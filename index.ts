/*
|--------------------------------------------------------------------------
| Package entrypoint
|--------------------------------------------------------------------------
|
| Export values from the package entrypoint as you see fit.
|
*/

export { configure } from './configure.js'
export { stubsRoot } from './stubs/main.js'
export { statementsRegistry } from './src/statements_registry.js'

export interface BlueprintConfig {
  viewer?: 'edge' | 'inertia'
  inertia?: {
    adapter?: 'react' | 'vue' | 'svelte'
  }
  namespaces?: {
    models?: string
    controllers?: string
    validators?: string
    factories?: string
  }
}

export function defineConfig(config: BlueprintConfig): BlueprintConfig {
  return config
}
