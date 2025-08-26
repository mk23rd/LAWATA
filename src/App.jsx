import './App.css'
import { Routes, Route } from 'react-router-dom';
import Registration from "./pages/registration"
import Home from './pages/Home';
import CreateProject from './pages/CreateProject';

function App() {
  return (
    <Routes>
      <Route path="/*" element={<Registration />} />
      <Route path="/home" element={<Home />} />
      <Route path="/create" element={<CreateProject />} />
    </Routes>
  )
}

export default App