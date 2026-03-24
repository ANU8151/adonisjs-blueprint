import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class FactoryGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const attributes: any[] = []

    if (definition.attributes) {
      for (const [attrName, attrType] of Object.entries(definition.attributes)) {
        let fakerMethod = 'lorem.word'
        const type = typeof attrType === 'string' ? attrType : (attrType as any).type

        if (attrName === 'email') {
          fakerMethod = 'internet.email'
        } else if (type === 'string' || type === 'text') {
          fakerMethod = 'lorem.sentence'
        } else if (type === 'integer' || type === 'number') {
          fakerMethod = 'number.int'
        } else if (type === 'boolean') {
          fakerMethod = 'datatype.boolean'
        } else if (type === 'timestamp' || type === 'datetime') {
          fakerMethod = 'date.recent'
        }

        attributes.push({ name: attrName, fakerMethod })
      }
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/factory/main.stub', {
      entity,
      attributes,
    })
  }
}
