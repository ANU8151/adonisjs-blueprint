import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'yaml'
import type { BlueprintSchema } from './types.js'
import Ajv from 'ajv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export class BlueprintParser {
  /**
   * Parse the given draft file and validate it against the JSON schema
   */
  async parse(filePath: string): Promise<BlueprintSchema> {
    if (!existsSync(filePath)) {
      throw new Error(`File ${filePath} not found`)
    }

    const content = readFileSync(filePath, 'utf8')
    const parsed = parse(content)

    // Validate the parsed YAML against the schema
    const ajv = new Ajv.default({
      allErrors: true,
      strict: false,
    })
    const dirName = dirname(fileURLToPath(import.meta.url))

    const schemaPath = join(dirName, 'schema.json')
    if (existsSync(schemaPath)) {
      const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
      const validate = ajv.compile(schema)
      const valid = validate(parsed)

      if (!valid) {
        console.error('\nBlueprint validation failed! Errors in your draft.yaml:')
        validate.errors?.forEach((error) => {
          const path = error.instancePath || 'root'
          console.error(
            `  - ${path}: ${error.message} ${error.params ? JSON.stringify(error.params) : ''}`
          )
        })
        console.error('')
        throw new Error('Blueprint validation failed. Please fix the errors above.')
      }
    }

    return parsed as BlueprintSchema
  }
}
