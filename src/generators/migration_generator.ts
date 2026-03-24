import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'
import type { Entity } from '../types.js'

export class MigrationGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
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
        }
        attributes.push({ migrationLine })
      }
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/migration/main.stub', {
      entity: {
        ...entity,
        tableName: entity.name.toLowerCase() + 's',
      },
      attributes,
    })

    // Check for Many-to-Many to generate pivot table
    if (definition.relationships) {
      for (const [relName, relType] of Object.entries(definition.relationships)) {
        if (relType === 'belongsToMany') {
          await this.generatePivotMigration(entity.name, relName)
        }
      }
    }
  }

  private async generatePivotMigration(modelA: string, modelB: string) {
    const models = [modelA.toLowerCase(), modelB.toLowerCase()].sort()
    const tableName = `${models[0]}_${models[1]}`
    const entity = this.app.generators.createEntity(tableName)

    await this.codemods.makeUsingStub(stubsRoot, 'make/migration/main.stub', {
      entity: {
        ...entity,
        tableName,
      },
      attributes: [
        {
          migrationLine: `table.integer('${models[0]}_id').unsigned().references('id').inTable('${models[0]}s').onDelete('CASCADE')`,
        },
        {
          migrationLine: `table.integer('${models[1]}_id').unsigned().references('id').inTable('${models[1]}s').onDelete('CASCADE')`,
        },
      ],
    })
  }
}
