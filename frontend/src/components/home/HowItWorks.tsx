export default function HowItWorks() {
  const steps = [
    { id: '01', name: 'Select Courses', description: 'Choose your desired courses from any semester.' },
    { id: '02', name: 'Choose Sections', description: 'Review available instructors and time slots.' },
    { id: '03', name: 'Check for Clashes', description: 'The system automatically detects any overlaps.' },
    { id: '04', name: 'Review Timetable', description: 'Ensure your weekly schedule is perfect.' },
    { id: '05', name: 'Download PDF', description: 'Export your final professional timetable.' },
  ];

  return (
    <div className="bg-gray-50 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">How It Works</h2>
          <p className="mt-4 text-lg text-gray-500">Your timetable ready in 5 simple steps</p>
        </div>
        
        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2" aria-hidden="true" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((step) => (
              <div key={step.id} className="relative flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-md z-10">
                  {step.id}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{step.name}</h3>
                <p className="text-sm text-gray-500 px-2">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
