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
 * Returns the command class for a given metadata object.
 * This is called when the user actually tries to run the command.
 */
export async function getCommand(metaData: { commandName: string }) {
  const map: Record<string, () => Promise<any>> = {
    'blueprint:build': () => import('./build.js'),
    'blueprint:erase': () => import('./erase.js'),
    'blueprint:trace': () => import('./trace.js'),
    'blueprint:stubs': () => import('./stubs.js'),
    'blueprint:init': () => import('./init.js'),
  }

  if (map[metaData.commandName]) {
    const module = await map[metaData.commandName]()
    return module.default
  }

  return null
}
