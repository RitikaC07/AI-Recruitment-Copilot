import axios from "axios";
import { UploadCloud } from "lucide-react";

function UploadBox({ selectedFile, setSelectedFile, setProgress ,setCandidate,fetchCandidates,}) {

  const handleFileChange = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  setSelectedFile(file);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/resume",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },

        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          setProgress(percent);
        },
      }
    );

    setCandidate(response.data.candidate);
    fetchCandidates();
    alert("Resume uploaded successfully!");

  } catch (error) {
    console.error(error);
    alert("Upload failed.");
  }
};
  return (
    <div className="bg-white rounded-3xl shadow-lg p-10 border border-gray-200">

      <label
        className="border-2 border-dashed border-indigo-300 rounded-3xl h-80 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition"
      >

        <UploadCloud
          size={60}
          className="text-indigo-600 mb-5"
        />

        <h2 className="text-2xl font-semibold">
          Drag & Drop Resume Here
        </h2>

        <p className="text-gray-500 mt-3">
          or click to browse
        </p>

        <p className="text-sm text-gray-400 mt-5">
          PDF, DOCX (Maximum 5 MB)
        </p>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          hidden
          onChange={handleFileChange}
        />

      </label>

      {selectedFile && (

        <div className="mt-6 bg-indigo-50 rounded-xl p-4">

          📄 {selectedFile.name}

        </div>

      )}

    </div>
  );
}

export default UploadBox;