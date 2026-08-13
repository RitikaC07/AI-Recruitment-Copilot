import { useState, useEffect } from "react";
import API from "../../api/api";
import UploadBox from "../../components/Upload/UploadBox";
import ProgressBar from "../../components/Upload/ProgressBar";
import ExtractedInfo from "../../components/Upload/ExtractedInfo";
import SectionTitle from "../../components/Common/SectionTitle";

function ResumeUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);

  // Temporary dummy data
  const [candidate, setCandidate] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const fetchCandidates = async () => {
  try {
    const response = await API.get("/candidates");

    setCandidates(response.data);
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  fetchCandidates();
}, []);

  return (
  <div className="space-y-8">

    <SectionTitle
      title="Resume Parsing & Candidate Profiling"
      subtitle="Upload PDF or DOCX resumes to extract candidate information using AI."
    />

    <UploadBox
      selectedFile={selectedFile}
      setSelectedFile={setSelectedFile}
      setProgress={setProgress}
      setCandidate={setCandidate}
      fetchCandidates={fetchCandidates}
    />

    {selectedFile && (
      <ProgressBar progress={progress} />
    )}

    {candidate && (
      <ExtractedInfo candidate={candidate} />
    )}

    {/* List of Uploaded Candidates */}

    <div className="bg-white rounded-3xl shadow p-8">
      <h2 className="text-2xl font-bold mb-6">
        Uploaded Candidates
      </h2>

      {candidates.length === 0 ? (
        <p className="text-gray-500">
          No candidates uploaded yet.
        </p>
      ) : (
        <div className="space-y-4">

          {candidates.map((candidate) => (

            <div
              key={candidate._id}
              className="border rounded-xl p-5 hover:bg-gray-50 transition"
            >

              <h3 className="text-lg font-semibold">
                {candidate.name}
              </h3>

              <p className="text-gray-600">
                {candidate.email}
              </p>

              <p className="text-gray-500">
                {candidate.phone}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">

                {candidate.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}

              </div>

            </div>

          ))}

        </div>
      )}

    </div>

  </div>
);
}

export default ResumeUpload;