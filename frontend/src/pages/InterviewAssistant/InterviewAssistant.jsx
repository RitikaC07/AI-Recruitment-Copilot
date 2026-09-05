import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Play,
  MessageSquare,
  Loader2,
  Send,
  Bot,
  User,
  Mic,
  MicOff,
} from "lucide-react";
import API from "../../api/api";

const InterviewAssistant = () => {
  // ---------------------------------------------------------
  // Jobs / Candidates
  // ---------------------------------------------------------

  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [jobPosition, setJobPosition] = useState("");
  const [questionType, setQuestionType] = useState("Technical Skills");
  const [candidate, setCandidate] = useState("");

  // ---------------------------------------------------------
  // Question Generation
  // ---------------------------------------------------------

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // ---------------------------------------------------------
  // Interview
  // ---------------------------------------------------------

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);

  // ---------------------------------------------------------
  // Evaluation
  // ---------------------------------------------------------

  const [evaluation, setEvaluation] = useState(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState(false);

  // ---------------------------------------------------------
  // Voice / Speech Recognition
  // ---------------------------------------------------------

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef(null);

  // Stores the text that existed before voice input started
  const baseAnswerRef = useRef("");

  // Stores the final recognized speech
  const finalTranscriptRef = useRef("");

  // ---------------------------------------------------------
  // Load Jobs and Candidates
  // ---------------------------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsResponse, candidatesResponse] = await Promise.all([
          API.get("/jobs"),
          API.get("/candidates"),
        ]);

        setJobs(jobsResponse.data || []);
        setCandidates(candidatesResponse.data || []);
      } catch (error) {
        console.error("Error fetching jobs/candidates:", error);
      }
    };

    fetchData();
  }, []);

  // ---------------------------------------------------------
  // Setup Speech Recognition
  // ---------------------------------------------------------

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);

    const recognition = new SpeechRecognition();

    // Continue listening while the candidate speaks
    recognition.continuous = true;

    // Show partial speech while speaking
    recognition.interimResults = true;

    // English language
    recognition.lang = "en-US";

    // -------------------------------------------------------
    // Speech result
    // -------------------------------------------------------

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      const combinedText =
        baseAnswerRef.current + finalTranscriptRef.current + interimTranscript;

      setAnswer(combinedText);
    };

    // -------------------------------------------------------
    // Recognition started
    // -------------------------------------------------------

    recognition.onstart = () => {
      setIsListening(true);
    };

    // -------------------------------------------------------
    // Recognition stopped
    // -------------------------------------------------------

    recognition.onend = () => {
      setIsListening(false);
    };

    // -------------------------------------------------------
    // Recognition error
    // -------------------------------------------------------

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      setIsListening(false);

      if (event.error === "not-allowed") {
        alert(
          "Microphone permission was denied. Please allow microphone access in your browser.",
        );
      } else if (event.error === "audio-capture") {
        alert(
          "No microphone was detected. Please connect or enable a microphone.",
        );
      }
    };

    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      try {
        recognition.stop();
      } catch (error) {
        console.log("Speech recognition cleanup:", error);
      }
    };
  }, []);

  // ---------------------------------------------------------
  // Start Voice Input
  // ---------------------------------------------------------

  const startListening = () => {
    if (!speechSupported) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
      );
      return;
    }

    if (!recognitionRef.current) {
      return;
    }

    if (
      sendingMessage ||
      evaluatingInterview ||
      interviewComplete ||
      interviewEnded
    ) {
      return;
    }

    // Save existing answer so voice input gets appended
    baseAnswerRef.current = answer
      ? `${answer.trim()}${answer.trim() ? " " : ""}`
      : "";

    // Clear previous voice transcript
    finalTranscriptRef.current = "";

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Could not start speech recognition:", error);
    }
  };

  // ---------------------------------------------------------
  // Stop Voice Input
  // ---------------------------------------------------------

  const stopListening = () => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error("Could not stop speech recognition:", error);
    }

    setIsListening(false);
  };

  // ---------------------------------------------------------
  // Generate Interview Questions
  // ---------------------------------------------------------

  const generateQuestions = async () => {
    if (!jobPosition) {
      alert("Please select a job.");
      return;
    }

    try {
      setLoadingQuestions(true);

      const response = await API.post(
        `/jobs/${jobPosition}/interview-questions`,
        {},
        {
          params: {
            question_type: questionType,
          },
        },
      );

      setQuestions(response.data?.questions || []);
    } catch (error) {
      console.error("Error generating questions:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to generate interview questions.",
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  // ---------------------------------------------------------
  // Evaluate Interview
  // ---------------------------------------------------------

  const evaluateCurrentInterview = async (
  conversationMessages = messages
) => {
  if (
    !candidate ||
    !jobPosition ||
    conversationMessages.length === 0
  ) {
    return;
  }

  try {
    setEvaluatingInterview(true);

    // Convert React format to FastAPI format
    const apiMessages = conversationMessages.map(
      (message) => ({
        sender:
          message.role === "assistant"
            ? "ai"
            : "candidate",
        text: message.content,
      })
    );

    console.log(
      "Sending evaluation to backend:",
      apiMessages
    );

    const response = await API.post(
      "/interview/evaluate",
      {
        candidate_id: candidate,
        job_id: jobPosition,
        messages: apiMessages,
      }
    );

    const evaluationData = response.data?.evaluation || response.data;

console.log("FINAL EVALUATION:", evaluationData);

setEvaluation(evaluationData);

    setInterviewComplete(true);
    setInterviewEnded(true);

    // Refresh candidates
    try {
      const candidatesResponse =
        await API.get("/candidates");

      setCandidates(
        candidatesResponse.data || []
      );

    } catch (refreshError) {
      console.error(
        "Error refreshing candidates:",
        refreshError
      );
    }

  } catch (error) {
    console.error(
      "Error evaluating interview:",
      error
    );

    const detail =
      error.response?.data?.detail;

    alert(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map(
                (item) =>
                  item.msg ||
                  JSON.stringify(item)
              )
              .join("\n")
          : detail
            ? JSON.stringify(detail)
            : "Failed to evaluate the interview."
    );

  } finally {
    setEvaluatingInterview(false);
  }
};

  // ---------------------------------------------------------
  // Start Interview
  // ---------------------------------------------------------

  const startInterview = async () => {
    if (!candidate) {
      alert("Please select a candidate.");
      return;
    }

    if (!jobPosition) {
      alert("Please select a job.");
      return;
    }

    // Stop microphone if it is running
    stopListening();

    try {
      setInterviewStarted(true);
      setInterviewComplete(false);
      setInterviewEnded(false);
      setEvaluation(null);
      setMessages([]);
      setAnswer("");

      const response = await API.post("/interview/chat", {
        candidate_id: candidate,
        job_id: jobPosition,
        messages: [],
      });

      // IMPORTANT:
      // Backend response is:
      // response.data.response
      const interviewData = response.data?.response || response.data;

      // Create messages BEFORE using initialMessages
      const initialMessages = [];

      // 1. Add greeting message
      if (interviewData?.message) {
        initialMessages.push({
          role: "assistant",
          content: interviewData.message,
        });
      }

      // 2. Add first interview question
      if (interviewData?.question) {
        initialMessages.push({
          role: "assistant",
          content: interviewData.question,
        });
      }

      // Now update the UI
      setMessages(initialMessages);

      // If interview is already complete
      if (interviewData?.interview_complete) {
        await evaluateCurrentInterview(initialMessages);
      }
    } catch (error) {
      console.error("Error starting interview:", error);

      setInterviewStarted(false);

      alert(error.response?.data?.detail || "Failed to start interview.");
    }
  };

  // ---------------------------------------------------------
  // Send Answer
  // ---------------------------------------------------------

  const sendAnswer = async () => {
  if (!answer.trim()) {
    return;
  }

  if (!interviewStarted || interviewComplete || interviewEnded) {
    return;
  }

  stopListening();

  const candidateMessage = {
    role: "user",
    content: answer.trim(),
  };

  // Messages used by React UI
  const updatedMessages = [
    ...messages,
    candidateMessage,
  ];

  setMessages(updatedMessages);
  setAnswer("");
  setSendingMessage(true);

  try {
    // Convert React format to FastAPI format
    const apiMessages = updatedMessages.map((message) => ({
      sender:
        message.role === "assistant"
          ? "ai"
          : "candidate",
      text: message.content,
    }));

    console.log("Sending to backend:", apiMessages);

    const response = await API.post("/interview/chat", {
      candidate_id: candidate,
      job_id: jobPosition,
      messages: apiMessages,
    });

    const interviewData =
      response.data?.response || response.data;

    // Add AI acknowledgement
    const aiMessages = [];

    if (interviewData?.message) {
      aiMessages.push({
        role: "assistant",
        content: interviewData.message,
      });
    }

    // Add next question
    if (interviewData?.question) {
      aiMessages.push({
        role: "assistant",
        content: interviewData.question,
      });
    }

    const finalMessages = [
      ...updatedMessages,
      ...aiMessages,
    ];

    setMessages(finalMessages);

    // If interview is complete
    if (interviewData?.interview_complete) {
      await evaluateCurrentInterview(finalMessages);
    }

  } catch (error) {
    console.error("Error sending answer:", error);

    const detail = error.response?.data?.detail;

    alert(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map(
                (item) =>
                  item.msg ||
                  JSON.stringify(item)
              )
              .join("\n")
          : detail
            ? JSON.stringify(detail)
            : "Failed to send answer."
    );

  } finally {
    setSendingMessage(false);
  }
};

  // ---------------------------------------------------------
  // End Interview Manually
  // ---------------------------------------------------------

  const endInterview = async () => {
    if (!interviewStarted || interviewEnded) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to end the interview and evaluate it?",
    );

    if (!confirmed) {
      return;
    }

    stopListening();

    await evaluateCurrentInterview(messages);
  };

  // ---------------------------------------------------------
  // Enter Key Handler
  // ---------------------------------------------------------

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!sendingMessage && !evaluatingInterview) {
        sendAnswer();
      }
    }
  };

  // ---------------------------------------------------------
  // Job Change
  // ---------------------------------------------------------

  const handleJobChange = (event) => {
    stopListening();

    setJobPosition(event.target.value);

    // Reset generated questions
    setQuestions([]);

    // Reset interview
    setInterviewStarted(false);
    setMessages([]);
    setAnswer("");
    setEvaluation(null);
    setInterviewComplete(false);
    setInterviewEnded(false);
  };

  // ---------------------------------------------------------
  // Candidate Change
  // ---------------------------------------------------------

  const handleCandidateChange = (event) => {
    stopListening();

    setCandidate(event.target.value);

    // Reset interview
    setInterviewStarted(false);
    setMessages([]);
    setAnswer("");
    setEvaluation(null);
    setInterviewComplete(false);
    setInterviewEnded(false);
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-purple-600" />

          <h1 className="text-2xl font-bold text-gray-900">
            AI Interview Assistant
          </h1>
        </div>

        <p className="mt-1 text-gray-500">
          Conduct AI-powered interviews and evaluate candidates.
        </p>
      </div>

      {/* =====================================================
          TWO COLUMN LAYOUT
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-purple-600" />

            <h2 className="text-lg font-semibold text-gray-900">
              Generate Interview Questions
            </h2>
          </div>

          {/* Job */}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Position
            </label>

            <select
              value={jobPosition}
              onChange={handleJobChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a job</option>

              {jobs.map((job) => (
                <option key={job.id || job._id} value={job.id || job._id}>
                  {job.title || job.position || job.job_title}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type */}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type
            </label>

            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Technical Skills">Technical Skills</option>

              <option value="Behavioral">Behavioral</option>

              <option value="Situational">Situational</option>

              <option value="General">General</option>
            </select>
          </div>

          {/* Generate Button */}

          <button
            onClick={generateQuestions}
            disabled={loadingQuestions || !jobPosition}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingQuestions ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Questions
              </>
            )}
          </button>

          {/* Generated Questions */}

          {questions.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Generated Questions
              </h3>

              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>

                      <p className="text-sm text-gray-700">
                        {typeof question === "string"
                          ? question
                          : question.question || ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================
            RIGHT SIDE - AI INTERVIEW
        =================================================== */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />

              <h2 className="text-lg font-semibold text-gray-900">
                AI Interview
              </h2>
            </div>

            {interviewStarted && !interviewEnded && (
              <span className="flex items-center gap-2 text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* Candidate */}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidate
            </label>

            <select
              value={candidate}
              onChange={handleCandidateChange}
              disabled={interviewStarted}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select a candidate</option>

              {candidates.map((item) => (
                <option key={item.id || item._id} value={item.id || item._id}>
                  {item.name ||
                    item.full_name ||
                    item.candidate_name ||
                    "Unnamed Candidate"}
                </option>
              ))}
            </select>
          </div>

          {/* Start Interview */}

          {!interviewStarted && (
            <button
              onClick={startInterview}
              disabled={!candidate || !jobPosition}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Start AI Interview
            </button>
          )}

          {/* =================================================
              CHAT AREA
          ================================================= */}

          {interviewStarted && (
            <div className="mt-5">
              <div className="h-[400px] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare className="w-10 h-10 mb-2" />

                    <p>Waiting for the first question...</p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 mb-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role !== "user" && (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-purple-600" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-700"
                      }`}
                    >
                      {message.content}
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}

                {sendingMessage && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>

                    <span>AI is thinking...</span>

                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              {/* =================================================
                  EVALUATION
              ================================================= */}

              {evaluation && (
                <div className="mt-4 border border-green-200 bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3">
                    Interview Evaluation
                  </h3>

                  <div className="space-y-2 text-sm text-gray-700">
                    {evaluation.score !== undefined && (
                      <p>
                        <strong>Score:</strong> {evaluation.score}
                      </p>
                    )}

                    {evaluation.overall_score !== undefined && (
                      <p>
                        <strong>Overall Score:</strong>{" "}
                        {evaluation.overall_score}
                      </p>
                    )}

                    {evaluation.feedback && (
                      <p>
                        <strong>Feedback:</strong> {evaluation.feedback}
                      </p>
                    )}

                    {evaluation.recommendation && (
                      <p>
                        <strong>Recommendation:</strong>{" "}
                        {evaluation.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* =================================================
                  ANSWER AREA
              ================================================= */}

              {!interviewComplete && !interviewEnded && (
                <div className="mt-4">
                  <div className="relative">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sendingMessage || evaluatingInterview}
                      rows={4}
                      placeholder={
                        isListening
                          ? "Listening... speak your answer."
                          : "Type your answer or click the microphone to speak..."
                      }
                      className={`w-full border rounded-lg px-4 py-3 pr-14 focus:outline-none focus:ring-2 resize-none ${
                        isListening
                          ? "border-red-400 focus:ring-red-400"
                          : "border-gray-300 focus:ring-blue-500"
                      } disabled:bg-gray-100`}
                    />

                    {/* =================================================
                        MICROPHONE BUTTON
                    ================================================= */}

                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      disabled={
                        !speechSupported ||
                        sendingMessage ||
                        evaluatingInterview
                      }
                      title={
                        !speechSupported
                          ? "Speech recognition is not supported in this browser"
                          : isListening
                            ? "Stop voice input"
                            : "Start voice input"
                      }
                      aria-label={
                        isListening ? "Stop voice input" : "Start voice input"
                      }
                      className={`absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition ${
                        isListening
                          ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                          : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isListening ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Voice status */}

                  <div className="mt-2 min-h-[20px]">
                    {isListening && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Listening... speak your answer
                      </div>
                    )}

                    {!speechSupported && (
                      <p className="text-xs text-gray-400">
                        Voice input is not supported in this browser. Please use
                        Google Chrome or Microsoft Edge.
                      </p>
                    )}

                    {speechSupported && !isListening && (
                      <p className="text-xs text-gray-400">
                        Click the microphone to answer using your voice.
                      </p>
                    )}
                  </div>

                  {/* Send Button */}

                  <button
                    onClick={sendAnswer}
                    disabled={
                      !answer.trim() || sendingMessage || evaluatingInterview
                    }
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Answer
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* =================================================
                  END INTERVIEW BUTTON
              ================================================= */}

              {!interviewEnded && !interviewComplete && (
                <button
                  onClick={endInterview}
                  disabled={evaluatingInterview || messages.length === 0}
                  className="mt-3 w-full border border-red-300 text-red-600 py-2.5 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {evaluatingInterview ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Evaluating Interview...
                    </span>
                  ) : (
                    "End Interview & Evaluate"
                  )}
                </button>
              )}

              {/* =================================================
                  COMPLETED MESSAGE
              ================================================= */}

              {(interviewComplete || interviewEnded) && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    ✓ Interview completed successfully
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewAssistant;
