function ExtractedInfo({ candidate }) {

  return (

    <div className="bg-white rounded-3xl p-8 shadow">

      <h2 className="text-2xl font-bold mb-6">
        Extracted Candidate Information
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div>
          <strong>Name</strong>
          <p>{candidate.name}</p>
        </div>

        <div>
          <strong>Email</strong>
          <p>{candidate.email}</p>
        </div>

        <div>
          <strong>Phone</strong>
          <p>{candidate.phone}</p>
        </div>

        <div>
          <strong>Experience</strong>
          <p>{candidate.experience}</p>
        </div>

        <div className="col-span-2">
          <strong>Skills</strong>

          <div className="flex gap-3 mt-3 flex-wrap">

            {candidate.skills.map((skill) => (

              <span
                key={skill}
                className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full"
              >
                {skill}
              </span>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

}

export default ExtractedInfo;