import { BaseGenerator } from './base_generator.js'

export class JobGenerator extends BaseGenerator {
  async generate(name: string, _definition?: any) {
    const entity = this.app.generators.createEntity(name)
    await this.generateStub('make/job/main.stub', { entity })
  }
}
