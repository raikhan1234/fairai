import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App'
import { AppProvider } from './store'
import i18n from './i18n'

// Apply saved theme before first render to prevent flash
const savedTheme = (() => {
  try { return localStorage.getItem('fairai-theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
})()
document.documentElement.classList.add(savedTheme)

// Apply saved language
const savedLang = (() => {
  try {
    const v = localStorage.getItem('fairai-lang')
    return (v === 'ru' || v === 'kz') ? v : 'en'
  } catch { return 'en' }
})()
i18n.changeLanguage(savedLang)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
