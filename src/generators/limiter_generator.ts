import { BaseGenerator } from './base_generator.js'

export class LimiterGenerator extends BaseGenerator {
  async generate(_name: string, limiters: Record<string, any>) {
    const outputPath = this.app.makePath('start/limiter.ts')

    let content = "import { limiter } from '@adonisjs/limiter/services/main'\n\n"

    for (const [name, definition] of Object.entries(limiters)) {
      const limit = (definition as any)?.limit || 10
      const duration = (definition as any)?.duration || '1 min'
      const blockFor = (definition as any)?.blockFor
        ? `.blockFor('${(definition as any).blockFor}')`
        : ''

      content += `export const ${name} = limiter.define('${name}', (ctx) => {\n`
      content += `  return limiter.allowRequests(${limit}).every('${duration}')${blockFor}\n`
      content += `})\n\n`
    }

    const { writeFileSync, existsSync, mkdirSync } = await import('node:fs')
    const { dirname } = await import('node:path')

    const dir = dirname(outputPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    writeFileSync(outputPath, content)
    this.logger.action(`create ${outputPath}`).succeeded()
    if (this.manifest) {
      this.manifest.push(outputPath)
    }
  }
}
