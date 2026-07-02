import type { SettingsDoc } from '../model/schema'

export interface Dependencies {
  codeware: boolean
  nif: boolean
  keybinds: boolean
}

export function deriveDependencies(doc: SettingsDoc): Dependencies {
  let codeware = false
  let nif = false
  let keybinds = false
  for (const opt of doc.options) {
    const kind = opt.apply?.kind
    if (kind === 'variant' || kind === 'swap' || kind === 'selectorVariant') codeware = true
    if (kind === 'nif') nif = true
    if (opt.type === 'keyBinding') keybinds = true
  }
  return { codeware, nif, keybinds }
}

export function buildReadme(doc: SettingsDoc, runtimeVersion: string): string {
  const deps = deriveDependencies(doc)
  const lines: string[] = []
  const { mod } = doc

  lines.push(`# ${mod.modName}`)
  lines.push('')
  lines.push(`In-game settings menu for ${mod.modName}${mod.author ? ` by ${mod.author}` : ''} (v${mod.modVersion}).`)
  lines.push(`Menu generated with Native Settings Builder (runtime v${runtimeVersion}).`)
  lines.push('')
  lines.push('## Installation')
  lines.push('')
  lines.push('Extract this archive into your Cyberpunk 2077 game folder (the folder that')
  lines.push('contains `bin` and `archive`). If you use a mod manager such as Vortex or MO2,')
  lines.push('install the archive as a normal mod.')
  lines.push('')
  lines.push('## Requirements')
  lines.push('')
  lines.push('- [Cyber Engine Tweaks](https://www.nexusmods.com/cyberpunk2077/mods/107)')
  lines.push('- [Native Settings UI](https://www.nexusmods.com/cyberpunk2077/mods/3518)')
  if (deps.codeware) {
    lines.push('- [Codeware](https://www.nexusmods.com/cyberpunk2077/mods/7780) (used to toggle world variants)')
  }
  if (deps.keybinds && !deps.codeware) {
    lines.push('- [Codeware](https://www.nexusmods.com/cyberpunk2077/mods/7780) (used for key bindings to fire in-game)')
  }
  if (deps.nif) {
    lines.push('- [Native Interactions Framework](https://www.nexusmods.com/cyberpunk2077/mods/14964) (used for interaction toggles)')
  }
  lines.push('')
  lines.push('## Changing settings')
  lines.push('')
  const tabLabel = mod.tabMode === 'shared' ? mod.sharedTab?.label : mod.ownTab?.label
  lines.push(`Open the game menu, go to Settings, then the Mods entry, and select the "${tabLabel}" tab.`)
  if (mod.tabMode === 'shared') {
    lines.push(`Click the "${mod.modName}" button to open this mod's settings; the Back button returns to the list.`)
  }
  lines.push('')
  lines.push('Your choices are saved to `config.json` inside the mod folder')
  lines.push(`(\`bin/x64/plugins/cyber_engine_tweaks/mods/${mod.cetFolderName}/\`) and re-applied on every game load.`)
  lines.push('')
  lines.push('## For mod authors')
  lines.push('')
  lines.push('This menu was built with Native Settings Builder. To change it, import the')
  lines.push('`settings.json` from this folder back into the builder, edit, and re-export;')
  lines.push('only `settings.json` (and `user_callbacks.lua`, if callbacks are used) change')
  lines.push('between exports. Do not edit the files under `modules/`.')
  lines.push('')
  return lines.join('\n')
}
