import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class MigrationGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const attributes: any[] = []

    if (definition.attributes) {
      for (const [attrName, attrType] of Object.entries(definition.attributes)) {
        let migrationLine = ''
        if (typeof attrType === 'string') {
          if (attrType === 'foreign') {
            migrationLine = `table.integer('${attrName}').unsigned().references('id').inTable('${attrName.replace('_id', 's')}')`
          } else {
            migrationLine = `table.${attrType}('${attrName}')`
          }
        } else {
          // Complex definition
          // migrationLine = ...
        }
        attributes.push({ migrationLine })
      }
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/migration/main.stub', {
      entity: {
        ...entity,
        tableName: entity.name.toLowerCase() + 's', // Simple pluralization for now
      },
      attributes,
    })
  }
}
