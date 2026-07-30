/*
 * Lets node run the real /src/engine modules under --experimental-strip-types:
 * resolves the app's extensionless relative imports (bundler style) to .ts/.tsx,
 * and serves .json imports as default-export modules the way Vite does.
 * Verification plumbing only — never imported by the app.
 */
import { register } from 'node:module'

register(new URL('./app-import-hooks.mjs', import.meta.url))
