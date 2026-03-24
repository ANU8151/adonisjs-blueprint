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
import { SeederGenerator } from '../generators/seeder_generator.js'
import { PolicyGenerator } from '../generators/policy_generator.js'
import { EnumGenerator } from '../generators/enum_generator.js'

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

    if (blueprint.auth) {
      this.logger.info('Auth shorthand detected.')
      this.logger.warning('AdonisJS 7 provides a native, highly secure auth scaffolding.')
      this.logger.action('Please run: node ace add auth').succeeded()

      // We can also auto-inject a simple AuthController into the blueprint definition here
      if (!blueprint.controllers) blueprint.controllers = {}
      if (!blueprint.controllers['Auth']) {
        blueprint.controllers['Auth'] = {
          login: { render: 'auth/login' },
          register: { render: 'auth/register' },
          store: { validate: 'email, password', auth: 'true', redirect: 'home' },
          logout: { auth: 'logout', redirect: 'home' },
        }
      }
    }

    if (blueprint.models) {
      const modelGenerator = new ModelGenerator(this.app, this.logger)
      const migrationGenerator = new MigrationGenerator(this.app, this.logger)
      const validatorGenerator = new ValidatorGenerator(this.app, this.logger)
      const factoryGenerator = new FactoryGenerator(this.app, this.logger)
      const seederGenerator = new SeederGenerator(this.app, this.logger)
      const enumGenerator = new EnumGenerator(this.app, this.logger)

      for (const [name, definition] of Object.entries(blueprint.models)) {
        this.logger.info(`Generating model, migration, validator, factory and seeder for ${name}`)
        await modelGenerator.generate(name, definition)
        await migrationGenerator.generate(name, definition)
        await validatorGenerator.generate(name, definition)
        await factoryGenerator.generate(name, definition)
        await seederGenerator.generate(name, definition)

        // Generate Enums if present
        if ((definition as any).attributes) {
          for (const [attrName, attrType] of Object.entries((definition as any).attributes)) {
            if (typeof attrType === 'string' && attrType.startsWith('enum:')) {
              const enumName = `${name.charAt(0).toUpperCase() + name.slice(1)}${attrName.charAt(0).toUpperCase() + attrName.slice(1)}`
              const values = attrType
                .split(':')[1]
                .split(',')
                .map((v) => v.trim())
              this.logger.info(`Generating enum ${enumName}`)
              await enumGenerator.generate(enumName, { values })
            }
          }
        }
      }
    }

    if (blueprint.controllers) {
      const controllerGenerator = new ControllerGenerator(this.app, this.logger)
      const routeGenerator = new RouteGenerator(this.app, this.logger)
      const testGenerator = new TestGenerator(this.app, this.logger)
      const viewGenerator = new ViewGenerator(this.app, this.logger)
      const policyGenerator = new PolicyGenerator(this.app, this.logger)

      const useInertia = blueprint.settings?.inertia?.enabled || false
      const adapter = blueprint.settings?.inertia?.adapter || 'react'
      const isApi = blueprint.settings?.api || false

      for (const [name, definition] of Object.entries(blueprint.controllers)) {
        this.logger.info(`Generating controller, routes, tests and policies for ${name}`)
        await controllerGenerator.generate(name, definition, useInertia, isApi)
        await routeGenerator.generate(name, definition, isApi)
        await testGenerator.generate(name, definition)
        await policyGenerator.generate(name, definition)

        // Generate views only if not API mode
        if (!isApi) {
          for (const actionDef of Object.values(definition)) {
            if (typeof actionDef === 'object' && actionDef !== null && (actionDef as any).render) {
              const viewPath = (actionDef as any).render
              this.logger.info(`Generating view ${viewPath} (${useInertia ? adapter : 'edge'})`)
              await viewGenerator.generate(viewPath, useInertia, adapter)
            }
          }
        }
      }
    }

    this.logger.success('Application built successfully')
  }
}

export default BuildBlueprint
