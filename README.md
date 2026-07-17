# **OptiWeb**

OptiWeb is a Chrome extension developed with the aim of optimizing browser performance by automatically discarding inactive tabs to free up memory space. The more tabs opened, the more impactful OptiWeb becomes!

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange?style=flat-square&logo=googlechrome&logoColor=white)

## Project Demo

[![Watch the OptiWeb Demo](https://img.youtube.com/vi/HrUBDXlFT-E/0.jpg)](https://youtu.be/HrUBDXlFT-E)

## Built with

- **HTML** - Popup UI layout
- **CSS** - Visual design structure & theming
- **JavaScript** - Extension logic & background service worker
- **Manifest V3** - Chrome Extension API

## Features

- Dashboard displaying memory and tab metrics
- Button to discard inactive tabs once clicked
- Tab list displaying all opened tabs
- Whitelist selecting sites from being discarded
- Automated optimization settings
- Dark & light theme
- Custom keyboard shortcuts
- Settings backup & restoring

## Why I built this

Web browsers consume a lot of memory, and memory usage grows for each tab opened, slowing down performance.
I built this extension to allow users that frequently open many tabs to be able to simply freeze tabs they do not actively use, while saving memory and retaining site data if they were to open them again.

## Technical highlights

- Architected with Manifest V3 to implement scripts that bridge the popup and background service worker together
- Background service worker is scheduled with **chrome.alarms**, working around its life-cycle constraints
- Utilized **chrome.storage** to save user settings locally, with JSON files to export and import settings

## Screenshots

| ![Dashboard](/images/screenshots/dashboard.png) | ![Dark Mode](/images/screenshots/dashboard-dark.png) |
| :---------------------------------------------: | :--------------------------------------------------: |
|      **Dashboard** — memory & tab metrics       |     **Dark mode** — a theme friendly to the eyes     |

| ![Tab list](/images/screenshots/tab-list.png) | ![Whitelist](/images/screenshots/whitelist.png) |
| :-------------------------------------------: | :---------------------------------------------: |
|    **Tab list** — displays all opened tabs    |  **Whitelist** — protect sites from discarding  |

|   ![Settings](/images/screenshots/settings-1.png)    | ![Advanced Settings](/images/screenshots/settings-2.png) |
| :--------------------------------------------------: | :------------------------------------------------------: |
| **Settings** — automation, notifications, and themes |   **Settings** — keyboard shortcuts & settings backup    |

## Prerequisites

Before installing, please ensure that you are using a Chromium web browser (e.g. Google Chrome, Microsoft Edge)

## How to install

1. Clone the repository via **`git clone https://github.com/jwt1f24/optiweb.git`**
2. Alternatively, click the green button **`Code`** to download & extract ZIP
3. Navigate to the **`chrome://extensions/`** page
4. Enable **`Developer mode`** on the top right corner of the page
5. Click on **`Load unpacked`** on the top left corner of the page
6. Select the root project folder **`optiweb-main`** containing **`manifest.json`**
