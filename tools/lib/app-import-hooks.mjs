import { readFile } from 'node:fs/promises'

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    try {
      return await nextResolve(specifier, context)
    } catch (err) {
      for (const ext of ['.ts', '.tsx']) {
        try {
          return await nextResolve(specifier + ext, context)
        } catch {
          /* try next extension */
        }
      }
      throw err
    }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const source = await readFile(new URL(url), 'utf8')
    // Same shape Vite gives the app: the parsed value as default export.
    return { format: 'module', source: `export default ${source}`, shortCircuit: true }
  }
  return nextLoad(url, context)
}
