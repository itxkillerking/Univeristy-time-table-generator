import { useState, useEffect } from 'react';
import { validateTimetableData, type RawTimetableData } from '../../lib/timetable/timetableValidator';
import TimetableImport from './TimetableImport';
import ManualSectionForm from './ManualSectionForm';
import ReportsAdmin from './ReportsAdmin';
import AnnouncementsAdmin from './AnnouncementsAdmin';
import AnalyticsAdmin from './AnalyticsAdmin';
import SectionManager from './SectionManager'; // We'll create this to browse and remove sections
import { Upload, Plus, Database, Clock, Loader2, RotateCcw, LogOut } from 'lucide-react';
import RollbackModal from './RollbackModal';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../lib/api/apiClient';

type AdminView = 'dashboard' | 'import' | 'manual' | 'reports' | 'announcements' | 'sections' | 'analytics';

export default function TimetableAdmin() {
  const [view, setView] = useState<AdminView>('dashboard');
  const [currentData, setCurrentData] = useState<RawTimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRollback, setShowRollback] = useState(false);
  const [editSectionData, setEditSectionData] = useState<any>(null);
  const { user, logout } = useAuth();
  
  const [apiStats, setApiStats] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Fetch timetable data
      const dataRes = await fetch(`${API_URL}/api/timetable/`);
      if (dataRes.ok) {
        const raw = await dataRes.json();
        if (validateTimetableData(raw)) {
          setCurrentData(raw);
        } else {
          setCurrentData(null);
        }
      }

      // Fetch admin stats
      const statsRes = await fetchWithAuth('/api/admin/timetable/status/');
      if (statsRes.ok) {
        setApiStats(await statsRes.json());
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (view === 'dashboard' || !currentData) {
      loadData();
    }
  }, [view]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-4 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium">Connecting to Database...</p>
        </div>
      </div>
    );
  }

  const safeData = currentData || { metadata: { title: "New Dataset", source: "Empty", record_count: 0, effective_date: new Date().toISOString(), schema: [] }, classes: [] };

  if (view === 'import') {
    return <TimetableImport onCancel={() => setView('dashboard')} onPublished={() => setView('dashboard')} currentData={safeData} baseVersionId={apiStats?.id} />;
  }

  if (view === 'manual') {
    return <ManualSectionForm onCancel={() => setView('dashboard')} onPublished={() => setView('dashboard')} currentData={safeData} baseVersionId={apiStats?.id} initialData={editSectionData} />;
  }
  
  if (view === 'sections') {
    return <SectionManager 
      currentData={safeData} 
      baseVersionId={apiStats?.id} 
      onCancel={() => setView('dashboard')} 
      onPublished={() => setView('dashboard')}
      onEdit={(sectionData) => {
        setEditSectionData(sectionData);
        setView('manual');
      }}
    />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b border-slate-200 overflow-x-auto hide-scrollbar whitespace-nowrap pb-1">
        <button 
          onClick={() => setView('dashboard')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${view === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Timetable Overview
        </button>
        <button 
          onClick={() => setView('reports')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${view === 'reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Student Reports
        </button>
        <button 
          onClick={() => setView('announcements')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${view === 'announcements' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Announcements
        </button>
        <button 
          onClick={() => setView('analytics')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${view === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Analytics
        </button>
      </div>

      {view === 'reports' && <ReportsAdmin />}
      {view === 'announcements' && <AnnouncementsAdmin />}
      {view === 'analytics' && <AnalyticsAdmin />}
      
      {view === 'dashboard' && (
    <div className="space-y-6">
      {/* Current Dataset Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-slate-900 break-words">Current Published Dataset</h2>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
             <span className="text-sm text-slate-500 truncate">{user?.username} ({user?.role})</span>
             <button onClick={logout} className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors flex-shrink-0">
               <LogOut className="w-4 h-4" /> Logout
             </button>
          </div>
        </div>
        
        {apiStats ? (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-slate-50 p-3 sm:p-0 sm:bg-transparent rounded-lg sm:rounded-none">
              <p className="text-sm font-medium text-slate-500 mb-1">Active Version</p>
              <p className="text-base font-semibold text-slate-900 break-words leading-tight">{apiStats.version}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-0 sm:bg-transparent rounded-lg sm:rounded-none">
              <p className="text-sm font-medium text-slate-500 mb-1">Last Updated</p>
              <p className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="break-words">{new Date(apiStats.lastUpdated).toLocaleString()}</span>
              </p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-0 sm:bg-transparent rounded-lg sm:rounded-none">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Sections</p>
              <p className="text-2xl font-bold text-slate-900">{apiStats.sections}</p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-0 sm:bg-transparent rounded-lg sm:rounded-none">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Schedule Blocks</p>
              <p className="text-2xl font-bold text-slate-900">{apiStats.totalSchedules}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-600 font-medium bg-slate-50">
            No published timetable is available yet. Please import a dataset.
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <button
          onClick={() => setView('import')}
          className="text-left bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all group"
        >
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <Upload className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Import Dataset</h3>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            Upload JSON dataset. Safely compare, review, and publish changes.
          </p>
        </button>

        <button
          onClick={() => { setEditSectionData(null); setView('manual'); }}
          className="text-left bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all group"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-100 transition-colors">
            <Plus className="w-6 h-6 text-slate-700" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Add Section</h3>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            Manually add a new section or correct timetable information quickly.
          </p>
        </button>

        <button
          onClick={() => setView('sections')}
          className="text-left bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
            <Database className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Manage Sections</h3>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            Browse, edit, or remove existing sections with diff preview and safe publish.
          </p>
        </button>
        
        <button
          onClick={() => setShowRollback(true)}
          className="text-left bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all group"
        >
          <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
            <RotateCcw className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Rollback</h3>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            Restore a previously published version of the timetable if a mistake was made.
          </p>
        </button>
      </div>
      
      {showRollback && (
         <RollbackModal onClose={() => setShowRollback(false)} onRollbackSuccess={loadData} />
      )}
      </div>
      )}
    </div>
  );
}
