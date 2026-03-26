import { BaseGenerator } from './base_generator.js'
export class SeederGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)
    const count = (definition as any).seed || 10
    const data = (definition as any).data || null

    await this.generateStub('make/seeder/main.stub', {
      entity,
      count,
      data,
    })
  }
}
