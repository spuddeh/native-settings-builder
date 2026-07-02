-- api.lua — public surface other mods (or your own scripts) can use:
--   local other = GetMod("<cetFolderName>")
--   other.getValue("some_option")
--   other.setValue("some_option", true)      -- saves, applies, updates the menu
--   other.setMultiple({ a = true, b = 2 })   -- batch, single save
--   other.onChange("some_option", function(value) ... end)
-- Part of the Native Settings Builder runtime v__RUNTIME_VERSION__. Do not edit.

local Definition = require("modules/definition")
local Config = require("modules/config")
local Apply = require("modules/apply")

local Api = {}

local function coerce(ctx, opt, value)
    -- Selectors accept either the runtime index or the stable string key.
    if opt.type == "selectorString" and type(value) == "string" then
        for i, key in ipairs(Definition.selectorKeys(opt)) do
            if key == value then
                return i
            end
        end
        return nil
    end
    return value
end

local function setInternal(ctx, id, value)
    local opt = Definition.optionById(ctx.def, id)
    if not opt or opt.type == "button" then
        print(ctx.logPrefix .. " WARN: setValue on unknown or valueless option '" .. tostring(id) .. "'")
        return false
    end
    local coerced = coerce(ctx, opt, value)
    if coerced == nil or ctx.values[id] == coerced then
        return false
    end
    ctx.values[id] = coerced
    Apply.dispatch(ctx, opt, coerced)
    if ctx.notifyChange then
        ctx.notifyChange(id, coerced)
    end
    -- Update the live menu widget if it exists (may have been wiped in shared mode).
    local widget = ctx.widgets and ctx.widgets[id]
    if widget and ctx.nativeSettings then
        pcall(function() ctx.nativeSettings.setOption(widget, coerced) end)
    end
    return true
end

function Api.create(ctx)
    ctx.listeners = {}
    ctx.notifyChange = function(id, value)
        for _, listener in ipairs(ctx.listeners[id] or {}) do
            local ok, err = pcall(listener, value)
            if not ok then
                print(ctx.logPrefix .. " ERROR in onChange listener for '" .. id .. "': " .. tostring(err))
            end
        end
    end

    local api = {}

    function api.getValue(id)
        if not ctx.values then
            return nil
        end
        return ctx.values[id]
    end

    function api.setValue(id, value)
        if not ctx.def then
            return false
        end
        local changed = setInternal(ctx, id, value)
        if changed then
            Config.save(ctx.configFile, ctx.def, ctx.values, ctx.appliedCompat)
        end
        return changed
    end

    function api.setMultiple(map)
        if not ctx.def then
            return false
        end
        local changed = false
        for id, value in pairs(map or {}) do
            if setInternal(ctx, id, value) then
                changed = true
            end
        end
        if changed then
            Config.save(ctx.configFile, ctx.def, ctx.values, ctx.appliedCompat)
        end
        return changed
    end

    function api.getDefinition()
        return ctx.def
    end

    function api.onChange(id, fn)
        ctx.listeners[id] = ctx.listeners[id] or {}
        table.insert(ctx.listeners[id], fn)
    end

    return api
end

return Api
