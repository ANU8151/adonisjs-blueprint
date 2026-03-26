import { BaseGenerator } from './base_generator.js'
import type { Entity, BlueprintSchema } from '../types.js'
import string from '@adonisjs/core/helpers/string'

export class TestGenerator extends BaseGenerator {
  async generate(name: string, definition: any, blueprint: BlueprintSchema) {
    const entity = this.app.generators.createEntity(name) as Entity
    const actions: any[] = []
    const pluralName = string.plural(string.snakeCase(entity.name))

    for (const [actionName, actionDef] of Object.entries(definition)) {
      if (typeof actionDef !== 'object') continue

      let method = 'get'
      let url = `/${pluralName}`
      const typedDef = actionDef as any

      if (actionName === 'store') {
        method = 'post'
      } else if (actionName === 'show' || actionName === 'edit') {
        url = `/${pluralName}/1`
      } else if (actionName === 'update') {
        method = 'put'
        url = `/${pluralName}/1`
      } else if (actionName === 'destroy') {
        method = 'delete'
        url = `/${pluralName}/1`
      } else if (actionName === 'create') {
        url = `/${pluralName}/create`
      }

      actions.push({
        name: actionName,
        method,
        url,
        auth: !!typedDef.auth,
      })
    }

    await this.generateStub('make/test/controller.stub', {
      entity,
      actions,
      hasAuth: actions.some((a) => a.auth) || !!blueprint.auth,
    })
  }
}
