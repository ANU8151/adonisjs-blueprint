import { BaseGenerator } from './base_generator.js'
import string from '@adonisjs/core/helpers/string'

export class FactoryGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const attributes: any[] = []
    const relationships: any[] = []
    const factoryImports: Set<string> = new Set()

    if (definition.attributes) {
      for (const [attrName, attrType] of Object.entries(definition.attributes)) {
        let fakerMethod = 'lorem.word'
        const typeStr = typeof attrType === 'string' ? attrType : (attrType as any).type || 'string'

        if (typeStr.includes('faker:')) {
          fakerMethod = typeStr.split('faker:')[1].split(':')[0]
        } else if (attrName.includes('first_name')) {
          fakerMethod = 'person.firstName'
        } else if (attrName.includes('last_name')) {
          fakerMethod = 'person.lastName'
        } else if (attrName.includes('full_name') || attrName === 'name') {
          fakerMethod = 'person.fullName'
        } else if (attrName === 'email') {
          fakerMethod = 'internet.email'
        } else if (attrName.includes('password')) {
          fakerMethod = 'internet.password'
        } else if (attrName.includes('phone')) {
          fakerMethod = 'phone.number'
        } else if (attrName.includes('city')) {
          fakerMethod = 'location.city'
        } else if (attrName.includes('country')) {
          fakerMethod = 'location.country'
        } else if (attrName.includes('address')) {
          fakerMethod = 'location.streetAddress'
        } else if (typeStr.startsWith('string') || typeStr.startsWith('text')) {
          fakerMethod = 'lorem.sentence'
        } else if (typeStr.startsWith('integer') || typeStr.startsWith('number')) {
          fakerMethod = 'number.int'
        } else if (typeStr.startsWith('boolean')) {
          fakerMethod = 'datatype.boolean'
        } else if (typeStr.startsWith('timestamp') || typeStr.startsWith('datetime')) {
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
        const relatedModel = string.pascalCase(string.singular(relName))
        relationships.push({
          name: relName,
          type: relType,
          model: relatedModel,
        })
        if (relType === 'hasMany' || relType === 'belongsToMany') {
          factoryImports.add(`${relatedModel}Factory`)
        }
      }
    }

    await this.generateStub('make/factory/main.stub', {
      entity,
      attributes,
      relationships,
      factoryImports: Array.from(factoryImports),
      imports: Array.from(factoryImports)
        .map((f) => `import { ${f} } from './${f.replace('Factory', '').toLowerCase()}_factory'`)
        .join('\n'),
      attributesLines: attributes
        .map((a) => `${a.name}: faker.${a.fakerMethod}()`)
        .join(',\n      '),
      relationsLines: relationships
        .filter((r) => r.type === 'hasMany' || r.type === 'belongsToMany')
        .map((r) => `.relation('${r.name}', () => ${r.model}Factory)`)
        .join('\n  '),
    })
  }
}
