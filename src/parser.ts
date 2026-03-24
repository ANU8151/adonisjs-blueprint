import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'yaml'
import type { BlueprintSchema } from './types.js'

export class BlueprintParser {
  /**
   * Parse the given draft file
   */
  async parse(filePath: string): Promise<BlueprintSchema> {
    if (!existsSync(filePath)) {
      throw new Error(`File ${filePath} not found`)
    }

    const content = readFileSync(filePath, 'utf8')
    const parsed = parse(content)

    return parsed as BlueprintSchema
  }
}
