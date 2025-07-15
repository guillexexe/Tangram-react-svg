import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './assets/main.css'

// FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTruck,
  faExchangeAlt,
  faLock,
  faEnvelope,
  faEye,
  faEyeSlash,
  faTruckFast
} from '@fortawesome/free-solid-svg-icons'
library.add(faTruck, faExchangeAlt, faLock, faEnvelope, faEye, faEyeSlash, faTruckFast)

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)