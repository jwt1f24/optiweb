// main navbar navigation
const navBtns = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".section");
navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        sections.forEach(section => {
            if (section.id === btn.dataset.target) {
                section.style.display = "block";
            } else {
                section.style.display = "none";
            }
        });
        // default display when user navigates to tab list section
        if (btn.dataset.target === "tabList") {
            displayList();
        }
        // restore settings
        if (btn.dataset.target === "settings") {
            checkboxSettings();
        }
    });
});

// secondary navbar navigation for list tabs section
const listNavBtns = document.querySelectorAll(".list-nav-btn");
const listSections = document.querySelectorAll(".list-container");
listNavBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        listSections.forEach(section => {
            if (section.id === btn.dataset.target) {
                section.style.display = "block";
            } else {
                section.style.display = "none";
            }
        });
        // display all tabs section
        if (btn.dataset.target === "allTabsView") {
            displayList();
        }
        // display whitelist section
        if (btn.dataset.target === "whitelistView") {
            displayWhitelist();
        }
    });
});

// normalize domain into a simpler format
function normalizeDomain(hostname) {
    return hostname.replace(/^www\./, "");
}

// scan all opened tabs & update dashboard tab counter
async function updateMetrics() {
    // check for active & sleeping tabs
    const tabs = await chrome.tabs.query({});
    let active = 0;
    let freeze = 0;
    
    tabs.forEach(tab => {
        if (tab.discarded) { 
            freeze += 1;
        } else {
            active += 1;
        }
    });

    // connect the html elements with the number counter
    const activeCount = document.getElementById("activeCount");
    const freezeCount = document.getElementById("freezeCount");

    activeCount.innerText = active;
    freezeCount.innerText = freeze;

    // display memory usage metrics
    const memUsage = document.getElementById("memUsage");
    const memAvailable = document.getElementById("memAvailable");

    if (chrome.system && chrome.system.memory) {
        const mem = await chrome.system.memory.getInfo(); // returns {capacity, availableCapacity}
        const memUsed = (mem.capacity - mem.availableCapacity) / (1024 ** 3);
        const memUnused = mem.availableCapacity / (1024 ** 3);

        memUsage.innerText = memUsed.toFixed(1) + " GB";
        memAvailable.innerText = memUnused.toFixed(1) + " GB";
    }
}

// optimize browser by discarding inactive tabs
async function optimize() {
    const saved = await chrome.storage.local.get({ whitelist: [] });
    const whitelist = saved.whitelist;
    const inactiveTabs = await chrome.tabs.query({ active: false, discarded: false, audible:false, pinned: false });
    const memBefore = await chrome.system.memory.getInfo();
    let discardCount = 0;
    for (const tab of inactiveTabs) {
        if (!tab.id) {
            continue;
        }
        try {
            const domain = normalizeDomain(new URL(tab.url).hostname);
            if (!whitelist.includes(domain)) {
                await chrome.tabs.discard(tab.id);
                discardCount++;
            }
        } catch (err) {
            console.error(`Failed to discard tab ID: ${tab.id}`, err);
        }
    }
    // refresh dashboard
    updateMetrics();

    // send a notification after an optimizing action is triggered
    const memAfter = await chrome.system.memory.getInfo();
    const memSaved = ((memAfter.availableCapacity - memBefore.availableCapacity) / (1024 ** 2)).toFixed(1);
    const notifSaved = await chrome.storage.local.get({ checked: false });
    
    // configure notification content
    if (notifSaved.checked) {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "/images/icon32.png",
            title: "Web Browser Optimized",
            message: `${discardCount} tabs have been discarded, ${memSaved} MB of memory has been saved.`
        });
    }
}

