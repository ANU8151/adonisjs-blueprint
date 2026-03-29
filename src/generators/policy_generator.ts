import { BaseGenerator } from './base_generator.js'
import type { Entity } from '../types.js'
import string from '@adonisjs/core/helpers/string'

export class PolicyGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const nameParts = name.split(/[\/.]/)
    const baseName = nameParts.pop() || ''
    const entity = this.app.generators.createEntity(baseName) as Entity
    if (!entity.className) {
      entity.className = string.pascalCase(baseName)
    }
    if (nameParts.length > 0) {
      entity.path = nameParts.map((p) => string.snakeCase(p || '')).join('/')
    }

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
        variableName: string.camelCase(entity.className || ''),
      })
    }

    const actionLines = actions
      .map((action) => {
        return `  ${action.name}(user: User, ${action.variableName}: ${action.modelName}): AuthorizerResponse {\n    return true\n  }`
      })
      .join('\n\n')

    await this.generateStub('make/policy/main.stub', {
      entity,
      actions, // Keep for tests
      actionLines,
    })
  }
}
