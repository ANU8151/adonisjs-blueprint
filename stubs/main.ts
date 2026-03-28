import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const dirname = fileURLToPath(new URL('./', import.meta.url))
const templatesDir = join(dirname, 'templates')

/**
 * Path to the root directory where the stubs are stored. We use
 * this path within commands and the configure hook.
 */
export const stubsRoot = existsSync(templatesDir) ? templatesDir : dirname
