import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const iconFont = '24px "Material Symbols Outlined"'
const iconProbeText = 'dashboard'

async function waitForIconFont() {
  if (!document.fonts || document.fonts.check(iconFont, iconProbeText)) {
    return
  }

  await document.fonts.load(iconFont, iconProbeText)
}

async function renderApp() {
  await waitForIconFont()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void renderApp()
