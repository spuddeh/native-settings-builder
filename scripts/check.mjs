// Smoke tests: Lua syntax of the runtime, serializer round-trip, validation of the example.
// Run with: npm run check
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import luaparse from 'luaparse'

let failures = 0

function check(name, fn) {
  try {
    fn()
    console.log(`ok   ${name}`)
  } catch (e) {
    failures += 1
    console.error(`FAIL ${name}: ${e.message}`)
  }
}

// 1. Every runtime Lua file parses (LuaJIT is 5.1-compatible).
function luaFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return luaFiles(full)
    return name.endsWith('.lua') ? [full] : []
  })
}

for (const file of luaFiles('runtime-template')) {
  check(`lua parse: ${file}`, () => {
    luaparse.parse(readFileSync(file, 'utf-8'), { luaVersion: '5.1' })
  })
}

// 2. Example document imports, validates cleanly, and survives a serialize round-trip.
const { importDoc } = await import('../src/model/migrate.ts')
const { validate } = await import('../src/model/validate.ts')
const { serializeSettings } = await import('../src/export/serializeSettings.ts')
const { emitUserCallbacks, docHasCallbacks } = await import('../src/export/emitUserCallbacks.ts')

const exampleText = readFileSync('examples/northside-example.settings.json', 'utf-8')

check('example imports', () => {
  importDoc(exampleText)
})

check('example validates without errors', () => {
  const issues = validate(importDoc(exampleText))
  const errors = issues.filter((i) => i.severity === 'error')
  if (errors.length) throw new Error(errors.map((e) => e.message).join('; '))
})

check('serialize round-trip is byte-identical', () => {
  const once = serializeSettings(importDoc(exampleText))
  const twice = serializeSettings(importDoc(once))
  if (once !== twice) throw new Error('round-trip output differs')
})

check('emitted user_callbacks.lua parses', () => {
  const doc = importDoc(exampleText)
  if (!docHasCallbacks(doc)) throw new Error('example should contain callbacks')
  const template = readFileSync('runtime-template/user_callbacks.template.lua', 'utf-8')
  const emitted = emitUserCallbacks(doc, template)
  luaparse.parse(emitted, { luaVersion: '5.1' })
})

// 3. The generated settings.json the runtime will read: definition.lua's validation
// mirrors importDoc, so parsing the example with luaparse is not applicable here;
// instead assert the example matches the published JSON Schema keywords loosely.
check('example declares current schemaVersion', () => {
  const raw = JSON.parse(exampleText)
  if (raw.schemaVersion !== 1) throw new Error(`schemaVersion is ${raw.schemaVersion}`)
})

if (failures) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
