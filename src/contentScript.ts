// Check if the current site is blocked
chrome.storage.local.get(['blockedSites', 'settings'], (result) => {
  const { blockedSites = [], settings = { enabledFeatures: { focus: true } } } = result

  // Only check if focus mode is enabled
  if (settings.enabledFeatures.focus) {
    const currentDomain = window.location.hostname.replace('www.', '')

    const isBlocked = blockedSites.some((site: { url: string }) =>
      currentDomain.includes(site.url.replace('www.', ''))
    )

    if (isBlocked) {
      // Create overlay
      const overlay = document.createElement('div')
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.98);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
      `

      const content = document.createElement('div')
      content.style.cssText = `
        text-align: center;
        max-width: 400px;
        padding: 2rem;
      `

      const title = document.createElement('h1')
      title.textContent = 'Stay Focused!'
      title.style.cssText = `
        font-size: 2rem;
        font-weight: bold;
        color: #1a1a1a;
        margin-bottom: 1rem;
      `

      const message = document.createElement('p')
      message.textContent = 'This site is currently blocked to help you maintain focus.'
      message.style.cssText = `
        color: #666;
        margin-bottom: 2rem;
        line-height: 1.5;
      `

      const buttonContainer = document.createElement('div')
      buttonContainer.style.cssText = `
        display: flex;
        gap: 1rem;
      `

      const goBackButton = document.createElement('button')
      goBackButton.textContent = 'Go Back'
      goBackButton.style.cssText = `
        background-color: #3b82f6;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      `
      goBackButton.addEventListener('mouseover', () => {
        goBackButton.style.backgroundColor = '#2563eb'
      })
      goBackButton.addEventListener('mouseout', () => {
        goBackButton.style.backgroundColor = '#3b82f6'
      })
      goBackButton.addEventListener('click', () => {
        window.history.back()
      })

      const openDevFlowButton = document.createElement('button')
      openDevFlowButton.textContent = 'Open DevFlow'
      openDevFlowButton.style.cssText = `
        background-color: #e5e7eb;
        color: #374151;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      `
      openDevFlowButton.addEventListener('mouseover', () => {
        openDevFlowButton.style.backgroundColor = '#d1d5db'
      })
      openDevFlowButton.addEventListener('mouseout', () => {
        openDevFlowButton.style.backgroundColor = '#e5e7eb'
      })
      openDevFlowButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openDevFlow' })
      })

      buttonContainer.appendChild(goBackButton)
      buttonContainer.appendChild(openDevFlowButton)

      content.appendChild(title)
      content.appendChild(message)
      content.appendChild(buttonContainer)
      overlay.appendChild(content)

      // Add overlay to page
      document.body.appendChild(overlay)

      // Prevent scrolling on the main page
      document.body.style.overflow = 'hidden'
    }
  }
})
