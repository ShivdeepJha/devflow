import { getFromStorage, setInStorage } from './storage'

export const initializeDevData = async () => {
  // Check if data already exists
  const [
    existingSettings,
    existingQuickLinks,
    existingSnippets,
    existingTasks,
    existingResources,
    existingBlockedSites,
    existingTimerSettings
  ] = await Promise.all([
    getFromStorage('settings'),
    getFromStorage('quickLinks'),
    getFromStorage('snippets'),
    getFromStorage('tasks'),
    getFromStorage('resources'),
    getFromStorage('blockedSites'),
    getFromStorage('timerSettings')
  ])

  // Only set default data if it doesn't exist
  if (!existingSettings) {
    await setInStorage('settings', {
      enabledFeatures: {
        home: true,
        snippets: true,
        tasks: true,
        resources: true,
        focus: true
      },
      theme: 'dark',
      notifications: true,
      autoStartBreaks: false,
      autoStartPomodoros: false
    })
  }

  if (!existingQuickLinks) {
    await setInStorage('quickLinks', [
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
    ])
  }

  if (!existingSnippets) {
    await setInStorage('snippets', [])
  }

  if (!existingTasks) {
    await setInStorage('tasks', [])
  }

  if (!existingResources) {
    await setInStorage('resources', [])
  }

  if (!existingBlockedSites) {
    await setInStorage('blockedSites', [])
  }

  if (!existingTimerSettings) {
    await setInStorage('timerSettings', {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4
    })
  }

  // Mark as initialized
  localStorage.setItem('initialized', 'true')
}
