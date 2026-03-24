import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class ViewGenerator extends BaseGenerator {
  async generate(
    name: string,
    useInertia: boolean = false,
    adapter: 'react' | 'vue' | 'svelte' = 'react'
  ) {
    const entity = this.app.generators.createEntity(name)
    let stubPath = 'make/view/edge.stub'

    if (useInertia) {
      stubPath = `make/view/${adapter}.stub`
    }

    await this.codemods.makeUsingStub(stubsRoot, stubPath, {
      entity,
    })
  }
}
