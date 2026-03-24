import { BaseCommand } from '@adonisjs/core/ace'
import { stubsRoot } from '../../stubs/main.js'

export default class EjectStubs extends BaseCommand {
  static commandName = 'blueprint:stubs'
  static description = 'Publish blueprint stubs to your project root'

  async run() {
    const stubs = await this.app.stubs.create()
    await stubs.copy(stubsRoot, {
      overwrite: false,
      source: stubsRoot,
    })

    this.logger.success('Stubs published to ./stubs/blueprint')
  }
}
