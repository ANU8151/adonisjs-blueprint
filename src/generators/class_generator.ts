import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class ClassGenerator extends BaseGenerator {
  async generate(name: string, type: 'event' | 'mail' | 'job') {
    const entity = this.app.generators.createEntity(name)
    const stubPath = `make/${type}/main.stub`

    await this.codemods.makeUsingStub(stubsRoot, stubPath, {
      entity,
    })
  }
}
