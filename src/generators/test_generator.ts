import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'
import type { Entity } from '../types.js'

export class TestGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
    const actions: any[] = []

    for (const [actionName] of Object.entries(definition)) {
      actions.push({ name: actionName })
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/test/controller.stub', {
      entity,
      actions,
    })
  }
}
