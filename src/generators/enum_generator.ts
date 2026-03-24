import { BaseGenerator } from './base_generator.js'
import { stubsRoot } from '../../stubs/main.js'

export class EnumGenerator extends BaseGenerator {
  async generate(name: string, definition: any) {
    const entity = this.app.generators.createEntity(name)

    const values = definition.values.map((val: string) => ({
      key: val.toUpperCase(),
      value: val,
    }))

    await this.codemods.makeUsingStub(stubsRoot, 'make/enum/main.stub', {
      entity,
      values,
    })
  }
}
