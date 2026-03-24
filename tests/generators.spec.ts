import { test } from '@japa/runner'
import { ModelGenerator } from '../src/generators/model_generator.js'
import { MigrationGenerator } from '../src/generators/migration_generator.js'
import { ControllerGenerator } from '../src/generators/controller_generator.js'
import { FactoryGenerator } from '../src/generators/factory_generator.js'
import { RouteGenerator } from '../src/generators/route_generator.js'
import { TestGenerator } from '../src/generators/test_generator.js'
import { ClassGenerator } from '../src/generators/class_generator.js'
import { join, dirname } from 'node:path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'

test.group('Generators', () => {
  const mockApp = (fs: any, type: string) =>
    ({
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
          className: name.charAt(0).toUpperCase() + name.slice(1),
          tableName: name.includes('_') ? name : name.toLowerCase() + 's',
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

                // Mock @if blocks
                finalContent = finalContent.replace(
                  /@if\(imports\.(models|validators|events)\)[\s\S]*?@end\n/g,
                  (match) => {
                    const importType = match.match(/imports\.(models|validators|events)/)![1]
                    if (
                      state.imports &&
                      state.imports[importType] &&
                      state.imports[importType].length > 0
                    ) {
                      return match.replace(/@if\(imports\..*?\)\n/, '').replace(/@end\n/, '')
                    }
                    return ''
                  }
                )

                // Mock @each loops for imports
                finalContent = finalContent.replace(
                  /@each\((model|validator|event) in imports\.(models|validators|events)\)([\s\S]*?)@end/g,
                  (match, item, list, body) => {
                    if (state.imports && state.imports[list]) {
                      return state.imports[list]
                        .map((val: string) => body.replace(new RegExp(`{{ ${item} }}`, 'g'), val))
                        .join('')
                    }
                    return ''
                  }
                )

                // Mock @each loops for attributes
                if (state.attributes) {
                  const eachAttrMatch = finalContent.match(
                    /@each\(attribute in attributes\)([\s\S]*?)@end/
                  )
                  if (eachAttrMatch) {
                    const loopBody = eachAttrMatch[1]
                    const replacement = state.attributes
                      .map((attr: any) => {
                        let line = loopBody.replace(/{{ attribute.name }}/g, attr.name)
                        line = line.replace(/{{ attribute.vineType }}/g, attr.vineType)
                        line = line.replace(/{{ attribute.fakerMethod }}/g, attr.fakerMethod)
                        line = line.replace(/{{ attribute.migrationLine }}/g, attr.migrationLine)
                        return line
                      })
                      .join('\n')
                    finalContent = finalContent.replace(
                      /@each\(attribute in attributes\)[\s\S]*?@end/,
                      replacement
                    )
                  }
                }

                // Mock @each loops for actions
                if (state.actions) {
                  const eachActionMatch = finalContent.match(
                    /@each\(action in actions\)([\s\S]*?)@end/
                  )
                  if (eachActionMatch) {
                    const loopBody = eachActionMatch[1]
                    const replacement = state.actions
                      .map((action: any) => {
                        let line = loopBody.replace(/{{ action.name }}/g, action.name)
                        line = line.replace(/{{ action.context }}/g, action.context)
                        line = line.replace(/{{ action.logic }}/g, action.logic)
                        return line
                      })
                      .join('\n')
                    finalContent = finalContent.replace(
                      /@each\(action in actions\)[\s\S]*?@end/,
                      replacement
                    )
                  }
                }

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
                    } else if (type === 'factory') {
                      folder = 'database/factories'
                      ext = '_factory.ts'
                    } else if (type === 'test') {
                      folder = 'tests/functional'
                      ext = '.spec.ts'
                    } else if (type === 'event') {
                      folder = 'app/events'
                    } else if (type === 'mail') {
                      folder = 'app/mails'
                    } else if (type === 'job') {
                      folder = 'app/jobs'
                    }
                    destination = join(fs.basePath, folder, state.entity.name.toLowerCase() + ext)

                    if (type === 'migration') {
                      destination = join(
                        fs.basePath,
                        folder,
                        (state.entity.tableName || state.entity.name.toLowerCase()) + '.ts'
                      )
                    }
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
    warning: () => {},
    action: () => ({ succeeded: () => {} }),
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
    await assert.fileExists('app/models/user.ts')
    assert.include(await fs.contents('app/models/user.ts'), 'class User extends UserSchema')
  })

  test('generate migration with pivot', async ({ assert, fs }) => {
    const generator = setupGenerator(MigrationGenerator, fs, 'migration')
    await generator.generate('Post', {
      attributes: { title: 'string' },
      relationships: {
        users: 'belongsToMany',
      },
    })
    await assert.fileExists('database/migrations/posts.ts')
    await assert.fileExists('database/migrations/post_user.ts')
    const pivotContent = await fs.contents('database/migrations/post_user.ts')
    assert.include(pivotContent, "table.integer('post_id')")
    assert.include(pivotContent, "table.integer('user_id')")
  })

  test('generate factory', async ({ assert, fs }) => {
    const generator = setupGenerator(FactoryGenerator, fs, 'factory')
    await generator.generate('User', {
      attributes: { email: 'email', age: 'integer' },
    })
    await assert.fileExists('database/factories/user_factory.ts')
    const content = await fs.contents('database/factories/user_factory.ts')
    assert.include(content, 'faker.internet.email()')
    assert.include(content, 'faker.number.int()')
  })

  test('generate controller with resource and imports', async ({ assert, fs }) => {
    const generator = setupGenerator(ControllerGenerator, fs, 'controller')
    await generator.generate('Post', {
      store: { validate: 'title', save: true, fire: 'NewPost' },
    })
    await assert.fileExists('app/controllers/post_controller.ts')
    const content = await fs.contents('app/controllers/post_controller.ts')
    assert.include(content, "import Post from '#models/post'")
    assert.include(content, "import NewPost from '#events/newpost'")
    assert.include(content, 'emitter.emit(new NewPost(payload))')

    // Also check if NewPost event was generated
    await assert.fileExists('app/events/newpost.ts')
  })

  test('generate routes', async ({ assert, fs }) => {
    const app = mockApp(fs, 'route')
    const generator = new RouteGenerator(app, mockLogger)
    await generator.generate('User', {})

    const routesContent = await fs.contents('start/routes.ts')
    assert.include(routesContent, "router.resource('users', '#controllers/user_controller')")
  })

  test('generate classes (event, mail, job)', async ({ assert, fs }) => {
    const generator = setupGenerator(ClassGenerator, fs, 'event')
    await generator.generate('NewUser', 'event')
    await assert.fileExists('app/events/newuser.ts')

    const mailGenerator = setupGenerator(ClassGenerator, fs, 'mail')
    await mailGenerator.generate('Welcome', 'mail')
    await assert.fileExists('app/mails/welcome.ts')

    const jobGenerator = setupGenerator(ClassGenerator, fs, 'job')
    await jobGenerator.generate('SyncData', 'job')
    await assert.fileExists('app/jobs/syncdata.ts')
  })
})
