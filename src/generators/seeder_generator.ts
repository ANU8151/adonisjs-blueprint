import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class SeederGenerator extends BaseGenerator {
  async generate(name: string, _definition: any) {
    const entity = this.app.generators.createEntity(name)

    await this.codemods.makeUsingStub(stubsRoot, 'make/seeder/main.stub', {
      entity,
    })
  }
}
