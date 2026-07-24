function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div
      className="bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
    >
      <div className="flex justify-between items-start">

        <div>
          <p className="text-gray-500 text-sm">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {value}
          </h2>

          <p className="text-gray-400 mt-2 text-sm">
            {subtitle}
          </p>
        </div>

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl ${color}`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}

export default StatCard;