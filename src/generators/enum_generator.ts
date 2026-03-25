import { BaseGenerator } from './base_generator.js'
export class EnumGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)

    const values = definition.values.map((val: string) => ({
      key: val.toUpperCase(),
      value: val,
    }))

    await this.generateStub('make/enum/main.stub', {
      entity,
      values,
    })
  }
}
