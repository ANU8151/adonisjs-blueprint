import type { ApplicationService } from '@adonisjs/core/types'
import { Codemods } from '@adonisjs/core/ace/codemods'
import { stubsRoot } from '../../stubs/main.js'

export abstract class BaseGenerator {
  protected codemods: Codemods

  constructor(
    protected app: ApplicationService,
    protected logger: any,
    protected manifest?: string[],
    codemods?: Codemods
  ) {
    this.codemods = codemods || new Codemods(this.app, this.logger)
  }

  protected async generateStub(stubPath: string, stubState: any) {
    const result = await this.codemods.makeUsingStub(stubsRoot, stubPath, stubState)
    if (this.manifest && result && result.destination) {
      this.manifest.push(result.destination)
    }
    return result
  }

  abstract generate(name: string, definition: any, ...args: any[]): Promise<void>
}
