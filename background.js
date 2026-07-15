importScripts("shared.js");

// check if extension is toggled on or off
async function isExtensionEnabled() {
    const saved = await chrome.storage.local.get({ extensionEnabled: true });
    return saved.extensionEnabled;
}

// optimize on browser startup
chrome.runtime.onStartup.addListener(async () => {
    if (!(await isExtensionEnabled())) {
        return;
    }
    await optimize();
});

// automated optimization
let isOptimizing = false;
chrome.alarms.create("timeOptimizeCheck", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
    // guard extension state
    if (!(await isExtensionEnabled())) {
        return;
    }
    
    // guard overlapping triggers
    if (isOptimizing) {
        return;
    }
    
    // read local storage settings
    const saved = await chrome.storage.local.get({
        minCbox: false,
        minValue: 1,
        lastSavedTime: 0
    });
    
    // trigger optimization for each time interval in minutes
    if (saved.minCbox) {
        const now = Date.now();
        const mins = (now - saved.lastSavedTime) / 60000;

        if (mins >= saved.minValue) {
            isOptimizing = true;
            await optimize();
            isOptimizing = false;
            await chrome.storage.local.set({ lastSavedTime: now });
        }
    }

    // discard individual tabs after set time of being unfocused
    const unfocusedSaved = await chrome.storage.local.get({
        unfocusedCbox: false,
        unfocusedValue: 5,
        timeFocused: {},
        whitelist: []
    });

    if (unfocusedSaved.unfocusedCbox) {
        const tabs = await chrome.tabs.query({ discarded: false, audible: false, pinned: false });
        const now = Date.now();
        const timeSet = unfocusedSaved.unfocusedValue * 60000;
        let discardCount = 0;

        for (const tab of tabs) {
            // ignore if tab is currently focused by user
            if (tab.active) {
                continue;
            };

            // ignore in case if tab doesn't have a background timer
            const lastFocused = unfocusedSaved.timeFocused[tab.id];
            if (!lastFocused) {
                continue;
            }

            try {
                // ignore if tab is in whitelist
                const domain = normalizeDomain(new URL(tab.url).hostname);
                if (unfocusedSaved.whitelist.includes(domain)) {
                    continue;
                }

                // discard tab if time elapsed reaches the setting value
                const elapsed = now - lastFocused;
                if (elapsed >= timeSet) {
                    await chrome.tabs.discard(tab.id);
                    discardCount += 1;
                }
            } catch (err) {
                console.error(`Failed to check tab ID: ${tab.id}`, err);
            }
        }

        // configure notification content
        if (discardCount > 0) {
            const notifSaved = await chrome.storage.local.get({ notifCbox: false });
            if (notifSaved.notifCbox) {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "/images/icon128.png",
                    title: "Web Browser Optimized",
                    message: `${discardCount} tabs have been discarded after being inactive for ${unfocusedSaved.unfocusedValue} minutes.`
                });
            }
        }
    }
});

// reset tab's timestamp if user focuses on it
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const saved = await chrome.storage.local.get({ timeFocused: {} });
    const times = saved.timeFocused;
    times[activeInfo.tabId] = Date.now();
    await chrome.storage.local.set({ timeFocused: times });
});

// initialize timestamp for newly opened tab
chrome.tabs.onCreated.addListener(async (tab) => {
    const saved = await chrome.storage.local.get({ timeFocused: {} });
    const times = saved.timeFocused;
    times[tab.id] = Date.now();
    await chrome.storage.local.set({ timeFocused: times });
});

// remove inactive tab and its stored timestamp
chrome.tabs.onRemoved.addListener(async (tabId) => {
    const saved = await chrome.storage.local.get({ timeFocused: {} });
    const times = saved.timeFocused;
    delete times[tabId];
    await chrome.storage.local.set({ timeFocused: times });
});

// hotkey event handling
chrome.commands.onCommand.addListener(async (command) => {
    // toggle extension hotkey
    if (command === "toggle-extension") {
        const saved = await chrome.storage.local.get({ extensionEnabled: true });
        await chrome.storage.local.set({ extensionEnabled: !saved.extensionEnabled });
    }
    
    // optimize hotkey
    if (command  === "run-optimize") {
        if (!(await isExtensionEnabled())) {
            return;
        }
        await optimize();
    }
});