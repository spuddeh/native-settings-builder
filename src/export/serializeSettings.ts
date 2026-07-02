import type { SettingsDoc } from '../model/schema'

// Fixed key order per object level so re-exports diff cleanly.
const KEY_ORDER: Record<string, string[]> = {
  '': ['$schema', 'schemaVersion', 'runtimeVersion', 'generator', 'mod', 'categories', 'options', 'translations', 'compat'],
  generator: ['site', 'siteVersion', 'exportedAt'],
  mod: ['modName', 'cetFolderName', 'author', 'modVersion', 'tabMode', 'ownTab', 'sharedTab', 'subCategoryPrefix'],
  ownTab: ['id', 'label'],
  sharedTab: ['id', 'label', 'landingHeader'],
  category: ['id', 'label'],
  option: ['id', 'type', 'category', 'label', 'description', 'showInMenu', 'default',
    'min', 'max', 'step', 'format', 'elements', 'buttonText', 'textSize', 'isHold', 'apply'],
  apply: ['kind', 'ref', 'variant', 'variantOn', 'variantOff', 'variants', 'project', 'function', 'lua'],
  compatRule: ['ifArchive', 'set', 'once'],
}

function orderKeys(value: unknown, context: string): unknown {
  if (Array.isArray(value)) {
    const childContext = context === 'categories' ? 'category'
      : context === 'options' ? 'option'
      : context === 'compat' ? 'compatRule'
      : context
    return value.map((item) => orderKeys(item, childContext))
  }
  if (typeof value !== 'object' || value === null) return value

  const obj = value as Record<string, unknown>
  const order = KEY_ORDER[context]
  const keys = Object.keys(obj)
  const sorted = order
    ? [...keys].sort((a, b) => {
        const ia = order.indexOf(a)
        const ib = order.indexOf(b)
        if (ia === -1 && ib === -1) return a.localeCompare(b)
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })
    : [...keys].sort()

  const out: Record<string, unknown> = {}
  for (const key of sorted) {
    if (obj[key] === undefined) continue
    out[key] = orderKeys(obj[key], key)
  }
  return out
}

/** Pretty-printed settings.json with a stable key order. */
export function serializeSettings(doc: SettingsDoc): string {
  return JSON.stringify(orderKeys(doc, ''), null, 2) + '\n'
}
