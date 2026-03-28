import { BaseGenerator } from './base_generator.js'

export class ViewGenerator extends BaseGenerator {
  async generate(
    name: string,
    useInertia: boolean = false,
    adapter: 'react' | 'vue' | 'svelte' = 'react',
    definition?: any
  ) {
    const entity = this.app.generators.createEntity(name)
    let stubPath = 'make/view/edge.stub'

    if (useInertia) {
      stubPath = `make/view/${adapter}.stub`
    }

    const attributes = definition?.attributes
      ? Object.entries(definition.attributes).map(([attrName, attrType]) => ({
          name: attrName,
          type: typeof attrType === 'string' ? attrType : (attrType as any).type,
        }))
      : []

    const action = name.split('/').pop() || 'show'
    const folder = name.split('/').slice(0, -1).join('/')

    await this.generateStub(stubPath, {
      entity,
      attributes,
      action,
      folder,
    })
  }
}
