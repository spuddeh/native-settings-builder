import type { SettingsDoc } from '../model/schema'

export function docHasCallbacks(doc: SettingsDoc): boolean {
  return doc.options.some((o) => o.apply?.kind === 'callback')
}

/** Fills user_callbacks.template.lua with one named function per callback option. */
export function emitUserCallbacks(doc: SettingsDoc, template: string): string {
  const blocks: string[] = []
  for (const opt of doc.options) {
    if (opt.apply?.kind !== 'callback') continue
    const body = opt.apply.lua.trim()
    const indented = body
      ? body.split('\n').map((line) => (line.trim() ? '    ' + line : '')).join('\n')
      : '    -- (no code yet)'
    blocks.push(
      `-- ${opt.label} (option "${opt.id}")\n` +
      `function M.${opt.apply.function}(value)\n` +
      `${indented}\n` +
      `end`,
    )
  }
  return template.replace('-- __CALLBACK_FUNCTIONS__', blocks.join('\n\n'))
}
