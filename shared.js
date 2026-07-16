// normalize domain into a simpler format
function normalizeDomain(hostname) {
    return hostname.replace(/^www\./, "");
}

// optimize browser by discarding inactive tabs
async function optimize() {
    const saved = await chrome.storage.local.get({ whitelist: [] });
    const whitelist = saved.whitelist;
    const inactiveTabs = await chrome.tabs.query({ active: false, discarded: false, audible:false, pinned: false });
    let discardCount = 0;
    
    for (const tab of inactiveTabs) {
        if (!tab.id) {
            continue;
        }
        try {
            const domain = normalizeDomain(new URL(tab.url).hostname);
            if (!whitelist.includes(domain)) {
                await chrome.tabs.discard(tab.id);
                discardCount += 1;
            }
        } catch (err) {
            console.error(`Failed to discard tab ID: ${tab.id}`, err);
        }
    }

    // if settings enabled, configure & send a notification after optimizing
    await new Promise(res => setTimeout(res, 1000));
    const notifSaved = await chrome.storage.local.get({ notifCbox: false });

    if (notifSaved.notifCbox) {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "/images/icon128.png",
            title: "Web Browser Optimized",
            message: `${discardCount} tabs have been discarded.`
        });
    }
}