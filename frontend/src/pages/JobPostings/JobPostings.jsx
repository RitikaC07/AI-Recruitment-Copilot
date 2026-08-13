import { useEffect, useState } from "react";
import API from "../../api/api";
import { Plus, Briefcase, Trash2, X } from "lucide-react";

function JobPostings() {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    minimum_experience: "",
  });

  const [skills, setSkills] = useState([]);

  const [skillInput, setSkillInput] = useState("");
  const [skillLevel, setSkillLevel] = useState("Required");

  // --------------------------------
  // Fetch Jobs
  // --------------------------------

  const fetchJobs = async () => {
    try {
      const response = await API.get("/jobs");
      setJobs(response.data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // --------------------------------
  // Handle Form Changes
  // --------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------
  // Add Skill
  // --------------------------------

  const addSkill = () => {
    const skill = skillInput.trim();

    if (!skill) {
      return;
    }

    // Prevent duplicate skills
    const alreadyExists = skills.some(
      (item) => item.name.toLowerCase() === skill.toLowerCase()
    );

    if (alreadyExists) {
      alert("This skill has already been added.");
      return;
    }

    setSkills((prev) => [
      ...prev,
      {
        name: skill,
        level: skillLevel,
      },
    ]);

    setSkillInput("");
    setSkillLevel("Required");
  };

  // --------------------------------
  // Remove Skill
  // --------------------------------

  const removeSkill = (index) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  // --------------------------------
  // Create Job
  // --------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (skills.length === 0) {
      alert("Please add at least one required skill.");
      return;
    }

    try {
      const jobData = {
        title: formData.title,
        company: formData.company,
        description: formData.description,

        required_skills: skills,

        minimum_experience:
          Number(formData.minimum_experience) || 0,
      };

      await API.post("/jobs", jobData);

      alert("Job created successfully!");

      setFormData({
        title: "",
        company: "",
        description: "",
        minimum_experience: "",
      });

      setSkills([]);
      setSkillInput("");
      setSkillLevel("Required");

      setShowForm(false);

      fetchJobs();
    } catch (error) {
      console.error("Failed to create job:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to create job"
      );
    }
  };

  return (
    <div className="p-2 space-y-8">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Job Postings
          </h1>

          <p className="text-gray-500 mt-2">
            Create and manage job openings.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition"
        >
          <Plus size={20} />

          {showForm ? "Close" : "Create Job"}
        </button>

      </div>


      {/* Create Job Form */}

      {showForm && (

        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-8">

          <h2 className="text-2xl font-semibold mb-6">
            Create New Job
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Job Title */}

            <div>

              <label className="block font-medium mb-2">
                Job Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Python Backend Developer"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>


            {/* Company */}

            <div>

              <label className="block font-medium mb-2">
                Company
              </label>

              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="ABC Technologies"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>


            {/* Description */}

            <div>

              <label className="block font-medium mb-2">
                Job Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the responsibilities and requirements..."
                rows="6"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>


            {/* Skills */}

            <div>

              <label className="block font-medium mb-2">
                Required Skills
              </label>

              <div className="flex gap-3">

                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) =>
                    setSkillInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Enter skill e.g. Python"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <select
                  value={skillLevel}
                  onChange={(e) =>
                    setSkillLevel(e.target.value)
                  }
                  className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Required">
                    Required
                  </option>

                  <option value="Intermediate">
                    Intermediate
                  </option>

                  <option value="Basic">
                    Basic
                  </option>
                </select>

                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition"
                >
                  <Plus size={20} />
                </button>

              </div>

              <p className="text-sm text-gray-500 mt-2">
                Add each skill and select its required proficiency level.
              </p>

            </div>


            {/* Added Skills */}

            {skills.length > 0 && (

              <div className="space-y-3">

                <h3 className="font-semibold">
                  Selected Skills
                </h3>

                {skills.map((skill, index) => (

                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                  >

                    <div className="flex items-center gap-3">

                      <span className="font-medium">
                        {skill.name}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          skill.level === "Required"
                            ? "bg-red-100 text-red-700"
                            : skill.level === "Intermediate"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {skill.level}
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>

                  </div>

                ))}

              </div>

            )}


            {/* Experience */}

            <div>

              <label className="block font-medium mb-2">
                Minimum Experience (Years)
              </label>

              <input
                type="number"
                name="minimum_experience"
                value={formData.minimum_experience}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="2"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>


            {/* Submit */}

            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition"
            >
              Create Job
            </button>

          </form>

        </div>

      )}


      {/* Job List */}

      <div>

        <h2 className="text-2xl font-semibold mb-5">
          Existing Jobs
        </h2>

        {jobs.length === 0 ? (

          <div className="bg-white rounded-3xl p-10 text-center text-gray-500">

            <Briefcase
              size={50}
              className="mx-auto mb-4"
            />

            <p>
              No job postings available.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {jobs.map((job) => (

              <div
                key={job._id}
                className="bg-white rounded-3xl shadow-md border border-gray-100 p-6"
              >

                {/* Job Header */}

                <div className="flex items-start justify-between">

                  <div>

                    <h3 className="text-xl font-semibold">
                      {job.title}
                    </h3>

                    <p className="text-gray-500 mt-1">
                      {job.company || "Company not specified"}
                    </p>

                  </div>

                  <Briefcase
                    className="text-indigo-600"
                    size={28}
                  />

                </div>


                {/* Description */}

                <p className="text-gray-600 mt-5 line-clamp-3">
                  {job.description}
                </p>


                {/* Skills */}

                <div className="mt-5">

                  <p className="font-semibold mb-3">
                    Required Skills
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {(job.required_skills || []).map(
                      (skill, index) => {

                        // New format
                        if (
                          typeof skill === "object"
                        ) {
                          return (
                            <span
                              key={index}
                              className={`px-3 py-1 rounded-full text-sm ${
                                skill.level === "Required"
                                  ? "bg-red-100 text-red-700"
                                  : skill.level ===
                                    "Intermediate"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {skill.name} · {skill.level}
                            </span>
                          );
                        }

                        // Old jobs
                        return (
                          <span
                            key={index}
                            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        );
                      }
                    )}

                  </div>

                </div>


                {/* Experience */}

                <div className="mt-5 text-sm text-gray-600">

                  <strong>
                    Minimum Experience:
                  </strong>{" "}

                  {job.minimum_experience || 0} years

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default JobPostings;