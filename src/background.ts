// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    // Check if the URL is blocked
    chrome.storage.local.get(['blockedSites', 'settings'], (result) => {
      const { blockedSites = [], settings = { enabledFeatures: { focus: true } } } = result

      // Only check if focus mode is enabled
      if (settings.enabledFeatures.focus) {
        const url = new URL(tab.url)
        const domain = url.hostname.replace('www.', '')

        const isBlocked = blockedSites.some((site: { url: string }) =>
          domain.includes(site.url.replace('www.', ''))
        )

        if (isBlocked) {
          // Redirect to blocked page
          chrome.tabs.update(tabId, {
            url: chrome.runtime.getURL('blocked.html')
          })
        }
      }
    })
  }
})

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  // Open DevFlow in a new tab
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  })
})

// Handle alarm for Pomodoro timer
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroTimer') {
    chrome.storage.local.get(['settings'], (result) => {
      const { settings } = result
      if (settings?.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon.svg',
          title: 'DevFlow Timer',
          message: 'Time to take a break!',
          priority: 2
        })
      }
    })
  }
})

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialize default settings
    const defaultSettings = {
      enabledFeatures: {
        home: true,
        snippets: true,
        tasks: true,
        resources: true,
        focus: true
      },
      theme: 'light',
      notifications: true,
      autoStartBreaks: false,
      autoStartPomodoros: false
    }

    // Example quick links
    const defaultQuickLinks = [
      {
        id: '1',
        title: 'React Documentation',
        url: 'https://react.dev',
        description: 'Official React documentation',
        category: 'Documentation',
        createdAt: Date.now()
      },
      {
        id: '2',
        title: 'TypeScript Documentation',
        url: 'https://www.typescriptlang.org/docs/',
        description: 'Official TypeScript documentation',
        category: 'Documentation',
        createdAt: Date.now()
      },
      {
        id: '3',
        title: 'Tailwind CSS',
        url: 'https://tailwindcss.com',
        description: 'A utility-first CSS framework',
        category: 'Tools',
        createdAt: Date.now()
      }
    ]

    chrome.storage.local.set({
      settings: defaultSettings,
      quickLinks: defaultQuickLinks,
      snippets: [],
      tasks: [],
      resources: [],
      blockedSites: [],
      timerSettings: {
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4
      }
    })

    // Open onboarding page
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding.html')
    })
  }
})
