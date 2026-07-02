// Single source of truth for the settings.json document shape.
// Mirrored by schema/settings.schema.json (published JSON Schema).

export const SCHEMA_VERSION = 1

export type WidgetType =
  | 'switch'
  | 'rangeInt'
  | 'rangeFloat'
  | 'selectorString'
  | 'button'
  | 'keyBinding'

export type ApplyKind = 'variant' | 'swap' | 'selectorVariant' | 'nif' | 'callback'

export interface VariantApply {
  kind: 'variant'
  ref: string
  variant: string
}

export interface SwapApply {
  kind: 'swap'
  ref: string
  variantOn: string
  variantOff: string
}

export interface SelectorVariantApply {
  kind: 'selectorVariant'
  ref: string
  variants: string[]
}

export interface NifApply {
  kind: 'nif'
  project: string
}

export interface CallbackApply {
  kind: 'callback'
  function: string
  lua: string
}

export type Apply = VariantApply | SwapApply | SelectorVariantApply | NifApply | CallbackApply

interface OptionBase {
  id: string
  type: WidgetType
  subcategory: string
  label: string
  description: string
  showInMenu?: boolean
  apply?: Apply
}

export interface SwitchOption extends OptionBase {
  type: 'switch'
  default: boolean
  apply?: VariantApply | SwapApply | NifApply | CallbackApply
}

export interface RangeIntOption extends OptionBase {
  type: 'rangeInt'
  min: number
  max: number
  step: number
  default: number
  apply?: CallbackApply
}

export interface RangeFloatOption extends OptionBase {
  type: 'rangeFloat'
  min: number
  max: number
  step: number
  format: string
  default: number
  apply?: CallbackApply
}

export interface SelectorStringOption extends OptionBase {
  type: 'selectorString'
  elements: string[]
  /** 1-based element index, matching the NativeSettings API. */
  default: number
  apply?: SelectorVariantApply | CallbackApply
}

export interface ButtonOption extends OptionBase {
  type: 'button'
  buttonText: string
  textSize?: number
  apply: CallbackApply
}

export interface KeyBindingOption extends OptionBase {
  type: 'keyBinding'
  /** IK_* input key name. */
  default: string
  isHold?: boolean
  apply: CallbackApply
}

export type SettingsOption =
  | SwitchOption
  | RangeIntOption
  | RangeFloatOption
  | SelectorStringOption
  | ButtonOption
  | KeyBindingOption

export interface Subcategory {
  id: string
  label: string
}

export interface CompatRule {
  ifArchive: string
  set: Record<string, boolean | number | string>
  once: boolean
}

/**
 * Per-language string overrides. Keys: "<optionId>.label", "<optionId>.description",
 * "<optionId>.buttonText", "<optionId>.elements" (string[]),
 * "subcategories.<subcategoryId>", "mod.modName", "mod.ownTab.label".
 */
export type Translations = Record<string, Record<string, string | string[]>>

export interface ModMeta {
  modName: string
  cetFolderName: string
  author: string
  modVersion: string
  tabMode: 'own' | 'shared'
  ownTab?: { id: string; label: string }
  sharedTab?: { id: string; label: string; landingHeader?: string }
  subCategoryPrefix: string
}

export interface GeneratorInfo {
  site: string
  siteVersion: string
  exportedAt: string
}

export interface SettingsDoc {
  $schema?: string
  schemaVersion: number
  runtimeVersion: string
  generator: GeneratorInfo
  mod: ModMeta
  subcategories: Subcategory[]
  options: SettingsOption[]
  translations?: Translations
  compat?: CompatRule[]
}

/** Widget names exactly as the Native Settings README calls them. */
export const WIDGET_LABELS: Record<WidgetType, string> = {
  switch: 'Toggle',
  rangeInt: 'Slider Int',
  rangeFloat: 'Slider Float',
  selectorString: 'String List',
  button: 'Button',
  keyBinding: 'Keybind',
}

export const APPLY_LABELS: Record<ApplyKind, string> = {
  variant: 'Toggle a world variant',
  swap: 'Swap between two world variants',
  selectorVariant: 'Choose one of several world variants',
  nif: 'Toggle a Native Interactions project',
  callback: 'Run custom Lua code',
}

/** Which apply kinds are legal for each widget ('' = plain value, no effect). */
export const LEGAL_APPLY: Record<WidgetType, (ApplyKind | '')[]> = {
  switch: ['', 'variant', 'swap', 'nif', 'callback'],
  rangeInt: ['', 'callback'],
  rangeFloat: ['', 'callback'],
  selectorString: ['', 'selectorVariant', 'callback'],
  button: ['callback'],
  keyBinding: ['callback'],
}

/** Shared-tab ids owned by other ecosystems; the builder must never emit them. */
export const RESERVED_TAB_IDS = ['tidy_your_trash']

export const SLUG_RE = /^[a-z0-9_]+$/
