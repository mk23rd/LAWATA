import { useState } from "react";
import { Routes, Route } from 'react-router-dom';
import Registration from "./pages/registration"
import Loading from "./pages/Loading";
import Home from './pages/Home';
import CreateProjectForm from "./pages/CreateProjectForm"
import Browse from "./pages/Browse"
import ProjectDetails from "./pages/ProjectDetails"
import Signing from "./pages/Signing";
import Profile from "./pages/Profile";
import ManageProfile from "./pages/ManageProfile";
import Projects from "./pages/Projects";
import ViewMyProjects from "./pages/ViewMyProjects";
import Rewards from "./pages/Rewards";
import Support from "./pages/Support";

function App() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  /*if (!loadingComplete) {
    return <Loading onComplete={() => setLoadingComplete(true)} />;
  }*/

  return (
    <Routes>
      
      <Route path="/*" element={<Signing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/create" element={<CreateProjectForm />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/projectDet/:id" element={<ProjectDetails />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/manage-profile" element={<ManageProfile />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/view-my-projects" element={<ViewMyProjects />} />
      <Route path="/rewards/:id" element={<Rewards />} />
      <Route path="/support/:id" element={<Support />} />
    </Routes>
  )
}

export default App