import { BaseGenerator } from './base_generator.js'
import string from '@adonisjs/core/helpers/string'

export class ValidatorGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const attributes: any[] = []

    if (definition.attributes) {
      for (const [attrName, attrType] of Object.entries(definition.attributes)) {
        let vineChain = 'vine.string()'

        const typeStr = typeof attrType === 'string' ? attrType : (attrType as any).type || 'string'
        const parts = typeStr.split(':')
        const baseType = parts[0]

        if (baseType === 'number' || baseType === 'integer') {
          vineChain = 'vine.number()'
        } else if (baseType === 'boolean') {
          vineChain = 'vine.boolean()'
        } else if (baseType === 'email') {
          vineChain = 'vine.string().email()'
        } else if (baseType === 'url') {
          vineChain = 'vine.string().url()'
        } else if (baseType === 'ip') {
          vineChain = 'vine.string().ip()'
        } else if (baseType === 'uuid') {
          vineChain = 'vine.string().uuid()'
        } else if (baseType === 'mobile') {
          vineChain = 'vine.string().mobile()'
        } else if (baseType === 'postalCode') {
          vineChain = 'vine.string().postalCode()'
        } else if (baseType === 'creditCard') {
          vineChain = 'vine.string().creditCard()'
        } else if (baseType === 'macAddress') {
          vineChain = 'vine.string().macAddress()'
        }

        // Apply modifiers
        for (let i = 1; i < parts.length; i++) {
          const modifier = parts[i]
          if (modifier === 'unique') {
            const tableName = string.plural(string.snakeCase(entity.name))
            vineChain += `.unique(async (db, value) => { return !await db.from('${tableName}').where('${attrName}', value).first() })`
          } else if (modifier === 'min' && parts[i + 1]) {
            vineChain +=
              baseType === 'number' ? `.min(${parts[i + 1]})` : `.minLength(${parts[i + 1]})`
            i++
          } else if (modifier === 'max' && parts[i + 1]) {
            vineChain +=
              baseType === 'number' ? `.max(${parts[i + 1]})` : `.maxLength(${parts[i + 1]})`
            i++
          } else if (modifier === 'optional' || modifier === 'nullable') {
            vineChain += '.optional()'
          } else if (modifier === 'confirmed') {
            vineChain += '.confirmed()'
          } else if (modifier === 'regex' && parts[i + 1]) {
            vineChain += `.regex(new RegExp('${parts[i + 1]}'))`
            i++
          }
        }
        attributes.push({ name: attrName, vineType: vineChain.replace('vine.', '') })
      }
    }

    await this.generateStub(
      'make/validator/main.stub',
      {
        entity,
        attributes,
      },
      definition.stub
    )
  }
}
