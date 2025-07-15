// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import 'leaflet/dist/leaflet.css'
import 'datatables.net-dt/css/dataTables.dataTables.css'
import 'datatables.net-buttons-dt/css/buttons.dataTables.css'

// 1) Importa el core y los íconos
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTruck,
  faExchangeAlt,
  faLock
} from '@fortawesome/free-solid-svg-icons'

// 2) Añádelos al library **antes** de renderizar
library.add(faTruck, faExchangeAlt, faLock)

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)