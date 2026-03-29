import { BaseGenerator } from './base_generator.js'
import type { Entity } from '../types.js'
import string from '@adonisjs/core/helpers/string'

export class ServiceGenerator extends BaseGenerator {
  async generate(name: string) {
    const nameParts = name.split(/[\/.]/)
    const baseName = nameParts.pop()!
    const entity = this.app.generators.createEntity(baseName) as Entity
    if (nameParts.length > 0) {
      entity.path = nameParts.map((p) => string.snakeCase(p)).join('/')
    }

    await this.generateStub('make/service/main.stub', {
      entity,
      imports: "import { inject } from '@adonisjs/core'",
    })
  }
}
