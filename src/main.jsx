import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
// Global styles for the entire application
import './index.css'
// Root component containing all route registrations
import App from './App.jsx'
// Authentication context provider to expose user state throughout the tree
import { AuthProvider } from './context/AuthContext.jsx';
// import Home from './pages/Home.jsx';
// import Signing from './pages/Signing'
// import Registration from './pages/registration.jsx'
// import CreateProject from '/pages/CreateProject';


// Bootstrap the React application by rendering into the host DOM node
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* React Router wraps the app to enable client-side navigation */}
    <BrowserRouter>
      {/* Provide authentication state and helpers to descendants */}
      <AuthProvider>
        <App />
      {/* <Home/> */}
      {/* <Signing /> */}
      {/* <Registration/> */}
      {/* <CreateProjectForm /> */}
      </AuthProvider> 
    </BrowserRouter>
  </StrictMode>,
)