-- apply.lua — turns a setting value into an in-game effect.
-- World variants go through WorldStateSystem (requires Codeware for CreateNodeRef),
-- nif toggles go through Native Interactions Framework, callbacks run author code
-- from user_callbacks.lua (always pcall-wrapped so a typo cannot break the menu).
-- Part of the Native Settings Builder runtime v__RUNTIME_VERSION__. Do not edit.

local Apply = {}

local warned = {}

local function warnOnce(ctx, key, message)
    if not warned[key] then
        warned[key] = true
        print(ctx.logPrefix .. " WARN: " .. message)
    end
end

local function toggleVariant(ref, variant, state)
    Game.GetWorldStateSystem():TogglePrefabVariant(CreateNodeRef(ref), variant, state)
end

local APPLIERS = {
    variant = function(_, opt, value)
        toggleVariant(opt.apply.ref, opt.apply.variant, value == true)
    end,

    swap = function(_, opt, value)
        toggleVariant(opt.apply.ref, opt.apply.variantOn, value == true)
        toggleVariant(opt.apply.ref, opt.apply.variantOff, value ~= true)
    end,

    selectorVariant = function(_, opt, index)
        for i, variant in ipairs(opt.apply.variants) do
            toggleVariant(opt.apply.ref, variant, i == index)
        end
    end,

    nif = function(ctx, opt, value)
        local nif = GetMod("nativeInteractions")
        if nif then
            nif.api.toggleProject(opt.apply.project, value == true)
        else
            warnOnce(ctx, "nif", "Native Interactions Framework is not installed; option '" .. opt.id .. "' has no effect")
        end
    end,

    callback = function(ctx, opt, value)
        local name = opt.apply["function"]
        local fn = ctx.userCallbacks and ctx.userCallbacks[name]
        if type(fn) ~= "function" then
            warnOnce(ctx, "cb_" .. tostring(name), "callback '" .. tostring(name) .. "' not found in user_callbacks.lua")
            return
        end
        local ok, err = pcall(fn, value)
        if not ok then
            print(ctx.logPrefix .. " ERROR in callback '" .. name .. "': " .. tostring(err))
        end
    end,
}

function Apply.dispatch(ctx, opt, value)
    if not opt.apply then
        return
    end
    local applier = APPLIERS[opt.apply.kind]
    if applier then
        applier(ctx, opt, value)
    end
end

-- Re-asserts world state for every world-affecting option. Runs on every session
-- start; author callbacks are change-driven and intentionally NOT fired here.
local WORLD_KINDS = { variant = true, swap = true, selectorVariant = true, nif = true }

function Apply.applyAll(ctx)
    for _, opt in ipairs(ctx.def.options) do
        if opt.apply and WORLD_KINDS[opt.apply.kind] then
            Apply.dispatch(ctx, opt, ctx.values[opt.id])
        end
    end
end

return Apply
