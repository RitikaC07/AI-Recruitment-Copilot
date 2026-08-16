import { useEffect, useState } from "react";
import { Sparkles, Play, MessageSquare, Loader2 } from "lucide-react";
import API from "../../api/api";

function InterviewAssistant() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [jobPosition, setJobPosition] = useState("");
  const [questionType, setQuestionType] = useState("Technical Skills");
  const [candidate, setCandidate] = useState("");

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");

  // Fetch jobs and candidates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsResponse, candidatesResponse] = await Promise.all([
          API.get("/jobs"),
          API.get("/candidates"),
        ]);

        setJobs(jobsResponse.data);
        setCandidates(candidatesResponse.data);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    fetchData();
  }, []);

  // Generate interview questions
  const generateQuestions = async () => {
    if (!jobPosition) return;

    try {
      setLoadingQuestions(true);
      setQuestions([]);

      const response = await API.post(
        `/jobs/${jobPosition}/interview-questions`,
        null,
        {
          params: {
            question_type: questionType,
          },
        },
      );

      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error("Failed to generate questions:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to generate interview questions.",
      );
    } finally {
      setLoadingQuestions(false);
    }
  };
  const startInterview = () => {
    if (!candidate || !jobPosition || questions.length === 0) {
      alert("Please select a job, candidate, and generate questions first.");
      return;
    }

    setCurrentQuestion(0);
    setAnswer("");
    setInterviewStarted(true);
  };

  return (
    <div className="p-2 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Interview Assistant
        </h1>

        <p className="text-gray-500 mt-2">
          Generate personalized interview questions and conduct AI-powered
          interviews.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Generate Questions */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Generate Interview Questions
              </h2>

              <p className="text-sm text-gray-500">
                Create questions based on the job requirements.
              </p>
            </div>
          </div>

          {/* Job Position */}
          <div className="mb-5">
            <label className="block font-medium mb-2">Job Position</label>

            <select
              value={jobPosition}
              onChange={(e) => {
                setJobPosition(e.target.value);
                setQuestions([]);
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a job position</option>

              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type */}
          <div className="mb-5">
            <label className="block font-medium mb-2">Question Type</label>

            <select
              value={questionType}
              onChange={(e) => {
                setQuestionType(e.target.value);
                setQuestions([]);
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Technical Skills</option>
              <option>Behavioral</option>
              <option>General</option>
              <option>Resume Based</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateQuestions}
            disabled={!jobPosition || loadingQuestions}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
          >
            {loadingQuestions ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Questions
              </>
            )}
          </button>

          {/* Generated Questions */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Generated Questions</h3>

            {questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className="flex gap-3 bg-indigo-50 rounded-xl p-4"
                  >
                    <div className="w-7 h-7 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>

                    <p className="text-gray-700">{question}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
                <MessageSquare
                  size={32}
                  className="mx-auto mb-3 text-gray-400"
                />

                <p>Select a job and generate interview questions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Start Interview */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Play size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">Start Interview</h2>

              <p className="text-sm text-gray-500">
                Select a candidate to begin the AI interview.
              </p>
            </div>
          </div>

          {/* Candidate */}
          <div className="mb-5">
            <label className="block font-medium mb-2">Candidate</label>

            <select
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a candidate</option>

              {candidates.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={startInterview}
            disabled={!candidate || !jobPosition || questions.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Play size={18} />
            Start Interview
          </button>

          {interviewStarted ? (
            <div className="mt-6">
              <div className="bg-indigo-50 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-indigo-900">
                    AI Interview
                  </h3>

                  <span className="text-sm text-indigo-700">
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                </div>

                <p className="text-lg font-medium text-gray-800">
                  {questions[currentQuestion]}
                </p>
              </div>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows="6"
                className="w-full mt-4 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                onClick={() => {
                  if (!answer.trim()) {
                    alert("Please enter an answer.");
                    return;
                  }

                  if (currentQuestion < questions.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                    setAnswer("");
                  } else {
                    alert("Interview completed!");
                  }
                }}
                className="w-full mt-4 bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
              >
                {currentQuestion < questions.length - 1
                  ? "Submit Answer"
                  : "Finish Interview"}
              </button>
            </div>
          ) : (
            <div className="mt-6 bg-indigo-50 rounded-2xl p-5">
              <h3 className="font-semibold text-indigo-900 mb-2">
                AI Interview
              </h3>

              <p className="text-sm text-indigo-800">
                Generate questions and select a candidate to start the
                interview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewAssistant;
