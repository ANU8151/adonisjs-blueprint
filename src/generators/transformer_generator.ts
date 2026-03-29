import { BaseGenerator } from './base_generator.js'
import type { Entity } from '../types.js'
import string from '@adonisjs/core/helpers/string'

export class TransformerGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name) as Entity
    const attributes: string[] = []

    if (definition.attributes) {
      attributes.push(...Object.keys(definition.attributes))
    }

    const attributesLines = attributes.map((a) => `'${a}'`).join(', ')

    const relations: any[] = []
    if (definition.relationships) {
      for (const [relName] of Object.entries(definition.relationships)) {
        const relatedModel = string.pascalCase(string.singular(relName))
        relations.push({
          name: relName,
          model: relatedModel,
          transformer: `${relatedModel}Transformer`,
        })
      }
    }

    const relationLines = relations
      .map((r) => {
        return `${r.name}: this.whenLoaded('${r.name}', () => ${r.transformer}.transform(this.resource.${r.name}))`
      })
      .join(',\n      ')

    const importLines = relations
      .map(
        (r) =>
          `import ${r.transformer} from '#transformers/${string.snakeCase(r.model)}_transformer'`
      )
      .join('\n')

    await this.generateStub('make/transformer/main.stub', {
      entity,
      attributes: attributesLines,
      relationLines,
      importLines,
    })
  }
}
