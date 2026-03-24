import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'
import type { Entity } from '../types.js'
import { ClassGenerator } from './class_generator.js'

export class ControllerGenerator extends BaseGenerator {
  async generate(name: string, definition: any, useInertia: boolean = false) {
    const entity = this.app.generators.createEntity(name) as Entity
    const classGenerator = new ClassGenerator(this.app, this.logger)
    const actions: any[] = []
    const imports = {
      models: new Set<string>(),
      validators: new Set<string>(),
      events: new Set<string>(),
    }

    // Support resource: true shorthand
    const normalizedDefinition = definition.resource
      ? {
          index: { render: `${entity.name.toLowerCase()}s/index` },
          create: { render: `${entity.name.toLowerCase()}s/create` },
          store: { validate: 'all', save: true, redirect: `${entity.name.toLowerCase()}s.index` },
          show: { render: `${entity.name.toLowerCase()}s/show` },
          edit: { render: `${entity.name.toLowerCase()}s/edit` },
          update: { validate: 'all', save: true, redirect: `${entity.name.toLowerCase()}s.index` },
          destroy: { delete: true, redirect: `${entity.name.toLowerCase()}s.index` },
        }
      : definition

    for (const [actionName, actionDef] of Object.entries(normalizedDefinition)) {
      let context = 'request, response'
      let logicLines: string[] = []

      if (typeof actionDef === 'object' && actionDef !== null) {
        const typedDef = actionDef as any

        if (typedDef.query) {
          const queryParts = typedDef.query.split(':')
          const queryType = queryParts[0]
          const variableName =
            entity.name.toLowerCase() + (queryType === 'all' || queryType === 'paginate' ? 's' : '')

          if (queryType === 'all') {
            logicLines.push(`const ${variableName} = await ${entity.className}.all()`)
          } else if (queryType === 'paginate') {
            const limit = queryParts[1] || '20'
            logicLines.push(
              `const ${variableName} = await ${entity.className}.query().paginate(request.input('page', 1), ${limit})`
            )
          } else if (queryType === 'find') {
            logicLines.push(
              `const ${variableName} = await ${entity.className}.findOrFail(params.id)`
            )
            if (!context.includes('params')) context += ', params'
          }
          imports.models.add(entity.className)
        }

        if (typedDef.validate) {
          const validatorName =
            actionName === 'store' || actionName === 'update'
              ? `${actionName === 'store' ? 'create' : 'update'}${entity.className}Validator`
              : 'validator'
          logicLines.push(`const payload = await request.validateUsing(${validatorName})`)
          imports.validators.add(validatorName)
        }

        if (typedDef.save) {
          logicLines.push(`await ${entity.className}.create(payload)`)
          imports.models.add(entity.className)
        }

        if (typedDef.delete) {
          logicLines.push(`const model = await ${entity.className}.findOrFail(params.id)`)
          logicLines.push(`await model.delete()`)
          imports.models.add(entity.className)
          if (!context.includes('params')) context += ', params'
        }

        if (typedDef.fire) {
          const eventName = typedDef.fire
          logicLines.push(`emitter.emit(new ${eventName}(payload))`)
          imports.events.add(eventName)
          await classGenerator.generate(eventName, 'event')
          if (!context.includes('emitter')) context += ', emitter'
        }

        if (typedDef.send) {
          const mailName = typedDef.send
          logicLines.push(`await mail.sendLater(new ${mailName}(payload))`)
          await classGenerator.generate(mailName, 'mail')
          if (!context.includes('mail')) context += ', mail'
        }

        if (typedDef.dispatch) {
          const jobName = typedDef.dispatch
          logicLines.push(`await new ${jobName}(payload).handle()`)
          await classGenerator.generate(jobName, 'job')
        }

        if (typedDef.auth) {
          logicLines.push(`const user = auth.user!`)
          if (!context.includes('auth')) context += ', auth'
        }

        if (typedDef.render) {
          const parts = typedDef.render.split(' with: ')
          const viewPath = parts[0]
          const data = parts[1] ? `, { ${parts[1]} }` : ''

          if (useInertia) {
            logicLines.push(`return inertia.render('${viewPath}'${data})`)
            if (!context.includes('inertia')) context += ', inertia'
          } else {
            logicLines.push(`return view.render('${viewPath}'${data})`)
            if (!context.includes('view')) context += ', view'
          }
        }

        if (typedDef.redirect) {
          logicLines.push(`return response.redirect().toRoute('${typedDef.redirect}')`)
        }

        if (typedDef.flash) {
          logicLines.push(`session.flash('${typedDef.flash}', 'Success!')`)
          if (!context.includes('session')) context += ', session'
        }
      }

      actions.push({
        name: actionName,
        context,
        logic: logicLines.join('\n    ') || '// Action logic here',
      })
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/controller/main.stub', {
      entity,
      actions,
      imports: {
        models: Array.from(imports.models),
        validators: Array.from(imports.validators),
        events: Array.from(imports.events),
      },
    })
  }
}
