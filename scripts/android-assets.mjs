import { writeFile } from 'node:fs/promises'
import { build } from 'vite'

const variant = process.argv[2]
if (!['debug', 'release'].includes(variant)) throw new Error('Expected debug or release')

const emulatorOrigin = 'http://10.0.2.2:3001'
const origin = variant === 'debug' ? emulatorOrigin : process.env.VITE_MOBILE_API_ORIGIN
if (variant === 'release') {
  const url = URL.canParse(origin) ? new URL(origin) : undefined
  if (!url || url.protocol !== 'https:' || url.origin !== origin) {
    throw new Error('Set VITE_MOBILE_API_ORIGIN to an HTTPS origin before packaging a release.')
  }
}

process.env.VITE_MOBILE_API_ORIGIN = origin
await build({ mode: variant === 'debug' ? 'android-emulator' : 'android-release' })
// The Gradle release task also checks the assets that Capacitor actually copied.
await writeFile('dist/android-build.json', JSON.stringify({ variant, origin }))
