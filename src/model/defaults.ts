import type { CallbackApply, SettingsDoc, SettingsOption, WidgetType } from './schema'
import { LEGAL_APPLY, SCHEMA_VERSION } from './schema'

declare const __RUNTIME_VERSION__: string
declare const __SITE_VERSION__: string

export const RUNTIME_VERSION = __RUNTIME_VERSION__
export const SITE_VERSION = __SITE_VERSION__

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
}

export function newDoc(): SettingsDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    runtimeVersion: RUNTIME_VERSION,
    generator: {
      site: 'native-settings-builder',
      siteVersion: SITE_VERSION,
      exportedAt: '',
    },
    mod: {
      modName: 'My Mod',
      cetFolderName: 'MyMod',
      author: '',
      modVersion: '1.0.0',
      tabMode: 'own',
      ownTab: { id: 'my_mod', label: 'My Mod' },
      subCategoryPrefix: 'My Mod',
    },
    subcategories: [{ id: 'general', label: 'General' }],
    options: [],
  }
}

/**
 * Converts an option to another widget type, keeping id, label, description,
 * subcategory and visibility. Widget-specific fields reset to defaults; the effect
 * survives when the new widget supports it (callbacks carry over, and buttons
 * and key bindings get one created if needed).
 */
export function convertOption(opt: SettingsOption, type: WidgetType): SettingsOption {
  if (type === opt.type) return opt
  const base = {
    id: opt.id,
    subcategory: opt.subcategory,
    label: opt.label,
    description: opt.description,
    showInMenu: opt.showInMenu,
  }
  const carried = opt.apply && LEGAL_APPLY[type].includes(opt.apply.kind) ? opt.apply : undefined
  const callback: CallbackApply =
    carried?.kind === 'callback'
      ? carried
      : { kind: 'callback', function: `${opt.id}_pressed`, lua: '' }

  switch (type) {
    case 'switch':
      return {
        ...base,
        type,
        default: false,
        apply: carried as Extract<SettingsOption, { type: 'switch' }>['apply'],
      }
    case 'rangeInt':
      return { ...base, type, min: 0, max: 10, step: 1, default: 5, apply: carried?.kind === 'callback' ? carried : undefined }
    case 'rangeFloat':
      return { ...base, type, min: 0, max: 1, step: 0.05, format: '%.2f', default: 0.5, apply: carried?.kind === 'callback' ? carried : undefined }
    case 'selectorString':
      return {
        ...base,
        type,
        elements: ['Option A', 'Option B'],
        default: 1,
        apply: carried?.kind === 'callback' ? carried : undefined,
      }
    case 'button':
      return { ...base, type, buttonText: 'Apply', textSize: 45, apply: callback }
    case 'keyBinding':
      return { ...base, type, default: 'IK_F5', isHold: false, apply: callback }
  }
}

let optionCounter = 0

/** A fresh option of the given widget type with sensible defaults. */
export function newOption(type: WidgetType, subcategory: string, existingIds: Set<string>): SettingsOption {
  let id = `new_${type.toLowerCase()}`
  while (existingIds.has(id)) {
    optionCounter += 1
    id = `new_${type.toLowerCase()}_${optionCounter}`
  }
  const base = { id, subcategory, label: 'New option', description: '' }
  switch (type) {
    case 'switch':
      return { ...base, type, default: false }
    case 'rangeInt':
      return { ...base, type, min: 0, max: 10, step: 1, default: 5 }
    case 'rangeFloat':
      return { ...base, type, min: 0, max: 1, step: 0.05, format: '%.2f', default: 0.5 }
    case 'selectorString':
      return { ...base, type, elements: ['Option A', 'Option B'], default: 1 }
    case 'button':
      return {
        ...base,
        type,
        buttonText: 'Apply',
        textSize: 45,
        apply: { kind: 'callback', function: `${id}_pressed`, lua: '' },
      }
    case 'keyBinding':
      return {
        ...base,
        type,
        default: 'IK_F5',
        isHold: false,
        apply: { kind: 'callback', function: `${id}_pressed`, lua: '' },
      }
  }
}
