import { BaseGenerator } from './base_generator.js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import type { Entity } from '../types.js'

export class RouteGenerator extends BaseGenerator {
  async generate(name: string, definition: any, isApi: boolean = false) {
    // Handle nested resources like 'Post.Comment'
    const nameParts = name.split(/[\/.]/)
    const baseName = nameParts.pop()! // Last part is the actual entity (Comment)
    const parents = nameParts.map((p) => p.toLowerCase() + 's') // Prefix parents (posts)

    const entity = this.app.generators.createEntity(baseName) as Entity
    const routesPath = this.app.makePath('start/routes.ts')

    if (!existsSync(routesPath)) {
      this.logger.warning(`File ${routesPath} not found. Skipping route registration.`)
      return
    }

    const resourceName = entity.name.toLowerCase() + 's'
    const fullResourcePath = [...parents, resourceName].join('.') // posts.comments
    const controllerPath = [
      ...nameParts.map((p) => p.toLowerCase()),
      entity.name.toLowerCase(),
    ].join('/')

    let content = readFileSync(routesPath, 'utf8')

    // Simple check if route already exists
    if (content.includes(`router.resource('${fullResourcePath}'`)) {
      return
    }

    let routeLine = `router.resource('${fullResourcePath}', () => import('#controllers/${controllerPath}_controller'))`
    if (isApi) {
      routeLine += '.apiOnly()'
    }

    if (definition.middleware && definition.middleware.length > 0) {
      const mw = definition.middleware.map((m: string) => `middleware.${m}()`).join(', ')
      routeLine += `.use('*', [${mw}])`
    }

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
