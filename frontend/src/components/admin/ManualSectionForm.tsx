import { useState, useMemo } from 'react';
import type { RawTimetableData, RawTimetableRecord } from '../../lib/timetable/timetableValidator';
import { generateTimetableDiff } from '../../lib/admin/timetableDiff';
import { courseCatalogue } from '../../data/courseCatalogue';
import ImportPreview from './ImportPreview';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api/apiClient';

interface Props {
  onCancel: () => void;
  onPublished: () => void;
  currentData: RawTimetableData;
  baseVersionId?: string;
  initialData?: RawTimetableRecord[];
}

export default function ManualSectionForm({ onCancel, onPublished, currentData, baseVersionId, initialData }: Props) {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [semester, setSemester] = useState(initialData ? initialData[0].semester : '7th Semester');
  
  // Attempt to strip out "(Lab)" if it's there so the dropdown matches the catalogue
  const initialCourse = initialData ? initialData[0].course_name.replace(/\s*\((lab|2hr)\)/i, '').trim() : '';
  const [courseIdentity, setCourseIdentity] = useState(initialCourse);
  const [sectionName, setSectionName] = useState(initialData ? initialData[0].section : '');
  
  const [schedules, setSchedules] = useState<Array<{
    day: string;
    startTime: string;
    endTime: string;
    room: string;
    instructor: string;
    type: string;
  }>>(initialData ? initialData.map(r => ({
    day: r.day,
    startTime: r.start_time,
    endTime: r.end_time,
    room: r.room,
    instructor: r.instructor,
    type: /\b(Lab|LAB)\b/.test(r.course_name) ? 'Lab' : 'Lecture'
  })) : [{
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:15',
    room: '',
    instructor: '',
    type: 'Lecture'
  }]);

  const [previewData, setPreviewData] = useState<{ diff: any, newData: RawTimetableData } | null>(null);

  const availableCourses = useMemo(() => {
    return courseCatalogue.filter(c => c.semester === semester).sort((a, b) => a.courseName.localeCompare(b.courseName));
  }, [semester]);

  const handleAddSchedule = () => {
    setSchedules([...schedules, {
      day: 'Monday',
      startTime: '08:00',
      endTime: '09:15',
      room: '',
      instructor: '',
      type: 'Lecture'
    }]);
  };

  const handleRemoveSchedule = (index: number) => {
    if (schedules.length === 1) return;
    const s = [...schedules];
    s.splice(index, 1);
    setSchedules(s);
  };

  const updateSchedule = (index: number, field: string, value: string) => {
    const s = [...schedules];
    (s[index] as any)[field] = value;
    setSchedules(s);
  };

  const handlePreview = () => {
    setError(null);
    if (!courseIdentity) return setError("Please select a valid course from the catalogue.");
    if (!sectionName.trim()) return setError("Please enter a section name.");
    
    const course = availableCourses.find(c => c.courseName === courseIdentity);
    if (!course) return setError("Invalid course.");

    // Validate times
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      if (!s.room.trim()) return setError(`Schedule ${i+1}: Room is required.`);
      if (!s.instructor.trim()) return setError(`Schedule ${i+1}: Instructor is required.`);
      
      const startMin = timeToMinutes(s.startTime);
      const endMin = timeToMinutes(s.endTime);
      if (startMin >= endMin) {
        return setError(`Schedule ${i+1}: End time must be after start time.`);
      }
    }

    // Build new records
    const newRecords: RawTimetableRecord[] = schedules.map(s => ({
      semester,
      section: sectionName.trim().toUpperCase(),
      course_name: s.type === 'Lab' ? `${course.courseName} (Lab)` : course.courseName,
      instructor: s.instructor.trim(),
      day: s.day,
      start_time: s.startTime,
      end_time: s.endTime,
      room: s.room.trim()
    }));

    // If we are editing, we need to filter out the original records being edited
    let baseClasses = currentData.classes;
    if (initialData && initialData.length > 0) {
      baseClasses = baseClasses.filter(record => 
        !initialData.some(initial => 
          initial.course_name === record.course_name && 
          initial.section === record.section && 
          initial.semester === record.semester &&
          initial.day === record.day &&
          initial.start_time === record.start_time &&
          initial.end_time === record.end_time
        )
      );
    }

    // Generate new dataset
    const newData: RawTimetableData = {
      ...currentData,
      classes: [...baseClasses, ...newRecords]
    };

    const diff = generateTimetableDiff(currentData.classes, newData.classes);
    setPreviewData({ diff, newData });
    setStep('preview');
  };

  const [isPublishing, setIsPublishing] = useState(false);

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
        <ImportPreview 
          diff={previewData.diff}
          onCancel={() => setStep('form')}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Add Section Manually</h2>
      </div>

      <div className="p-6 max-w-4xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium mt-0.5">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
            <select 
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                setCourseIdentity(''); // reset course on semester change
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option>1st Semester</option>
              <option>2nd Semester</option>
              <option>3rd Semester</option>
              <option>4th Semester</option>
              <option>5th Semester</option>
              <option>6th Semester</option>
              <option>7th Semester</option>
              <option>8th Semester</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Official Course</label>
            <select 
              value={courseIdentity}
              onChange={(e) => setCourseIdentity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">-- Select Course --</option>
              {availableCourses.map(c => (
                <option key={c.courseName} value={c.courseName}>{c.courseName} ({c.shortName})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
            <input 
              type="text" 
              placeholder="e.g. BSCS-7N"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="font-semibold text-slate-900">Schedule Blocks</h3>
          <button 
            onClick={handleAddSchedule}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {schedules.map((s, index) => (
            <div key={index} className="flex items-end gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-500 mb-1">Day</label>
                <select 
                  value={s.day} onChange={(e) => updateSchedule(index, 'day', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                >
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-500 mb-1">Start</label>
                <input 
                  type="time" 
                  value={s.startTime} onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-500 mb-1">End</label>
                <input 
                  type="time" 
                  value={s.endTime} onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                <select 
                  value={s.type} onChange={(e) => updateSchedule(index, 'type', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                >
                  <option>Lecture</option>
                  <option>Lab</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Room</label>
                <input 
                  type="text" placeholder="e.g. FIT-305"
                  value={s.room} onChange={(e) => updateSchedule(index, 'room', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Instructor</label>
                <input 
                  type="text" placeholder="e.g. Dr. Example"
                  value={s.instructor} onChange={(e) => updateSchedule(index, 'instructor', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>
              
              <button 
                onClick={() => handleRemoveSchedule(index)}
                disabled={schedules.length === 1}
                className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors rounded border border-transparent hover:border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-6 flex justify-end">
          <button 
            onClick={handlePreview}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Review Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function timeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
