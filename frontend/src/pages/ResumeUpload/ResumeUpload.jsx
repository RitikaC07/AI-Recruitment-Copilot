import { useState } from "react";

import UploadBox from "../../components/Upload/UploadBox";
import ProgressBar from "../../components/Upload/ProgressBar";
import ExtractedInfo from "../../components/Upload/ExtractedInfo";
import SectionTitle from "../../components/Common/SectionTitle";

function ResumeUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);

  // Temporary dummy data
  const [candidate, setCandidate] = useState({
  name: "Sarah Johnson",
  email: "sarah@gmail.com",
  phone: "+91 9876543210",
  experience: "5 Years",
  skills: ["React", "Python", "FastAPI", "Machine Learning"],
});

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
      />

      {selectedFile && (
        <ProgressBar progress={progress} />
      )}

      {candidate && (
        <ExtractedInfo candidate={candidate} />
      )}

    </div>
  );
}

export default ResumeUpload;