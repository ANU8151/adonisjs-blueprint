export const commands = [
  () => import('./build.js'),
  () => import('./erase.js'),
  () => import('./trace.js'),
  () => import('./stubs.js'),
  () => import('./init.js'),
]

/**
 * Compatibility with AdonisJS loader expected by Ace Kernel
 */
export async function getMetaData() {
  const build = await import('./build.js')
  const erase = await import('./erase.js')
  const trace = await import('./trace.js')
  const stubs = await import('./stubs.js')
  const init = await import('./init.js')

  return [
    build.default.serialize(),
    erase.default.serialize(),
    trace.default.serialize(),
    stubs.default.serialize(),
    init.default.serialize(),
  ]
}

export async function load(commandName: string) {
  const map: Record<string, () => Promise<any>> = {
    'blueprint:build': () => import('./build.js'),
    'blueprint:erase': () => import('./erase.js'),
    'blueprint:trace': () => import('./trace.js'),
    'blueprint:stubs': () => import('./stubs.js'),
    'blueprint:init': () => import('./init.js'),
  }

  if (map[commandName]) {
    return map[commandName]()
  }

  throw new Error(`Command "${commandName}" not found`)
}
