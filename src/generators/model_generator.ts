import { BaseGenerator } from './base_generator.js'
import type { Entity } from '../types.js'
import string from '@adonisjs/core/helpers/string'

export class ModelGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const nameParts = name.split(/[\/.]/)
    const baseName = nameParts.pop() || ''
    const entity = this.app.generators.createEntity(baseName) as Entity
    if (!entity.className) {
      entity.className = string.pascalCase(baseName)
    }
    if (nameParts.length > 0) {
      entity.path = nameParts.map((p) => string.snakeCase(p || '')).join('/')
    }

    const relationships: any[] = []
    const attributes: any[] = []
    const processedAttributes = new Set<string>()
    const isUser = entity.className === 'User'

    // Core model imports
    const coreImports = new Set<string>([
      "import { DateTime } from 'luxon'",
      "import { column, BaseModel } from '@adonisjs/lucid/orm'",
    ])

    const relationImports = new Set<string>()

    let modelSignature = `export default class ${entity.className} extends BaseModel {`

    // Handle Auth Mixin
    if (isUser) {
      coreImports.add("import { compose } from '@adonisjs/core/helpers'")
      coreImports.add("import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'")
      coreImports.add("import hash from '@adonisjs/core/services/hash'")
      coreImports.add(
        "import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens_providers/db'"
      )

      const authFinder = `const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})`

      // We'll inject this before the class
      modelSignature = `${authFinder}\n\nexport default class ${entity.className} extends compose(BaseModel, AuthFinder) {`
    }

    // Handle soft deletes
    if (definition.softDeletes) {
      coreImports.add("import { compose } from '@adonisjs/core/helpers'")
      coreImports.add("import { withSoftDeletes } from '@adonisjs/lucid-soft-deletes'")

      if (isUser) {
        // Already using compose for AuthFinder
        modelSignature = modelSignature.replace(
          'compose(BaseModel, AuthFinder)',
          'compose(BaseModel, AuthFinder, withSoftDeletes)'
        )
      } else {
        modelSignature = `export default class ${entity.className} extends compose(BaseModel, withSoftDeletes) {`
      }
    }

    // Process explicit attributes
    if (definition.attributes) {
      for (const [attrName, attrValue] of Object.entries(definition.attributes)) {
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
          columnDecorator = '@column.dateTime()'
        } else if (baseType === 'enum') {
          tsType = 'any'
        }

        attributes.push({
          line: `${columnDecorator}\n  declare ${attrName}: ${tsType}`,
        })
        processedAttributes.add(attrName)
      }
    }

    // Auth specific providers
    if (isUser) {
      attributes.push({
        line: `static accessTokens = DbAccessTokensProvider.forModel(User)`,
      })
    }

    // Process relationships
    if (definition.relationships) {
      for (const [relName, relValue] of Object.entries(definition.relationships)) {
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

        if (relType === 'belongsTo') {
          const foreignKey = `${string.camelCase(relName)}Id`
          if (!processedAttributes.has(foreignKey)) {
            attributes.push({
              line: `@column()\n  declare ${foreignKey}: number`,
            })
            processedAttributes.add(foreignKey)
          }
        }

        relationImports.add(`import { ${relType} } from '@adonisjs/lucid/orm'`)
        relationImports.add(
          `import type { ${relTypeClass} } from '@adonisjs/lucid/types/relations'`
        )
        relationImports.add(
          `import ${relatedModelName} from '#models/${string.snakeCase(relatedModelName || '')}'`
        )

        relationships.push({
          line: relationshipLine,
        })
      }
    }

    // Standard timestamps
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
        relationshipsImports: Array.from(relationImports).join('\n'),
        relationshipsLines: relationships.map((r) => r.line).join('\n\n  '),
        modelImports: Array.from(coreImports).join('\n'),
        modelSignature,
      },
      definition.stub
    )
  }
}
