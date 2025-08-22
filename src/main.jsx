import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Home from './pages/home'
import Signing from './pages/Signing'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <Home/>
    {/* <Signing/> */}
  </StrictMode>,
)
