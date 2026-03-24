import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class ViewGenerator extends BaseGenerator {
  async generate(name: string, useInertia: boolean = false) {
    const entity = this.app.generators.createEntity(name)
    const stubPath = useInertia ? 'make/view/inertia.stub' : 'make/view/edge.stub'

    await this.codemods.makeUsingStub(stubsRoot, stubPath, {
      entity,
    })
  }
}
