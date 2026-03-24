import { BaseGenerator } from './base_generator.js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import type { Entity } from '../types.js'

export class RouteGenerator extends BaseGenerator {
  async generate(name: string, _definition: any, isApi: boolean = false) {
    // Handle nested resources like 'Post.Comment'
    const nameParts = name.split('.')
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

    let content = readFileSync(routesPath, 'utf8')

    // Simple check if route already exists
    if (content.includes(`router.resource('${fullResourcePath}'`)) {
      return
    }

    let routeLine = `\nrouter.resource('${fullResourcePath}', '#controllers/${entity.name.toLowerCase()}_controller')`
    if (isApi) {
      routeLine += '.apiOnly()'
    }

    // Append to the end of the file or after imports
    writeFileSync(routesPath, content + routeLine)
    this.logger.success(`Registered resource routes for ${fullResourcePath}`)
  }
}
