import { BaseGenerator } from './base_generator.js'
import type { BlueprintSchema } from '../types.js'
import string from '@adonisjs/core/helpers/string'
import { writeFileSync } from 'node:fs'

export class OpenAPIGenerator extends BaseGenerator {
  async generate(blueprint: BlueprintSchema) {
    if (!blueprint.controllers) return

    const openapi: any = {
      openapi: '3.0.0',
      info: {
        title: 'AdonisJS API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    }

    // Generate schemas from models
    if (blueprint.models) {
      for (const [modelName, modelDef] of Object.entries(blueprint.models)) {
        const schema: any = {
          type: 'object',
          properties: {},
        }

        if (modelDef.attributes) {
          for (const [attrName, attrType] of Object.entries(modelDef.attributes)) {
            const typeStr = typeof attrType === 'string' ? attrType : (attrType as any).type || 'string'
            schema.properties[attrName] = {
              type: this.mapToOpenAPIType(typeStr),
            }
          }
        }

        openapi.components.schemas[modelName] = schema
      }
    }

    // Generate paths from controllers
    for (const [controllerName, controllerDef] of Object.entries(blueprint.controllers)) {
      const resourceName = string.snakeCase(controllerName)
      const normalizedDefinition = this.normalizeDefinition(controllerDef, blueprint.settings?.api)

      for (const [actionName, actionDef] of Object.entries(normalizedDefinition)) {
        if (actionName === 'resource' || actionName === 'middleware' || actionName === 'stub') continue

        const { path, method } = this.inferRoute(resourceName, actionName)
        if (!path || !method) continue

        if (!openapi.paths[path]) openapi.paths[path] = {}

        openapi.paths[path][method] = {
          tags: [controllerName],
          summary: `${actionName} action for ${controllerName}`,
          responses: {
            '200': {
              description: 'Successful response',
            },
          },
        }

        if (actionDef.auth) {
          openapi.paths[path][method].security = [{ bearerAuth: [] }]
        }

        // Add request body for store/update
        if (actionName === 'store' || actionName === 'update') {
          openapi.paths[path][method].requestBody = {
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${string.pascalCase(string.singular(controllerName))}`,
                },
              },
            },
          }
        }
      }
    }

    const outputPath = this.app.makePath('openapi.json')
    writeFileSync(outputPath, JSON.stringify(openapi, null, 2))
    this.logger.action(`create ${outputPath}`).succeeded()
    this.manifest.push(outputPath)
  }

  private mapToOpenAPIType(type: string): string {
    const baseType = type.split(':')[0]
    switch (baseType) {
      case 'integer':
      case 'number':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'datetime':
      case 'timestamp':
      case 'date':
        return 'string'
      default:
        return 'string'
    }
  }

  private normalizeDefinition(definition: any, isApi?: boolean) {
    if (definition.resource) {
      const pluralName = string.plural(string.camelCase(definition.name || ''))
      return isApi
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
            update: { validate: 'all', save: true, redirect: `${pluralName}.index` },
            destroy: { delete: true, redirect: `${pluralName}.index` },
          }
    }
    return definition
  }

  private inferRoute(resourceName: string, actionName: string) {
    const routes: Record<string, { path: string; method: string }> = {
      index: { path: `/${resourceName}`, method: 'get' },
      create: { path: `/${resourceName}/create`, method: 'get' },
      store: { path: `/${resourceName}`, method: 'post' },
      show: { path: `/${resourceName}/{id}`, method: 'get' },
      edit: { path: `/${resourceName}/{id}/edit`, method: 'get' },
      update: { path: `/${resourceName}/{id}`, method: 'put' },
      destroy: { path: `/${resourceName}/{id}`, method: 'delete' },
    }

    return routes[actionName] || { path: `/${resourceName}/${string.snakeCase(actionName)}`, method: 'get' }
  }
}
