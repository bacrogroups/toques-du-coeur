import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// Les espaces adhérent et gestion sont chargés à part, pour que la vitrine reste légère.
const Espace = lazy(() => import('./adherent/Espace'))
const Gestion = lazy(() => import('./gestion/Gestion'))
const chemin = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {chemin.startsWith('/gestion') ? <Suspense fallback={null}><Gestion /></Suspense>
      : chemin.startsWith('/adherent') ? <Suspense fallback={null}><Espace /></Suspense>
      : <App />}
  </React.StrictMode>,
)
