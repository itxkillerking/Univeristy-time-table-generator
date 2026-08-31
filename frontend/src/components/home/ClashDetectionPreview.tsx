import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ClashDetectionPreview() {
  return (
    <div className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center flex flex-col-reverse lg:flex-row">
          <div className="mt-10 lg:mt-0 w-full">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6">
              <div className="space-y-4 relative">
                {/* Clashing items */}
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-md flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-red-800">Course A (Section 5A)</h4>
                    <p className="text-sm text-red-600">Monday • 09:30 – 10:45</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-md flex justify-between items-center -mt-2">
                  <div>
                    <h4 className="font-semibold text-red-800">Course B (Section 5B)</h4>
                    <p className="text-sm text-red-600">Monday • 10:00 – 11:15</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>

                <div className="flex justify-center py-2">
                  <div className="bg-gray-100 rounded-full p-2">
                    <ArrowRight className="h-5 w-5 text-gray-500 rotate-90 lg:rotate-0" />
                  </div>
                </div>

                {/* Resolved item */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-md flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-green-800">Alternative: Course B (Section 5C)</h4>
                    <p className="text-sm text-green-600">Monday • 11:00 – 12:15</p>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-10 lg:mb-0">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              Intelligent Clash Detection
            </h2>
            <p className="text-lg text-gray-500">
              Never worry about double-booking yourself again. Our system automatically identifies time overlaps down to the exact minute.
            </p>
            <p className="mt-4 text-lg text-gray-500">
              When a conflict occurs, we immediately recommend alternative sections that perfectly fit your existing schedule.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
