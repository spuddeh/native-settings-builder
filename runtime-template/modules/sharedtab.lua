-- sharedtab.lua — lets several independent mods share one Native Settings tab.
-- The first mod to register creates the tab; every mod adds itself to a registry
-- stored on the tab's data table. The landing page lists one "Enter" button per
-- registered mod; a mod's detail view is rendered by its own callback.
--
-- The registry entry shape { name, callback } is a frozen wire protocol: any copy
-- of this file bundled in any mod of a family can render every other mod's entry,
-- even across runtime versions. Never add required fields to it.
--
-- Part of the Native Settings Builder runtime v__RUNTIME_VERSION__. Do not edit.

local SharedTab = {}

-- Distinct from other ecosystems' registry fields (e.g. Tidy Your Trash's
-- "_subMenus") so builder-made mods can never interfere with them.
local REGISTRY_FIELD = "_nsbSubMenus"

local function tabData(ns, sharedTabDef)
    return ns.data[sharedTabDef.id]
end

function SharedTab.renderLanding(ns, sharedTabDef)
    local tab = tabData(ns, sharedTabDef)
    if not tab then
        return
    end
    tab.options = {}
    tab.subcategories = {}
    tab.keys = {}

    local headerPath = "/" .. sharedTabDef.id .. "/nsb_landing"
    ns.addSubcategory(headerPath, sharedTabDef.landingHeader or "Select a mod to configure")

    local registry = tab[REGISTRY_FIELD] or {}
    table.sort(registry, function(a, b) return a.name < b.name end)
    for _, entry in ipairs(registry) do
        ns.addButton(headerPath, entry.name, "", "Enter", 45, entry.callback)
    end

    -- On the landing page there is nothing of ours to restore.
    ns.registerRestoreDefaultsCallback("/" .. sharedTabDef.id, false, function() end)
    ns.refresh()
end

function SharedTab.register(ns, sharedTabDef, modName, detailCallback)
    local tabPath = "/" .. sharedTabDef.id
    if not ns.pathExists(tabPath) then
        ns.addTab(tabPath, sharedTabDef.label or sharedTabDef.id)
    end

    local tab = tabData(ns, sharedTabDef)
    tab[REGISTRY_FIELD] = tab[REGISTRY_FIELD] or {}
    local registry = tab[REGISTRY_FIELD]

    -- Idempotent: re-registering (e.g. CET "Reload All Mods") updates in place.
    local found = false
    for _, entry in ipairs(registry) do
        if entry.name == modName then
            entry.callback = detailCallback
            found = true
            break
        end
    end
    if not found then
        table.insert(registry, { name = modName, callback = detailCallback })
    end

    SharedTab.renderLanding(ns, sharedTabDef)
end

return SharedTab
