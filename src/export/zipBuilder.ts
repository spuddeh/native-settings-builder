import JSZip from 'jszip'
import type { SettingsDoc } from '../model/schema'
import { RUNTIME_VERSION, SITE_VERSION } from '../model/defaults'
import { serializeSettings } from './serializeSettings'
import { docHasCallbacks, emitUserCallbacks } from './emitUserCallbacks'
import { buildReadme } from './readmeTemplate'

// Bundle the canonical runtime as raw strings at build time.
const runtimeFiles = import.meta.glob('../../runtime-template/**/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const CALLBACK_TEMPLATE_KEY = 'user_callbacks.template.lua'

function runtimePath(globKey: string): string {
  return globKey.replace('../../runtime-template/', '')
}

function stampHeader(content: string, modName: string): string {
  return content
    .replaceAll('__MOD_NAME__', modName)
    .replaceAll('__RUNTIME_VERSION__', RUNTIME_VERSION)
}

/** Assembles the ready-to-ship mod zip. Returns the Blob and suggested filename. */
export async function buildZip(doc: SettingsDoc): Promise<{ blob: Blob; filename: string }> {
  const exportedDoc: SettingsDoc = {
    ...doc,
    runtimeVersion: RUNTIME_VERSION,
    generator: {
      site: 'native-settings-builder',
      siteVersion: SITE_VERSION,
      exportedAt: new Date().toISOString(),
    },
  }

  const zip = new JSZip()
  const modRoot = `bin/x64/plugins/cyber_engine_tweaks/mods/${doc.mod.cetFolderName}`

  for (const [globKey, content] of Object.entries(runtimeFiles)) {
    const relative = runtimePath(globKey)
    if (relative === CALLBACK_TEMPLATE_KEY) continue
    zip.file(`${modRoot}/${relative}`, stampHeader(content, doc.mod.modName))
  }

  zip.file(`${modRoot}/settings.json`, serializeSettings(exportedDoc))

  if (docHasCallbacks(doc)) {
    const template = stampHeader(runtimeFiles['../../runtime-template/' + CALLBACK_TEMPLATE_KEY] ?? '', doc.mod.modName)
    zip.file(`${modRoot}/user_callbacks.lua`, emitUserCallbacks(doc, template))
  }

  zip.file('README.md', buildReadme(exportedDoc, RUNTIME_VERSION))

  const blob = await zip.generateAsync({ type: 'blob' })
  return { blob, filename: `${doc.mod.cetFolderName}-settings.zip` }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/** Standalone settings.json download (for authors who just want the definition). */
export function downloadSettingsJson(doc: SettingsDoc): void {
  const exportedDoc: SettingsDoc = {
    ...doc,
    runtimeVersion: RUNTIME_VERSION,
    generator: {
      site: 'native-settings-builder',
      siteVersion: SITE_VERSION,
      exportedAt: new Date().toISOString(),
    },
  }
  const blob = new Blob([serializeSettings(exportedDoc)], { type: 'application/json' })
  downloadBlob(blob, 'settings.json')
}
