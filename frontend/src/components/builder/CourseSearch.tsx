import { Search } from 'lucide-react';

interface CourseSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function CourseSearch({ searchQuery, setSearchQuery }: CourseSearchProps) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-500 mb-1.5">Search Courses</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors shadow-sm"
          placeholder="Search by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
