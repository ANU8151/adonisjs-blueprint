import { BaseGenerator } from './base_generator.js'
export class FactoryGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const attributes: any[] = []
    const relationships: any[] = []

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

    if (definition.relationships) {
      for (const [relName, relType] of Object.entries(definition.relationships) as [
        string,
        string,
      ][]) {
        relationships.push({
          name: relName,
          type: relType,
          model: relName.charAt(0).toUpperCase() + relName.slice(1).replace(/s$/, ''),
        })
      }
    }

    await this.generateStub('make/factory/main.stub', {
      entity,
      attributes,
      relationships,
    })
  }
}
