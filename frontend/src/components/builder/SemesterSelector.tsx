import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SemesterSelectorProps {
  semesters: string[];
  activeSemester: string;
  onSelectSemester: (semester: string) => void;
}

export default function SemesterSelector({ semesters, activeSemester, onSelectSemester }: SemesterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-slate-500 mb-1.5">Select Semester</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-64 flex items-center justify-between bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 font-medium hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
      >
        <span>{activeSemester || 'Choose a semester...'}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full sm:w-64 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-y-auto">
            {semesters.map((semester) => (
              <li key={semester}>
                <button
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    activeSemester === semester 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    onSelectSemester(semester);
                    setIsOpen(false);
                  }}
                >
                  {semester}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
