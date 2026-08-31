import { BookOpen, Clock, AlertTriangle, FileCheck2 } from 'lucide-react';

const features = [
  {
    name: 'Choose Courses',
    description: 'Select courses from different semesters easily in one centralized place without losing your progress.',
    icon: BookOpen,
  },
  {
    name: 'Choose Sections',
    description: 'View instructor names, room allocations, and exact days and time slots before making a decision.',
    icon: Clock,
  },
  {
    name: 'Detect Clashes',
    description: 'Automatically identify overlapping classes across different sections and semesters.',
    icon: AlertTriangle,
  },
  {
    name: 'Find Better Options',
    description: 'Instantly find alternative and backup sections that perfectly fit into your existing timetable.',
    icon: FileCheck2,
  },
];

export default function CoreFeatures() {
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Core Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need for perfect planning
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            A professional toolkit designed specifically for university students to eliminate the stress of manual timetable creation.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.name}</h3>
                    <p className="mt-5 text-base text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
