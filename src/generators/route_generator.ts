import { BaseGenerator } from './base_generator.js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import type { Entity } from '../types.js'

export class RouteGenerator extends BaseGenerator {
  async generate(name: string, _definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
    const routesPath = this.app.makePath('start/routes.ts')

    if (!existsSync(routesPath)) {
      this.logger.warning(`File ${routesPath} not found. Skipping route registration.`)
      return
    }

    const resourceName = entity.name.toLowerCase() + 's'

    let content = readFileSync(routesPath, 'utf8')

    // Simple check if route already exists
    if (content.includes(`router.resource('${resourceName}'`)) {
      return
    }

    const routeLine = `\nrouter.resource('${resourceName}', '#controllers/${entity.name.toLowerCase()}_controller')`

    // Append to the end of the file or after imports
    writeFileSync(routesPath, content + routeLine)
    this.logger.success(`Registered resource routes for ${resourceName}`)
  }
}
