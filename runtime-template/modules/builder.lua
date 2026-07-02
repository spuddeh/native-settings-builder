-- builder.lua — turns the definition into Native Settings widgets.
-- Categories render in categories[] order and options in options[] order;
-- iteration is always by array index, never pairs(), so ordering is stable.
-- Part of the Native Settings Builder runtime v__RUNTIME_VERSION__. Do not edit.

local Config = require("modules/config")
local Apply = require("modules/apply")
local Lang = require("modules/lang")
local SharedTab = require("modules/sharedtab")

local Builder = {}

local function slug(text)
    return (tostring(text):gsub("[^%w]+", "_"):lower())
end

-- The section prefix is optional free text. Shown verbatim before section
-- labels in shared tabs; always sanitized when used in subcategory paths.
local function displayPrefix(mod)
    if type(mod.subCategoryPrefix) == "string" and mod.subCategoryPrefix ~= "" then
        return mod.subCategoryPrefix
    end
    return nil
end

local function pathPrefix(mod)
    return slug(displayPrefix(mod) or mod.cetFolderName or mod.modName)
end

local function makeOnChange(ctx, opt)
    return function(value)
        ctx.values[opt.id] = value
        Config.save(ctx.configFile, ctx.def, ctx.values, ctx.appliedCompat)
        Apply.dispatch(ctx, opt, value)
        if ctx.notifyChange then
            ctx.notifyChange(opt.id, value)
        end
    end
end

local BUILDERS = {
    switch = function(ns, path, ctx, opt)
        return ns.addSwitch(path,
            Lang.get(opt.id .. ".label", opt.label),
            Lang.get(opt.id .. ".description", opt.description),
            ctx.values[opt.id], opt.default, makeOnChange(ctx, opt))
    end,

    rangeInt = function(ns, path, ctx, opt)
        return ns.addRangeInt(path,
            Lang.get(opt.id .. ".label", opt.label),
            Lang.get(opt.id .. ".description", opt.description),
            opt.min, opt.max, opt.step,
            ctx.values[opt.id], opt.default, makeOnChange(ctx, opt))
    end,

    rangeFloat = function(ns, path, ctx, opt)
        return ns.addRangeFloat(path,
            Lang.get(opt.id .. ".label", opt.label),
            Lang.get(opt.id .. ".description", opt.description),
            opt.min, opt.max, opt.step, opt.format or "%.2f",
            ctx.values[opt.id], opt.default, makeOnChange(ctx, opt))
    end,

    selectorString = function(ns, path, ctx, opt)
        return ns.addSelectorString(path,
            Lang.get(opt.id .. ".label", opt.label),
            Lang.get(opt.id .. ".description", opt.description),
            Lang.getElements(opt.id, opt.elements),
            ctx.values[opt.id], opt.default, makeOnChange(ctx, opt))
    end,

    button = function(ns, path, ctx, opt)
        return ns.addButton(path,
            Lang.get(opt.id .. ".label", opt.label),
            Lang.get(opt.id .. ".description", opt.description),
            Lang.get(opt.id .. ".buttonText", opt.buttonText or "Apply"),
            opt.textSize or 45,
            function() Apply.dispatch(ctx, opt, nil) end)
    end,

    keyBinding = function(ns, path, ctx, opt)
        return ns.addKeyBinding(path,
            Lang.get(opt.id .. ".label", opt.label),
            Lang.get(opt.id .. ".description", opt.description),
            ctx.values[opt.id], opt.default, opt.isHold == true,
            makeOnChange(ctx, opt))
    end,
}

-- Adds all subcategories + options for this mod under tabPath.
local function buildOptions(ns, ctx, tabPath)
    local def = ctx.def
    local prefix = pathPrefix(def.mod)
    local labelPrefix = def.mod.tabMode == "shared" and displayPrefix(def.mod) or nil
    ctx.widgets = {}

    for _, category in ipairs(def.categories) do
        local subPath = tabPath .. "/" .. prefix .. "_" .. slug(category.id)
        local hasVisibleOption = false
        for _, opt in ipairs(def.options) do
            if opt.category == category.id and opt.showInMenu ~= false then
                hasVisibleOption = true
                break
            end
        end
        if hasVisibleOption then
            local label = Lang.get("categories." .. category.id, category.label)
            if labelPrefix then
                label = Lang.get("mod.subCategoryPrefix", labelPrefix) .. " - " .. label
            end
            ns.addSubcategory(subPath, label)
            for _, opt in ipairs(def.options) do
                if opt.category == category.id and opt.showInMenu ~= false then
                    local build = BUILDERS[opt.type]
                    if build then
                        ctx.widgets[opt.id] = build(ns, subPath, ctx, opt)
                    end
                end
            end
        end
    end
end

function Builder.onRestoreDefaults(ctx)
    for _, opt in ipairs(ctx.def.options) do
        if opt.type ~= "button" then
            ctx.values[opt.id] = opt.default
            if ctx.notifyChange then
                ctx.notifyChange(opt.id, opt.default)
            end
        end
    end
    Config.save(ctx.configFile, ctx.def, ctx.values, ctx.appliedCompat)
    Apply.applyAll(ctx)
end

function Builder.buildOwnTab(ns, ctx)
    local tabPath = "/" .. ctx.def.mod.ownTab.id
    if not ns.pathExists(tabPath) then
        ns.addTab(tabPath, Lang.get("mod.ownTab.label", ctx.def.mod.ownTab.label))
    end
    buildOptions(ns, ctx, tabPath)
    ns.registerRestoreDefaultsCallback(tabPath, false, function()
        Builder.onRestoreDefaults(ctx)
    end)
end

-- Shared mode detail view: wipe the shared tab and rebuild it with a Back button
-- followed by this mod's subcategories (the TYT master/detail pattern).
function Builder.buildDetail(ns, ctx)
    local sharedTabDef = ctx.def.mod.sharedTab
    local tabPath = "/" .. sharedTabDef.id
    local tab = ns.data[sharedTabDef.id]
    if not tab then
        return
    end
    tab.options = {}
    tab.subcategories = {}
    tab.keys = {}

    local backPath = tabPath .. "/" .. pathPrefix(ctx.def.mod) .. "_nsb_back"
    ns.addSubcategory(backPath, Lang.get("mod.modName", ctx.def.mod.modName))
    ns.addButton(backPath, "Back", "Return to the mod list", "Back", 45, function()
        SharedTab.renderLanding(ns, sharedTabDef)
    end)

    buildOptions(ns, ctx, tabPath)
    ns.registerRestoreDefaultsCallback(tabPath, false, function()
        Builder.onRestoreDefaults(ctx)
    end)
    ns.refresh()
end

return Builder
