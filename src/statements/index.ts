import { statementsRegistry } from '../statements_registry.js'
import string from '@adonisjs/core/helpers/string'

// query
statementsRegistry.register('query', (value, { entity, pluralName, singularName, useInertia }) => {
  const parts = (value as string).split(',').map((p) => p.trim())
  const queryPart = parts[0]
  const preloads: string[] = []

  for (const part of parts.slice(1)) {
    if (part.startsWith('with:')) {
      const relations = part
        .replace('with:', '')
        .split(',')
        .map((r) => r.trim())
      preloads.push(...relations)
    } else {
      preloads.push(part)
    }
  }

  const queryParts = queryPart.split(':')
  const queryType = queryParts[0]
  const variableName = queryType === 'all' || queryType === 'paginate' ? pluralName : singularName
  const logicLines: string[] = []
  const context: string[] = []
  const transformerName = `${entity.className}Transformer`

  let queryChain = `${entity.className}.query()`
  for (const relation of preloads) {
    if (relation) {
      queryChain += `.preload('${string.camelCase(relation)}')`
    }
  }

  if (queryType === 'all') {
    if (useInertia) {
      logicLines.push(`const models = await ${queryChain}`)
      logicLines.push(`const ${variableName} = ${transformerName}.transform(models)`)
    } else {
      logicLines.push(`const ${variableName} = await ${queryChain}`)
    }
  } else if (queryType === 'paginate') {
    const limit = queryParts[1] || '20'
    if (useInertia) {
      logicLines.push(
        `const results = await ${queryChain}.paginate(request.input('page', 1), ${limit})`
      )
      logicLines.push(`const ${variableName} = ${transformerName}.paginate(results)`)
    } else {
      logicLines.push(
        `const ${variableName} = await ${queryChain}.paginate(request.input('page', 1), ${limit})`
      )
    }
  } else if (queryType === 'find') {
    if (useInertia) {
      logicLines.push(`const model = await ${queryChain}.where('id', params.id).firstOrFail()`)
      logicLines.push(`const ${variableName} = ${transformerName}.transform(model)`)
    } else {
      logicLines.push(
        `const ${variableName} = await ${queryChain}.where('id', params.id).firstOrFail()`
      )
    }
    context.push('params')
  }

  return {
    logicLines,
    imports: {
      models: [entity.className],
      services: useInertia ? [transformerName] : [],
    },
    context,
  }
})

// authorize
statementsRegistry.register('authorize', (value, { entity }) => {
  const authParts = (value as string).split(',')
  const action = authParts[0].trim()
  const modelArg = authParts[1] ? `, ${authParts[1].trim()}` : ''
  const policyName = `${entity.className}Policy`

  return {
    logicLines: [`await bouncer.with(${policyName}).authorize('${action}'${modelArg})`],
    imports: { policies: [policyName] },
    context: ['bouncer'],
  }
})

// validate
statementsRegistry.register('validate', (value, { actionName, entity }) => {
  const validatorName =
    actionName === 'store' || actionName === 'update'
      ? `${actionName === 'store' ? 'create' : 'update'}${entity.className}Validator`
      : 'validator'

  let meta = ''
  if (actionName === 'update') {
    meta = ', { meta: { id: params.id } }'
  }

  if (typeof value === 'string' && value !== 'all') {
    const fields = value.split(',').map((f) => f.trim())
    return {
      logicLines: [
        `const payload = await request.validateUsing(${validatorName}.pick(['${fields.join("', '")}'])${meta})`,
      ],
      imports: { validators: [validatorName] },
      context: actionName === 'update' ? ['params'] : [],
    }
  }

  return {
    logicLines: [`const payload = await request.validateUsing(${validatorName}${meta})`],
    imports: { validators: [validatorName] },
    context: actionName === 'update' ? ['params'] : [],
  }
})

// save
statementsRegistry.register('save', (value, { entity }) => {
  const logicLines: string[] = []
  const parts = typeof value === 'string' ? (value as string).split(',').map((p) => p.trim()) : []
  const relationships: string[] = []

  for (const part of parts.slice(1)) {
    if (part.startsWith('with:')) {
      const relations = part
        .replace('with:', '')
        .split(',')
        .map((r) => r.trim())
      relationships.push(...relations)
    } else {
      relationships.push(part)
    }
  }

  if (relationships.length > 0) {
    logicLines.push(`const model = await ${entity.className}.create(payload)`)
    for (const rel of relationships) {
      if (rel) {
        const singularRel = string.singular(rel)
        logicLines.push(
          `await model.related('${string.camelCase(rel)}').sync(payload.${string.snakeCase(singularRel)}_ids)`
        )
      }
    }
  } else {
    logicLines.push(`await ${entity.className}.create(payload)`)
  }

  return {
    logicLines,
    imports: { models: [entity.className] },
  }
})

// delete
statementsRegistry.register('delete', (_value, { entity, models }) => {
  const modelDef = models ? models[entity.className] : null
  const isSoftDelete = modelDef && modelDef.softDeletes

  return {
    logicLines: [
      `const model = await ${entity.className}.findOrFail(params.id)`,
      `await model.${isSoftDelete ? 'delete()' : 'delete()'}`,
    ],
    imports: { models: [entity.className] },
    context: ['params'],
  }
})

