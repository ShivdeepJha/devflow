import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getFromStorage, setInStorage } from '../../utils/storage'

interface BlockedSite {
  id: string
  url: string
}

interface TimerSettings {
  workDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
}

interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  isBreak: boolean;
  sessionCount: number;
  lastUpdated: number;
}

export default function FocusMode() {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isBreak, setIsBreak] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([])
  const [newSite, setNewSite] = useState('')
  const [settings, setSettings] = useState<TimerSettings>({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4
  })

  useEffect(() => {
    // Load blocked sites, settings, and timer state from storage
    const loadData = async () => {
      const [storedSites, storedSettings, storedTimerState] = await Promise.all([
        getFromStorage('blockedSites'),
        getFromStorage('timerSettings'),
        getFromStorage('timerState')
      ])

      if (storedSites) {
        setBlockedSites(storedSites)
      }
      if (storedSettings) {
        setSettings(storedSettings)
      }

      // Restore timer state if it exists
      if (storedTimerState) {
        const state = storedTimerState as TimerState;
        const timePassed = Math.floor((Date.now() - state.lastUpdated) / 1000);

        if (state.isRunning) {
          const remainingTime = Math.max(0, state.timeLeft - timePassed);
          setTimeLeft(remainingTime);

          // If timer would have completed while away, reset to work duration
          if (remainingTime === 0) {
            setTimeLeft(settings.workDuration * 60);
            setIsRunning(false);
            setIsBreak(false);
          } else {
            setIsRunning(true);
            setIsBreak(state.isBreak);
          }
        } else {
          setTimeLeft(state.timeLeft);
          setIsBreak(state.isBreak);
        }

        setSessionCount(state.sessionCount);
      } else {
        setTimeLeft(settings.workDuration * 60);
      }
    }
    loadData()
  }, [])

  // Save timer state when component unmounts or tab is hidden
  useEffect(() => {
    const saveTimerState = () => {
      const timerState: TimerState = {
        isRunning,
        timeLeft,
        isBreak,
        sessionCount,
        lastUpdated: Date.now()
      };
      setInStorage('timerState', timerState);
    };

    // Save state when tab becomes hidden
    document.addEventListener('visibilitychange', saveTimerState);

    // Save state before unload
    window.addEventListener('beforeunload', saveTimerState);

    return () => {
      document.removeEventListener('visibilitychange', saveTimerState);
      window.removeEventListener('beforeunload', saveTimerState);
      saveTimerState();
    };
  }, [isRunning, timeLeft, isBreak, sessionCount]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = () => {
    if (!isBreak) {
      const newSessionCount = sessionCount + 1
      setSessionCount(newSessionCount)

      if (newSessionCount % settings.sessionsBeforeLongBreak === 0) {
        setTimeLeft(settings.longBreakDuration * 60)
      } else {
        setTimeLeft(settings.breakDuration * 60)
      }
    } else {
      setTimeLeft(settings.workDuration * 60)
    }

    setIsBreak(!isBreak)
    setIsRunning(false)

    // Notify user
    if (Notification.permission === 'granted') {
      new Notification(isBreak ? 'Time to work!' : 'Time for a break!')
    }
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(settings.workDuration * 60)
    setIsBreak(false)
    setSessionCount(0)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const saveBlockedSites = async (sites: BlockedSite[]) => {
    try {
      await setInStorage('blockedSites', sites)
      setBlockedSites(sites)
    } catch (error) {
      console.error('Error saving blocked sites:', error)
    }
  }

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSite) {
      const site: BlockedSite = {
        id: Date.now().toString(),
        url: newSite.toLowerCase()
      }
      saveBlockedSites([...blockedSites, site])
      setNewSite('')
    }
  }

  const handleRemoveSite = (id: string) => {
    saveBlockedSites(blockedSites.filter(site => site.id !== id))
  }

  const saveSettings = async (newSettings: TimerSettings) => {
    try {
      await setInStorage('timerSettings', newSettings)
      setSettings(newSettings)
      if (!isRunning) {
        setTimeLeft(newSettings.workDuration * 60)
      }
    } catch (error) {
      console.error('Error saving timer settings:', error)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Timer Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{formatTime(timeLeft)}</h2>
          <p className="text-gray-600 dark:text-gray-300">{isBreak ? 'Break Time' : 'Focus Time'}</p>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleTimer}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
          >
            {isRunning ? (
              <>
                <PauseIcon className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <PlayIcon className="w-5 h-5" />
                Start
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Reset
          </button>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Timer Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Work Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={settings.workDuration}
              onChange={(e) => saveSettings({ ...settings, workDuration: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Break Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={settings.breakDuration}
              onChange={(e) => saveSettings({ ...settings, breakDuration: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Long Break Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={settings.longBreakDuration}
              onChange={(e) => saveSettings({ ...settings, longBreakDuration: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sessions Before Long Break
            </label>
            <input
              type="number"
              min="1"
              value={settings.sessionsBeforeLongBreak}
              onChange={(e) => saveSettings({ ...settings, sessionsBeforeLongBreak: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Site Blocking Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Blocked Sites</h3>
        <form onSubmit={handleAddSite} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter domain (e.g., facebook.com)"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <PlusIcon className="w-5 h-5" />
              Add Site
            </button>
          </div>
        </form>
        <div className="space-y-2">
          {blockedSites.map(site => (
            <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-900 dark:text-white">{site.url}</span>
              <button
                onClick={() => handleRemoveSite(site.id)}
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
