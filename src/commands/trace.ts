import { BaseCommand } from '@adonisjs/core/ace'
import { writeFileSync } from 'node:fs'
import { stringify } from 'yaml'
import string from '@adonisjs/core/helpers/string'

export default class TraceBlueprint extends BaseCommand {
  static commandName = 'blueprint:trace'
  static description = 'Trace the database and generate a draft.yaml file'

  static options = {
    startApp: true,
  }

  async run() {
    this.logger.info('Tracing database to generate draft.yaml...')

    try {
      const db = (await this.app.container.make('lucid.db')) as any
      const connection = db.connection()
      const tables = await connection.inspect()

      const draft: any = {
        models: {},
      }

      for (const table of tables) {
        if (['adonis_schema', 'adonis_schema_versions', 'lucid_models'].includes(table.name)) {
          continue
        }

        const modelName = string.pascalCase(string.singular(table.name))

        draft.models[modelName] = {
          attributes: {},
          relationships: {},
        }

        const columns = await connection.getColumns(table.name)
        for (const column of columns) {
          if (['id', 'created_at', 'updated_at', 'deleted_at'].includes(column.name)) {
            if (column.name === 'deleted_at') {
              draft.models[modelName].softDeletes = true
            }
            continue
          }

          // Detect relationships via _id suffix
          if (column.name.endsWith('_id')) {
            const relName = string.camelCase(column.name.replace('_id', ''))
            draft.models[modelName].relationships[relName] = 'belongsTo'
            continue
          }

          let type = 'string'
          if (column.type === 'integer' || column.type === 'int') type = 'integer'
          if (column.type === 'boolean' || column.type === 'tinyint') type = 'boolean'
          if (column.type === 'timestamp' || column.type === 'datetime') type = 'timestamp'

          draft.models[modelName].attributes[column.name] = type
        }

        // Cleanup if empty
        if (Object.keys(draft.models[modelName].attributes).length === 0) {
          delete draft.models[modelName].attributes
        }
        if (Object.keys(draft.models[modelName].relationships).length === 0) {
          delete draft.models[modelName].relationships
        }
      }

      writeFileSync(this.app.makePath('draft.yaml'), stringify(draft))
      this.logger.success('draft.yaml generated successfully from database')
    } catch (error) {
      this.logger.error('Failed to trace database. Make sure Lucid is configured.')
      this.logger.debug(error)
    }
  }
}
