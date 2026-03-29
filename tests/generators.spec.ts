import { test } from '@japa/runner'
import { ModelGenerator } from '../src/generators/model_generator.js'
import { MigrationGenerator } from '../src/generators/migration_generator.js'
import { ControllerGenerator } from '../src/generators/controller_generator.js'
import { FactoryGenerator } from '../src/generators/factory_generator.js'
import { ViewGenerator } from '../src/generators/view_generator.js'
import { PolicyGenerator } from '../src/generators/policy_generator.js'
import { SeederGenerator } from '../src/generators/seeder_generator.js'
import { ValidatorGenerator } from '../src/generators/validator_generator.js'
import { EventGenerator } from '../src/generators/event_generator.js'
import { MailGenerator } from '../src/generators/mail_generator.js'
import { JobGenerator } from '../src/generators/job_generator.js'
import { RouteGenerator } from '../src/generators/route_generator.js'
import { MiddlewareGenerator } from '../src/generators/middleware_generator.js'
import { TestGenerator } from '../src/generators/test_generator.js'
import { ServiceGenerator } from '../src/generators/service_generator.js'
import { EnumGenerator } from '../src/generators/enum_generator.js'
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
                const getVal = (path: string, obj: any) => {
                  const parts = path.split('.')
                  let val = obj
                  for (const p of parts) {
                    if (val === undefined || val === null) return undefined
                    val = val[p]
                  }
                  return val
                }

                const inspect = (val: any) => JSON.stringify(val)

                const processLogic = (text: string, currentState: any): string => {
                  let processed = text

                  // Handle @if
                  processed = processed.replace(
                    /@if\((.*?)\)([\s\S]*?)@else([\s\S]*?)@end/g,
                    (_match, condition, body, elseBody) => {
                      const val = getVal(condition, currentState)
                      return val ? body : elseBody
                    }
                  )
                  processed = processed.replace(
                    /@if\((.*?)\)([\s\S]*?)@end/g,
                    (_match, condition, body) => {
                      const val = getVal(condition, currentState)
                      return val ? body : ''
                    }
                  )

                  // Handle remaining {{ }} placeholders
                  processed = processed.replace(/{{ (.*?) }}/g, (match, path) => {
                    if (path.startsWith('inspect(')) {
                      const valPath = path.match(/inspect\((.*?)\)/)![1]
                      const val = getVal(valPath, currentState)
                      return inspect(val)
                    }
                    const val = getVal(path, currentState)
                    if (val !== undefined && val !== null) {
                      if (typeof val === 'object' && !Array.isArray(val)) {
                        return match
                      }
                      return String(val)
                    }
                    return match
                  })

                  return processed
                }

                const processEach = (text: string, currentState: any): string => {
                  return text.replace(
                    /@each\((.*?) in (.*?)\)([\s\S]*?)@end/g,
                    (_match, item, list, body) => {
                      const val = getVal(list, currentState)
                      if (Array.isArray(val)) {
                        return val
                          .map((v) => {
                            const localState = { ...currentState, [item]: v }
                            return processLogic(body, localState)
                          })
                          .join('\n')
                      }
                      return ''
                    }
                  )
                }

                let finalContent = processEach(content, state)
                finalContent = processLogic(finalContent, state)

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
                      ext = '.ts'
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
                    } else if (type === 'middleware') {
                      folder = 'app/middleware'
                      ext = '_middleware.ts'
                    } else if (type === 'service') {
                      folder = 'app/services'
                      ext = '_service.ts'
                    } else if (type === 'enum') {
                      folder = 'app/enums'
                    } else if (type === 'view') {
                      folder = 'resources/views'
                      ext = '.edge'
                    } else if (type === 'view-react') {
                      folder = 'inertia/pages'
                      ext = '.tsx'
                    } else if (type === 'view-vue') {
                      folder = 'inertia/pages'
                      ext = '.vue'
                    } else if (type === 'view-svelte') {
                      folder = 'inertia/pages'
                      ext = '.svelte'
                    } else if (type === 'policy') {
                      folder = 'app/policies'
                      ext = '_policy.ts'
                    } else if (type === 'seeder') {
                      folder = 'database/seeders'
                      ext = '_seeder.ts'
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
                  destination,
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
    const mockCodemods = {
      makeUsingStub: async (root: string, path: string, state: any) => {
        try {
          const stubs = await app.stubs.create()
          const stub = await stubs.build(path, { source: root })
          const prepared = (stub as any).prepare(state)
          await prepared.write()
          return {
            destination: (prepared as any).destination,
            stub: {
              generate: () => ({
                to: () => {},
              }),
            },
          }
        } catch (e) {
          // Ignore errors from deep mocks like ClassGenerator if stub doesn't exist in mock context
          return { destination: '' }
        }
      },
    } as any
    const generator = new GeneratorClass(app, mockLogger, [], mockCodemods)
    return generator
  }

  test('generate model', async ({ assert, fs }) => {
    const generator = setupGenerator(ModelGenerator, fs, 'model')
    await generator.generate('User', {
      attributes: { email: 'string' },
    })
    await assert.fileExists('app/models/user.ts')
    assert.include(await fs.contents('app/models/user.ts'), 'class User extends BaseModel')
  })

  test('generate migration with pivot', async ({ assert, fs }) => {
    const generator = setupGenerator(MigrationGenerator, fs, 'migration')
    await generator.generate('Post', {
      attributes: { title: 'string' },
      relationships: {
        users: 'belongsToMany',
      },
    })
    // Our mock simple destination handles this
    await assert.fileExists('database/migrations/posts.ts')
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

  test('generate controller with inertia rendering', async ({ assert, fs }) => {
    const generator = setupGenerator(ControllerGenerator, fs, 'controller')
    await generator.generate(
      'Post',
      {
        index: { render: 'posts/index' },
      },
      true
    )

    await assert.fileExists('app/controllers/post_controller.ts')
    const content = await fs.contents('app/controllers/post_controller.ts')
    assert.include(content, 'async index({ request, response, inertia }: HttpContext)')
    assert.include(content, "return inertia.render('posts/index')")
  })

  test('generate edge view', async ({ assert, fs }) => {
    const generator = setupGenerator(ViewGenerator, fs, 'view')
    await generator.generate('posts/index', false)

    await assert.fileExists('resources/views/posts/index.edge')
    const content = await fs.contents('resources/views/posts/index.edge')
    assert.include(content, "@layout.app({ title: 'Posts/index index' })")
  })

  test('generate react view', async ({ assert, fs }) => {
    const generator = setupGenerator(ViewGenerator, fs, 'view-react')
    await generator.generate('posts/index', true, 'react')

    await assert.fileExists('inertia/pages/posts/index.tsx')
    const content = await fs.contents('inertia/pages/posts/index.tsx')
    assert.include(content, "import { Head } from '@inertiajs/react'")
  })

  test('generate vue view', async ({ assert, fs }) => {
    const generator = setupGenerator(ViewGenerator, fs, 'view-vue')
    await generator.generate('posts/index', true, 'vue')

    await assert.fileExists('inertia/pages/posts/index.vue')
    const content = await fs.contents('inertia/pages/posts/index.vue')
    assert.include(content, '<script setup lang="ts">')
    assert.include(content, "import { Head } from '@inertiajs/vue3'")
  })

  test('generate svelte view', async ({ assert, fs }) => {
    const generator = setupGenerator(ViewGenerator, fs, 'view-svelte')
    await generator.generate('posts/index', true, 'svelte')

    await assert.fileExists('inertia/pages/posts/index.svelte')
    const content = await fs.contents('inertia/pages/posts/index.svelte')
    assert.include(content, "import { Head } from '@inertiajs/svelte'")
  })

  test('generate seeder', async ({ assert, fs }) => {
    const generator = setupGenerator(SeederGenerator, fs, 'seeder')
    await generator.generate('User', {})
    await assert.fileExists('database/seeders/user_seeder.ts')
    const content = await fs.contents('database/seeders/user_seeder.ts')
    assert.include(content, 'UserFactory.createMany(10)')
  })

  test('generate policy', async ({ assert, fs }) => {
    const generator = setupGenerator(PolicyGenerator, fs, 'policy')
    await generator.generate('Post', {
      update: { authorize: 'update, post' },
    })
    await assert.fileExists('app/policies/post_policy.ts')
    const content = await fs.contents('app/policies/post_policy.ts')
    assert.include(content, 'update(user: User, post: Post): AuthorizerResponse')
  })

  test('generate validator', async ({ assert, fs }) => {
    const generator = setupGenerator(ValidatorGenerator, fs, 'validator')
    await generator.generate('User', {
      attributes: { email: 'email:unique', password: 'string:min:8' },
    })
    await assert.fileExists('app/validators/user.ts')
    const content = await fs.contents('app/validators/user.ts')
    assert.include(content, 'vine.string().email().unique')
    assert.include(content, 'vine.string().minLength(8)')
  })

  test('generate event', async ({ assert, fs }) => {
    const generator = setupGenerator(EventGenerator, fs, 'event')
    await generator.generate('UserRegistered', {})
    await assert.fileExists('app/events/userregistered.ts')
  })

  test('generate mail', async ({ assert, fs }) => {
    const generator = setupGenerator(MailGenerator, fs, 'mail')
    await generator.generate('WelcomeEmail', {})
    await assert.fileExists('app/mails/welcomeemail.ts')
  })

  test('generate job', async ({ assert, fs }) => {
    const generator = setupGenerator(JobGenerator, fs, 'job')
    await generator.generate('ProcessVideo', {})
    await assert.fileExists('app/jobs/processvideo.ts')
  })

  test('generate enum', async ({ assert, fs }) => {
    const generator = setupGenerator(EnumGenerator, fs, 'enum')
    await generator.generate('UserRole', { values: ['admin', 'user'] })
    await assert.fileExists('app/enums/userrole.ts')
    const content = await fs.contents('app/enums/userrole.ts')
    assert.include(content, "ADMIN = 'admin'")
    assert.include(content, "USER = 'user'")
  })

  test('generate middleware', async ({ assert, fs }) => {
    const generator = setupGenerator(MiddlewareGenerator, fs, 'middleware')
    await generator.generate('AdminOnly', {})
    await assert.fileExists('app/middleware/adminonly_middleware.ts')
  })

  test('generate service', async ({ assert, fs }) => {
    const generator = setupGenerator(ServiceGenerator, fs, 'service')
    await generator.generate('PaymentService')
    await assert.fileExists('app/services/paymentservice_service.ts')
  })

  test('generate route', async ({ assert, fs }) => {
    const generator = setupGenerator(RouteGenerator, fs, 'route')
    await generator.generate('Post', { middleware: ['auth'] }, true)

    const content = await fs.contents('start/routes.ts')
    assert.include(
      content,
      "router.resource('posts', () => import('#controllers/post_controller')).apiOnly().use('*', [middleware.auth()])"
    )
  })

  test('generate functional test', async ({ assert, fs }) => {
    const generator = setupGenerator(TestGenerator, fs, 'test')
    await generator.generate(
      'Post',
      {
        index: {},
        store: { auth: true },
      },
      { auth: true } as any
    )

    await assert.fileExists('tests/functional/post.spec.ts')
    const content = await fs.contents('tests/functional/post.spec.ts')
    assert.include(content, "test.group('Post Controller'")
    assert.include(content, 'loginAs(user)')
  })
})
