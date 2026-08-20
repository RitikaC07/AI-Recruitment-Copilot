import { useEffect, useState } from "react";
import {
  Sparkles,
  Play,
  MessageSquare,
  Loader2,
  Send,
  Bot,
  User,
} from "lucide-react";
import API from "../../api/api";

function InterviewAssistant() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [jobPosition, setJobPosition] = useState("");
  const [questionType, setQuestionType] = useState("Technical Skills");
  const [candidate, setCandidate] = useState("");

  // Generate Questions section
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // AI Interview section
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);

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

  // Generate questions for the left-side question generator
  const generateQuestions = async () => {
    if (!jobPosition) {
      alert("Please select a job position.");
      return;
    }

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
        }
      );

      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error("Failed to generate questions:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to generate interview questions."
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Start AI interview
  const startInterview = async () => {
    if (!candidate || !jobPosition) {
      alert("Please select a job and candidate first.");
      return;
    }

    try {
      setSendingMessage(true);
      setInterviewStarted(true);
      setInterviewComplete(false);
      setInterviewEnded(false);
      setMessages([]);
      setAnswer("");

      const response = await API.post("/interview/chat", {
        candidate_id: candidate,
        job_id: jobPosition,
        messages: [],
      });

      const aiResponse = response.data?.response;

      if (aiResponse) {
        setMessages([
          {
            sender: "ai",
            text: aiResponse.message || aiResponse.question || "",
          },
        ]);

        if (aiResponse.interview_complete) {
          setInterviewComplete(true);
        }
      }
    } catch (error) {
      console.error("Failed to start interview:", error);

      setInterviewStarted(false);

      alert(
        error.response?.data?.detail ||
          "Failed to start the AI interview."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // Send candidate answer to AI
  const sendAnswer = async () => {
    if (
      !answer.trim() ||
      sendingMessage ||
      interviewComplete ||
      interviewEnded
    ) {
      return;
    }

    const candidateAnswer = answer.trim();

    // Add candidate's message immediately to UI
    const updatedMessages = [
      ...messages,
      {
        sender: "candidate",
        text: candidateAnswer,
      },
    ];

    setMessages(updatedMessages);
    setAnswer("");
    setSendingMessage(true);

    try {
      const response = await API.post("/interview/chat", {
        candidate_id: candidate,
        job_id: jobPosition,

        messages: updatedMessages.map((message) => ({
          sender: message.sender,
          text: message.text,
        })),
      });

      const aiResponse = response.data?.response;

      if (aiResponse) {
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            sender: "ai",
            text: aiResponse.message || aiResponse.question || "",
          },
        ]);

        if (aiResponse.interview_complete) {
          setInterviewComplete(true);
        }
      }
    } catch (error) {
      console.error("Failed to send answer:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to get the AI response."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // End interview
  const endInterview = () => {
    const confirmEnd = window.confirm(
      "Are you sure you want to end this interview?"
    );

    if (!confirmEnd) {
      return;
    }

    setInterviewEnded(true);
    setInterviewComplete(true);
    setAnswer("");
  };

  // Allow Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
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

        {/* ===================================================== */}
        {/* LEFT SIDE - GENERATE QUESTIONS */}
        {/* ===================================================== */}

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

            <label className="block font-medium mb-2">
              Job Position
            </label>

            <select
              value={jobPosition}
              onChange={(e) => {
                setJobPosition(e.target.value);
                setQuestions([]);
                setInterviewStarted(false);
                setMessages([]);
                setInterviewComplete(false);
                setInterviewEnded(false);
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >

              <option value="">
                Select a job position
              </option>

              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}

            </select>

          </div>

          {/* Question Type */}
          <div className="mb-5">

            <label className="block font-medium mb-2">
              Question Type
            </label>

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
                <Loader2
                  size={18}
                  className="animate-spin"
                />
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

            <h3 className="font-semibold mb-3">
              Generated Questions
            </h3>

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

                    <p className="text-gray-700">
                      {question}
                    </p>

                  </div>

                ))}

              </div>

            ) : (

              <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">

                <MessageSquare
                  size={32}
                  className="mx-auto mb-3 text-gray-400"
                />

                <p>
                  Select a job and generate interview questions.
                </p>

              </div>

            )}

          </div>

        </div>


        {/* ===================================================== */}
        {/* RIGHT SIDE - AI CHAT INTERVIEW */}
        {/* ===================================================== */}

        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-7">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">

            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Play size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                AI Interview
              </h2>

              <p className="text-sm text-gray-500">
                Conduct a personalized AI-powered interview.
              </p>
            </div>

          </div>


          {/* Candidate */}
          <div className="mb-5">

            <label className="block font-medium mb-2">
              Candidate
            </label>

            <select
              value={candidate}
              onChange={(e) => {
                setCandidate(e.target.value);
                setInterviewStarted(false);
                setMessages([]);
                setInterviewComplete(false);
                setInterviewEnded(false);
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >

              <option value="">
                Select a candidate
              </option>

              {candidates.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}

            </select>

          </div>


          {/* Start Interview */}
          {!interviewStarted && (

            <button
              onClick={startInterview}
              disabled={
                !candidate ||
                !jobPosition ||
                sendingMessage
              }
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >

              {sendingMessage ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Starting Interview...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start Interview
                </>
              )}

            </button>

          )}


          {/* ================================================= */}
          {/* CHAT WINDOW */}
          {/* ================================================= */}

          {interviewStarted && (

            <div className="mt-5">

              {/* Chat Area */}
              <div className="h-[430px] overflow-y-auto bg-gray-50 rounded-2xl p-4 space-y-4">

                {messages.map((message, index) => (

                  <div
                    key={index}
                    className={`flex ${
                      message.sender === "candidate"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`flex items-start gap-2 max-w-[85%] ${
                        message.sender === "candidate"
                          ? "flex-row-reverse"
                          : ""
                      }`}
                    >

                      {/* Avatar */}
                      <div
                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                          message.sender === "candidate"
                            ? "bg-indigo-600 text-white"
                            : "bg-purple-100 text-purple-600"
                        }`}
                      >

                        {message.sender === "candidate" ? (
                          <User size={18} />
                        ) : (
                          <Bot size={18} />
                        )}

                      </div>


                      {/* Message */}
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          message.sender === "candidate"
                            ? "bg-indigo-600 text-white rounded-tr-sm"
                            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                        }`}
                      >

                        <p className="text-sm leading-relaxed">
                          {message.text}
                        </p>

                      </div>

                    </div>

                  </div>

                ))}


                {/* AI typing indicator */}
                {sendingMessage && (

                  <div className="flex justify-start">

                    <div className="flex items-center gap-2">

                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Bot size={18} />
                      </div>

                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm">

                        <div className="flex gap-1">

                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>

                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></span>

                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></span>

                        </div>

                      </div>

                    </div>

                  </div>

                )}

              </div>


              {/* Interview Completed / Ended */}
              {interviewComplete ? (

                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">

                  <p className="font-semibold text-green-800">
                    {interviewEnded
                      ? "Interview Ended"
                      : "Interview Completed 🎉"}
                  </p>

                  <p className="text-sm text-green-700 mt-1">
                    {interviewEnded
                      ? "The interview was ended by the recruiter."
                      : "The AI interview has been completed successfully."}
                  </p>

                </div>

              ) : (

                /* Answer Box */
                <div>

                  <div className="mt-4 flex gap-2">

                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sendingMessage}
                      placeholder="Type your answer here..."
                      rows={3}
                      className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    />

                    <button
                      onClick={sendAnswer}
                      disabled={
                        !answer.trim() ||
                        sendingMessage
                      }
                      className="self-end w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50"
                    >

                      <Send size={19} />

                    </button>

                  </div>

                  {/* End Interview Button */}
                  <button
                    onClick={endInterview}
                    disabled={sendingMessage}
                    className="w-full mt-3 border border-red-300 text-red-600 px-5 py-3 rounded-xl font-medium hover:bg-red-50 transition disabled:opacity-50"
                  >
                    End Interview
                  </button>

                </div>

              )}

              {!interviewComplete && (

                <p className="text-xs text-gray-400 mt-2">
                  Press Enter to send • Shift + Enter for a new line
                </p>

              )}

            </div>

          )}


          {/* Before interview */}
          {!interviewStarted && (

            <div className="mt-6 bg-indigo-50 rounded-2xl p-5">

              <h3 className="font-semibold text-indigo-900 mb-2">
                AI Interview
              </h3>

              <p className="text-sm text-indigo-800">
                Select a candidate and job position to start a personalized
                AI interview.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default InterviewAssistant;