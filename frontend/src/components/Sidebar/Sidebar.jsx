import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Upload,
  Users,
  Briefcase,
  Brain,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react";


const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Resume Upload",
    path: "/upload",
    icon: Upload,
  },
  {
    name: "Candidates",
    path: "/candidates",
    icon: Users,
  },
  {
    name: "Job Postings",
    path: "/jobs",
    icon: Briefcase,
  },
  {
    name: "AI Matching",
    path: "/matching",
    icon: Brain,
  },
  {
  name: "Interview Assistant",
  path: "/interview",
  icon: MessageSquare,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
];


function Sidebar() {
  return (
    <aside className="w-72 min-h-screen bg-white border-r border-gray-100 flex flex-col">

      {/* Logo */}

      <div className="p-6">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            AI
          </div>

          <div>

            <h2 className="font-bold text-xl text-gray-900">
              RecruitAI
            </h2>

            <p className="text-sm text-gray-500">
              Talent Copilot
            </p>

          </div>

        </div>

      </div>


      {/* Menu */}

      <nav className="flex-1 px-4 py-6">

        {menuItems.map((item) => {

          const Icon = item.icon;

          return (

            <NavLink
              key={item.name}
              to={item.path}

              className={({ isActive }) =>
                `group flex items-center gap-4 rounded-2xl px-5 py-4 mb-3 transition-all duration-300 ease-in-out ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl scale-105"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 hover:translate-x-2 hover:shadow-md"
                }`
              }
            >

              <Icon
                size={20}
                className="transition-transform duration-300 group-hover:rotate-6"
              />

              <span>
                {item.name}
              </span>

            </NavLink>

          );

        })}

      </nav>


      {/* Footer */}

      <div className="border-t border-gray-100 p-5 bg-gradient-to-r from-white to-indigo-50">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center font-semibold shadow-lg">
            R
          </div>

          <div>

            <p className="font-medium">
              Recruiter
            </p>

            <p className="text-sm text-gray-500">
              admin@company.com
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
}


export default Sidebar;