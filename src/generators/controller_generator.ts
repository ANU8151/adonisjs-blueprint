import { BaseGenerator } from './base_generator.js'

import type { Entity } from '../types.js'
import { EventGenerator } from './event_generator.js'
import { MailGenerator } from './mail_generator.js'
import { JobGenerator } from './job_generator.js'
import { NotificationGenerator } from './notification_generator.js'
import { ServiceGenerator } from './service_generator.js'
import string from '@adonisjs/core/helpers/string'
import { statementsRegistry } from '../statements_registry.js'
import '../statements/index.js'

export class ControllerGenerator extends BaseGenerator {
  async generate(
    name: string,
    definition: any,
    useInertia: boolean = false,
    isApi: boolean = false,
    models?: any
  ) {
    const nameParts = name.split(/[\/.]/)
    const baseName = nameParts.pop() || ''
    const entity = this.app.generators.createEntity(baseName) as Entity
    if (nameParts.length > 0) {
      entity.path = nameParts.map((p) => string.snakeCase(p || '')).join('/')
    }

    const eventGenerator = new EventGenerator(this.app, this.logger, this.manifest)
    const mailGenerator = new MailGenerator(this.app, this.logger, this.manifest)
    const jobGenerator = new JobGenerator(this.app, this.logger, this.manifest)
    const notificationGenerator = new NotificationGenerator(this.app, this.logger, this.manifest)
    const serviceGenerator = new ServiceGenerator(this.app, this.logger, this.manifest)

    const actions: any[] = []
    const imports = {
      models: new Set<string>(),
      validators: new Set<string>(),
      events: new Set<string>(),
      policies: new Set<string>(),
      mails: new Set<string>(),
      jobs: new Set<string>(),
      notifications: new Set<string>(),
      services: new Map<string, string>(),
      transformers: new Set<string>(),
    }

    const middleware = definition.middleware || []

    const pluralName = string.plural(string.camelCase(entity.name || ''))
    const singularName = string.camelCase(entity.name || '')

    // Support resource: true shorthand
    let normalizedDefinition = definition
    if (definition.resource) {
      normalizedDefinition = isApi
        ? {
            index: { query: 'all', render: 'json' },
            store: { validate: 'all', save: true, render: 'json' },
            show: { query: 'find', render: 'json' },
            update: { validate: 'all', save: true, render: 'json' },
            destroy: { delete: true, render: 'json' },
          }
        : {
            index: { render: `${pluralName}/index` },
            create: { render: `${pluralName}/create` },
            store: { validate: 'all', save: true, redirect: `${pluralName}.index` },
            show: { render: `${pluralName}/show` },
            edit: { render: `${pluralName}/edit` },
            update: {
              validate: 'all',
              save: true,
              redirect: `${pluralName}.index`,
            },
            destroy: { delete: true, redirect: `${pluralName}.index` },
          }
    }

    const generators = {
      event: eventGenerator,
      mail: mailGenerator,
      job: jobGenerator,
      notification: notificationGenerator,
      service: serviceGenerator,
    }

    for (const [actionName, actionDef] of Object.entries(normalizedDefinition)) {
      if (actionName === 'resource' || actionName === 'middleware' || actionName === 'stub')
        continue

      const contextItems = new Set<string>(['request', 'response'])
      let logicLines: string[] = []

      if (typeof actionDef === 'object' && actionDef !== null) {
        const typedDef = actionDef as any

        // Sort keys to maintain some order (e.g., query before render)
        const order = [
          'auth',
          'authorize',
          'validate',
          'query',
          'save',
          'delete',
          'fire',
          'send',
          'dispatch',
          'notify',
          'upload',
          'flash',
          'render',
          'redirect',
        ]
        const keys = Object.keys(typedDef).sort((a, b) => {
          const idxA = order.indexOf(a)
          const idxB = order.indexOf(b)
          if (idxA === -1 && idxB === -1) return 0
          if (idxA === -1) return 1
          if (idxB === -1) return -1
          return idxA - idxB
        })

        for (const key of keys) {
          const handler = statementsRegistry.get(key)
          if (handler) {
            const result = await handler(typedDef[key], {
              actionName,
              actionDef,
              entity,
              isApi,
              useInertia,
              pluralName,
              singularName,
              generators,
              models,
            })

            logicLines.push(...result.logicLines)
            if (result.imports) {
              if (result.imports.models)
                result.imports.models.forEach((i: string) => i && imports.models.add(i))
              if (result.imports.validators)
                result.imports.validators.forEach((i: string) => i && imports.validators.add(i))
              if (result.imports.events)
                result.imports.events.forEach((i: string) => i && imports.events.add(i))
              if (result.imports.policies)
                result.imports.policies.forEach((i: string) => i && imports.policies.add(i))
              if (result.imports.mails)
                result.imports.mails.forEach((i: string) => i && imports.mails.add(i))
              if (result.imports.jobs)
                result.imports.jobs.forEach((i: string) => i && imports.jobs.add(i))
              if (result.imports.notifications)
                result.imports.notifications.forEach(
                  (i: string) => i && imports.notifications.add(i)
                )
              if (result.imports.services)
                result.imports.services.forEach((serviceName: string) => {
                  if (serviceName) {
                    if (serviceName.endsWith('Transformer')) {
                      imports.transformers.add(serviceName)
                    } else {
                      const servicePath =
                        string.snakeCase(serviceName.replace('Service', '')) + '_service'
                      imports.services.set(serviceName, servicePath)
                    }
                  }
                })
            }
            if (result.context) {
              result.context.forEach((c: string) => c && contextItems.add(c))
            }
          }
        }
      }

      actions.push({
        name: actionName,
        context: Array.from(contextItems).join(', '),
        logic: logicLines.join('\n    ') || '// Action logic here',
      })
    }

    const importsLines: string[] = ["import type { HttpContext } from '@adonisjs/core/http'"]
    let injectLine = ''

    if (imports.services.size > 0) {
      importsLines.push("import { inject } from '@adonisjs/core'")
      injectLine = '@inject()'
    }
    imports.models.forEach((model) => {
      if (model) importsLines.push(`import ${model} from '#models/${string.snakeCase(model)}'`)
    })
    imports.validators.forEach((v) => {
      if (v)
        importsLines.push(
          `import { ${v} } from '#validators/${string.snakeCase(entity.name || '').toLowerCase()}'`
        )
    })
    imports.events.forEach((e) => {
      if (e) importsLines.push(`import ${e} from '#events/${string.snakeCase(e).toLowerCase()}'`)
    })
    imports.policies.forEach((p) => {
      if (p)
        importsLines.push(
          `import ${p} from '#policies/${string.snakeCase(entity.name || '').toLowerCase()}_policy'`
        )
    })
    imports.services.forEach((path, serviceName) => {
      if (serviceName && path) importsLines.push(`import ${serviceName} from '#services/${path}'`)
    })
    imports.transformers.forEach((t) => {
      if (t)
        importsLines.push(
          `import ${t} from '#transformers/${string.snakeCase(t.replace('Transformer', ''))}_transformer'`
        )
    })

    const middlewareLines =
      middleware.length > 0
        ? `static middleware = [\n    ${middleware.map((m: string) => `middleware.${m}()`).join(',\n    ')}\n  ]`
        : ''

    const actionLines = actions
      .map((action) => {
        return `async ${action.name}({ ${action.context} }: HttpContext) {\n    ${action.logic}\n  }`
      })
      .join('\n\n  ')

    await this.generateStub(
      'make/controller/main.stub',
      {
        entity,
        injectLine,
        actions, // Keep for tests
        middleware, // Keep for tests
        importsData: {
          models: Array.from(imports.models),
          validators: Array.from(imports.validators),
          events: Array.from(imports.events),
          policies: Array.from(imports.policies),
          mails: Array.from(imports.mails),
          jobs: Array.from(imports.jobs),
          notifications: Array.from(imports.notifications),
          services: Array.from(imports.services.entries()).map(([serviceName, path]) => ({
            name: serviceName,
            path,
          })),
        },
        importsLines: importsLines.join('\n'),
        middlewareLines,
        actionLines,
      },
      definition.stub
    )
  }
}
