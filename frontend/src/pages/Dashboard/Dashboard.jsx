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

  const [activeJobs, setActiveJobs] = useState(0);
  const [aiMatchScore, setAiMatchScore] = useState(0);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // Existing dashboard data
      const dashboardResponse = await API.get("/dashboard");

      setDashboardData(dashboardResponse.data);

      // Get jobs
      const jobsResponse = await API.get("/jobs");

      const jobs = jobsResponse.data || [];

      setActiveJobs(jobs.length);

      // Get matching scores for all jobs
      if (jobs.length > 0) {
        const matchResponses = await Promise.all(
          jobs.map((job) =>
            API.get(`/jobs/${job._id}/matches`)
          )
        );

        const allScores = matchResponses.flatMap(
          (response) =>
            (response.data.matches || []).map(
              (candidate) => candidate.match_score
            )
        );

        if (allScores.length > 0) {
          const averageScore =
            allScores.reduce(
              (sum, score) => sum + score,
              0
            ) / allScores.length;

          setAiMatchScore(Math.round(averageScore));
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  // AI score description
  const getScoreLabel = () => {
    if (aiMatchScore >= 80) return "Excellent";
    if (aiMatchScore >= 60) return "Good";
    if (aiMatchScore >= 40) return "Average";
    return "Needs Improvement";
  };

  return (
    <div className="p-2">

      <SectionTitle
        title="Is your resume good enough?"
        subtitle="Here's your recruitment overview today."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Total Candidates */}
        <StatCard
          title="Total Candidates"
          value={dashboardData.total_candidates}
          subtitle="Uploaded resumes"
          icon={<Users />}
          color="bg-gradient-to-r from-indigo-500 to-purple-600"
        />

        {/* Active Jobs */}
        <StatCard
          title="Active Jobs"
          value={activeJobs}
          subtitle="Current job openings"
          icon={<Briefcase />}
          color="bg-gradient-to-r from-blue-500 to-cyan-500"
        />

        {/* Resumes Uploaded */}
        <StatCard
          title="Resumes Uploaded"
          value={dashboardData.total_candidates}
          subtitle="Total resumes"
          icon={<FileText />}
          color="bg-gradient-to-r from-pink-500 to-rose-500"
        />

        {/* AI Match Score */}
        <StatCard
          title="AI Match Score"
          value={`${aiMatchScore}%`}
          subtitle={getScoreLabel()}
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