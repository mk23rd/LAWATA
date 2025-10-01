import { useState } from "react";
import { Routes, Route } from 'react-router-dom';
// Page-level route components import for centralised routing configuration
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
import MyProjectInfo from "./pages/MyProjectInfo";
import Rewards from "./pages/Rewards";
import Support from "./pages/Support";
import Community from "./pages/Community"
import MyInvestments from "./pages/MyInvestments";
import InvestPage from "./pages/InvestPage";
import Wallet from "./pages/Wallet";

function App() {
  // Track whether the splash/loading experience has finished running
  const [loadingComplete, setLoadingComplete] = useState(false);

  /*if (!loadingComplete) {
    // Display the loading component until the asynchronous setup finishes
    return <Loading onComplete={() => setLoadingComplete(true)} />;
  }*/

  return (
    // Centralised route table for the single-page application
    <Routes> 
      {/* Landing and home variants */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      {/* Authentication flows */}
      <Route path="/signing" element={<Signing />} />
      <Route path="/create" element={<CreateProjectForm />} />
      <Route path="/community" element={<Community />} />
      <Route path="/browse" element={<Browse />} />
      {/* Dynamic routes for project-oriented experiences */}
      <Route path="/projectDet/:id" element={<ProjectDetails />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/manage-profile" element={<ManageProfile />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/view-my-projects" element={<ViewMyProjects />} />
      <Route path="/my-project-info/:id" element={<MyProjectInfo />} />
      <Route path="/myInvestments" element={<MyInvestments />} />
      <Route path="/invest/:id" element={<InvestPage />} />
      <Route path="/rewards/:id" element={<Rewards />} />
      <Route path="/support/:id" element={<Support />} />
      {/* Wallet and finance management */}
      <Route path="/wallet" element={<Wallet />} />
    </Routes>
  )
}

export default App