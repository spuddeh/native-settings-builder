# Native Settings menus for location mods: a review of three implementations

Setting up a Native Settings menu, especially one with subcategories, is one of the most common
stumbling blocks for authors creating variants for their location mods. This page compares the
three scripts most authors start from, and explains which ideas from each were carried into the
Native Settings Builder runtime.

The three implementations:

1. **The original wiki example** (the variant switcher script from the Sector Variants wiki page)
2. **Akiway's improved version** (shipped with the "Sector Variants Practical Example" project)
3. **Spuddeh's Tidy Your Trash system** (the unified settings menu shared by the Tidy mod family)

## Comparison

| Aspect | Original wiki example | Akiway | Tidy Your Trash |
|--------|-----------------------|--------|-----------------|
| Structure | Flat; all logic in init.lua | Modular; logic, data and utils separated | Modular; shared registry, renderer and data separated |
| Option types | 2 hardcoded families (mutually exclusive selector, additive switch) | 4 data-driven types: boolean, swap, selector, manual | 3 data-driven arrays: mutually exclusive, additive, interaction toggles |
| Persistence | Entire settings table, metadata included | Minimal name and state pairs with stable unique names | Full structured config, reconciled by stable keys |
| Migration | Shallow top-level key merge | Old-format detection plus obsolete-entry cleanup | Key-based reconcile that heals structural drift and clamps indices |
| Ordering | Implicit | Definition array order | Explicit categoryOrder array |
| Multi-mod support | None (own tab) | None (own tab) | Shared tab registry with landing page and Back navigation |
| Localization | None | 18 languages plus LocKey passthrough | None |
| External API | None | Get and set by name, batch set, compat hook | None |
| Schema version | None | None | None |

## What each does well

### The original wiki example

It proved the core mechanic: `Game.GetWorldStateSystem():TogglePrefabVariant(CreateNodeRef(ref), variant, state)`
driven from Native Settings callbacks, with re-application on session start via psiberx's GameUI
library. Its two option families (a string selector for mutually exclusive variants and switches
for additive ones) cover the majority of real menus. Its weakness is that it persists the entire
settings table, display names included, so renaming anything in an update collides with players'
saved files, and its migration only merges top-level keys.

### Akiway's version

Three big ideas:

- **Data-driven types.** One definitions file where every entry has a type (boolean, swap,
  selector, manual) and a loop builds the menu. The swap type is the standout: a single switch
  that flips between two variants, such as a default and an alternate prop.
- **Minimal persistence.** Only a stable unique name and the state are saved. On load, defaults
  are cloned and saved states are overlaid; entries whose names no longer exist are cleaned up.
  Mod updates can freely reorder and relabel options without touching player choices.
- **Localization and an API.** An 18-language table plus LocKey passthrough for descriptions, and
  functions other mods can call to read or set variants, including a hook that auto-enables a
  compatibility variant when a companion mod's archive is detected.

### Tidy Your Trash

Its unique contribution is the **shared tab registry**, which none of the other versions have.
Several independent mods present one tab: the first mod to load creates it (guarded by
`pathExists`), each mod registers a named entry in a registry stored on the tab's data table, and
the landing page lists one button per installed mod. Clicking a button wipes and rebuilds the
tab's options as that mod's detail view, with a Back button to return. Registration is idempotent,
so load order and hot reloads do not matter, and uninstalling one mod leaves the rest working.

It also uses an explicit category order array (Lua's `pairs()` iteration order is undefined, so
implicit ordering is a trap), and its config reconciliation heals structural drift: refs are
refreshed, changed variant sets replaced, and out-of-range selector indices clamped.

## Gaps shared by all three

- **No schema version field** in either the definition or the saved config, so format changes can
  only be detected heuristically.
- **Selector choices persist as indices** (or in full-table form), so reordering entries between
  mod versions silently remaps what players selected.
- **Restore defaults is not wired up.** The game's own "restore defaults" button resets the
  widgets but leaves the saved config and the world state stale.

## What the Native Settings Builder runtime takes from each

| Lesson | Source | Where it lives in the runtime |
|--------|--------|-------------------------------|
| Minimal id and value persistence, obsolete cleanup | Akiway | `modules/config.lua` |
| Data-driven menu build from a definitions file | Akiway | `modules/builder.lua` reading `settings.json` |
| Swap variant type | Akiway | `apply.kind = "swap"` in `modules/apply.lua` |
| Localization (LocKey passthrough plus overrides) | Akiway | `modules/lang.lua` |
| External API and compat hooks | Akiway | `modules/api.lua`, compat rules in `modules/config.lua` |
| Shared tab registry, landing page, Back navigation | Tidy Your Trash | `modules/sharedtab.lua` |
| Explicit ordering arrays | Tidy Your Trash | array order in `settings.json`, arrays only in `builder.lua` |
| Key-based reconcile with clamping | Tidy Your Trash | `modules/config.lua` |
| Session-start re-apply, Codeware guard | Original | `init.lua`, `modules/apply.lua` |

New in this runtime, present in none of the prior art:

- A **schemaVersion** in both the definition and the config, with migration hook tables on both
  the site and the Lua side.
- **Selector persistence by string** (the element text, or the variant name for variant
  selectors), with a fallback to the default when the string no longer exists. Reordering choices
  between mod versions no longer remaps player selections.
- **Restore-defaults integration**: the game's restore button now also resets the saved config
  and re-applies world state.

The shared tab registry is generalized but deliberately namespaced apart from Tidy Your Trash
(different registry field, and the Tidy tab id is reserved in the builder's validation), so
builder-made mods and the existing Tidy family can never interfere with each other.
