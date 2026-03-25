import { BaseGenerator } from './base_generator.js'
import type { Entity } from '../types.js'
import { EventGenerator } from './event_generator.js'
import { MailGenerator } from './mail_generator.js'
import { JobGenerator } from './job_generator.js'
import string from '@adonisjs/core/helpers/string'

export class ControllerGenerator extends BaseGenerator {
  async generate(
    name: string,
    definition: any,
    useInertia: boolean = false,
    isApi: boolean = false
  ) {
    const nameParts = name.split('.')
    const baseName = nameParts.pop()! // Handle nested names like Post.Comment
    const entity = this.app.generators.createEntity(baseName) as Entity

    const eventGenerator = new EventGenerator(this.app, this.logger, this.manifest)
    const mailGenerator = new MailGenerator(this.app, this.logger, this.manifest)
    const jobGenerator = new JobGenerator(this.app, this.logger, this.manifest)

    const actions: any[] = []
    const imports = {
      models: new Set<string>(),
      validators: new Set<string>(),
      events: new Set<string>(),
      policies: new Set<string>(),
    }

    const middleware = definition.middleware || []

    const pluralName = string.plural(string.camelCase(entity.name))
    const singularName = string.camelCase(entity.name)

    // Support resource: true shorthand
    let normalizedDefinition = definition
    if (definition.resource) {
      normalizedDefinition = isApi
        ? {
            index: { query: 'all', render: 'json' },
            store: { validate: 'all', save: true, render: 'json' },
            show: { query: 'find', render: 'json' },
            update: { validate: 'all', save: true, render: 'json' },
            destroy: { delete: true, render: 'json' },
          }
        : {
            index: { render: `${pluralName}/index` },
            create: { render: `${pluralName}/create` },
            store: { validate: 'all', save: true, redirect: `${pluralName}.index` },
            show: { render: `${pluralName}/show` },
            edit: { render: `${pluralName}/edit` },
            update: {
              validate: 'all',
              save: true,
              redirect: `${pluralName}.index`,
            },
            destroy: { delete: true, redirect: `${pluralName}.index` },
          }
    }

    for (const [actionName, actionDef] of Object.entries(normalizedDefinition)) {
      let context = 'request, response'
      let logicLines: string[] = []

      if (typeof actionDef === 'object' && actionDef !== null) {
        const typedDef = actionDef as any

        if (typedDef.query) {
          const queryParts = typedDef.query.split(':')
          const queryType = queryParts[0]
          const variableName =
            queryType === 'all' || queryType === 'paginate' ? pluralName : singularName

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

        if (typedDef.authorize) {
          const authParts = (typedDef.authorize as string).split(',')
          const action = authParts[0].trim()
          const modelArg = authParts[1] ? `, ${authParts[1].trim()}` : ''
          const policyName = `${entity.className}Policy`
          logicLines.push(`await bouncer.with(${policyName}).authorize('${action}'${modelArg})`)
          imports.policies.add(policyName)
          if (!context.includes('bouncer')) context += ', bouncer'
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
          await eventGenerator.generate(eventName)
          if (!context.includes('emitter')) context += ', emitter'
        }

        if (typedDef.send) {
          const mailName = typedDef.send
          logicLines.push(`await mail.sendLater(new ${mailName}(payload))`)
          await mailGenerator.generate(mailName)
          if (!context.includes('mail')) context += ', mail'
        }

        if (typedDef.dispatch) {
          const jobName = typedDef.dispatch
          logicLines.push(`await new ${jobName}(payload).handle()`)
          await jobGenerator.generate(jobName)
        }

        if (typedDef.auth) {
          logicLines.push(`const user = auth.user!`)
          if (!context.includes('auth')) context += ', auth'
        }

        if (typedDef.render) {
          const parts = typedDef.render.split(' with: ')
          const viewPath = parts[0]

          if (isApi || viewPath === 'json') {
            // Basic JSON response assuming the variable from query or save is available
            const responseData = parts[1]
              ? parts[1]
              : actionName === 'store' || actionName === 'update'
                ? 'payload'
                : 'data'
            logicLines.push(`return response.json({ ${responseData} })`)
          } else if (useInertia) {
            const data = parts[1] ? `, { ${parts[1]} }` : ''
            logicLines.push(`return inertia.render('${viewPath}'${data})`)
            if (!context.includes('inertia')) context += ', inertia'
          } else {
            const data = parts[1] ? `, { ${parts[1]} }` : ''
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

    await this.generateStub('make/controller/main.stub', {
      entity,
      actions,
      middleware,
      imports: {
        models: Array.from(imports.models),
        validators: Array.from(imports.validators),
        events: Array.from(imports.events),
        policies: Array.from(imports.policies),
      },
    })
  }
}
