import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'
import type { Entity } from '../types.js'

export class ControllerGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
    const actions: any[] = []

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

        if (typedDef.validate) {
          const validatorName =
            actionName === 'store' || actionName === 'update'
              ? `${actionName === 'store' ? 'create' : 'update'}${entity.className}Validator`
              : 'validator'
          logicLines.push(`const payload = await request.validateUsing(${validatorName})`)
        }

        if (typedDef.save) {
          logicLines.push(`await ${entity.className}.create(payload)`)
        }

        if (typedDef.delete) {
          logicLines.push(`const model = await ${entity.className}.findOrFail(params.id)`)
          logicLines.push(`await model.delete()`)
          if (!context.includes('params')) context += ', params'
        }

        if (typedDef.fire) {
          logicLines.push(`emitter.emit('${typedDef.fire}', payload)`)
          if (!context.includes('emitter')) context += ', emitter'
        }

        if (typedDef.dispatch) {
          logicLines.push(`${typedDef.dispatch}.dispatch(payload)`)
        }

        if (typedDef.send) {
          logicLines.push(`await mail.sendLater(new ${typedDef.send}(payload))`)
          if (!context.includes('mail')) context += ', mail'
        }

        if (typedDef.auth) {
          logicLines.push(`const user = auth.user!`)
          if (!context.includes('auth')) context += ', auth'
        }

        if (typedDef.render) {
          logicLines.push(`return view.render('${typedDef.render}')`)
          if (!context.includes('view')) context += ', view'
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
    })
  }
}
