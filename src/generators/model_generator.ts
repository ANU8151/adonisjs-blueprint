import { BaseGenerator } from './base_generator.js'
import type { Entity } from '../types.js'
import string from '@adonisjs/core/helpers/string'

export class ModelGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
    const relationships: any[] = []
    const attributes: any[] = []
    const processedAttributes = new Set<string>()

    // Core model imports
    let modelImports = `import { DateTime } from 'luxon'\nimport { column } from '@adonisjs/lucid/orm'\nimport { BaseModel } from '@adonisjs/lucid/orm'`
    let modelSignature = `export default class ${entity.className} extends BaseModel {`

    // Handle soft deletes
    if (definition.softDeletes) {
      modelImports = `import { DateTime } from 'luxon'\nimport { column } from '@adonisjs/lucid/orm'\nimport { BaseModel } from '@adonisjs/lucid/orm'\nimport { compose } from '@adonisjs/core/helpers'\nimport { withSoftDeletes } from '@adonisjs/lucid-soft-deletes'`
      modelSignature = `export default class ${entity.className} extends compose(BaseModel, withSoftDeletes) {`
    }

    // Process explicit attributes
    if (definition.attributes) {
      for (const [attrName, attrType] of Object.entries(definition.attributes)) {
        let tsType = 'string'
        let columnDecorator = '@column()'

        const typeStr = typeof attrType === 'string' ? attrType : (attrType as any).type || 'string'
        const parts = typeStr.split(':')
        const baseType = parts[0]

        if (baseType === 'number' || baseType === 'integer') {
          tsType = 'number'
        } else if (baseType === 'boolean') {
          tsType = 'boolean'
        } else if (baseType === 'timestamp' || baseType === 'datetime') {
          tsType = 'DateTime'
          columnDecorator = '@column.dateTime({ autoCreate: true, autoUpdate: true })'
        } else if (baseType === 'enum') {
          tsType = 'any' // Enums are handled separately or can be string
        }

        attributes.push({
          line: `${columnDecorator}\ndeclare ${attrName}: ${tsType}`,
        })
        processedAttributes.add(attrName)
      }
    }

    // Process relationships for models and implicit columns
    if (definition.relationships) {
      for (const [relName, relType] of Object.entries(definition.relationships) as [
        string,
        string,
      ][]) {
        const relatedModelName = string.pascalCase(string.singular(relName))

        // Add foreign key column for belongsTo
        if (relType === 'belongsTo') {
          const foreignKey = `${string.camelCase(relName)}Id`
          if (!processedAttributes.has(foreignKey)) {
            attributes.push({
              line: `@column()\ndeclare ${foreignKey}: number`,
            })
            processedAttributes.add(foreignKey)
          }
        }

        relationships.push({
          importLine: `import { ${relType} } from '@adonisjs/lucid/orm'\nimport type { ${relType.charAt(0).toUpperCase() + relType.slice(1)} } from '@adonisjs/lucid/types'\nimport ${relatedModelName} from '#models/${string.snakeCase(relatedModelName)}'`,
          line: `@${relType}(() => ${relatedModelName})\ndeclare ${relName}: ${relType.charAt(0).toUpperCase() + relType.slice(1)}<typeof ${relatedModelName}>`,
        })
      }
    }

    // Always add standard timestamps if not already present
    if (!processedAttributes.has('createdAt')) {
      attributes.push({
        line: '@column.dateTime({ autoCreate: true })\ndeclare createdAt: DateTime',
      })
    }
    if (!processedAttributes.has('updatedAt')) {
      attributes.push({
        line: '@column.dateTime({ autoCreate: true, autoUpdate: true })\ndeclare updatedAt: DateTime',
      })
    }

    await this.generateStub(
      'make/model/main.stub',
      {
        entity,
        attributes,
        relationships,
        modelImports,
        modelSignature,
      },
      definition.stub
    )
  }
}
