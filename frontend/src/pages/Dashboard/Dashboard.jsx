import { useEffect, useState } from "react";

import {
  Users,
  Briefcase,
  FileText,
  Brain,
} from "lucide-react";

import API from "../../api/api";

import StatCard from "../../components/cards/StatCard";
import SectionTitle from "../../components/common/SectionTitle";
import RecentCandidates from "../../components/tables/RecentCandidates";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
  total_candidates: 0,
  recent_candidates: [],
});

useEffect(() => {
  fetchDashboard();
}, []);

const fetchDashboard = async () => {
  try {
    const response = await API.get("/dashboard");
    setDashboardData(response.data);
  } catch (error) {
    console.error(error);
  }
};
  return (
    <div className="p-2">

      <SectionTitle
        title="Is your resume good enough?"
        subtitle="Here's your recruitment overview today."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatCard
          title="Total Candidates"
          value={dashboardData.total_candidates}
          subtitle="Uploaded resumes"
          icon={<Users />}
          color="bg-gradient-to-r from-indigo-500 to-purple-600"
        />

        <StatCard
          title="Active Jobs"
          value="18"
          subtitle="4 New Openings"
          icon={<Briefcase />}
          color="bg-gradient-to-r from-blue-500 to-cyan-500"
        />

        <StatCard
          title="Resumes Uploaded"
          value={dashboardData.total_candidates}
          subtitle="28 Today"
          icon={<FileText />}
          color="bg-gradient-to-r from-pink-500 to-rose-500"
        />

        <StatCard
          title="AI Match Score"
          value="97%"
          subtitle="Excellent"
          icon={<Brain />}
          color="bg-gradient-to-r from-emerald-500 to-green-600"
        />

      </div>

      <RecentCandidates 
      candidates={dashboardData.recent_candidates}
      />

    </div>
  );
}

export default Dashboard;