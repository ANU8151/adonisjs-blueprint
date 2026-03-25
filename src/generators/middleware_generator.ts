import { BaseGenerator } from './base_generator.js'

export class MiddlewareGenerator extends BaseGenerator {
  async generate(name: string, _definition?: any) {
    const entity = this.app.generators.createEntity(name)
    await this.generateStub('make/middleware/main.stub', { entity })
  }
}
