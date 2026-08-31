import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6 md:order-2">
            <Link to="/builder" className="text-gray-400 hover:text-gray-500">
              Build Timetable
            </Link>
            <Link to="/report" className="text-gray-400 hover:text-gray-500">
              Report Problem
            </Link>
            <Link to="/login" className="text-gray-400 hover:text-gray-500">
              Login
            </Link>
          </div>
          <div className="mt-8 md:mt-0 md:order-1 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-4 mb-4">
               <img 
                 src="/images/university-logo.png" 
                 alt="University Logo" 
                 className="h-8 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"
               />
               <div className="h-6 w-px bg-gray-300"></div>
               <img 
                 src="/images/kng_logo_4k_transparent (1) (1)_11zon (2).png" 
                 alt="KNG Logics Solution" 
                 className="h-6 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"
               />
            </div>
            <p className="text-center md:text-left text-base text-gray-400">
              &copy; {new Date().getFullYear()} University Timetable Planner. Powered by KNG Logics Solution.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
