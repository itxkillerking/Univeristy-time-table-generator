import { useState, useMemo } from 'react';
import type { RawTimetableData, RawTimetableRecord } from '../../lib/timetable/timetableValidator';
import { generateTimetableDiff } from '../../lib/admin/timetableDiff';
import ImportPreview from './ImportPreview';
import { ArrowLeft, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api/apiClient';

interface Props {
  currentData: RawTimetableData;
  baseVersionId?: string;
  onCancel: () => void;
  onPublished: () => void;
  onEdit: (sectionRecords: RawTimetableRecord[]) => void;
}

export default function SectionManager({ currentData, baseVersionId, onCancel, onPublished, onEdit }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('All');
  
  const [step, setStep] = useState<'list' | 'preview'>('list');
  const [previewData, setPreviewData] = useState<{ diff: any, newData: RawTimetableData } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group records by Course + Section to display them logically
  const groupedSections = useMemo(() => {
    const groups = new Map<string, RawTimetableRecord[]>();
    for (const record of currentData.classes) {
      const key = `${record.semester}__${record.course_name}__${record.section}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    }
    
    let result = Array.from(groups.values()).map(records => ({
      semester: records[0].semester,
      course_name: records[0].course_name,
      section: records[0].section,
      records
    }));

    if (semesterFilter !== 'All') {
      result = result.filter(g => g.semester === semesterFilter);
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(g => 
        g.course_name.toLowerCase().includes(lowerSearch) || 
        g.section.toLowerCase().includes(lowerSearch)
      );
    }

    return result.sort((a, b) => {
      if (a.semester !== b.semester) return a.semester.localeCompare(b.semester);
      if (a.course_name !== b.course_name) return a.course_name.localeCompare(b.course_name);
      return a.section.localeCompare(b.section);
    });
  }, [currentData, searchTerm, semesterFilter]);

  const handleRemove = (recordsToRemove: RawTimetableRecord[]) => {
    // Determine exact records to remove by matching
    const remainingClasses = currentData.classes.filter(record => 
      !recordsToRemove.some(r => 
        r.course_name === record.course_name && 
        r.section === record.section && 
        r.semester === record.semester &&
        r.day === record.day &&
        r.start_time === record.start_time &&
        r.end_time === record.end_time
      )
    );

    const newData: RawTimetableData = {
      ...currentData,
      classes: remainingClasses
    };

    const diff = generateTimetableDiff(currentData.classes, newData.classes);
    setPreviewData({ diff, newData });
    setStep('preview');
  };

  const handlePublish = async () => {
    if (!previewData) return;
    
    setIsPublishing(true);
    setError(null);
    try {
      const response = await fetchWithAuth('/api/admin/timetable/publish/', {
        method: 'POST',
        body: JSON.stringify({
          ...previewData.newData,
          base_version_id: baseVersionId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish timetable.');
      }

      onPublished();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during publish.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (step === 'preview' && previewData) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start text-left gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Publish Failed</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
          <h3 className="font-bold">Review Section Removal</h3>
          <p className="text-sm">You are about to remove a section. Please review the diff below and confirm publish to apply the deletion.</p>
        </div>
        <ImportPreview 
          diff={previewData.diff}
          onCancel={() => setStep('list')}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900">Manage Sections</h2>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by course or section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
        >
          <option value="All">All Semesters</option>
          <option value="1st Semester">1st Semester</option>
          <option value="2nd Semester">2nd Semester</option>
          <option value="3rd Semester">3rd Semester</option>
          <option value="4th Semester">4th Semester</option>
          <option value="5th Semester">5th Semester</option>
          <option value="6th Semester">6th Semester</option>
          <option value="7th Semester">7th Semester</option>
          <option value="8th Semester">8th Semester</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedSections.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              No sections found matching your criteria.
            </div>
          ) : (
            groupedSections.map((group, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors shadow-sm flex flex-col">
                <div className="flex-1">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md mb-2 inline-block">
                    {group.semester}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{group.course_name}</h3>
                  <p className="text-sm font-medium text-slate-700 mb-3">Section {group.section}</p>
                  
                  <div className="space-y-1 mb-4">
                    {group.records.map((r, i) => (
                      <div key={i} className="text-xs text-slate-500 flex justify-between bg-slate-50 p-1.5 rounded">
                        <span>{r.day} {r.start_time}-{r.end_time}</span>
                        <span className="truncate ml-2 max-w-[80px]">{r.room}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button 
                    onClick={() => onEdit(group.records)}
                    className="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => handleRemove(group.records)}
                    className="flex-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
