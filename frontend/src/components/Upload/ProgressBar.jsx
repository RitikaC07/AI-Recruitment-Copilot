function ProgressBar({ progress }) {

  return (

    <div className="bg-white rounded-3xl p-6 shadow">

      <div className="flex justify-between mb-3">

        <h3 className="font-semibold">
          Upload Progress
        </h3>

        <span>{progress}%</span>

      </div>

      <div className="w-full bg-gray-200 rounded-full h-4">

        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`
          }}
        />

      </div>

    </div>

  );

}

export default ProgressBar;