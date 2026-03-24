import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class ControllerGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const actions: any[] = []

    for (const [actionName, actionDef] of Object.entries(definition)) {
      let context = 'request, response'
      let logic = '// Action logic here'

      if (typeof actionDef === 'object' && actionDef !== null) {
        // Implement logic for render, query, validate, etc.
        const typedDef = actionDef as any
        if (typedDef.render) {
          logic = `return view.render('${typedDef.render}')`
          context = 'view'
        } else if (typedDef.query === 'all') {
          // logic = ...
        }
      }

      actions.push({
        name: actionName,
        context,
        logic,
      })
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/controller/main.stub', {
      entity,
      actions,
    })
  }
}
