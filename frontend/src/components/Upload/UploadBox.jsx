import { useState } from "react";
import axios from "axios";
import { UploadCloud } from "lucide-react";

function UploadBox({
  selectedFile,
  setSelectedFile,
  setProgress,
  setCandidate,
  fetchCandidates,
}) {

  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);

  // =====================================================
  // HANDLE FILE SELECTION
  // =====================================================

  const handleFileChange = async (e) => {

    const files = Array.from(e.target.files);

    if (!files.length) {
      return;
    }

    // ---------------------------------------------------
    // Allowed file types
    // ---------------------------------------------------

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx"
    ];

    // ---------------------------------------------------
    // Check file types
    // ---------------------------------------------------

    const invalidFiles = files.filter((file) => {

      const extension =
        "." +
        file.name
          .split(".")
          .pop()
          .toLowerCase();

      return !allowedExtensions.includes(
        extension
      );
    });

    if (invalidFiles.length > 0) {

      alert(
        "Some files have an invalid format. " +
        "Please upload only PDF, DOC or DOCX files."
      );

      e.target.value = "";
      return;
    }

    // ---------------------------------------------------
    // Check file size
    // ---------------------------------------------------

    const maxSize = 5 * 1024 * 1024; // 5 MB

    const oversizedFiles = files.filter(
      (file) => file.size > maxSize
    );

    if (oversizedFiles.length > 0) {

      alert(
        "Each resume must be smaller than 5 MB."
      );

      e.target.value = "";
      return;
    }

    // ---------------------------------------------------
    // Save selected files
    // ---------------------------------------------------

    setSelectedFile(files);

    setProgress(0);

    setCandidate(null);

    setUploadResults([]);

    // ---------------------------------------------------
    // Upload
    // ---------------------------------------------------

    const formData = new FormData();

    files.forEach((file) => {

      formData.append(
        "files",
        file
      );

    });

    try {

      setUploading(true);

      const response = await axios.post(
        "http://127.0.0.1:8000/resume",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },

          onUploadProgress: (progressEvent) => {

            if (!progressEvent.total) {
              return;
            }

            const percent = Math.round(
              (
                progressEvent.loaded *
                100
              ) /
              progressEvent.total
            );

            setProgress(percent);
          },
        }
      );

      // -------------------------------------------------
      // Save results
      // -------------------------------------------------

      const results =
        response.data.results || [];

      setUploadResults(results);

      // -------------------------------------------------
      // Set first successful candidate
      // -------------------------------------------------

      const successfulCandidate =
        results.find(
          (result) =>
            result.success &&
            result.candidate
        );

      if (successfulCandidate) {

        setCandidate(
          successfulCandidate.candidate
        );

      }

      // -------------------------------------------------
      // Refresh candidate list
      // -------------------------------------------------

      await fetchCandidates();

      // -------------------------------------------------
      // Summary message
      // -------------------------------------------------

      const successCount =
        response.data.successful_count || 0;

      const failedCount =
        response.data.failed_count || 0;

      if (failedCount === 0) {

        alert(
          `${successCount} resume(s) uploaded successfully!`
        );

      } else {

        alert(
          `${successCount} resume(s) added successfully. ` +
          `${failedCount} file(s) need attention.`
        );

      }

    } catch (error) {

      console.error(
        "Upload error:",
        error
      );

      const message =
        error.response?.data?.detail ||
        "Upload failed.";

      alert(
        `⚠️ ${message}`
      );

    } finally {

      setUploading(false);

      // Reset input so the same file
      // can be selected again
      e.target.value = "";

    }
  };


  // =====================================================
  // REMOVE SELECTED FILE
  // =====================================================

  const getFileName = (file) => {

    if (!file) {
      return "";
    }

    return file.name;
  };


  return (

    <div className="bg-white rounded-3xl shadow-lg p-10 border border-gray-200">

      <label
        className={`
          border-2
          border-dashed
          border-indigo-300
          rounded-3xl
          min-h-80
          flex
          flex-col
          items-center
          justify-center
          cursor-pointer
          hover:bg-indigo-50
          transition
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >

        <UploadCloud
          size={60}
          className="text-indigo-600 mb-5"
        />

        <h2 className="text-2xl font-semibold">

          {uploading
            ? "Uploading resumes..."
            : "Drag & Drop Resumes Here"}

        </h2>

        <p className="text-gray-500 mt-3">

          {uploading
            ? "Please wait..."
            : "or click to browse"}

        </p>

        <p className="text-sm text-gray-400 mt-5">

          PDF, DOC, DOCX • Maximum 5 MB each

        </p>

        <p className="text-sm text-indigo-500 mt-2">

          You can select multiple resumes

        </p>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          hidden
          disabled={uploading}
          onChange={handleFileChange}
        />

      </label>


      {/* =================================================
          SELECTED FILES
          ================================================= */}

      {selectedFile && (

        <div className="mt-6">

          <h3 className="font-semibold text-lg mb-3">

            Selected Resumes

          </h3>

          <div className="space-y-2">

            {Array.isArray(selectedFile) ? (

              selectedFile.map(
                (file, index) => (

                  <div
                    key={index}
                    className="
                      bg-indigo-50
                      rounded-xl
                      p-4
                      flex
                      items-center
                    "
                  >

                    <span className="mr-3">
                      📄
                    </span>

                    <span className="text-gray-700">
                      {getFileName(file)}
                    </span>

                  </div>

                )
              )

            ) : (

              <div
                className="
                  bg-indigo-50
                  rounded-xl
                  p-4
                "
              >
                📄 {getFileName(selectedFile)}
              </div>

            )}

          </div>

        </div>

      )}


      {/* =================================================
          UPLOAD RESULTS
          ================================================= */}

      {uploadResults.length > 0 && (

        <div className="mt-8">

          <h3 className="text-xl font-bold mb-4">

            Upload Results

          </h3>

          <div className="space-y-3">

            {uploadResults.map(
              (result, index) => (

                <div
                  key={index}
                  className={`
                    rounded-xl
                    p-4
                    border
                    ${
                      result.success
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }
                  `}
                >

                  <p className="font-semibold">

                    {result.success
                      ? "✅"
                      : "⚠️"}

                    {" "}

                    {result.filename}

                  </p>

                  <p
                    className={`
                      text-sm
                      mt-1
                      ${
                        result.success
                          ? "text-green-700"
                          : "text-red-700"
                      }
                    `}
                  >

                    {result.message}

                  </p>

                </div>

              )
            )}

          </div>

        </div>

      )}

    </div>

  );
}

export default UploadBox;