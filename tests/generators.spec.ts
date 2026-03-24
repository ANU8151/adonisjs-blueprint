import { test } from '@japa/runner'
import { ModelGenerator } from '../src/generators/model_generator.js'
import { MigrationGenerator } from '../src/generators/migration_generator.js'
import { ControllerGenerator } from '../src/generators/controller_generator.js'
import { ValidatorGenerator } from '../src/generators/validator_generator.js'
import { join, dirname } from 'node:path'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

test.group('Generators', () => {
  const mockApp = (fs: any, type: string) =>
    ({
      makePath: (...args: string[]) => join(fs.basePath, ...args),
      generators: {
        createEntity: (name: string) => ({
          name,
          path: '',
          className: name.charAt(0).toUpperCase() + name.slice(1),
          tableName: name.toLowerCase() + 's',
        }),
      },
      stubs: {
        create: async () => ({
          build: async (stubPath: string, { source }: { source: string }) => {
            const fullStubPath = join(source, stubPath)
            let content = readFileSync(fullStubPath, 'utf8')

            return {
              replaceWith: (newContent: string) => {
                content = newContent
              },
              prepare: (state: any) => {
                let finalContent = content.replace(
                  /{{ entity.className }}/g,
                  state.entity.className
                )
                finalContent = finalContent.replace(/{{ entity.name }}/g, state.entity.name)
                finalContent = finalContent.replace(
                  /{{ entity.tableName }}/g,
                  state.entity.tableName
                )

                const exportsMatch = finalContent.match(/{{{([\s\S]*?)}}}/)
                let destination = ''
                if (exportsMatch) {
                  const exportsCode = exportsMatch[1]
                  if (exportsCode.includes('app.makePath')) {
                    let folder = 'app/models'
                    let ext = '.ts'
                    if (type === 'migration') {
                      folder = 'database/migrations'
                    } else if (type === 'controller') {
                      folder = 'app/controllers'
                      ext = '_controller.ts'
                    } else if (type === 'validator') {
                      folder = 'app/validators'
                    }
                    destination = join(fs.basePath, folder, state.entity.name + ext)
                  }
                  finalContent = finalContent.replace(/{{{[\s\S]*?}}}/, '')
                }

                return {
                  write: async () => {
                    mkdirSync(dirname(destination), { recursive: true })
                    writeFileSync(destination, finalContent)
                  },
                }
              },
            }
          },
        }),
      },
    }) as any

  const mockLogger = {
    info: () => {},
    success: () => {},
    error: () => {},
  } as any

  const setupGenerator = (GeneratorClass: any, fs: any, type: string) => {
    const app = mockApp(fs, type)
    const generator = new GeneratorClass(app, mockLogger)
    const generatorWithMock = generator as any
    generatorWithMock.codemods = {
      makeUsingStub: async (root: string, path: string, state: any) => {
        const stubs = await app.stubs.create()
        const stub = await stubs.build(path, { source: root })
        const prepared = (stub as any).prepare(state)
        await prepared.write()
      },
    }
    return generator
  }

  test('generate model', async ({ assert, fs }) => {
    const generator = setupGenerator(ModelGenerator, fs, 'model')
    await generator.generate('User', {
      attributes: { email: 'string' },
    })
    await assert.fileExists('app/models/User.ts')
    assert.include(await fs.contents('app/models/User.ts'), 'class User extends UserSchema')
  })

  test('generate migration', async ({ assert, fs }) => {
    const generator = setupGenerator(MigrationGenerator, fs, 'migration')
    await generator.generate('User', {
      attributes: { email: 'string' },
    })
    // Since our mock destination is simplified for test User.ts
    await assert.fileExists('database/migrations/User.ts')
    assert.include(await fs.contents('database/migrations/User.ts'), "tableName = 'users'")
  })

  test('generate controller', async ({ assert, fs }) => {
    const generator = setupGenerator(ControllerGenerator, fs, 'controller')
    await generator.generate('User', {
      index: { render: 'users/index' },
    })
    await assert.fileExists('app/controllers/User_controller.ts')
    assert.include(await fs.contents('app/controllers/User_controller.ts'), 'class UserController')
  })

  test('generate validator', async ({ assert, fs }) => {
    const generator = setupGenerator(ValidatorGenerator, fs, 'validator')
    await generator.generate('User', {
      attributes: { email: 'string' },
    })
    await assert.fileExists('app/validators/User.ts')
    assert.include(await fs.contents('app/validators/User.ts'), 'export const createUserValidator')
  })
})
