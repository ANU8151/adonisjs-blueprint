import { BaseGenerator } from './base_generator.js'
import type { Entity } from '../types.js'
import string from '@adonisjs/core/helpers/string'

export class MigrationGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
    const attributes: any[] = []
    const processedAttributes = new Set<string>()

    if (definition.attributes) {
      for (const [attrName, attrType] of Object.entries(definition.attributes)) {
        let migrationLine = ''
        if (typeof attrType === 'string') {
          const parts = attrType.split(':')
          const type = parts[0]
          const modifiers = parts.slice(1)

          if (type === 'foreign') {
            migrationLine = `table.integer('${attrName}').unsigned().references('id').inTable('${string.plural(attrName.replace('_id', '') || '')}')`
          } else {
            if (type === 'enum') {
              const valuesStr = modifiers[0] || ''
              const values = valuesStr
                .split(',')
                .map((v) => `'${v.trim()}'`)
                .join(', ')
              migrationLine = `table.enum('${attrName}', [${values}])`
            } else {
              // Mapping for common types
              const typeMapping: Record<string, string> = {
                datetime: 'dateTime',
                timestamp: 'timestamp',
                text: 'text',
                string: 'string',
                integer: 'integer',
                boolean: 'boolean',
                float: 'float',
                double: 'double',
                decimal: 'decimal',
                date: 'date',
                time: 'time',
                json: 'json',
                jsonb: 'jsonb',
                uuid: 'uuid',
              }

              const knexType = typeMapping[type] || type
              migrationLine = `table.${knexType}('${attrName}')`
            }

            // Add common modifiers
            if (modifiers.includes('unique')) migrationLine += '.unique()'
            if (modifiers.includes('nullable') || modifiers.includes('optional')) {
              migrationLine += '.nullable()'
            } else {
              migrationLine += '.notNullable()'
            }
            if (modifiers.includes('unsigned')) migrationLine += '.unsigned()'

            // Handle default value and references by iterating and checking current and next parts
            for (let i = 0; i < modifiers.length; i++) {
              const modifier = modifiers[i]
              if (modifier === 'default' && modifiers[i + 1]) {
                const defaultValue = modifiers[i + 1]
                const isNumeric = !Number.isNaN(Number(defaultValue))
                migrationLine += `.defaultTo(${isNumeric ? defaultValue : `'${defaultValue}'`})`
                i++ // Skip next part
              } else if (modifier === 'references' && modifiers[i + 1]) {
                const refValue = modifiers[i + 1]
                const tableAndColumn = refValue.split('.')
                const table = tableAndColumn[0]
                const column = tableAndColumn[1] || 'id'
                migrationLine += `.references('${column}').inTable('${table}').onDelete('CASCADE')`
                i++ // Skip next part
              }
            }
          }
        }
        attributes.push({ migrationLine })
        processedAttributes.add(attrName)
      }
    }

    // Smart inference: add foreign keys from relationships if not already present
    if (definition.relationships) {
      for (const [relName, relValue] of Object.entries(definition.relationships)) {
        const relType = typeof relValue === 'string' ? relValue : (relValue as any).type
        if (relType === 'belongsTo' && !processedAttributes.has(`${relName}_id`)) {
          attributes.push({
            migrationLine: `table.integer('${relName}_id').unsigned().references('id').inTable('${string.plural(relName || '')}').onDelete('CASCADE')`,
          })
        }
      }
    }

    // Add soft deletes column
    if (definition.softDeletes) {
      attributes.push({ migrationLine: `table.timestamp('deleted_at')` })
    }

    const isUser = entity.name === 'User'

    await this.generateStub('make/migration/main.stub', {
      entity: {
        ...entity,
        tableName: string.plural(string.snakeCase(entity.name || '')),
      },
      attributes, // Keep for tests
      attributesLines: attributes.map((a) => a.migrationLine).join('\n      '),
    })

    // If it's the User model, also generate remember_me_tokens and access_tokens tables
    if (isUser) {
      await this.generateAuthTables()
    }

    // Check for Many-to-Many to generate pivot table
    if (definition.relationships) {
      for (const [relName, relValue] of Object.entries(definition.relationships)) {
        const relType = typeof relValue === 'string' ? relValue : (relValue as any).type
        if (relType === 'belongsToMany') {
          await this.generatePivotMigration(entity.name, relName)
        }
      }
    }
  }

  private async generatePivotMigration(modelA: string, modelB: string) {
    const models = [string.snakeCase(modelA || ''), string.snakeCase(modelB || '')].sort()
    const tableName = `${models[0]}_${models[1]}`
    const entity = this.app.generators.createEntity(tableName)

    const pivotAttributes = [
      `table.integer('${models[0]}_id').unsigned().references('id').inTable('${string.plural(models[0] || '')}').onDelete('CASCADE')`,
      `table.integer('${models[1]}_id').unsigned().references('id').inTable('${string.plural(models[1] || '')}').onDelete('CASCADE')`,
    ]

    await this.generateStub('make/migration/main.stub', {
      entity: {
        ...entity,
        tableName,
      },
      attributes: pivotAttributes.map((a) => ({ migrationLine: a })),
      attributesLines: pivotAttributes.join('\n      '),
    })
  }

  private async generateAuthTables() {
    // Access Tokens table
    await this.generateStub('make/migration/main.stub', {
      entity: {
        name: 'AccessToken',
        path: '',
        tableName: 'auth_access_tokens',
      },
      attributesLines: [
        "table.integer('tokenable_id').unsigned().references('id').inTable('users').onDelete('CASCADE')",
        "table.string('type').notNullable()",
        "table.string('name').nullable()",
        "table.string('hash').notNullable()",
        "table.text('abilities').notNullable()",
        "table.timestamp('created_at')",
        "table.timestamp('updated_at')",
        "table.timestamp('last_used_at').nullable()",
        "table.timestamp('expires_at').nullable()",
      ].join('\n      '),
    })

    // Remember Me Tokens table
    await this.generateStub('make/migration/main.stub', {
      entity: {
        name: 'RememberMeToken',
        path: '',
        tableName: 'remember_me_tokens',
      },
      attributesLines: [
        "table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')",
        "table.string('hash').notNullable()",
        "table.timestamp('created_at')",
        "table.timestamp('updated_at')",
        "table.timestamp('expires_at').notNullable()",
      ].join('\n      '),
    })
  }
}
