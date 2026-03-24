import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { BlueprintParser } from '../parser.js'
import { ModelGenerator } from '../generators/model_generator.js'
import { MigrationGenerator } from '../generators/migration_generator.js'
import { ControllerGenerator } from '../generators/controller_generator.js'
import { ValidatorGenerator } from '../generators/validator_generator.js'
import { FactoryGenerator } from '../generators/factory_generator.js'
import { RouteGenerator } from '../generators/route_generator.js'
import { TestGenerator } from '../generators/test_generator.js'
import { ViewGenerator } from '../generators/view_generator.js'

export class BuildBlueprint extends BaseCommand {
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
      const factoryGenerator = new FactoryGenerator(this.app, this.logger)

      for (const [name, definition] of Object.entries(blueprint.models)) {
        this.logger.info(`Generating model, migration, validator and factory for ${name}`)
        await modelGenerator.generate(name, definition)
        await migrationGenerator.generate(name, definition)
        await validatorGenerator.generate(name, definition)
        await factoryGenerator.generate(name, definition)
      }
    }

    if (blueprint.controllers) {
      const controllerGenerator = new ControllerGenerator(this.app, this.logger)
      const routeGenerator = new RouteGenerator(this.app, this.logger)
      const testGenerator = new TestGenerator(this.app, this.logger)
      const viewGenerator = new ViewGenerator(this.app, this.logger)

      const useInertia = blueprint.settings?.inertia || false

      for (const [name, definition] of Object.entries(blueprint.controllers)) {
        this.logger.info(`Generating controller, routes and tests for ${name}`)
        await controllerGenerator.generate(name, definition, useInertia)
        await routeGenerator.generate(name, definition)
        await testGenerator.generate(name, definition)

        // Generate views
        for (const actionDef of Object.values(definition)) {
          if (typeof actionDef === 'object' && actionDef !== null && (actionDef as any).render) {
            const viewPath = (actionDef as any).render
            this.logger.info(`Generating view ${viewPath}`)
            await viewGenerator.generate(viewPath, useInertia)
          }
        }
      }
    }

    this.logger.success('Application built successfully')
  }
}

export default BuildBlueprint
