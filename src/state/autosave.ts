import { useProjectStore } from './store'
import { importDoc } from '../model/migrate'
import type { SettingsDoc } from '../model/schema'

const STORAGE_KEY = 'nsb:doc:v1'
const DEBOUNCE_MS = 500

let timer: number | undefined

/** Starts persisting every doc change to localStorage (debounced). */
export function startAutosave(): void {
  useProjectStore.subscribe((state) => {
    window.clearTimeout(timer)
    const doc = state.doc
    timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
      } catch {
        // Storage full or unavailable; autosave is best-effort.
      }
    }, DEBOUNCE_MS)
  })
}

/** Returns the autosaved doc if one exists and still parses, else null. */
export function loadAutosaved(): SettingsDoc | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return null
    return importDoc(text)
  } catch {
    return null
  }
}

export function clearAutosaved(): void {
  localStorage.removeItem(STORAGE_KEY)
}
