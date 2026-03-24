import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'
import type { Entity } from '../types.js'

export class ControllerGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
    const actions: any[] = []

    for (const [actionName, actionDef] of Object.entries(definition)) {
      let context = 'request, response'
      let logicLines: string[] = []

      if (typeof actionDef === 'object' && actionDef !== null) {
        const typedDef = actionDef as any

        if (typedDef.validate) {
          const validatorName =
            actionName === 'store'
              ? `create${entity.className}Validator`
              : `update${entity.className}Validator`
          logicLines.push(`const payload = await request.validateUsing(${validatorName})`)
        }

        if (typedDef.save) {
          logicLines.push(`await ${entity.className}.create(payload)`)
        }

        if (typedDef.render) {
          logicLines.push(`return view.render('${typedDef.render}')`)
          context = 'view'
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
