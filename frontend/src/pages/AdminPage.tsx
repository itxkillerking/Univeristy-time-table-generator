import TimetableAdmin from '../components/admin/TimetableAdmin';

export default function AdminPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Timetable Management</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Manage timetable sections and safely publish timetable updates. 
            All changes are validated and reviewed before affecting the student-facing builder.
          </p>
        </div>
        
        <TimetableAdmin />
      </div>
    </div>
  );
}
