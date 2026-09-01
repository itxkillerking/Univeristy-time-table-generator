import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../lib/api/apiClient';
import { MessageSquareWarning, AlertCircle } from 'lucide-react';

interface AdminReport {
  id: number;
  student_details: { username: string; email: string };
  category: string;
  course: string | null;
  section: string | null;
  message: string;
  status: 'OPEN' | 'NOTED' | 'RESOLVED';
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
  replied_by_details: { username: string } | null;
}

export default function ReportsAdmin() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  
  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'OPEN' | 'NOTED' | 'RESOLVED'>('OPEN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/reports/');
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSelectReport = (report: AdminReport) => {
    setSelectedReport(report);
    setReplyText(report.admin_reply || '');
    setReplyStatus(report.status);
    setError(null);
  };

  const handleUpdate = async () => {
    if (!selectedReport) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/reports/${selectedReport.id}/`, {
        method: 'PUT',
        body: JSON.stringify({
          status: replyStatus,
          admin_reply: replyText.trim() || null
        })
      });
      if (!res.ok) throw new Error('Failed to update report.');
      
      const updated = await res.json();
      setReports(reports.map(r => r.id === updated.id ? updated : r));
      setSelectedReport(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading reports...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Reports List */}
      <div className={`lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px] lg:h-[600px] ${selectedReport ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">All Reports</h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">{reports.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {reports.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No reports found.</div>
          ) : (
            reports.map(report => (
              <button 
                key={report.id}
                onClick={() => handleSelectReport(report)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${selectedReport?.id === report.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-slate-900 truncate">{report.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    report.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                    report.status === 'NOTED' ? 'bg-blue-100 text-blue-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate mb-1">From: {report.student_details.username}</div>
                <div className="text-xs text-slate-400">{new Date(report.created_at).toLocaleDateString()}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Report Details & Reply */}
      <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-auto min-h-[500px] lg:h-[600px] ${!selectedReport ? 'hidden lg:flex' : 'flex'}`}>
        {!selectedReport ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageSquareWarning className="w-12 h-12 mb-4 text-slate-200" />
            <p>Select a report from the left to view details and reply.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50 overflow-y-auto flex-1">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 sm:hidden">
                    <button onClick={() => setSelectedReport(null)} className="p-1 -ml-1 text-slate-500 hover:bg-slate-200 rounded">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      selectedReport.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                      selectedReport.status === 'NOTED' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 break-words">{selectedReport.category}</h2>
                  <p className="text-sm text-slate-500 mt-1">Submitted by {selectedReport.student_details.username} on {new Date(selectedReport.created_at).toLocaleString()}</p>
                </div>
                <span className={`hidden sm:inline-block px-3 py-1 text-xs font-bold rounded-full ${
                  selectedReport.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                  selectedReport.status === 'NOTED' ? 'bg-blue-100 text-blue-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedReport.status}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-6 text-sm">
                {selectedReport.course && (
                  <div className="bg-white px-3 py-2 rounded border border-slate-200">
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Course</span>
                    <span className="font-medium text-slate-900">{selectedReport.course}</span>
                  </div>
                )}
                {selectedReport.section && (
                  <div className="bg-white px-3 py-2 rounded border border-slate-200">
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Section</span>
                    <span className="font-medium text-slate-900">{selectedReport.section}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-slate-200 text-slate-800 shadow-sm whitespace-pre-wrap">
                {selectedReport.message}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Admin Action</h3>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Update Status</label>
                  <select 
                    value={replyStatus} 
                    onChange={e => setReplyStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="OPEN">OPEN (Requires Action)</option>
                    <option value="NOTED">NOTED (Acknowledged but no direct fix)</option>
                    <option value="RESOLVED">RESOLVED (Fixed or answered)</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">Reply to Student (Optional)</label>
                <textarea 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Enter response that the student will see..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 text-center"
                >
                  {submitting ? 'Saving...' : 'Save & Update'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
