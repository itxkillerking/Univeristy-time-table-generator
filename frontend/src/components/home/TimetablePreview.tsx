import { Download } from 'lucide-react';

export default function TimetablePreview() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
          Your Final Timetable
        </h2>
        <p className="max-w-2xl text-lg text-gray-500 mx-auto mb-10">
          Review your complete weekly schedule in a clean, visual format. When everything looks perfect, generate a professional PDF.
        </p>
        
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span className="font-semibold text-gray-700">Timetable Ready</span>
            </div>
            <button className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md px-4 py-2 transition-colors shadow-sm">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </button>
          </div>
          
          {/* Simple Mock Timetable Grid */}
          <div className="p-6 overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div className="font-medium text-gray-400 text-sm">Time</div>
                {days.map(day => (
                  <div key={day} className="font-medium text-gray-700 text-sm text-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-2">
                <div className="text-xs text-gray-400 flex flex-col justify-start pt-2">
                  <span>08:00</span>
                  <span className="mt-8">09:30</span>
                  <span className="mt-8">11:00</span>
                </div>
                {/* Mock Schedule Blocks */}
                <div className="col-span-5 grid grid-cols-5 gap-2 relative h-48 border-t border-l border-gray-100 bg-[linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:100%_40px]">
                  {/* Class 1 */}
                  <div className="absolute top-[40px] left-0 w-[calc(20%-8px)] h-[38px] bg-blue-100 border border-blue-300 rounded p-1 text-[10px] leading-tight overflow-hidden">
                    <span className="font-bold text-blue-900 block">Diff Eq</span>
                    <span className="text-blue-700">09:30 - 10:45</span>
                  </div>
                  {/* Class 2 */}
                  <div className="absolute top-[80px] left-[20%] w-[calc(20%-8px)] h-[38px] bg-indigo-100 border border-indigo-300 rounded p-1 text-[10px] leading-tight overflow-hidden">
                    <span className="font-bold text-indigo-900 block">Database Sys</span>
                    <span className="text-indigo-700">11:00 - 12:15</span>
                  </div>
                  {/* Class 3 */}
                  <div className="absolute top-[120px] left-[60%] w-[calc(20%-8px)] h-[38px] bg-emerald-100 border border-emerald-300 rounded p-1 text-[10px] leading-tight overflow-hidden">
                    <span className="font-bold text-emerald-900 block">Compiler Const</span>
                    <span className="text-emerald-700">12:30 - 13:45</span>
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
