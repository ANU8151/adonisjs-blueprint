import { test } from '@japa/runner'
import { ModelGenerator } from '../src/generators/model_generator.js'
import { ControllerGenerator } from '../src/generators/controller_generator.js'
import { SeederGenerator } from '../src/generators/seeder_generator.js'
import { FactoryGenerator } from '../src/generators/factory_generator.js'
import { RouteGenerator } from '../src/generators/route_generator.js'
import { join, dirname } from 'node:path'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import string from '@adonisjs/core/helpers/string'

test.group('Features', () => {
  const setupGenerator = (GeneratorClass: any, fs: any, _type: string) => {
    const app = {
      makePath: (...args: string[]) => {
        const path = join(fs.basePath, ...args)
        if (args[0] === 'start/routes.ts' && !existsSync(path)) {
          mkdirSync(dirname(path), { recursive: true })
          writeFileSync(path, "import router from '@adonisjs/core/services/router'\n")
        }
        return path
      },
      generators: {
        createEntity: (name: string) => ({
          name,
          path: '',
          className: string.pascalCase(name),
          tableName: string.snakeCase(string.plural(name)),
        }),
      },
    } as any

    const mockLogger = {
      info: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      action: () => ({ succeeded: () => {} }),
    } as any

    // We'll capture the state passed to generateStub
    let capturedState: any = null

    const mockCodemods = {
      makeUsingStub: async (_root: string, _path: string, state: any) => {
        capturedState = state
        return {
          destination: join(fs.basePath, 'output.ts'),
          stub: {
            generate: () => ({
              to: () => ({
                to: () => {},
              }),
            }),
          },
        }
      },
    } as any

    const generator = new GeneratorClass(app, mockLogger, [], mockCodemods)
    return { generator, getCapturedState: () => capturedState }
  }

  test('ModelGenerator: pivotTable in belongsToMany', async ({ assert, fs }) => {
    const { generator, getCapturedState } = setupGenerator(ModelGenerator, fs, 'model')
    await generator.generate('User', {
      relationships: {
        roles: 'belongsToMany',
      },
    })
    const state = getCapturedState()
    assert.include(state.relationshipsLines, "pivotTable: 'role_user'")
  })

  test('ModelGenerator: softDeletes', async ({ assert, fs }) => {
    const { generator, getCapturedState } = setupGenerator(ModelGenerator, fs, 'model')
    await generator.generate('User', {
      softDeletes: true,
    })
    const state = getCapturedState()
    assert.include(state.modelImports, 'withSoftDeletes')
    assert.include(state.modelSignature, 'withSoftDeletes')
  })

  test('ControllerGenerator: query with preload', async ({ assert, fs }) => {
    const { generator, getCapturedState } = setupGenerator(ControllerGenerator, fs, 'controller')
    await generator.generate('Post', {
      index: { query: 'all, with: user, categories' },
    })
    const state = getCapturedState()
    const action = state.actions.find((a: any) => a.name === 'index')
    assert.include(action.logic, "preload('user')")
    assert.include(action.logic, "preload('categories')")
  })

  test('ControllerGenerator: save with sync', async ({ assert, fs }) => {
    const { generator, getCapturedState } = setupGenerator(ControllerGenerator, fs, 'controller')
    await generator.generate('Post', {
      store: { save: 'true, with: tags' },
    })
    const state = getCapturedState()
    const action = state.actions.find((a: any) => a.name === 'store')
    assert.include(action.logic, 'Post.create(payload)')
    assert.include(action.logic, '.sync(payload.tag_ids)')
  })

  test('ControllerGenerator: filtered validation', async ({ assert, fs }) => {
    const { generator, getCapturedState } = setupGenerator(ControllerGenerator, fs, 'controller')
    await generator.generate('User', {
      update: { validate: 'email, full_name' },
    })
    const state = getCapturedState()
    const action = state.actions.find((a: any) => a.name === 'update')
    assert.include(action.logic, "pick(['email', 'full_name'])")
    assert.include(action.logic, 'meta: { id: params.id }')
  })

  test('SeederGenerator: dynamic count', async ({ assert, fs }) => {
    const { generator, getCapturedState } = setupGenerator(SeederGenerator, fs, 'seeder')
    await generator.generate('User', { seed: 50 })
    const state = getCapturedState()
    assert.equal(state.count, 50)
  })

  test('FactoryGenerator: faker inference', async ({ assert, fs }) => {
    const { generator, getCapturedState } = setupGenerator(FactoryGenerator, fs, 'factory')
    await generator.generate('User', {
      attributes: {
        first_name: 'string',
        email: 'string',
        city: 'string',
        custom: 'string:faker:lorem.word',
      },
    })
    const state = getCapturedState()
    const firstName = state.attributes.find((a: any) => a.name === 'first_name')
    assert.equal(firstName.fakerMethod, 'person.firstName')
    const custom = state.attributes.find((a: any) => a.name === 'custom')
    assert.equal(custom.fakerMethod, 'lorem.word')
  })

  test('RouteGenerator: grouping and middleware', async ({ assert, fs }) => {
    const { generator } = setupGenerator(RouteGenerator, fs, 'route')
    await generator.generate('Admin/User', {
      middleware: ['auth'],
    })
    const content = await fs.contents('start/routes.ts')
    assert.include(content, 'router.group(() => {')
    assert.include(content, ".prefix('admin')")
    assert.include(content, ".use('*', [middleware.auth()])")
  })
})
