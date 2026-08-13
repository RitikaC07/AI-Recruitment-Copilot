function RecentCandidates({ candidates }) {
  return (
    <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 mt-10">

      <h2 className="text-2xl font-semibold mb-6">
        Recent Candidates
      </h2>

      <table className="w-full">

        <thead>
          <tr className="border-b">
            <th className="text-left py-3">Candidate</th>
            <th className="text-left">Email</th>
            <th className="text-left">Experience</th>
            <th className="text-left">Skills</th>
          </tr>
        </thead>

        <tbody>

          {candidates && candidates.length > 0 ? (

            candidates.map((candidate) => (

              <tr
                key={candidate._id}
                className="border-b hover:bg-gray-50 transition"
              >

                <td className="py-4 font-medium">
                  {candidate.name}
                </td>

                <td>
                  {candidate.email}
                </td>

                <td>
                  {candidate.experience || "Fresher"}
                </td>

                <td>
                  <div className="flex flex-wrap gap-2">

                    {(candidate.skills || [])
                      .slice(0, 3)
                      .map((skill, index) => (

                        <span
                          key={index}
                          className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs"
                        >
                          {skill}
                        </span>

                      ))}

                  </div>
                </td>

              </tr>

            ))

          ) : (

            <tr>

              <td
                colSpan="4"
                className="text-center py-6 text-gray-500"
              >
                No candidates uploaded yet.
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}

export default RecentCandidates;