import type { ApplicationService } from '@adonisjs/core/types'
import { Codemods } from '@adonisjs/core/ace/codemods'

export abstract class BaseGenerator {
  protected codemods: Codemods

  constructor(
    protected app: ApplicationService,
    protected logger: any
  ) {
    this.codemods = new Codemods(this.app, this.logger)
  }

  abstract generate(name: string, definition: any): Promise<void>
}
