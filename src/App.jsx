import { useState } from "react";
import { Routes, Route } from 'react-router-dom';
import Registration from "./pages/registration"
import Loading from "./pages/Loading";
import Home from './pages/Home';
import CreateProject from "./pages/CreateProject"
import Browse from "./pages/Browse"
import ProjectDetails from "./pages/ProjectDetails"
import Signing from "./pages/Signing";

function App() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  if (!loadingComplete) {
    return <Loading onComplete={() => setLoadingComplete(true)} />;
  }

  return (
    <Routes>
      <Route path="/*" element={<Signing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/create" element={<CreateProject />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/project/:id" element={<ProjectDetails />} />
    </Routes>
  )
}

export default App