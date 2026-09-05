import { useEffect, useState } from "react";
import API from "../../api/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/analytics");

      setAnalytics(response.data);
    } catch (err) {
      console.error("Analytics error:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to load analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-gray-500 text-lg">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // -----------------------------
  // Recruitment Pipeline
  // -----------------------------

  const pipelineData = Object.entries(
    analytics.pipeline || {}
  ).map(([status, count]) => ({
    status,
    count,
  }));

  // -----------------------------
  // Top Skills
  // -----------------------------

  const skillsData = analytics.top_skills || [];

  // -----------------------------
  // Interview Analytics
  // -----------------------------

  const interviewData = [
    {
      name: "Passed",
      value: Math.round(
        ((analytics.interview?.pass_rate || 0) / 100) *
          (analytics.interview?.completed_interviews || 0)
      ),
    },
    {
      name: "Not Passed",
      value:
        (analytics.interview?.completed_interviews || 0) -
        Math.round(
          ((analytics.interview?.pass_rate || 0) / 100) *
            (analytics.interview?.completed_interviews || 0)
        ),
    },
  ];

  const PIE_COLORS = ["#22c55e", "#bf4160"];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Analytics
        </h1>

        <p className="text-gray-500 mt-1">
          Recruitment and interview performance overview
        </p>
      </div>

      {/* ========================================= */}
      {/* KPI CARDS */}
      {/* ========================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        {/* Hiring Success Rate */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Hiring Success Rate
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {analytics.hiring_success_rate}%
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
              ✓
            </div>

          </div>
        </div>

        {/* Average Time To Hire */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Avg. Time to Hire
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {analytics.avg_time_to_hire}
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                days
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
              ⏱
            </div>

          </div>
        </div>

        {/* Total Hired */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Total Hired
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {analytics.total_hired}
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                candidates
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
              👥
            </div>

          </div>
        </div>

        {/* Average Interview Score */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Avg. Interview Score
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {analytics.interview?.average_score || 0}
                <span className="text-lg text-gray-400">
                  /10
                </span>
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-2xl">
              ★
            </div>

          </div>
        </div>

      </div>

      {/* ========================================= */}
      {/* RECRUITMENT PIPELINE */}
      {/* ========================================= */}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Recruitment Pipeline
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Candidate distribution across recruitment stages
          </p>
        </div>

        <div className="w-full h-[350px]">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={pipelineData}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 50,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="status"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={80}
                tick={{ fontSize: 12 }}
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip />

              <Bar
                dataKey="count"
                name="Candidates"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* ========================================= */}
      {/* LOWER SECTION */}
      {/* ========================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* ======================================= */}
        {/* TOP SKILLS */}
        {/* ======================================= */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Top Candidate Skills
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Most frequently detected skills
            </p>
          </div>

          {skillsData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No skill data available
            </div>
          ) : (
            <div className="w-full h-[380px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={skillsData}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 30,
                    left: 30,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="skill"
                    width={100}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    name="Candidates"
                    radius={[0, 6, 6, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>
          )}

        </div>

        {/* ======================================= */}
        {/* INTERVIEW ANALYTICS */}
        {/* ======================================= */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Interview Analytics
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Interview performance overview
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Completed Interviews
              </p>

              <p className="text-2xl font-bold text-gray-800 mt-1">
                {analytics.interview?.completed_interviews || 0}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Pass Rate
              </p>

              <p className="text-2xl font-bold text-gray-800 mt-1">
                {analytics.interview?.pass_rate || 0}%
              </p>
            </div>

          </div>

          <div className="h-[230px]">

            {analytics.interview?.completed_interviews > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={interviewData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >

                    {interviewData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index]}
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>
              </ResponsiveContainer>

            ) : (

              <div className="h-full flex items-center justify-center text-gray-400">
                No completed interviews yet
              </div>

            )}

          </div>

        </div>

      </div>

      {/* ========================================= */}
      {/* PIPELINE SUMMARY */}
      {/* ========================================= */}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-800">
            Pipeline Summary
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Current candidate count by recruitment stage
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">

          {pipelineData.map((item) => (

            <div
              key={item.status}
              className="border border-gray-100 rounded-xl p-4 text-center bg-gray-50"
            >

              <p className="text-xs text-gray-500 min-h-[32px] flex items-center justify-center">
                {item.status}
              </p>

              <p className="text-2xl font-bold text-gray-800 mt-2">
                {item.count}
              </p>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

export default Analytics;