// fire
statementsRegistry.register('fire', async (value, { generators }) => {
  const eventName = value as string
  await generators.event.generate(eventName)
  return {
    logicLines: [`await ${eventName}.dispatch(payload)`],
    imports: { events: [eventName] },
  }
})

// send
statementsRegistry.register('send', async (value, { generators }) => {
  const mailName = value as string
  await generators.mail.generate(mailName)
  return {
    logicLines: [`await ${mailName}.send(payload)`],
    imports: { mails: [mailName] },
  }
})

// dispatch
statementsRegistry.register('dispatch', async (value, { generators }) => {
  const jobName = value as string
  await generators.job.generate(jobName)
  return {
    logicLines: [`await ${jobName}.dispatch(payload)`],
    imports: { jobs: [jobName] },
  }
})

// notify
statementsRegistry.register('notify', async (value, { generators }) => {
  const notifyParts = (value as string).split(', ')
  const target = notifyParts[0].trim()
  const notificationName = notifyParts[1].trim()
  await generators.notification.generate(notificationName)

  return {
    logicLines: [`await ${target}.notify(new ${notificationName}(payload))`],
    imports: { notifications: [notificationName] },
  }
})

// upload
statementsRegistry.register('upload', (value) => {
  const parts = (value as string).split(', ')
  const mainPart = parts[0]
  const uploadParts = mainPart.split(' to: ')
  const field = uploadParts[0].trim()
  const disk = uploadParts[1] ? `, '${uploadParts[1].trim()}'` : ''

  let size = '2mb'
  let extnames = "['jpg', 'png', 'pdf']"

  for (const part of parts.slice(1)) {
    if (part.startsWith('size:')) {
      size = part.replace('size:', '').trim()
    } else if (part.startsWith('ext:')) {
      const exts = part.replace('ext:', '').trim().split(',')
      extnames = `['${exts.join("', '")}']`
    }
  }

  return {
    logicLines: [
      `const ${field}File = request.file('${field}', { size: '${size}', extnames: ${extnames} })!`,
      `const ${field}FileName = \`\${string.random(32)}.\${\${field}File.extname}\``,
      `await ${field}File.moveToDisk(''${disk}, { name: ${field}FileName })`,
    ],
  }
})

// auth
statementsRegistry.register('auth', (value) => {
  if (value === 'login') {
    return {
      logicLines: [
        `const user = await User.verifyCredentials(payload.email, payload.password)`,
        `await auth.use('web').login(user)`,
      ],
      imports: { models: ['User'] },
      context: ['auth'],
    }
  }

  if (value === 'logout') {
    return {
      logicLines: [`await auth.use('web').logout()`],
      context: ['auth'],
    }
  }

  return {
    logicLines: [`const user = auth.user!`],
    context: ['auth'],
  }
})

// render
statementsRegistry.register('render', (value, { actionName, isApi, useInertia }) => {
  const parts = (value as string).split(' with: ')
  const viewPath = parts[0]
  const logicLines: string[] = []
  const context: string[] = []

  if (isApi || viewPath === 'json') {
    const responseData = parts[1]
      ? parts[1]
      : actionName === 'store' || actionName === 'update'
        ? 'payload'
        : 'data'
    logicLines.push(`return response.json({ ${responseData} })`)
  } else if (useInertia) {
    const data = parts[1] ? `, { ${parts[1]} }` : ''
    logicLines.push(`return inertia.render('${viewPath}'${data})`)
    context.push('inertia')
  } else {
    const data = parts[1] ? `, { ${parts[1]} }` : ''
    logicLines.push(`return view.render('${viewPath}'${data})`)
    context.push('view')
  }

  return { logicLines, context }
})

// redirect
statementsRegistry.register('redirect', (value) => {
  return {
    logicLines: [`return response.redirect().toRoute('${value}')`],
  }
})

// flash
statementsRegistry.register('flash', (value) => {
  return {
    logicLines: [`session.flash('${value}', 'Success!')`],
    context: ['session'],
  }
})

// throttle
statementsRegistry.register('throttle', (value) => {
  return {
    logicLines: [`await throttle.${value}()`],
    context: ['throttle'],
  }
})

// cache
statementsRegistry.register('cache', (value) => {
  const parts = (value as string).split(',').map((p) => p.trim())
  const key = parts[0]
  const ttl = parts[1] || '1h'

  return {
    logicLines: [`const cachedData = await cache.getOrSet('${key}', () => data, '${ttl}')`],
    context: ['cache'],
  }
})

// service
statementsRegistry.register('service', async (value, { generators }) => {
  const parts = (value as string).split('.')
  const serviceClass = parts[0]
  const method = parts[1] || 'handle'
  await generators.service.generate(serviceClass)

  return {
    logicLines: [`await ${serviceClass}.${method}(payload)`],
    imports: { services: [serviceClass] },
  }
})
