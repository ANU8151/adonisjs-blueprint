import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { BlueprintParser } from '../parser.js'
import { ModelGenerator } from '../generators/model_generator.js'
import { MigrationGenerator } from '../generators/migration_generator.js'
import { ControllerGenerator } from '../generators/controller_generator.js'
import { ValidatorGenerator } from '../generators/validator_generator.js'

export default class BuildBlueprint extends BaseCommand {
  static commandName = 'blueprint:build'
  static description = 'Build the application from the draft.yaml file'

  @args.string({ description: 'The draft file to build from', default: 'draft.yaml' })
  declare draftFile: string

  @flags.boolean({ alias: 'e', description: 'Erase existing files' })
  declare erase: boolean

  async run() {
    this.logger.info('Building application from ' + this.draftFile)

    const parser = new BlueprintParser()
    const blueprint = await parser.parse(this.draftFile)

    if (blueprint.models) {
      const modelGenerator = new ModelGenerator(this.app, this.logger)
      const migrationGenerator = new MigrationGenerator(this.app, this.logger)
      const validatorGenerator = new ValidatorGenerator(this.app, this.logger)

      for (const [name, definition] of Object.entries(blueprint.models)) {
        this.logger.info(`Generating model, migration and validator for ${name}`)
        await modelGenerator.generate(name, definition)
        await migrationGenerator.generate(name, definition)
        await validatorGenerator.generate(name, definition)
      }
    }

    if (blueprint.controllers) {
      const controllerGenerator = new ControllerGenerator(this.app, this.logger)

      for (const [name, definition] of Object.entries(blueprint.controllers)) {
        this.logger.info(`Generating controller ${name}`)
        await controllerGenerator.generate(name, definition)
      }
    }

    this.logger.success('Application built successfully')
  }
}
