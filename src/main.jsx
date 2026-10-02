import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AnotherTab from './AnotherTab.jsx'
import App from './App.jsx'
import { forgetThisTabSession } from './browser-storage'
import { claimThisTab, loadedAsReload } from './tab-check'
import { settleOpeningSession } from './use-session-keeper'

const root = createRoot(document.getElementById('root'))

// The tab check comes first: only the tab that runs the app may look at a saved session.
// If a newer tab later takes the app over (this one was frozen or kept for Back), this one steps aside.
const stepAside = () => root.render(<AnotherTab />)

claimThisTab(stepAside).then((onlyTab) => {
  if (!onlyTab) {
    // A duplicated tab carries a copy of the first tab's note; it isn't the tab that started the session
    if (!loadedAsReload()) forgetThisTabSession()
    root.render(<AnotherTab />)
    return
  }
  settleOpeningSession()
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
