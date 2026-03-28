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
    let modelImports = `import { DateTime } from 'luxon'\nimport { column } from '@adonisjs/lucid/orm'\nimport { BaseModel } from '@adonisjs/lucid/orm'\n`
    let modelSignature = `export default class ${entity.className} extends BaseModel {`

    // Handle soft deletes
    if (definition.softDeletes) {
      modelImports = `import { DateTime } from 'luxon'\nimport { column } from '@adonisjs/lucid/orm'\nimport { BaseModel } from '@adonisjs/lucid/orm'\nimport { compose } from '@adonisjs/core/helpers'\nimport { withSoftDeletes } from '@adonisjs/lucid-soft-deletes'\n`
      modelSignature = `export default class ${entity.className} extends compose(BaseModel, withSoftDeletes) {`
    }

    // Process explicit attributes
    if (definition.attributes) {
      for (const [attrName, attrValue] of Object.entries(definition.attributes)) {
        // Skip 'relationships' key if it's accidentally nested under attributes
        if (attrName === 'relationships') continue

        let tsType = 'string'
        let columnDecorator = '@column()'

        const typeStr =
          typeof attrValue === 'string' ? attrValue : (attrValue as any).type || 'string'
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
          tsType = 'any'
        }

        attributes.push({
          line: `${columnDecorator}\n  declare ${attrName}: ${tsType}`,
        })
        processedAttributes.add(attrName)
      }
    }

    // Process relationships for models and implicit columns
    if (definition.relationships) {
      for (const [relName, relValue] of Object.entries(definition.relationships)) {
        // Blueprint supports 'rel: type' or 'rel: { type: ..., ... }'
        const relType = typeof relValue === 'string' ? relValue : (relValue as any).type
        if (!relType) continue

        const relatedModelName = string.pascalCase(string.singular(relName))
        const relTypeClass = relType.charAt(0).toUpperCase() + relType.slice(1)

        let relationshipLine = `@${relType}(() => ${relatedModelName})\n  declare ${relName}: ${relTypeClass}<typeof ${relatedModelName}>`

        if (relType === 'belongsToMany') {
          const models = [entity.className, relatedModelName].sort()
          const pivotTable = models.map((m) => string.snakeCase(m || '')).join('_')
          relationshipLine = `@${relType}(() => ${relatedModelName}, { pivotTable: '${pivotTable}' })\n  declare ${relName}: ${relTypeClass}<typeof ${relatedModelName}>`
        }

        // Add foreign key column for belongsTo
        if (relType === 'belongsTo') {
          const foreignKey = `${string.camelCase(relName)}Id`
          if (!processedAttributes.has(foreignKey)) {
            attributes.push({
              line: `@column()\n  declare ${foreignKey}: number`,
            })
            processedAttributes.add(foreignKey)
          }
        }

        relationships.push({
          importLine: `import { ${relType} } from '@adonisjs/lucid/orm'\nimport type { ${relTypeClass} } from '@adonisjs/lucid/types'\nimport ${relatedModelName} from '#models/${string.snakeCase(relatedModelName || '')}'`,
          line: relationshipLine,
        })
      }
    }

    // Always add standard timestamps if not already present
    if (!processedAttributes.has('createdAt')) {
      attributes.push({
        line: '@column.dateTime({ autoCreate: true })\n  declare createdAt: DateTime',
      })
    }
    if (!processedAttributes.has('updatedAt')) {
      attributes.push({
        line: '@column.dateTime({ autoCreate: true, autoUpdate: true })\n  declare updatedAt: DateTime',
      })
    }

    await this.generateStub(
      'make/model/main.stub',
      {
        entity,
        attributes,
        attributesLines: attributes.map((a) => a.line).join('\n\n  '),
        relationships,
        relationshipsImports: relationships.map((r) => r.importLine).join('\n'),
        relationshipsLines: relationships.map((r) => r.line).join('\n\n  '),
        modelImports,
        modelSignature,
      },
      definition.stub
    )
  }
}
