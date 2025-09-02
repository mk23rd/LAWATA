import './App.css'
import { Routes, Route } from 'react-router-dom';
import Registration from "./pages/registration"
import Home from './pages/Home';
import CreateProject from './pages/CreateProject';
import Browse from "./pages/Browse"
import ProjectDetails from "./pages/ProjectDetails"

function App() {
  return (
    <Routes>
      <Route path="/*" element={<Registration />} />
      <Route path="/home" element={<Home />} />
      <Route path="/create" element={<CreateProject />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/project/:id" element={<ProjectDetails />} />
    </Routes>
  )
}

export default App