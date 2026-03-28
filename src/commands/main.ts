export const commands = [
  () => import('./build.js'),
  () => import('./erase.js'),
  () => import('./trace.js'),
  () => import('./stubs.js'),
  () => import('./init.js'),
]

/**
 * Metadata for the commands.
 * Used by Ace Kernel to display help/list.
 */
export async function getMetaData() {
  const [build, erase, trace, stubs, init] = await Promise.all([
    import('./build.js'),
    import('./erase.js'),
    import('./trace.js'),
    import('./stubs.js'),
    import('./init.js'),
  ])

  return [
    build.default.serialize(),
    erase.default.serialize(),
    trace.default.serialize(),
    stubs.default.serialize(),
    init.default.serialize(),
  ]
}

/**
 * Loads a command by its name.
 * Used by Ace Kernel when running a command.
 */
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
