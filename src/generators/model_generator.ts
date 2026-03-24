import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class ModelGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const relationships: any[] = []

    // Core model imports
    let modelImports = `import { DateTime } from 'luxon'\nimport { ${entity.className}Schema } from '../../database/schema.js'`
    let modelSignature = `export default class ${entity.className} extends ${entity.className}Schema {`

    // Handle soft deletes
    if (definition.softDeletes) {
      modelImports = `import { DateTime } from 'luxon'\nimport { ${entity.className}Schema } from '../../database/schema.js'\nimport { compose } from '@adonisjs/core/helpers'\nimport { withSoftDeletes } from '@adonisjs/lucid-soft-deletes'`
      modelSignature = `export default class ${entity.className} extends compose(${entity.className}Schema, withSoftDeletes) {`
    }

    // Handle enums
    if (definition.attributes) {
      for (const [attrName, attrType] of Object.entries(definition.attributes)) {
        if (typeof attrType === 'string' && attrType.startsWith('enum:')) {
          const enumName = `${entity.className}${attrName.charAt(0).toUpperCase() + attrName.slice(1)}`
          modelImports += `\nimport { ${enumName} } from '#enums/${enumName.toLowerCase()}'`
        }
      }
    }

    if (definition.relationships) {
      for (const [relName, relType] of Object.entries(definition.relationships) as [
        string,
        string,
      ][]) {
        // Simple implementation for now
        const relatedModel = relName.charAt(0).toUpperCase() + relName.slice(1)
        relationships.push({
          importLine: `import { ${relType} } from '@adonisjs/lucid/orm'\nimport type { ${relType.charAt(0).toUpperCase() + relType.slice(1)} } from '@adonisjs/lucid/types'\nimport ${relatedModel} from '#models/${relName.toLowerCase()}'`,
          line: `@${relType}(() => ${relatedModel})\ndeclare ${relName}: ${relType.charAt(0).toUpperCase() + relType.slice(1)}<typeof ${relatedModel}>`,
        })
      }
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/model/main.stub', {
      entity,
      relationships,
      modelImports,
      modelSignature,
    })
  }
}
