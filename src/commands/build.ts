import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
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
import { MiddlewareGenerator } from '../generators/middleware_generator.js'
import { OpenAPIGenerator } from '../generators/openapi_generator.js'
import { ChannelGenerator } from '../generators/channel_generator.js'
import { TransformerGenerator } from '../generators/transformer_generator.js'
import { LimiterGenerator } from '../generators/limiter_generator.js'
import string from '@adonisjs/core/helpers/string'

export default class BuildBlueprint extends BaseCommand {
  static commandName = 'blueprint:build'
  static description = 'Build the application from the draft.yaml file'

  @args.string({ description: 'The draft file to build from', default: 'draft.yaml' })
  declare draftFile: string

  @flags.boolean({ alias: 'e', description: 'Erase existing files before building' })
  declare erase: boolean

  @flags.boolean({ alias: 'w', description: 'Watch the draft file for changes' })
  declare watch: boolean

  @flags.boolean({ alias: 'f', description: 'Force overwrite existing files' })
  declare force: boolean

  private manifest: string[] = []

  async run() {
    if (this.watch) {
      this.logger.info(`Watching for changes in ${this.draftFile}...`)
      const { watch } = await import('node:fs')

      // Initial build
      await this.build()

      const watcher = watch(this.app.makePath(this.draftFile))
      watcher.on('change', async () => {
        this.logger.info('Changes detected, rebuilding...')
        await this.build()
      })
      return
    }

    await this.build()
  }

  private async eraseExisting() {
    const manifestPath = this.app.makePath('.blueprint_manifest.json')
    if (existsSync(manifestPath)) {
      this.logger.info('Erasing existing generated files...')
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      const files: string[] = manifest.files || []

      for (const file of files) {
        if (existsSync(file)) {
          unlinkSync(file)
          this.logger.action(`deleted ${file}`).succeeded()
        }
      }
      unlinkSync(manifestPath)
    }
  }

  private async build() {
    if (this.erase) {
      await this.eraseExisting()
    }

    this.logger.info('Building application from ' + this.draftFile)

    const parser = new BlueprintParser()
    const blueprint = await parser.parse(this.draftFile)
    this.manifest = []

    if (blueprint.auth) {
      this.logger.info('Auth shorthand detected. Injecting AuthController...')
      if (!blueprint.controllers) blueprint.controllers = {}
      if (!blueprint.controllers['Auth']) {
        blueprint.controllers['Auth'] = {
          login: { render: 'auth/login' },
          register: { render: 'auth/register' },
          store: {
            validate: 'email, password',
            service: 'Auth.login',
            redirect: 'dashboard',
          },
          logout: { auth: 'logout', redirect: 'login' },
        }
      }

      if (!blueprint.models) blueprint.models = {}
      if (!blueprint.models['User']) {
        blueprint.models['User'] = {
          attributes: {
            email: 'string:unique',
            password: 'string',
            full_name: 'string:optional',
          },
        }
      }
    }

    const forceOverwrite = this.force || this.erase

    if (blueprint.models) {
      const modelGenerator = new ModelGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const migrationGenerator = new MigrationGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const validatorGenerator = new ValidatorGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const factoryGenerator = new FactoryGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const seederGenerator = new SeederGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const enumGenerator = new EnumGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const transformerGenerator = new TransformerGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )

      for (const [name, definition] of Object.entries(blueprint.models)) {
        this.logger.info(`Generating model, migration, validator, factory and seeder for ${name}`)
        await modelGenerator.generate(name, definition)
        await migrationGenerator.generate(name, definition)
        await validatorGenerator.generate(name, definition)
        await factoryGenerator.generate(name, definition)
        await seederGenerator.generate(name, definition)
        await transformerGenerator.generate(name, definition)

        // Generate Enums if present
        if ((definition as any).attributes) {
          for (const [attrName, attrType] of Object.entries((definition as any).attributes)) {
            if (typeof attrType === 'string' && attrType.startsWith('enum:')) {
              const enumName = string.pascalCase(name + '_' + attrName)
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
      const controllerGenerator = new ControllerGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const routeGenerator = new RouteGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const testGenerator = new TestGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const viewGenerator = new ViewGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const policyGenerator = new PolicyGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )
      const middlewareGenerator = new MiddlewareGenerator(
        this.app,
        this.logger,
        this.manifest,
        undefined,
        forceOverwrite
      )

      const useInertia = blueprint.settings?.inertia?.enabled || false
      const adapter = blueprint.settings?.inertia?.adapter || 'react'
      const isApi = blueprint.settings?.api || false

      for (const [name, definition] of Object.entries(blueprint.controllers)) {
        this.logger.info(`Generating controller, routes, tests and policies for ${name}`)
        await controllerGenerator.generate(name, definition, useInertia, isApi, blueprint.models)
        await routeGenerator.generate(name, definition, isApi)
        await testGenerator.generate(name, definition, blueprint)
        await policyGenerator.generate(name, definition)

        // Generate custom middleware if specified
        if (definition.middleware) {
          for (const mw of definition.middleware) {
            // Only generate if it looks like a custom middleware name (not a core one like 'auth')
            if (!['auth', 'guest', 'silentAuth'].includes(mw)) {
              this.logger.info(`Generating middleware ${mw}`)
              await middlewareGenerator.generate(mw)
            }
          }
        }

        // Generate views only if not API mode
        if (!isApi) {
          for (const actionDef of Object.values(definition)) {
            if (typeof actionDef === 'object' && actionDef !== null && (actionDef as any).render) {
              const viewPath = (actionDef as any).render
              this.logger.info(`Generating view ${viewPath} (${useInertia ? adapter : 'edge'})`)
              const modelName = string.pascalCase(string.singular(name))
              const modelDef = blueprint.models ? blueprint.models[modelName] : null
              await viewGenerator.generate(viewPath, useInertia, adapter, modelDef)
            }
          }
        }
      }
    }

    if (blueprint.channels) {
      const channelGenerator = new ChannelGenerator(this.app, this.logger, this.manifest)
      await channelGenerator.generate('', blueprint.channels)
    }

    if (blueprint.limiters) {
      const limiterGenerator = new LimiterGenerator(this.app, this.logger, this.manifest)
      await limiterGenerator.generate('', blueprint.limiters)
    }

    if (blueprint.settings?.api) {
      this.logger.info('Generating API documentation...')
      const openapiGenerator = new OpenAPIGenerator(this.app, this.logger, this.manifest)
      await openapiGenerator.generate('', blueprint)
    }

    // Save manifest
    if (this.manifest.length > 0) {
      const manifestPath = this.app.makePath('.blueprint_manifest.json')
      writeFileSync(manifestPath, JSON.stringify({ files: this.manifest }, null, 2))
      this.logger.info(`Manifest saved to ${manifestPath}`)
    }

    this.logger.success('Application built successfully')
  }
}
