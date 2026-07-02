import { create } from 'zustand'
import type { Category, CompatRule, ModMeta, SettingsDoc, SettingsOption, WidgetType } from '../model/schema'
import { newDoc, newOption } from '../model/defaults'

interface ProjectState {
  doc: SettingsDoc
  /** id of the option currently open in the editor drawer, if any */
  selectedOptionId: string | null
  selectedCategoryId: string | null

  loadDoc: (doc: SettingsDoc) => void
  resetDoc: () => void
  setMod: (patch: Partial<ModMeta>) => void
  setTranslations: (translations: SettingsDoc['translations']) => void
  setCompat: (compat: CompatRule[] | undefined) => void

  addCategory: (label: string) => void
  updateCategory: (id: string, patch: Partial<Category>) => void
  moveCategory: (id: string, delta: number) => void
  removeCategory: (id: string, moveOptionsTo: string | null) => void

  addOption: (type: WidgetType, category: string) => void
  updateOption: (id: string, next: SettingsOption) => void
  moveOption: (id: string, delta: number) => void
  duplicateOption: (id: string) => void
  removeOption: (id: string) => void

  selectOption: (id: string | null) => void
  selectCategory: (id: string | null) => void
}

function moveInArray<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export const useProjectStore = create<ProjectState>((set) => ({
  doc: newDoc(),
  selectedOptionId: null,
  selectedCategoryId: 'general',

  loadDoc: (doc) =>
    set({
      doc,
      selectedOptionId: null,
      selectedCategoryId: doc.categories[0]?.id ?? null,
    }),

  resetDoc: () => set({ doc: newDoc(), selectedOptionId: null, selectedCategoryId: 'general' }),

  setMod: (patch) =>
    set((s) => ({ doc: { ...s.doc, mod: { ...s.doc.mod, ...patch } } })),

  setTranslations: (translations) =>
    set((s) => ({ doc: { ...s.doc, translations } })),

  setCompat: (compat) =>
    set((s) => ({ doc: { ...s.doc, compat } })),

  addCategory: (label) =>
    set((s) => {
      const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'category'
      let id = base
      let n = 1
      while (s.doc.categories.some((c) => c.id === id)) {
        n += 1
        id = `${base}_${n}`
      }
      return {
        doc: { ...s.doc, categories: [...s.doc.categories, { id, label }] },
        selectedCategoryId: id,
      }
    }),

  updateCategory: (id, patch) =>
    set((s) => ({
      doc: {
        ...s.doc,
        categories: s.doc.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      },
    })),

  moveCategory: (id, delta) =>
    set((s) => {
      const idx = s.doc.categories.findIndex((c) => c.id === id)
      if (idx === -1) return s
      return { doc: { ...s.doc, categories: moveInArray(s.doc.categories, idx, idx + delta) } }
    }),

  removeCategory: (id, moveOptionsTo) =>
    set((s) => {
      const categories = s.doc.categories.filter((c) => c.id !== id)
      const options = moveOptionsTo
        ? s.doc.options.map((o) => (o.category === id ? { ...o, category: moveOptionsTo } : o))
        : s.doc.options.filter((o) => o.category !== id)
      return {
        doc: { ...s.doc, categories, options },
        selectedCategoryId: categories[0]?.id ?? null,
        selectedOptionId: null,
      }
    }),

  addOption: (type, category) =>
    set((s) => {
      const option = newOption(type, category, new Set(s.doc.options.map((o) => o.id)))
      return {
        doc: { ...s.doc, options: [...s.doc.options, option] },
        selectedOptionId: option.id,
      }
    }),

  updateOption: (id, next) =>
    set((s) => ({
      doc: { ...s.doc, options: s.doc.options.map((o) => (o.id === id ? next : o)) },
      selectedOptionId: next.id,
    })),

  moveOption: (id, delta) =>
    set((s) => {
      const option = s.doc.options.find((o) => o.id === id)
      if (!option) return s
      // Move within the option's own category while keeping the global array order stable.
      const siblings = s.doc.options.filter((o) => o.category === option.category)
      const sibIdx = siblings.findIndex((o) => o.id === id)
      const targetSib = siblings[sibIdx + delta]
      if (!targetSib) return s
      const from = s.doc.options.findIndex((o) => o.id === id)
      const to = s.doc.options.findIndex((o) => o.id === targetSib.id)
      return { doc: { ...s.doc, options: moveInArray(s.doc.options, from, to) } }
    }),

  duplicateOption: (id) =>
    set((s) => {
      const source = s.doc.options.find((o) => o.id === id)
      if (!source) return s
      const ids = new Set(s.doc.options.map((o) => o.id))
      let copyId = `${source.id}_copy`
      let n = 1
      while (ids.has(copyId)) {
        n += 1
        copyId = `${source.id}_copy_${n}`
      }
      const copy = structuredClone(source)
      copy.id = copyId
      if (copy.apply?.kind === 'callback') {
        copy.apply.function = `${copyId}_pressed`
      }
      const from = s.doc.options.findIndex((o) => o.id === id)
      const options = [...s.doc.options]
      options.splice(from + 1, 0, copy)
      return { doc: { ...s.doc, options }, selectedOptionId: copyId }
    }),

  removeOption: (id) =>
    set((s) => ({
      doc: { ...s.doc, options: s.doc.options.filter((o) => o.id !== id) },
      selectedOptionId: s.selectedOptionId === id ? null : s.selectedOptionId,
    })),

  selectOption: (id) => set({ selectedOptionId: id }),
  selectCategory: (id) => set({ selectedCategoryId: id, selectedOptionId: null }),
}))
