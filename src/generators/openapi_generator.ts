import { BaseGenerator } from './base_generator.js'
import type { BlueprintSchema } from '../types.js'
import string from '@adonisjs/core/helpers/string'
import { writeFileSync } from 'node:fs'

export class OpenAPIGenerator extends BaseGenerator {
  async generate(_name: string, blueprint: BlueprintSchema) {
    if (!blueprint.controllers) return

    const openapi: any = {
      openapi: '3.0.0',
      info: {
        title: blueprint.settings?.api ? 'AdonisJS API Documentation' : 'AdonisJS Application API',
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
          required: [],
        }

        if (modelDef.attributes) {
          for (const [attrName, attrType] of Object.entries(modelDef.attributes)) {
            const typeStr =
              typeof attrType === 'string' ? attrType : (attrType as any).type || 'string'
            schema.properties[attrName] = {
              type: this.mapToOpenAPIType(typeStr),
            }
            if (typeof attrType === 'string' && !attrType.includes('optional') && !attrType.includes('nullable')) {
              schema.required.push(attrName);
            }
          }
        }
        
        if (schema.required.length === 0) delete schema.required;

        openapi.components.schemas[modelName] = schema
      }
    }

    // Generate paths from controllers
    for (const [controllerName, controllerDef] of Object.entries(blueprint.controllers)) {
      const resourceName = string.snakeCase(controllerName)
      const normalizedDefinition = this.normalizeDefinition(controllerDef, blueprint.settings?.api, controllerName)
      const modelName = string.pascalCase(string.singular(controllerName))

      for (const [actionName, actionDef] of Object.entries(normalizedDefinition)) {
        if (actionName === 'resource' || actionName === 'middleware' || actionName === 'stub')
          continue

        const { path, method } = this.inferRoute(resourceName, actionName)
        if (!path || !method) continue

        if (!openapi.paths[path]) openapi.paths[path] = {}

        const operation: any = {
          tags: [controllerName],
          summary: `${actionName} action for ${controllerName}`,
          responses: {
            '200': {
              description: 'Successful response',
            },
          },
        }

        // Add ID parameter for specific routes
        if (path.includes('{id}')) {
          operation.parameters = [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ]
        }

        if ((actionDef as any).auth) {
          operation.security = [{ bearerAuth: [] }]
        }

        // Handle request body
        if ((actionDef as any).validate) {
          const validateFields = (actionDef as any).validate === 'all' 
            ? Object.keys(blueprint.models?.[modelName]?.attributes || {})
            : (actionDef as any).validate.split(',').map((f: string) => f.trim())

          operation.requestBody = {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {},
                },
              },
            },
          }

          for (const field of validateFields) {
            const attrType = blueprint.models?.[modelName]?.attributes?.[field]
            const typeStr = typeof attrType === 'string' ? attrType : (attrType as any)?.type || 'string'
            operation.requestBody.content['application/json'].schema.properties[field] = {
              type: this.mapToOpenAPIType(typeStr),
            }
          }
        } else if (actionName === 'store' || actionName === 'update') {
          operation.requestBody = {
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${modelName}` },
              },
            },
          }
        }

        // Handle response mapping
        if ((actionDef as any).query === 'all' || (actionDef as any).query?.startsWith('paginate')) {
          operation.responses['200'].content = {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: `#/components/schemas/${modelName}` },
              },
            },
          }
          if ((actionDef as any).query.startsWith('paginate')) {
            if (!operation.parameters) operation.parameters = []
            operation.parameters.push(
              { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
              { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
            )
          }
        } else if ((actionDef as any).query === 'find') {
          operation.responses['200'].content = {
            'application/json': {
              schema: { $ref: `#/components/schemas/${modelName}` },
            },
          }
        }

        openapi.paths[path][method] = operation
      }
    }

    const outputPath = this.app.makePath('openapi.json')
    writeFileSync(outputPath, JSON.stringify(openapi, null, 2))
    this.logger.action(`create ${outputPath}`).succeeded()
    if (this.manifest) {
      this.manifest.push(outputPath)
    }
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

  private normalizeDefinition(definition: any, isApi?: boolean, controllerName?: string) {
    if (definition.resource) {
      const pluralName = string.plural(string.camelCase(controllerName || ''))
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

    return (
      routes[actionName] || {
        path: `/${resourceName}/${string.snakeCase(actionName)}`,
        method: 'get',
      }
    )
  }
}
