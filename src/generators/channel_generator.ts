import { BaseGenerator } from './base_generator.js'

export class ChannelGenerator extends BaseGenerator {
  async generate(_name: string, channels: Record<string, any>) {
    const outputPath = this.app.makePath('start/transmission.ts')
    
    let content = "import transmission from '@adonisjs/transmission/services/main'\n\n"
    
    for (const [name, definition] of Object.entries(channels)) {
      const channelName = (definition as any).name || name.toLowerCase()
      content += `transmission.authorize('${channelName}', async (user) => {\n`
      if ((definition as any).authorized) {
        content += `  return !!user\n`
      } else {
        content += `  return true\n`
      }
      content += `})\n\n`
    }

    // We don't have a stub for this yet, so we'll use a simple writeFile for now,
    // but we need to match the BaseGenerator requirements.
    // Actually, let's just use it as it is but fix types.
    const { writeFileSync } = await import('node:fs')
    const { existsSync, mkdirSync } = await import('node:fs')
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
