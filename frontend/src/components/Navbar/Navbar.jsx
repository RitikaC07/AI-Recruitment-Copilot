import { Bell, Search, Sparkles } from "lucide-react";

function Navbar() {
  return (
    <header className="sticky top-0 z-50 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-10">

      {/* Left */}
      <div>
        <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Welcome back
        </h3>

        <p className="text-gray-500 mt-1">
          AI Recruitment & Talent Management Copilot
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">

        {/* Search */}

        <div className="relative">

          <Search
            className="absolute left-4 top-3.5 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search candidates..."
            className="w-72 pl-11 pr-5 py-3 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />

        </div>

        {/* Notification */}

        <button className="relative h-12 w-12 rounded-2xl bg-gray-100 hover:bg-indigo-100 transition duration-300">

          <Bell
            className="mx-auto mt-3 text-gray-600"
            size={20}
          />

          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>

        </button>

        {/* Profile */}

        {/* <div className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 transition rounded-2xl px-3 py-2 cursor-pointer"> */}

          {/* <div className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold">
            R
          </div> */}


        {/* </div> */}

      </div>

    </header>
  );
}

export default Navbar;