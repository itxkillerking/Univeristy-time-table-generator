import { ChevronDown, Check } from 'lucide-react';

export default function CourseSelectionPreview() {
  return (
    <div className="py-16 sm:py-24 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              Seamless Course Selection
            </h2>
            <p className="text-lg text-gray-500 mb-6">
              Browse and select courses from any semester without ever leaving the page. Our centralized interface makes planning your academic year effortless.
            </p>
            <ul className="space-y-4">
              {['Switch semesters instantly', 'Keep track of selected courses globally', 'Filter by core vs electives'].map((item, i) => (
                <li key={i} className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">{item}</p>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-10 lg:mt-0 relative">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
                <h3 className="font-medium text-gray-700">Course Selection</h3>
                <button className="flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm">
                  5th Semester <ChevronDown className="ml-2 h-4 w-4" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Courses</h4>
                  <div className="space-y-2">
                    <div className="flex items-center p-2 rounded hover:bg-gray-50 border border-transparent">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                      <span className="ml-3 text-sm text-gray-700">Differential Equations</span>
                    </div>
                    <div className="flex items-center p-2 rounded hover:bg-gray-50 border border-transparent">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                      <span className="ml-3 text-sm text-gray-700">Database Systems</span>
                    </div>
                    <div className="flex items-center p-2 rounded bg-blue-50 border border-blue-100">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                      <span className="ml-3 text-sm font-medium text-blue-800">Compiler Construction</span>
                    </div>
                  </div>
                </div>
                <div className="border-l pl-4 border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Selected</h4>
                  <div className="space-y-2">
                    <div className="bg-white border border-gray-200 p-2 rounded text-sm text-gray-700 shadow-sm">
                      Compiler Construction
                    </div>
                    <div className="bg-white border border-gray-200 p-2 rounded text-sm text-gray-700 shadow-sm">
                      PDC (6th Sem)
                    </div>
                    <div className="bg-white border border-gray-200 p-2 rounded text-sm text-gray-700 shadow-sm">
                      Machine Learning
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
