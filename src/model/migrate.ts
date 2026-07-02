import type { SettingsDoc } from './schema'
import { SCHEMA_VERSION } from './schema'

export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

/** Upgrades a raw imported document from its schemaVersion to the current one. */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  // 1 -> 2 would go here.
}

function expect(condition: boolean, message: string): asserts condition {
  if (!condition) throw new ImportError(message)
}

/**
 * Parses, migrates and structurally checks an imported settings.json string.
 * Throws ImportError with a human-readable path on failure.
 */
export function importDoc(text: string): SettingsDoc {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    throw new ImportError(`Not valid JSON: ${(e as Error).message}`)
  }
  expect(typeof raw === 'object' && raw !== null && !Array.isArray(raw), 'Top level must be a JSON object')
  let doc = raw as Record<string, unknown>

  expect(typeof doc.schemaVersion === 'number', 'Missing "schemaVersion"')
  let version = doc.schemaVersion as number
  expect(version >= 1 && version <= SCHEMA_VERSION, `Unsupported schemaVersion ${version} (this site supports up to ${SCHEMA_VERSION})`)
  while (version < SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version]
    expect(!!migrate, `No migration available from schemaVersion ${version}`)
    doc = migrate(doc)
    version += 1
  }
  doc.schemaVersion = SCHEMA_VERSION

  const mod = doc.mod as Record<string, unknown> | undefined
  expect(typeof mod === 'object' && mod !== null, 'Missing "mod" block')
  expect(typeof mod.modName === 'string', 'Missing "mod.modName"')
  expect(mod.tabMode === 'own' || mod.tabMode === 'shared', '"mod.tabMode" must be "own" or "shared"')
  expect(Array.isArray(doc.categories), 'Missing "categories" array')
  expect(Array.isArray(doc.options), 'Missing "options" array')
  ;(doc.options as unknown[]).forEach((opt, i) => {
    expect(typeof opt === 'object' && opt !== null, `options[${i}] is not an object`)
    const o = opt as Record<string, unknown>
    expect(typeof o.id === 'string' && o.id !== '', `options[${i}] missing "id"`)
    expect(typeof o.type === 'string', `options[${i}] ("${o.id}") missing "type"`)
    expect(typeof o.category === 'string', `options[${i}] ("${o.id}") missing "category"`)
  })

  return doc as unknown as SettingsDoc
}
