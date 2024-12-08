import { useRef, useContext } from 'react'
import { getFromStorage, setInStorage } from '../../utils/storage'
import * as OutlineIcons from '@heroicons/react/24/outline'
import { ThemeContext } from '../../App'

interface Settings {
  enabledFeatures: {
    home: boolean
    snippets: boolean
    tasks: boolean
    resources: boolean
    focus: boolean
  }
  theme: 'light' | 'dark'
  notifications: boolean
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
}

interface SettingsProps {
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
}

export default function Settings({ settings, setSettings }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updateTheme } = useContext(ThemeContext)

  const handleFeatureToggle = async (feature: keyof Settings['enabledFeatures']) => {
    const updatedSettings: Settings = {
      ...settings,
      enabledFeatures: {
        ...settings.enabledFeatures,
        [feature]: !settings.enabledFeatures[feature]
      }
    }
    await setInStorage('settings', updatedSettings)
    setSettings(updatedSettings)
  }

  const handleThemeToggle = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light' as const
    const updatedSettings: Settings = {
      ...settings,
      theme: newTheme
    }
    await setInStorage('settings', updatedSettings)
    setSettings(updatedSettings)
    updateTheme(newTheme)
  }

  const handleSettingToggle = async (setting: keyof Settings) => {
    if (setting === 'enabledFeatures' || setting === 'theme') return
    const updatedSettings: Settings = {
      ...settings,
      [setting]: !settings[setting]
    }
    await setInStorage('settings', updatedSettings)
    setSettings(updatedSettings)
  }

  const exportData = async () => {
    try {
      // Get all data from storage
      const [
        storedSettings,
        quickLinks,
        snippets,
        tasks,
        resources,
        blockedSites,
        timerSettings
      ] = await Promise.all([
        getFromStorage('settings'),
        getFromStorage('quickLinks'),
        getFromStorage('snippets'),
        getFromStorage('tasks'),
        getFromStorage('resources'),
        getFromStorage('blockedSites'),
        getFromStorage('timerSettings')
      ])

      const exportData = {
        settings: storedSettings || settings,
        quickLinks: quickLinks || [],
        snippets: snippets || [],
        tasks: tasks || [],
        resources: resources || [],
        blockedSites: blockedSites || [],
        timerSettings: timerSettings || {
          workDuration: 25,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4
        },
        exportDate: new Date().toISOString()
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devflow-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error exporting data. Please try again.')
    }
  }

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate data structure
      const requiredKeys = ['settings', 'quickLinks', 'snippets', 'tasks', 'resources', 'blockedSites', 'timerSettings']
      if (!requiredKeys.every(key => key in data)) {
        throw new Error('Invalid backup file format')
      }

      // Validate settings structure
      if (!data.settings?.enabledFeatures || typeof data.settings.theme !== 'string') {
        throw new Error('Invalid settings format in backup file')
      }

      // Ensure all arrays are present and valid
      const defaultData = {
        quickLinks: [],
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
      }

      // Merge imported data with defaults
      const importData = {
        settings: {
          ...settings,
          ...data.settings,
          theme: data.settings.theme === 'dark' ? 'dark' : 'light'
        },
        quickLinks: Array.isArray(data.quickLinks) ? data.quickLinks : defaultData.quickLinks,
        snippets: Array.isArray(data.snippets) ? data.snippets : defaultData.snippets,
        tasks: Array.isArray(data.tasks) ? data.tasks : defaultData.tasks,
        resources: Array.isArray(data.resources) ? data.resources : defaultData.resources,
        blockedSites: Array.isArray(data.blockedSites) ? data.blockedSites : defaultData.blockedSites,
        timerSettings: {
          ...defaultData.timerSettings,
          ...data.timerSettings
        }
      }

      // First update settings to ensure theme is applied
      await setInStorage('settings', importData.settings)
      setSettings(importData.settings)

      // Then update all other data
      const updatePromises = [
        setInStorage('quickLinks', importData.quickLinks),
        setInStorage('snippets', importData.snippets),
        setInStorage('tasks', importData.tasks),
        setInStorage('resources', importData.resources),
        setInStorage('blockedSites', importData.blockedSites),
        setInStorage('timerSettings', importData.timerSettings)
      ]

      // In development, ensure localStorage is marked as initialized before other operations
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        localStorage.setItem('initialized', 'true')
      }

      // Wait for all storage operations to complete
      await Promise.all(updatePromises)

      alert('Data imported successfully! The page will refresh to apply changes.')
      // Use a small delay to ensure all storage operations are complete
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Import error:', error)
      alert(`Error importing data: ${error instanceof Error ? error.message : 'Invalid file format'}. Please make sure the file is a valid DevFlow backup.`)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Theme Toggle */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            {settings.theme === 'light' ? (
              <OutlineIcons.MoonIcon className="w-5 h-5" />
            ) : (
              <OutlineIcons.SunIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Data Management</h3>
        <div className="flex gap-4">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <OutlineIcons.ArrowDownTrayIcon className="w-5 h-5" />
            Export Data
          </button>
          <input
            type="file"
            accept=".json"
            onChange={importData}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            <OutlineIcons.ArrowUpTrayIcon className="w-5 h-5" />
            Import Data
          </button>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Features</h3>
        <div className="space-y-4">
          {Object.entries(settings.enabledFeatures).map(([feature, enabled]) => (
            <label key={feature} className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 capitalize">{feature}</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleFeatureToggle(feature as keyof Settings['enabledFeatures'])}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Other Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Desktop Notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={() => handleSettingToggle('notifications')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Auto-start Breaks</span>
            <input
              type="checkbox"
              checked={settings.autoStartBreaks}
              onChange={() => handleSettingToggle('autoStartBreaks')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Auto-start Pomodoros</span>
            <input
              type="checkbox"
              checked={settings.autoStartPomodoros}
              onChange={() => handleSettingToggle('autoStartPomodoros')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
