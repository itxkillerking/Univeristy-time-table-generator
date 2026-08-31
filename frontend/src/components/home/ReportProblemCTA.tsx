import { MessageSquareWarning } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReportProblemCTA() {
  return (
    <div className="bg-blue-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
        <div className="text-center md:text-left mb-8 md:mb-0">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center md:justify-start">
            <MessageSquareWarning className="h-6 w-6 mr-3 text-blue-400" />
            Something not right?
          </h2>
          <p className="text-blue-200">
            Report a problem and help us improve the timetable planner for everyone.
          </p>
        </div>
        <div>
          <Link
            to="/report"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-900 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            Report a Problem
          </Link>
        </div>
      </div>
    </div>
  );
}
