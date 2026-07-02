import { useProjectStore } from '../state/store'
import { slugify } from '../model/defaults'
import { SelectField, TextField } from './fields'

function pascalize(name: string): string {
  return name.replace(/[^A-Za-z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''))
    .replace(/^./, (c) => c.toUpperCase())
}

export function MetadataForm() {
  const mod = useProjectStore((s) => s.doc.mod)
  const setMod = useProjectStore((s) => s.setMod)

  // Derived fields follow the mod name until the author edits them by hand:
  // a field is updated only while its value still matches what the previous
  // name would have derived.
  const renameMod = (modName: string) => {
    const patch: Parameters<typeof setMod>[0] = { modName }
    if (mod.cetFolderName === pascalize(mod.modName)) patch.cetFolderName = pascalize(modName)
    if (mod.subCategoryPrefix === mod.modName) patch.subCategoryPrefix = modName
    if (mod.tabMode === 'own' && mod.ownTab && mod.ownTab.id === slugify(mod.modName) && mod.ownTab.label === mod.modName) {
      patch.ownTab = { id: slugify(modName), label: modName }
    }
    setMod(patch)
  }

  return (
    <div>
      <div className="row">
        <TextField
          label="Mod name"
          value={mod.modName}
          onChange={renameMod}
          hint="Shown to players. Also usable as LocKey#…"
        />
        <TextField
          label="Author"
          value={mod.author}
          onChange={(author) => setMod({ author })}
        />
      </div>
      <div className="row">
        <TextField
          label="CET folder name"
          value={mod.cetFolderName}
          onChange={(cetFolderName) => setMod({ cetFolderName })}
          mono
          hint="Folder under .../cyber_engine_tweaks/mods/. Letters, digits, - and _"
        />
        <TextField
          label="Mod version"
          value={mod.modVersion}
          onChange={(modVersion) => setMod({ modVersion })}
          hint="Semantic version, e.g. 1.0.0"
        />
      </div>
      <TextField
        label="Subcategory prefix (optional)"
        value={mod.subCategoryPrefix}
        onChange={(subCategoryPrefix) => setMod({ subCategoryPrefix })}
        hint='Shown before subcategory labels in a shared tab, e.g. "Glen - Main". Also keeps subcategory paths unique between mods. Leave empty to skip.'
      />
      <SelectField
        label="Tab mode"
        value={mod.tabMode}
        onChange={(tabMode) => {
          if (tabMode === 'shared') {
            setMod({
              tabMode: 'shared',
              sharedTab: mod.sharedTab ?? { id: 'my_mod_family', label: 'My Mod Family', landingHeader: 'Select a mod to configure' },
            })
          } else {
            setMod({
              tabMode: 'own',
              ownTab: mod.ownTab ?? { id: slugify(mod.modName) || 'my_mod', label: mod.modName },
            })
          }
        }}
        options={[
          { value: 'own', label: 'Own tab (this mod alone)' },
          { value: 'shared', label: 'Shared tab (a family of mods, one tab)' },
        ]}
        hint="Shared tabs keep the Mods tab bar short when you publish several related mods"
      />
      {mod.tabMode === 'own' ? (
        <div className="row">
          <TextField
            label="Tab id"
            value={mod.ownTab?.id ?? ''}
            onChange={(id) => setMod({ ownTab: { id, label: mod.ownTab?.label ?? '' } })}
            mono
            hint="lowercase_with_underscores"
          />
          <TextField
            label="Tab label"
            value={mod.ownTab?.label ?? ''}
            onChange={(label) => setMod({ ownTab: { id: mod.ownTab?.id ?? '', label } })}
          />
        </div>
      ) : (
        <>
          <div className="row">
            <TextField
              label="Shared tab id"
              value={mod.sharedTab?.id ?? ''}
              onChange={(id) =>
                setMod({ sharedTab: { ...(mod.sharedTab ?? { label: '' }), id, label: mod.sharedTab?.label ?? '' } })
              }
              mono
              hint="Must be identical in every mod of the family"
            />
            <TextField
              label="Shared tab label"
              value={mod.sharedTab?.label ?? ''}
              onChange={(label) =>
                setMod({ sharedTab: { ...(mod.sharedTab ?? { id: '' }), id: mod.sharedTab?.id ?? '', label } })
              }
            />
          </div>
          <TextField
            label="Landing page header"
            value={mod.sharedTab?.landingHeader ?? ''}
            onChange={(landingHeader) =>
              setMod({
                sharedTab: {
                  ...(mod.sharedTab ?? { id: '', label: '' }),
                  id: mod.sharedTab?.id ?? '',
                  label: mod.sharedTab?.label ?? '',
                  landingHeader,
                },
              })
            }
            hint="Shown above the list of mod buttons on the shared tab"
          />
        </>
      )}
    </div>
  )
}
