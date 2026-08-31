import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api/apiClient';

interface Props {
  onClose: () => void;
  onRollbackSuccess: () => void;
}

export default function RollbackModal({ onClose, onRollbackSuccess }: Props) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await fetchWithAuth('/api/admin/timetable/versions/');
        if (res.ok) {
          const data = await res.json();
          // Filter out the active one if we want, or just show it as Active
          setVersions(data);
        } else {
          setError('Failed to fetch versions.');
        }
      } catch (err) {
        setError('Network error loading versions.');
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, []);

  const handleRollback = async (id: number) => {
    if (!confirm('Are you sure you want to rollback to this version? This will become the active timetable for all students.')) {
      return;
    }
    
    setRollingBack(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/timetable/rollback/${id}/`, {
        method: 'POST'
      });
      if (res.ok) {
        onRollbackSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to rollback.');
      }
    } catch (err) {
      setError('Network error during rollback.');
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Rollback Timetable</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
             <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-200">
               <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <p className="text-sm font-medium mt-0.5">{error}</p>
             </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
               <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
               No archived versions available to rollback to.
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map(v => (
                 <div key={v.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between bg-slate-50 hover:bg-white transition-colors">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{v.name || v.id}</p>
                      <p className="text-xs text-slate-500 mt-1">
                         Created: {new Date(v.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                         {v.recordCount} records • {v.sectionCount} sections
                      </p>
                    </div>
                    <button 
                      disabled={rollingBack || v.status === 'PUBLISHED'}
                      onClick={() => handleRollback(v.id)}
                      className={`px-4 py-2 font-semibold text-sm rounded-lg transition-colors ${v.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50'}`}
                    >
                      {rollingBack ? <Loader2 className="w-4 h-4 animate-spin" /> : (v.status === 'PUBLISHED' ? 'Active' : 'Restore')}
                    </button>
                 </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
