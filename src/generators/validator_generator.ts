import { BaseGenerator } from './base_generator.js'
import string from '@adonisjs/core/helpers/string'

export class ValidatorGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const attributes: any[] = []
    const tableName = string.plural(string.snakeCase(entity.name))

    if (definition.attributes) {
      for (const [attrName, attrType] of Object.entries(definition.attributes)) {
        if (typeof attrType === 'string') {
          const parts = attrType.split(':')
          const baseType = parts[0]
          let vineType = 'string()'

          if (baseType === 'number' || baseType === 'integer') {
            vineType = 'number()'
          } else if (baseType === 'boolean') {
            vineType = 'boolean()'
          } else if (baseType === 'date' || baseType === 'datetime' || baseType === 'timestamp') {
            vineType = 'date()'
          } else if (baseType === 'email') {
            vineType = 'string().email()'
          } else if (baseType === 'file' || baseType === 'image') {
            const extnames =
              baseType === 'image' ? "['jpg', 'png', 'jpeg']" : "['pdf', 'doc', 'docx']"
            vineType = `file({ size: '2mb', extnames: ${extnames} })`
          }

          // Apply unique rule with table and column
          if (parts.includes('unique')) {
            vineType += `.unique({ table: '${tableName}', column: '${attrName}' })`
          }

          // Apply other modifiers
          if (parts.includes('min')) {
            const minIdx = parts.indexOf('min')
            if (parts[minIdx + 1]) {
              const rule = baseType === 'number' || baseType === 'integer' ? 'min' : 'minLength'
              vineType += `.${rule}(${parts[minIdx + 1]})`
            }
          }
          if (parts.includes('max')) {
            const maxIdx = parts.indexOf('max')
            if (parts[maxIdx + 1]) {
              const rule = baseType === 'number' || baseType === 'integer' ? 'max' : 'maxLength'
              vineType += `.${rule}(${parts[maxIdx + 1]})`
            }
          }

          if (parts.includes('optional') || parts.includes('nullable')) {
            vineType += '.optional()'
          }

          attributes.push({
            name: attrName,
            vineType,
          })
        }
      }
    }

    // Prepare schemas with special handling for updates (to exclude current ID from unique checks)
    const createSchema = attributes.map((a) => `${a.name}: vine.${a.vineType}`).join(',\n    ')

    const updateSchema = attributes
      .map((a) => {
        let type = a.vineType
        if (type.includes('.unique(')) {
          // Add filter to exclude current record ID
          type = type.replace(
            '.unique({',
            `.unique({ filter: (db, value, field) => db.from('${tableName}').whereNot('id', field.meta.id || 0).where('${a.name}', value),`
          )
        }
        if (!type.includes('.optional()')) {
          type += '.optional()'
        }
        return `${a.name}: vine.${type}`
      })
      .join(',\n    ')

    await this.generateStub(
      'make/validator/main.stub',
      {
        entity,
        attributes,
        createSchema,
        updateSchema,
      },
      definition.stub
    )
  }
}
