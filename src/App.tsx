import { useState, useEffect, createContext } from 'react'
import * as OutlineIcons from '@heroicons/react/24/outline'
import CodeSnippets from './components/features/CodeSnippets'
import TaskTracker from './components/features/TaskTracker'
import ResourceHub from './components/features/ResourceHub'
import FocusMode from './components/features/FocusMode'
import Settings from './components/features/Settings'
import Home from './components/features/Home'
import { getFromStorage, setInStorage } from './utils/storage'
import './styles/tailwind.css'

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

export const ThemeContext = createContext<{
  theme: 'light' | 'dark'
  updateTheme: (newTheme: 'light' | 'dark') => void
}>({
  theme: 'light',
  updateTheme: () => {}
})

const SIDEBAR_ITEMS = [
  { id: 'home', icon: OutlineIcons.HomeIcon, label: 'Home', component: Home },
  { id: 'snippets', icon: OutlineIcons.CodeBracketIcon, label: 'Snippets', component: CodeSnippets },
  { id: 'tasks', icon: OutlineIcons.ClipboardDocumentListIcon, label: 'Tasks', component: TaskTracker },
  { id: 'resources', icon: OutlineIcons.BookmarkIcon, label: 'Resources', component: ResourceHub },
  { id: 'focus', icon: OutlineIcons.ClockIcon, label: 'Focus Mode', component: FocusMode },
  { id: 'settings', icon: OutlineIcons.Cog6ToothIcon, label: 'Settings', component: Settings }
] as const

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [settings, setSettings] = useState<Settings>({
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
  })

  // Function to update theme
  const updateTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }

  useEffect(() => {
    // Load settings from storage
    const loadSettings = async () => {
      const storedSettings = await getFromStorage('settings')
      if (storedSettings) {
        setSettings(storedSettings)
        updateTheme(storedSettings.theme)
      }
    }
    loadSettings()
  }, [])

  // Update theme whenever settings change
  useEffect(() => {
    updateTheme(settings.theme)
  }, [settings.theme])

  // Get the active component
  const ActiveComponent = SIDEBAR_ITEMS.find(item => item.id === activeTab)?.component

  return (
    <ThemeContext.Provider value={{
      theme: settings.theme,
      updateTheme: (newTheme) => {
        const updatedSettings = { ...settings, theme: newTheme }
        setSettings(updatedSettings)
        setInStorage('settings', updatedSettings)
      }
    }}>
      <div className="flex h-lvh w-full bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center py-4 space-y-4">
            {SIDEBAR_ITEMS.map(({ id, icon: Icon, label }) => {
              // Always show settings, check enabledFeatures for others
              const isEnabled = id === 'settings' || settings.enabledFeatures[id as keyof Settings['enabledFeatures']]

              return isEnabled ? (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  title={label}
                >
                  <Icon className="w-6 h-6" />
                </button>
              ) : null
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-4">
            {ActiveComponent && <ActiveComponent settings={settings} setSettings={setSettings} />}
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  )
}

export default App
