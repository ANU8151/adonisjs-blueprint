import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class ModelGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const relationships: any[] = []

    if (definition.relationships) {
      for (const [relName, relType] of Object.entries(definition.relationships) as [
        string,
        string,
      ][]) {
        // Simple implementation for now
        const relatedModel = relName.charAt(0).toUpperCase() + relName.slice(1)
        relationships.push({
          importLine: `import { ${relType} } from '@adonisjs/lucid/orm'\nimport type { ${relType.charAt(0).toUpperCase() + relType.slice(1)} } from '@adonisjs/lucid/types'\nimport ${relatedModel} from '#models/${relName.toLowerCase()}'`,
          line: `@${relType}(() => ${relatedModel})\ndeclare ${relName}: ${relType.charAt(0).toUpperCase() + relType.slice(1)}<typeof ${relatedModel}>`,
        })
      }
    }

    await this.codemods.makeUsingStub(stubsRoot, 'make/model/main.stub', {
      entity,
      relationships,
    })
  }
}
