import './App.css'
import { Routes, Route } from 'react-router-dom';
import Registration from "./pages/registration"
import Home from "./pages/home"

function App() {
  return (
    <Routes>
      <Route path="/*" element={<Registration />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  )
}

export default App