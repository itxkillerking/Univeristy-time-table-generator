import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../lib/api/apiClient';
import { MessageSquareWarning, Send, Clock, CheckCircle2, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Report {
  id: number;
  category: string;
  course: string | null;
  section: string | null;
  message: string;
  status: 'OPEN' | 'NOTED' | 'RESOLVED';
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
}

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState('Timetable Error');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [message, setMessage] = useState('');

  const loadReports = async () => {
    try {
      const res = await fetchWithAuth('/api/reports/');
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
    if (user) {
      loadReports();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a message detailing the problem.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/reports/', {
        method: 'POST',
        body: JSON.stringify({ category, course, section, message })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit report');
      }
      
      setMessage('');
      setCourse('');
      setSection('');
      loadReports();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Show auth prompt if user is not logged in
  if (!authLoading && !user) {
    return (
      <div className="bg-slate-50 min-h-screen py-10">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4 inline-block">
              &larr; Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <MessageSquareWarning className="w-8 h-8 text-indigo-600" />
              Report a Problem
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Login Required</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              You need a student account to submit and track your reports. Login or create a free account to continue.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/login"
                state={{ from: { pathname: '/report' } }}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                to="/register"
                state={{ from: { pathname: '/report' } }}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquareWarning className="w-8 h-8 text-indigo-600" />
            Report a Problem
          </h1>
          <p className="mt-2 text-slate-600">
            Submit any issues regarding clashes, missing sections, or incorrect times.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-900">New Report</h2>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium mt-0.5">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select 
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option>Timetable Error</option>
                    <option>Missing Course/Section</option>
                    <option>Clash Not Detected</option>
                    <option>Platform Bug</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course (Optional)</label>
                  <input 
                    type="text" value={course} onChange={e => setCourse(e.target.value)}
                    placeholder="e.g. Computer Networks"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Section (Optional)</label>
                  <input 
                    type="text" value={section} onChange={e => setSection(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                <textarea 
                  rows={4} value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Describe the problem in detail..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Your Past Reports</h2>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {reports.length} Total
            </span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-slate-500">You haven't submitted any reports yet.</div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        report.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        report.status === 'NOTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {report.status}
                      </span>
                      <h3 className="font-semibold text-slate-900">{report.category}</h3>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {(report.course || report.section) && (
                    <div className="text-xs text-slate-500 mb-3 flex gap-4">
                      {report.course && <span><strong className="text-slate-600">Course:</strong> {report.course}</span>}
                      {report.section && <span><strong className="text-slate-600">Section:</strong> {report.section}</span>}
                    </div>
                  )}
                  
                  <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {report.message}
                  </p>
                  
                  {report.admin_reply && (
                    <div className="mt-4 pl-4 border-l-2 border-indigo-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-900">Admin Response</span>
                        <span className="text-xs text-slate-400">
                          {report.replied_at && new Date(report.replied_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">
                        {report.admin_reply}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
