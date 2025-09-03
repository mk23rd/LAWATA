import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
// import Home from './pages/Home.jsx';
// import Signing from './pages/Signing'
// import Registration from './pages/registration.jsx'
// import CreateProject from '/pages/CreateProject';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> 
      <App />
      {/* <Home/> */}
      {/* <Signing /> */}
      {/* <Registration/> */}
      {/* <CreateProjectForm /> */}
    </BrowserRouter>
  </StrictMode>,
)