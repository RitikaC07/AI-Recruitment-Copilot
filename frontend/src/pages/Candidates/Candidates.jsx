import { useEffect, useState } from "react";
import {
  Search,
  Mail,
  Phone,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";

import API from "../../api/api";
import SectionTitle from "../../components/Common/SectionTitle";

function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ---------------------------------------
  // Fetch candidates
  // ---------------------------------------

  const fetchCandidates = async () => {
    try {
      setLoading(true);

      const response = await API.get("/candidates");

      setCandidates(response.data);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // ---------------------------------------
  // Search
  // ---------------------------------------

  const filteredCandidates = candidates.filter((candidate) => {
    const searchText = search.toLowerCase();

    return (
      candidate.name?.toLowerCase().includes(searchText) ||
      candidate.email?.toLowerCase().includes(searchText) ||
      candidate.skills?.some((skill) =>
        skill.toLowerCase().includes(searchText)
      )
    );
  });

  // ---------------------------------------
  // Update recruitment status
  // ---------------------------------------

  const updateCandidateStatus = async (
    candidateId,
    newStatus
  ) => {
    try {
      // Optimistic UI update
      setCandidates((prevCandidates) =>
        prevCandidates.map((candidate) =>
          candidate._id === candidateId
            ? {
                ...candidate,
                status: newStatus,
              }
            : candidate
        )
      );

      await API.patch(
        `/candidates/${candidateId}/status`,
        {
          status: newStatus,
        }
      );

    } catch (error) {
      console.error(
        "Failed to update candidate status:",
        error
      );

      // Reload original data if update fails
      fetchCandidates();

      alert(
        error.response?.data?.detail ||
          "Failed to update candidate status"
      );
    }
  };

  // ---------------------------------------
  // Recruitment status configuration
  // ---------------------------------------

  const getRecruitmentStatus = (status) => {
    switch (status) {
      case "Applied":
        return {
          className: "bg-blue-100 text-blue-700",
          icon: <Clock size={15} />,
        };

      case "Screened":
        return {
          className: "bg-indigo-100 text-indigo-700",
          icon: <CheckCircle size={15} />,
        };

      case "Interviewed":
        return {
          className: "bg-purple-100 text-purple-700",
          icon: <CheckCircle size={15} />,
        };

      case "Shortlisted":
        return {
          className: "bg-green-100 text-green-700",
          icon: <CheckCircle size={15} />,
        };

      case "Further Review":
        return {
          className: "bg-yellow-100 text-yellow-700",
          icon: <AlertCircle size={15} />,
        };

      case "Hired":
        return {
          className: "bg-emerald-100 text-emerald-700",
          icon: <CheckCircle size={15} />,
        };

      case "Rejected":
        return {
          className: "bg-red-100 text-red-700",
          icon: <XCircle size={15} />,
        };

      default:
        return {
          className: "bg-gray-100 text-gray-600",
          icon: <Clock size={15} />,
        };
    }
  };

  // ---------------------------------------
  // Interview status configuration
  // ---------------------------------------

  const getInterviewStatus = (candidate) => {
    const status =
      candidate.interview_status?.toLowerCase() ||
      "not started";

    if (status === "active") {
      return {
        label: "Active",
        className: "bg-blue-100 text-blue-700",
        icon: <Clock size={15} />,
      };
    }

    if (status === "selected") {
      return {
        label: "Selected",
        className: "bg-green-100 text-green-700",
        icon: <CheckCircle size={15} />,
      };
    }

    if (status === "rejected") {
      return {
        label: "Rejected",
        className: "bg-red-100 text-red-700",
        icon: <XCircle size={15} />,
      };
    }

    if (
      status === "further review" ||
      status === "further_review" ||
      status === "review"
    ) {
      return {
        label: "Further Review",
        className: "bg-yellow-100 text-yellow-700",
        icon: <AlertCircle size={15} />,
      };
    }

    if (status === "completed") {
      return {
        label: "Completed",
        className: "bg-purple-100 text-purple-700",
        icon: <CheckCircle size={15} />,
      };
    }

    return {
      label: "Not Started",
      className: "bg-gray-100 text-gray-600",
      icon: <Clock size={15} />,
    };
  };

  // ---------------------------------------
  // Status options
  // ---------------------------------------

  const statusOptions = [
    "Applied",
    "Screened",
    "Interviewed",
    "Shortlisted",
    "Further Review",
    "Hired",
    "Rejected",
  ];

  return (
    <div className="p-2 space-y-8">

      {/* Header */}

      <SectionTitle
        title="Candidates"
        subtitle="View and manage all candidates extracted from uploaded resumes."
      />

      {/* Search */}

      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">

        <div className="relative">

          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search candidates by name, email or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />

        </div>

      </div>

      {/* Loading */}

      {loading && (
        <div className="bg-white rounded-3xl shadow-md p-10 text-center">

          <p className="text-gray-500">
            Loading candidates...
          </p>

        </div>
      )}

      {/* No candidates */}

      {!loading && filteredCandidates.length === 0 && (
        <div className="bg-white rounded-3xl shadow-md p-10 text-center">

          <p className="text-gray-500">
            No candidates found.
          </p>

        </div>
      )}

      {/* Candidates */}

      {!loading && filteredCandidates.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {filteredCandidates.map((candidate) => {

            const interviewStatus =
              getInterviewStatus(candidate);

            const recruitmentStatus =
              candidate.status || "Applied";

            const statusStyle =
              getRecruitmentStatus(
                recruitmentStatus
              );

            return (
              <div
                key={candidate._id}
                className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition"
              >

                {/* Header */}

                <div className="flex items-start gap-4">

                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold">
                    {candidate.name
                      ?.charAt(0)
                      ?.toUpperCase() || "?"}
                  </div>

                  <div className="flex-1">

                    <h2 className="text-xl font-semibold text-gray-900">
                      {candidate.name ||
                        "Name not available"}
                    </h2>

                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">

                      <Mail size={15} />

                      {candidate.email ||
                        "Email not available"}

                    </div>

                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">

                      <Phone size={15} />

                      {candidate.phone ||
                        "Phone not available"}

                    </div>

                  </div>

                </div>

                {/* ================================= */}
                {/* RECRUITMENT STATUS */}
                {/* ================================= */}

                <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="text-sm text-gray-500">
                        Recruitment Status
                      </p>

                      <div
                        className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusStyle.className}`}
                      >

                        {statusStyle.icon}

                        {recruitmentStatus}

                      </div>

                    </div>

                    {/* Status Dropdown */}

                    <div className="relative">

                      <select
                        value={recruitmentStatus}
                        onChange={(e) =>
                          updateCandidateStatus(
                            candidate._id,
                            e.target.value
                          )
                        }
                        className="appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >

                        {statusOptions.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          )
                        )}

                      </select>

                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />

                    </div>

                  </div>

                </div>

                {/* ================================= */}
                {/* INTERVIEW STATUS */}
                {/* ================================= */}

                <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500">
                        Interview Status
                      </p>

                      <div
                        className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full text-sm font-medium ${interviewStatus.className}`}
                      >

                        {interviewStatus.icon}

                        {interviewStatus.label}

                      </div>

                    </div>

                    {/* Score */}

                    {candidate.interview_score !==
                      undefined &&
                      candidate.interview_score !==
                        null && (

                        <div className="text-right">

                          <p className="text-sm text-gray-500">
                            Interview Score
                          </p>

                          <p className="text-2xl font-bold text-indigo-600 mt-1">

                            {candidate.interview_score}

                            <span className="text-sm text-gray-400">
                              /10
                            </span>

                          </p>

                        </div>

                      )}

                  </div>

                  {/* Recommendation */}

                  {candidate.interview_recommendation && (

                    <div className="mt-4 pt-3 border-t border-gray-200">

                      <p className="text-sm text-gray-500">
                        AI Recommendation
                      </p>

                      <p className="font-medium text-gray-800 mt-1">
                        {candidate.interview_recommendation}
                      </p>

                    </div>

                  )}

                </div>

                {/* Experience */}

                <div className="mt-6 flex items-center gap-3">

                  <Briefcase
                    size={20}
                    className="text-indigo-600"
                  />

                  <div>

                    <p className="text-sm text-gray-500">
                      Experience
                    </p>

                    <p className="font-medium">

                      {candidate.experience?.length >
                      0
                        ? `${candidate.experience.length} experience entries`
                        : "No experience listed"}

                    </p>

                  </div>

                </div>

                {/* Skills */}

                <div className="mt-6">

                  <h3 className="font-semibold mb-3">
                    Skills
                  </h3>

                  <div className="flex flex-wrap gap-2">

                    {candidate.skills?.length > 0 ? (

                      candidate.skills.map(
                        (skill) => (

                          <span
                            key={skill}
                            className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm"
                          >
                            {skill}
                          </span>

                        )
                      )

                    ) : (

                      <p className="text-gray-400 text-sm">
                        No skills extracted
                      </p>

                    )}

                  </div>

                </div>

                {/* Education */}

                {candidate.education && (

                  <div className="mt-6 pt-5 border-t">

                    <h3 className="font-semibold mb-3">
                      Education
                    </h3>

                    <p className="text-gray-700">

                      {candidate.education.degree ||
                        "Degree not available"}

                    </p>

                    <p className="text-sm text-gray-500 mt-1">

                      {candidate.education.college ||
                        "College not available"}

                    </p>

                    {candidate.education.cgpa && (

                      <p className="text-sm text-gray-500 mt-1">

                        CGPA:{" "}
                        {candidate.education.cgpa}

                      </p>

                    )}

                  </div>

                )}

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default Candidates;