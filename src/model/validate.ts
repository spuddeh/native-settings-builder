import type { SettingsDoc, SettingsOption } from './schema'
import { LEGAL_APPLY, RESERVED_TAB_IDS, SLUG_RE } from './schema'
import { IK_KEYS } from './ikKeys'

export type Severity = 'error' | 'warning'

export interface Issue {
  severity: Severity
  message: string
  /** Focus target: 'mod' | 'category:<id>' | 'option:<id>' | 'translations' | 'compat:<index>' */
  path: string
}

function err(path: string, message: string): Issue {
  return { severity: 'error', message, path }
}

function warn(path: string, message: string): Issue {
  return { severity: 'warning', message, path }
}

const FOLDER_RE = /^[A-Za-z0-9_-]+$/

function validateOption(opt: SettingsOption, categoryIds: Set<string>, issues: Issue[]) {
  const p = `option:${opt.id}`
  if (!SLUG_RE.test(opt.id)) {
    issues.push(err(p, `Option id "${opt.id}" must be lowercase letters, digits and underscores only`))
  }
  if (!opt.label.trim()) {
    issues.push(err(p, `Option "${opt.id}" needs a label`))
  }
  if (!categoryIds.has(opt.category)) {
    issues.push(err(p, `Option "${opt.id}" references missing category "${opt.category}"`))
  }

  const legal = LEGAL_APPLY[opt.type]
  const kind = opt.apply?.kind ?? ''
  if (!legal.includes(kind)) {
    issues.push(err(p, `Option "${opt.id}": a ${opt.type} cannot use effect "${kind || 'none'}"`))
  }

  switch (opt.type) {
    case 'rangeInt':
    case 'rangeFloat':
      if (opt.min >= opt.max) {
        issues.push(err(p, `Option "${opt.id}": min must be less than max`))
      }
      if (opt.step <= 0) {
        issues.push(err(p, `Option "${opt.id}": step must be greater than 0`))
      }
      if (opt.default < opt.min || opt.default > opt.max) {
        issues.push(err(p, `Option "${opt.id}": default must be between min and max`))
      }
      if (opt.type === 'rangeInt' && !Number.isInteger(opt.step)) {
        issues.push(warn(p, `Option "${opt.id}": step will be floored to a whole number in-game`))
      }
      break
    case 'selectorString':
      if (opt.elements.length < 2) {
        issues.push(err(p, `Option "${opt.id}": a selector needs at least 2 entries`))
      }
      if (opt.elements.some((e) => !e.trim())) {
        issues.push(err(p, `Option "${opt.id}": selector entries cannot be empty`))
      }
      if (new Set(opt.elements).size !== opt.elements.length) {
        issues.push(err(p, `Option "${opt.id}": selector entries must be unique (they are the save keys)`))
      }
      if (opt.default < 1 || opt.default > opt.elements.length) {
        issues.push(err(p, `Option "${opt.id}": default choice is out of range`))
      }
      break
    case 'keyBinding':
      if (!IK_KEYS.includes(opt.default)) {
        issues.push(warn(p, `Option "${opt.id}": "${opt.default}" is not in the known key list; verify it is a valid IK_* name`))
      }
      break
  }

  const apply = opt.apply
  if (!apply) return
  switch (apply.kind) {
    case 'variant':
      if (!apply.ref.trim()) issues.push(err(p, `Option "${opt.id}": world variant needs a NodeRef`))
      if (!apply.variant.trim()) issues.push(err(p, `Option "${opt.id}": world variant needs a variant name`))
      break
    case 'swap':
      if (!apply.ref.trim()) issues.push(err(p, `Option "${opt.id}": swap needs a NodeRef`))
      if (!apply.variantOn.trim() || !apply.variantOff.trim()) {
        issues.push(err(p, `Option "${opt.id}": swap needs both an ON and an OFF variant name`))
      }
      break
    case 'selectorVariant':
      if (!apply.ref.trim()) issues.push(err(p, `Option "${opt.id}": variant selector needs a NodeRef`))
      if (opt.type === 'selectorString' && apply.variants.length !== opt.elements.length) {
        issues.push(err(p, `Option "${opt.id}": one variant name is needed per selector entry (${apply.variants.length} of ${opt.elements.length})`))
      }
      if (apply.variants.some((v) => !v.trim())) {
        issues.push(err(p, `Option "${opt.id}": variant names cannot be empty`))
      }
      if (new Set(apply.variants).size !== apply.variants.length) {
        issues.push(err(p, `Option "${opt.id}": variant names must be unique (they are the save keys)`))
      }
      break
    case 'nif':
      if (!apply.project.trim()) issues.push(err(p, `Option "${opt.id}": needs a Native Interactions project name`))
      break
    case 'callback':
      if (!SLUG_RE.test(apply.function)) {
        issues.push(err(p, `Option "${opt.id}": callback function name must be lowercase letters, digits and underscores`))
      }
      if (!apply.lua.trim()) {
        issues.push(warn(p, `Option "${opt.id}": callback has no Lua code yet; it will do nothing`))
      }
      break
  }

  if ('ref' in (apply as object)) {
    const ref = (apply as { ref: string }).ref
    if (ref.trim() && !ref.startsWith('$/') && !ref.startsWith('#')) {
      issues.push(warn(p, `Option "${opt.id}": NodeRef "${ref}" usually starts with "$/" (as exported by World Builder)`))
    }
  }
}

