import { BaseCommand } from '@adonisjs/core/ace'
import { stubsRoot } from '../../stubs/main.js'

export default class EjectStubs extends BaseCommand {
  static commandName = 'blueprint:stubs'
  static description = 'Publish blueprint stubs to your project root'

  async run() {
    const stubs = await this.app.stubs.create()

    // Copy only .stub files if possible, but stubs.copy copies directories.
    // Since stubsRoot contains config.stub and make/ directory,
    // we copy everything.
    await stubs.copy('.', {
      overwrite: false,
      source: stubsRoot,
    })

    this.logger.success('Stubs published to ./stubs')
  }
}
