import { useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import API from "../../api/api";
import SectionTitle from "../../components/Common/SectionTitle";

function AIMatching() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [selectedJob, setSelectedJob] = useState("");

  const [analyses, setAnalyses] = useState({});
  const [loadingCandidate, setLoadingCandidate] = useState(null);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // --------------------------------
  // Fetch Jobs
  // --------------------------------

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);

      const response = await API.get("/jobs");

      setJobs(response.data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  // --------------------------------
  // Fetch Candidates
  // --------------------------------

  const fetchCandidates = async () => {
    try {
      setLoadingCandidates(true);

      const response = await API.get("/candidates");

      setCandidates(response.data);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // --------------------------------
  // Initial Load
  // --------------------------------

  useEffect(() => {
    fetchJobs();
    fetchCandidates();
  }, []);

  // --------------------------------
  // Job Selection
  // --------------------------------

  const handleJobChange = async (e) => {
  const jobId = e.target.value;

  setSelectedJob(jobId);
  setAnalyses({});

  if (!jobId) {
    fetchCandidates();
    return;
  }

  try {
    setLoadingCandidates(true);

    const response = await API.get(
      `/jobs/${jobId}/matches`
    );

    // Backend already sorts by match_score
    const matchedCandidates = response.data.matches.map(
      (candidate) => ({
        ...candidate,
        _id: candidate.candidate_id,
      })
    );

    setCandidates(matchedCandidates);

  } catch (error) {
    console.error(
      "Failed to fetch matching candidates:",
      error
    );

    setCandidates([]);
  } finally {
    setLoadingCandidates(false);
  }
};

  // --------------------------------
  // Analyze Candidate
  // --------------------------------

  const analyzeCandidate = async (candidateId) => {
    if (!selectedJob) {
      return;
    }

    try {
      setLoadingCandidate(candidateId);

      const response = await API.post(
        `/jobs/${selectedJob}/candidates/${candidateId}/skill-gap`,
      );

      setAnalyses((prev) => ({
        ...prev,
        [candidateId]: response.data.analysis,
      }));
    } catch (error) {
      console.error("Skill gap analysis failed:", error);

      alert(error.response?.data?.detail || "Failed to analyze candidate.");
    } finally {
      setLoadingCandidate(null);
    }
  };

  // --------------------------------
  // Get Selected Job
  // --------------------------------

  const selectedJobData = jobs.find((job) => job._id === selectedJob);

  return (
    <div className="p-2 space-y-8">
      <SectionTitle
        title="AI Candidate Matching"
        subtitle="Analyze candidate suitability and identify skill gaps using AI."
      />

      {/* =========================
          JOB SELECTION
      ========================== */}

      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Search className="text-indigo-600" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Select Job</h2>

            <p className="text-gray-500 text-sm">
              Choose a job posting to evaluate candidates.
            </p>
          </div>
        </div>

        <select
          value={selectedJob}
          onChange={handleJobChange}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a job posting</option>

          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.title}
            </option>
          ))}
        </select>
      </div>

      {/* =========================
          JOB DESCRIPTION
      ========================== */}

      {selectedJobData && (
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-3">Job Description</h2>

          <p className="text-gray-600 leading-relaxed">
            {selectedJobData.description}
          </p>
        </div>
      )}

      {/* =========================
          CANDIDATES
      ========================== */}

      {selectedJob && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Sparkles className="text-indigo-600" />

            <h2 className="text-2xl font-semibold">Candidates</h2>
          </div>

          {loadingCandidates ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-md">
              <Loader2 className="animate-spin mx-auto text-indigo-600" />

              <p className="text-gray-500 mt-3">Loading candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-md">
              <p className="text-gray-500">No candidates available.</p>
            </div>
          ) : (
            candidates.map((candidate, index) => {
              const analysis = analyses[candidate._id];

              const isAnalyzing = loadingCandidate === candidate._id;

              return (
                <div
                  key={candidate._id}
                  className="bg-white rounded-3xl shadow-md border border-gray-100 p-6"
                >
                  {/* Candidate Header */}

                  <div className="flex justify-between items-start gap-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold">
                          {candidate.name}
                        </h3>

                        <p className="text-gray-500 text-sm">
                          {candidate.email}
                        </p>

                        {candidate.phone && (
                          <p className="text-gray-400 text-sm">
                            {candidate.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Analyze Button */}

                    <button
                      onClick={() => analyzeCandidate(candidate._id)}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-60"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Analyze
                        </>
                      )}
                    </button>
                  </div>
                  {/* Overall Match Score */}

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Overall Match</p>

                    <p className="text-4xl font-bold text-indigo-600 mt-1">
                      {Math.round(candidate.match_score)}%
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      {candidate.recommendation}
                    </p>
                  </div>

                  {/* Candidate Skills */}

                  <div className="mt-5">
                    <h4 className="font-semibold mb-3">Candidate Skills</h4>

                    <div className="flex flex-wrap gap-2">
                      {(candidate.skills || []).map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* =========================
                      AI ANALYSIS
                  ========================== */}

                  {analysis && (
                    <div className="mt-7 border-t pt-6">
                      <div className="flex items-center gap-2 mb-5">
                        <Sparkles size={20} className="text-indigo-600" />

                        <h3 className="text-xl font-semibold">AI Analysis</h3>
                      </div>

                      {/* Overall Assessment */}

                      {analysis.overall_assessment && (
                        <div className="bg-indigo-50 rounded-2xl p-5 mb-5">
                          <h4 className="font-semibold text-indigo-900 mb-2">
                            Overall Suitability
                          </h4>

                          <p className="text-gray-700">
                            {analysis.overall_assessment}
                          </p>
                        </div>
                      )}

                      {/* Matched + Missing */}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Matched Skills */}

                        <div className="bg-green-50 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle size={20} className="text-green-600" />

                            <h4 className="font-semibold text-green-800">
                              Matched Skills
                            </h4>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(analysis.matched_skills || []).length > 0 ? (
                              analysis.matched_skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm"
                                >
                                  ✓ {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-gray-500 text-sm">
                                No matching skills found.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Missing Skills */}

                        <div className="bg-red-50 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <XCircle size={20} className="text-red-600" />

                            <h4 className="font-semibold text-red-800">
                              Missing Skills
                            </h4>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(analysis.missing_skills || []).length > 0 ? (
                              analysis.missing_skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm"
                                >
                                  ✗ {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-green-600 text-sm">
                                No major skill gaps.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Related Skills */}

                      {analysis.related_skills && (
                        <div className="mt-5 bg-yellow-50 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle
                              size={20}
                              className="text-yellow-600"
                            />

                            <h4 className="font-semibold text-yellow-800">
                              Related Skills
                            </h4>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {analysis.related_skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience Gap */}

                      {analysis.experience_gap && (
                        <div className="mt-5 bg-gray-50 rounded-2xl p-5">
                          <h4 className="font-semibold mb-2">Experience Gap</h4>

                          <p className="text-gray-600">
                            {analysis.experience_gap}
                          </p>
                        </div>
                      )}

                      {/* Skill Gap Summary */}

                      {analysis.skill_gap_summary && (
                        <div className="mt-5">
                          <h4 className="font-semibold mb-2">
                            Skill Gap Summary
                          </h4>

                          <p className="text-gray-600 leading-relaxed">
                            {analysis.skill_gap_summary}
                          </p>
                        </div>
                      )}

                      {/* Recommendations */}

                      {analysis.recommendations && (
                        <div className="mt-5 bg-purple-50 rounded-2xl p-5">
                          <h4 className="font-semibold text-purple-900 mb-3">
                            Recommendations
                          </h4>

                          <ul className="space-y-2">
                            {analysis.recommendations.map(
                              (recommendation, index) => (
                                <li
                                  key={index}
                                  className="text-gray-700 flex gap-2"
                                >
                                  <span className="text-purple-600 font-bold">
                                    •
                                  </span>

                                  {recommendation}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default AIMatching;