export function validate(doc: SettingsDoc): Issue[] {
  const issues: Issue[] = []
  const { mod } = doc

  if (!mod.modName.trim()) issues.push(err('mod', 'Mod name is required'))
  if (!FOLDER_RE.test(mod.cetFolderName)) {
    issues.push(err('mod', 'CET folder name may only contain letters, digits, "-" and "_"'))
  }
  if (!SLUG_RE.test(mod.subCategoryPrefix)) {
    issues.push(err('mod', 'Section prefix must be lowercase letters, digits and underscores'))
  }
  if (mod.tabMode === 'own') {
    if (!mod.ownTab || !SLUG_RE.test(mod.ownTab.id)) {
      issues.push(err('mod', 'Own tab id must be lowercase letters, digits and underscores'))
    } else if (!mod.ownTab.label.trim()) {
      issues.push(err('mod', 'Own tab needs a label'))
    }
  } else {
    if (!mod.sharedTab || !SLUG_RE.test(mod.sharedTab.id)) {
      issues.push(err('mod', 'Shared tab id must be lowercase letters, digits and underscores'))
    } else {
      if (RESERVED_TAB_IDS.includes(mod.sharedTab.id)) {
        issues.push(err('mod', `Shared tab id "${mod.sharedTab.id}" is reserved by an existing mod family; pick your own`))
      }
      if (!mod.sharedTab.label.trim()) issues.push(err('mod', 'Shared tab needs a label'))
    }
  }

  const categoryIds = new Set<string>()
  for (const cat of doc.categories) {
    const p = `category:${cat.id}`
    if (!SLUG_RE.test(cat.id)) issues.push(err(p, `Category id "${cat.id}" must be lowercase letters, digits and underscores`))
    if (categoryIds.has(cat.id)) issues.push(err(p, `Duplicate category id "${cat.id}"`))
    if (!cat.label.trim()) issues.push(err(p, `Category "${cat.id}" needs a label`))
    categoryIds.add(cat.id)
  }
  if (doc.categories.length === 0) issues.push(err('mod', 'At least one category is required'))

  const optionIds = new Set<string>()
  for (const opt of doc.options) {
    if (optionIds.has(opt.id)) {
      issues.push(err(`option:${opt.id}`, `Duplicate option id "${opt.id}"`))
    }
    optionIds.add(opt.id)
    validateOption(opt, categoryIds, issues)
  }

  const callbackNames = new Set<string>()
  for (const opt of doc.options) {
    if (opt.apply?.kind === 'callback') {
      if (callbackNames.has(opt.apply.function)) {
        issues.push(err(`option:${opt.id}`, `Callback function name "${opt.apply.function}" is used by more than one option`))
      }
      callbackNames.add(opt.apply.function)
    }
  }

  if (doc.translations) {
    for (const [lang, entries] of Object.entries(doc.translations)) {
      for (const key of Object.keys(entries)) {
        const optionId = key.startsWith('categories.') || key.startsWith('mod.')
          ? null
          : key.replace(/\.(label|description|buttonText|elements)$/, '')
        if (optionId !== null) {
          if (optionId === key) {
            issues.push(warn('translations', `Translation key "${key}" (${lang}) has an unknown suffix`))
          } else if (!optionIds.has(optionId)) {
            issues.push(warn('translations', `Translation key "${key}" (${lang}) references unknown option "${optionId}"`))
          }
        } else if (key.startsWith('categories.') && !categoryIds.has(key.slice('categories.'.length))) {
          issues.push(warn('translations', `Translation key "${key}" (${lang}) references an unknown category`))
        }
      }
    }
  }

  doc.compat?.forEach((rule, i) => {
    const p = `compat:${i}`
    if (!rule.ifArchive.trim()) issues.push(err(p, `Compat rule ${i + 1} needs an archive file name`))
    else if (!rule.ifArchive.endsWith('.archive')) {
      issues.push(warn(p, `Compat rule ${i + 1}: "${rule.ifArchive}" does not end in .archive`))
    }
    for (const id of Object.keys(rule.set)) {
      if (!optionIds.has(id)) issues.push(err(p, `Compat rule ${i + 1} sets unknown option "${id}"`))
    }
  })

  return issues
}

export function hasErrors(issues: Issue[]): boolean {
  return issues.some((i) => i.severity === 'error')
}
