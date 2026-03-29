import { BaseGenerator } from './base_generator.js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import type { Entity } from '../types.js'
import string from '@adonisjs/core/helpers/string'

export class RouteGenerator extends BaseGenerator {
  async generate(name: string, definition: any, isApi: boolean = false) {
    // Handle nested resources like 'Post.Comment'
    const nameParts = name.split(/[\/.]/)
    const baseName = nameParts.pop()! // Last part is the actual entity (Comment)
    const parents = nameParts.map((p) => string.plural(p.toLowerCase())) // Prefix parents (posts)

    const entity = this.app.generators.createEntity(baseName) as Entity
    if (!entity.name) {
      entity.name = baseName
    }
    const routesPath = this.app.makePath('start/routes.ts')

    if (!existsSync(routesPath)) {
      this.logger.warning(`File ${routesPath} not found. Skipping route registration.`)
      return
    }

    const resourceName = string.plural(string.snakeCase(entity.name).toLowerCase())
    const fullResourcePath = [...parents, resourceName].join('.') // posts.comments
    const controllerPath = [
      ...nameParts.map((p) => string.snakeCase(p).toLowerCase()),
      string.snakeCase(entity.name).toLowerCase(),
    ].join('/')

    let content = readFileSync(routesPath, 'utf8')

    // Simple check if route already exists
    if (content.includes(`router.resource('${fullResourcePath}'`)) {
      return
    }

    // Prepare controller reference for lazy loading
    const controllerReference = `() => import('#controllers/${controllerPath}_controller')`
    let routeLine = `router.resource('${fullResourcePath}', ${controllerReference})`

    if (isApi) {
      routeLine += '.apiOnly()'
    }

    if (definition.middleware && definition.middleware.length > 0) {
      const mw = definition.middleware.map((m: string) => `middleware.${m}()`).join(', ')
      routeLine += `.use('*', [${mw}])`
    }

    // Add param matchers at the end
    routeLine += ".where('id', router.matchers.number())"

    if (nameParts.length > 0) {
      const prefix = nameParts.map((p) => p.toLowerCase()).join('/')
      const groupLine = `\nrouter.group(() => {\n  ${routeLine}\n}).prefix('${prefix}')`
      writeFileSync(routesPath, content + groupLine)
    } else {
      writeFileSync(routesPath, content + `\n${routeLine}`)
    }
    this.logger.success(`Registered resource routes for ${fullResourcePath}`)
  }
}
