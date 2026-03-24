import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class ValidatorGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const attributes: any[] = []

    if (definition.attributes) {
      for (const [attrName, attrType] of Object.entries(definition.attributes)) {
        let vineType = 'string'
        if (typeof attrType === 'string') {
          if (attrType === 'number' || attrType === 'integer') {
            vineType = 'number'
          } else if (attrType === 'boolean') {
            vineType = 'boolean'
          }
        }
        attributes.push({ name: attrName, vineType })
      }
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/validator/main.stub', {
      entity,
      attributes,
    })
  }
}
