import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import JobPostings from "./pages/JobPostings/JobPostings";
import Dashboard from "./pages/Dashboard/Dashboard";
import ResumeUpload from "./pages/ResumeUpload/ResumeUpload";
import Candidates from "./pages/Candidates/Candidates";
import CandidateProfile from "./pages/CandidateProfile/CandidateProfile";
import AIMatching from "./pages/AIMatching/AIMatching";
import Analytics from "./pages/Analytics/Analytics";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Login/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Pages with Sidebar + Navbar */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<ResumeUpload />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/candidate/:id" element={<CandidateProfile />} />
          <Route path="/jobs" element={<JobPostings />} />
          <Route path="/matching" element={<AIMatching />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Login page without layout */}
        <Route path="/login" element={<Login />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
