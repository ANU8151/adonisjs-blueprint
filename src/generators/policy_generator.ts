import { BaseGenerator } from './base_generator.js'
import type { Entity } from '../types.js'
import string from '@adonisjs/core/helpers/string'

export class PolicyGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
    const actions: any[] = []

    for (const [actionName, actionDef] of Object.entries(definition)) {
      if (typeof actionDef !== 'object') continue

      let policyAction = actionName
      if (actionName === 'index') policyAction = 'viewAny'
      if (actionName === 'show') policyAction = 'view'
      if (actionName === 'store') policyAction = 'create'
      if (actionName === 'update') policyAction = 'update'
      if (actionName === 'destroy') policyAction = 'delete'

      actions.push({
        name: policyAction,
        modelName: entity.className,
        variableName: string.camelCase(entity.className),
      })
    }

    await this.generateStub('make/policy/main.stub', {
      entity,
      actions,
    })
  }
}
