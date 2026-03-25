import type { ApplicationService } from '@adonisjs/core/types'
import { Codemods } from '@adonisjs/core/ace/codemods'
import { stubsRoot } from '../../stubs/main.js'
import { isAbsolute, dirname, basename } from 'node:path'

export abstract class BaseGenerator {
  protected codemods: Codemods

  constructor(
    protected app: ApplicationService,
    protected logger: any,
    protected manifest?: string[],
    codemods?: Codemods,
    protected forceOverwrite: boolean = false
  ) {
    this.codemods = codemods || new Codemods(this.app, this.logger)
  }

  protected async generateStub(stubPath: string, stubState: any, customStubPath?: string) {
    let finalStubRoot = stubsRoot
    let finalStubPath = stubPath

    if (customStubPath) {
      if (isAbsolute(customStubPath)) {
        finalStubRoot = dirname(customStubPath)
        finalStubPath = basename(customStubPath)
      } else {
        finalStubRoot = this.app.appRoot.toString()
        finalStubPath = customStubPath
      }
    }

    // Interactive overwrite protection is handled by BuildBlueprint via forceOverwrite flag
    this.codemods.overwriteExisting = this.forceOverwrite

    const result = await this.codemods.makeUsingStub(finalStubRoot, finalStubPath, stubState)
    if (this.manifest && result && result.destination) {
      this.manifest.push(result.destination)
    }
    return result
  }

  abstract generate(name: string, definition: any, ...args: any[]): Promise<void>
}
