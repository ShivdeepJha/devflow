import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeDevData } from './utils/initDevData'
import { getFromStorage } from './utils/storage'

// Initialize theme based on stored settings
const initializeTheme = async () => {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    await initializeDevData()
  }

  const settings = await getFromStorage('settings')
  const theme = settings?.theme || 'light'

  // Apply theme class to html element
  document.documentElement.className = theme === 'dark' ? 'dark' : ''

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
  )
}

// Initialize theme immediately
initializeTheme().catch(error => {
  console.error('Failed to initialize theme:', error)
  // Render app anyway with default light theme
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
  )
})
