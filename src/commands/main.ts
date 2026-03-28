const commands = [
  () => import('./build.js'),
  () => import('./erase.js'),
  () => import('./trace.js'),
  () => import('./stubs.js'),
  () => import('./init.js'),
]

export { commands }
export default commands
