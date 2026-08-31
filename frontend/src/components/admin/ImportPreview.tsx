import { useState } from 'react';
import type { DiffResult, SectionDiff } from '../../lib/admin/timetableDiff';
import type { RawTimetableRecord } from '../../lib/timetable/timetableValidator';
import { AlertCircle, ArrowLeft, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';

interface Props {
  diff: DiffResult;
  onCancel: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export default function ImportPreview({ diff, onCancel, onPublish, isPublishing }: Props) {
  const [viewState, setViewState] = useState<'summary' | 'review'>('summary');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const hasInvalid = diff.invalid.length > 0;
  const hasUnresolved = diff.unresolved.length > 0;
  const preventPublish = hasInvalid || hasUnresolved;
  const totalValidChanges = diff.added.length + diff.changed.length + diff.removed.length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={viewState === 'summary' ? onCancel : () => setViewState('summary')} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {viewState === 'summary' ? 'Import Summary' : 'Review Changes'}
            </h2>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6">
          {viewState === 'summary' && (
            <SummaryView diff={diff} onReview={() => setViewState('review')} hasValidChanges={totalValidChanges > 0} />
          )}

          {viewState === 'review' && (
            <div className="space-y-8">
              {diff.added.length > 0 && (
                <SectionList title="NEW SECTIONS" color="green" sections={diff.added} type="new" />
              )}
              {diff.changed.length > 0 && (
                <SectionList title="CHANGED SECTIONS" color="blue" sections={diff.changed} type="changed" />
              )}
              {diff.removed.length > 0 && (
                <SectionList title="⚠ POTENTIALLY REMOVED" color="amber" sections={diff.removed} type="removed" />
              )}
              {totalValidChanges === 0 && (
                <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No valid changes detected compared to the current dataset.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel Import
          </button>
          
          {viewState === 'review' && (
            <button 
              disabled={preventPublish}
              onClick={() => setShowPublishConfirm(true)}
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {preventPublish ? 'Cannot Publish (Fix Issues)' : 'Review & Publish'}
            </button>
          )}
        </div>
      </div>

      {showPublishConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Publication</h3>
              <p className="text-slate-600 mb-6">
                You are about to publish the reviewed timetable changes. The existing dataset will be backed up.
              </p>
              
              <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-slate-600">New Sections:</span>
                  <span className="font-bold text-slate-900">{diff.added.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Changed Sections:</span>
                  <span className="font-bold text-slate-900">{diff.changed.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Removed Sections:</span>
                  <span className="font-bold text-slate-900">{diff.removed.length}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPublishConfirm(false)}
                  className="flex-1 px-4 py-2 text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={onPublish}
                  disabled={isPublishing}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Confirm Publish"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------
// Subcomponents
// ------------------------------------------

function SummaryView({ diff, onReview, hasValidChanges }: { diff: DiffResult, onReview: () => void, hasValidChanges: boolean }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <p className="text-sm font-medium text-green-700">Added</p>
          <p className="text-2xl font-bold text-green-800">{diff.added.length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm font-medium text-blue-700">Changed</p>
          <p className="text-2xl font-bold text-blue-800">{diff.changed.length}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <p className="text-sm font-medium text-amber-700">Removed</p>
          <p className="text-2xl font-bold text-amber-800">{diff.removed.length}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <p className="text-sm font-medium text-orange-700">Unresolved</p>
          <p className="text-2xl font-bold text-orange-800">{diff.unresolved.length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <p className="text-sm font-medium text-red-700">Invalid</p>
          <p className="text-2xl font-bold text-red-800">{diff.invalid.length}</p>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={onReview}
          disabled={!hasValidChanges && diff.unresolved.length === 0 && diff.invalid.length === 0}
          className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
        >
          Review Valid Changes &rarr;
        </button>
      </div>

      {diff.unresolved.length > 0 && (
        <div className="mt-8 border border-orange-200 rounded-lg overflow-hidden">
          <div className="bg-orange-50 p-4 border-b border-orange-200 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-orange-800">Unresolved Courses ({diff.unresolved.length})</h4>
              <p className="text-sm text-orange-700 mt-1">
                These records contain course names that do not exist in the official course catalogue for their respective semesters. 
                They will prevent publishing until fixed in the source JSON or until official aliases are added.
              </p>
            </div>
          </div>
          <div className="p-4 bg-white max-h-96 overflow-y-auto space-y-3">
             {diff.unresolved.map((r, i) => <ErrorRecordRow key={i} record={r} reason="No matching official course exists in the current catalogue." />)}
          </div>
        </div>
      )}

      {diff.invalid.length > 0 && (
        <div className="mt-8 border border-red-200 rounded-lg overflow-hidden">
          <div className="bg-red-50 p-4 border-b border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-800">Invalid Records ({diff.invalid.length})</h4>
              <p className="text-sm text-red-700 mt-1">
                These records contain structural errors (e.g. start time &gt;= end time) or miss required fields.
              </p>
            </div>
          </div>
          <div className="p-4 bg-white max-h-96 overflow-y-auto space-y-3">
             {diff.invalid.map((r, i) => <ErrorRecordRow key={i} record={r} reason="Malformed record or illogical times." />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorRecordRow({ record, reason }: { record: RawTimetableRecord, reason: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div><span className="text-slate-500 font-medium">Semester:</span> <span className="font-semibold text-slate-800">{record.semester}</span></div>
        <div><span className="text-slate-500 font-medium">Course:</span> <span className="font-semibold text-slate-800">{record.course_name}</span></div>
        <div><span className="text-slate-500 font-medium">Section:</span> <span className="font-semibold text-slate-800">{record.section}</span></div>
        <div><span className="text-slate-500 font-medium">Room:</span> <span className="font-semibold text-slate-800">{record.room || 'N/A'}</span></div>
        <div><span className="text-slate-500 font-medium">Day:</span> <span className="font-semibold text-slate-800">{record.day}</span></div>
        <div><span className="text-slate-500 font-medium">Time:</span> <span className="font-semibold text-slate-800">{record.start_time} - {record.end_time}</span></div>
        <div className="md:col-span-2"><span className="text-slate-500 font-medium">Instructor:</span> <span className="font-semibold text-slate-800">{record.instructor || 'N/A'}</span></div>
      </div>
      <div className="mt-1 text-red-600 bg-red-50/50 p-2 rounded border border-red-100">
        <span className="font-medium">Reason:</span> {reason}
      </div>
    </div>
  );
}

function SectionList({ title, color, sections, type }: { title: string, color: string, sections: SectionDiff[], type: string }) {
  const [expanded, setExpanded] = useState(true);
  
  const colorClasses = {
    green: "text-green-700 bg-green-50 border-green-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200"
  }[color] || "text-slate-700 bg-slate-50 border-slate-200";

  return (
    <div>
      <button 
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-2 flex items-center justify-between rounded-lg border font-bold ${colorClasses}`}
      >
        <span className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          {title} ({sections.length})
        </span>
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-3 pl-2">
          {sections.map(sec => (
            <ChangeCard key={sec.id} section={sec} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeCard({ section, type }: { section: SectionDiff, type: string }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-slate-900">{section.canonicalCourseName}</h4>
          <p className="text-sm text-slate-500 font-medium">{section.semester} · Section {section.section}</p>
        </div>
      </div>
      
      {type === 'changed' ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 p-3 rounded border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Current</span>
            <ScheduleRecordsList records={section.currentRecords} />
          </div>
          <div className="bg-blue-50/30 p-3 rounded border border-blue-100">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2 block">Imported</span>
            <ScheduleRecordsList records={section.importedRecords} />
          </div>
        </div>
      ) : type === 'new' ? (
        <div className="text-sm bg-green-50/30 p-3 rounded border border-green-100">
          <ScheduleRecordsList records={section.importedRecords} />
        </div>
      ) : (
        <div className="text-sm bg-amber-50/30 p-3 rounded border border-amber-100">
           <ScheduleRecordsList records={section.currentRecords} />
        </div>
      )}
    </div>
  );
}

function ScheduleRecordsList({ records }: { records: RawTimetableRecord[] }) {
  if (records.length === 0) return <span className="text-slate-400 italic">No records</span>;
  
  return (
    <ul className="space-y-2">
      {records.map((r, i) => (
        <li key={i} className="text-slate-700">
          <span className="font-medium">{r.day}</span> · {r.start_time} - {r.end_time}
          <br/>
          <span className="text-slate-500">{r.room} · {r.instructor}</span>
        </li>
      ))}
    </ul>
  );
}
