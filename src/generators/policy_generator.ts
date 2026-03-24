import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'
import type { Entity } from '../types.js'

export class PolicyGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
    const actions: any[] = []
    const processedActions = new Set<string>()

    // Extract authorization actions from controller definition
    if (definition) {
      for (const [actionName, actionDef] of Object.entries(definition)) {
        if (typeof actionDef === 'object' && actionDef !== null && (actionDef as any).authorize) {
          const authStr = (actionDef as any).authorize as string
          const parts = authStr.split(',')
          const policyAction = parts[0].trim()

          if (!processedActions.has(policyAction)) {
            actions.push({ name: policyAction })
            processedActions.add(policyAction)
          }
        }
      }
    }

    // Default CRUD actions if none found, to provide a good baseline
    if (actions.length === 0) {
      actions.push(
        { name: 'viewList' },
        { name: 'view' },
        { name: 'create' },
        { name: 'update' },
        { name: 'delete' }
      )
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/policy/main.stub', {
      entity,
      actions,
    })
  }
}
