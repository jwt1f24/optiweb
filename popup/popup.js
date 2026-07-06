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

        // default tab list display
        if (btn.dataset.target === "tabList") {
            displayList();
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
    });
});

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

// optimize browser by freezing inactive tabs on button click
const optBtn = document.getElementById("optBtn");
optBtn.addEventListener("click", async () => {
    const saved = await chrome.storage.local.get({ whitelist: [] });
    const whitelist = saved.whitelist;
    const inactiveTabs = await chrome.tabs.query({ active: false, discarded: false, audible:false, pinned: false });
    for (const tab of inactiveTabs) {
        if (!tab.id) {
            continue;
        }
        try {
            const domain = new URL(tab.url).hostname;
            if (!whitelist.includes(domain)) {
                await chrome.tabs.discard(tab.id);
            }
        } catch (err) {
            console.error(`Failed to discard tab ID: ${tab.id}`, err);
        }
    }
    // refresh dashboard to load changes
    updateMetrics();
});

// instantiate live view dashboard tab updates
updateMetrics();
setInterval(updateMetrics, 1000);

// display all opened tabs on a list
async function displayList() {
    const tabs = await chrome.tabs.query({});
    const filtered = tabs.filter(tab => !tab.url.startsWith("chrome://"));
    const saved = await chrome.storage.local.get({ whitelist: [] });
    let whitelist = saved.whitelist;
    const listTabs = document.getElementById("listTabs");
    listTabs.innerHTML = "";

    filtered.forEach(tab => {
        try {
            const domain = new URL(tab.url).hostname;
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
            listTabs.appendChild(div);
        } catch (err) {
            console.error(`Failed to display tab ID: ${tab.id}`, err);
        }
    });
}