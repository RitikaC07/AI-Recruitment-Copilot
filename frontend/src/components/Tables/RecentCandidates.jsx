const candidates = [
  {
    name: "Sarah Johnson",
    role: "Frontend Developer",
    experience: "5 Years",
    status: "Shortlisted",
  },
  {
    name: "Michael Chen",
    role: "Python Developer",
    experience: "3 Years",
    status: "Interview",
  },
  {
    name: "Emma Watson",
    role: "UI/UX Designer",
    experience: "2 Years",
    status: "Reviewing",
  },
];

function RecentCandidates() {
  return (
    <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 mt-10">

      <h2 className="text-2xl font-semibold mb-6">
        Recent Candidates
      </h2>

      <table className="w-full">

        <thead>

          <tr className="border-b">

            <th className="text-left py-3">Candidate</th>

            <th className="text-left">Role</th>

            <th className="text-left">Experience</th>

            <th className="text-left">Status</th>

          </tr>

        </thead>

        <tbody>

          {candidates.map((candidate, index) => (

            <tr
              key={index}
              className="border-b hover:bg-gray-50 transition"
            >

              <td className="py-4">{candidate.name}</td>

              <td>{candidate.role}</td>

              <td>{candidate.experience}</td>

              <td>

                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">

                  {candidate.status}

                </span>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default RecentCandidates;