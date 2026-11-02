import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// L'espace adhérent est chargé à part, pour que la vitrine reste légère.
const Espace = lazy(() => import('./adherent/Espace'))
const espace = window.location.pathname.startsWith('/adherent')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {espace ? <Suspense fallback={null}><Espace /></Suspense> : <App />}
  </React.StrictMode>,
)
