function ExtractedInfo({ candidate }) {
  if (!candidate) return null;

  return (
    <div className="bg-white rounded-3xl p-8 shadow">
      <h2 className="text-2xl font-bold mb-6">
        Extracted Candidate Information
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div>
          <strong>Name</strong>
          <p>{candidate.name || "N/A"}</p>
        </div>

        <div>
          <strong>Email</strong>
          <p>{candidate.email || "N/A"}</p>
        </div>

        <div>
          <strong>Phone</strong>
          <p>{candidate.phone || "N/A"}</p>
        </div>

        <div>
          <strong>Experience</strong>
          <p>
            {Array.isArray(candidate.experience)
              ? candidate.experience.join(", ")
              : candidate.experience || "N/A"}
          </p>
        </div>

        <div className="col-span-2">
          <strong>Skills</strong>

          <div className="flex gap-3 mt-3 flex-wrap">
            {candidate.skills && candidate.skills.length > 0 ? (
              candidate.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p>No skills found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ExtractedInfo;