// display all opened tabs on a list
async function displayList() {
    const tabs = await chrome.tabs.query({});
    const filtered = tabs.filter(tab => !tab.url.startsWith("chrome://"));
    const saved = await chrome.storage.local.get({ whitelist: [] });
    let whitelist = saved.whitelist;
    const listContainer = document.getElementById("listTabs");
    listContainer.innerHTML = "";

    filtered.forEach(tab => {
        try {
            const domain = normalizeDomain(new URL(tab.url).hostname);
            const div = document.createElement("div");
            const tabName = document.createElement("h4");
            const url = document.createElement("p");
            const cbox = document.createElement("input");
            const isProtected = tab.pinned || tab.audible;

            tabName.textContent = tab.title;
            
            // if checkbox is ticked, save tab domain in a local storage
            cbox.type = "checkbox";
            cbox.checked = isProtected || whitelist.includes(domain);
            cbox.disabled = isProtected;
            cbox.addEventListener("change", async () => {
                if (cbox.checked) {
                    whitelist.push(domain);
                } else {
                    whitelist = whitelist.filter(item => item !== domain);
                }
                await chrome.storage.local.set({ whitelist: whitelist });
                displayList();
            });

            // mark pinned and audible tabs with a symbol
            let prefix = "";
            if (tab.audible) {
                prefix += "🔉 ";
            }
            if (tab.pinned)  {
                prefix += "📌 ";
            } 
            url.textContent = prefix + domain;
            
            div.appendChild(tabName);
            div.appendChild(url);
            div.appendChild(cbox);
            listContainer.appendChild(div);
        } catch (err) {
            console.error(`Failed to display tab ID: ${tab.id}`, err);
        }
    });
}

// display whitelisted domains on a list
async function displayWhitelist() {
    const saved = await chrome.storage.local.get({ whitelist: [] });
    let whitelist = saved.whitelist;
    const listContainer = document.getElementById("whitelistedDomains");
    listContainer.innerHTML = "";

    whitelist.forEach(domain => {
        try {
            const div = document.createElement("div");
            const name = document.createElement("p");
            const btn = document.createElement("button");

            name.textContent = domain;

            // button to remove saved domain from whitelist
            btn.textContent = "x";
            btn.addEventListener("click", async () => {
                whitelist = whitelist.filter(item => item !== domain);
                await chrome.storage.local.set({ whitelist: whitelist });
                displayWhitelist();
            });
            
            div.appendChild(name);
            div.appendChild(btn);
            listContainer.appendChild(div);
        } catch (err) {
            console.error(`Failed to display domain: ${domain}`, err);
        }
    });
}

// whitelist domain input handling
async function addToWhitelist() {
    const input = normalizeDomain(domainField.value);
    const pattern = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
    const validFormat = pattern.test(input);
    const saved = await chrome.storage.local.get({ whitelist: [] });
    let whitelist = saved.whitelist;

    // add domain to whitelist if input matches valid domain format
    if (validFormat) {
        if (!whitelist.includes(input)) {
            whitelist.push(input);
        } else {
            console.error(`Domain '${input}' already exists in whitelist`);
        }
        await chrome.storage.local.set({ whitelist: whitelist });
        displayWhitelist();
    } else {
        console.error(`Invalid domain format: ${input}`);
    }
    domainField.value = "";
}

// checkbox setting value storing
async function checkboxSettings() {
    const saved = await chrome.storage.local.get({ checked: false });
    notifCheck.checked = saved.checked;
}

// dashboard section event handling
const optBtn = document.getElementById("optBtn");
optBtn.addEventListener("click", optimize);
document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const dashboard = document.getElementById("dashboard");
        if (dashboard.style.display !== "none") {
            optBtn.click();
        }
    }
});

// whitelist section event handling
const domainBtn = document.getElementById("domainBtn");
const domainField = document.getElementById("domainField");
domainBtn.addEventListener("click", addToWhitelist);
domainField.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addToWhitelist();
    }
});

// notification setting event handling
const notifCheck = document.getElementById("notifCheck");
notifCheck.addEventListener("change", async () => {
    await chrome.storage.local.set({ checked: notifCheck.checked });
});

// instantiate live view dashboard tab updates
updateMetrics();
setInterval(updateMetrics, 1000);