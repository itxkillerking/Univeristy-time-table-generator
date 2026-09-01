import { useState, useEffect } from 'react';
import { Loader2, Users, FileText, Download, BarChart2 } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api/apiClient';

type AnalyticsData = {
  unique_sessions: number;
  timetables_generated: number;
  pdfs_generated: number;
};

type AnalyticsResponse = {
  today: AnalyticsData;
  seven_days: AnalyticsData;
  thirty_days: AnalyticsData;
  all_time: AnalyticsData;
};

type Period = 'today' | 'seven_days' | 'thirty_days' | 'all_time';

export default function AnalyticsAdmin() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('seven_days');

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth('/api/admin/analytics/');
        if (!response.ok) {
          throw new Error('Failed to load analytics');
        }
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error || 'Failed to load analytics data.'}
      </div>
    );
  }

  const currentData = data[period];

  const statCards = [
    {
      title: "Anonymous Unique Visitors",
      value: currentData.unique_sessions.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Timetables Generated",
      value: currentData.timetables_generated.toLocaleString(),
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "PDFs Generated",
      value: currentData.pdfs_generated.toLocaleString(),
      icon: Download,
      color: "text-purple-600",
      bg: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-6 h-6 text-slate-700 flex-shrink-0" />
          <h2 className="text-xl font-bold text-slate-900 break-words">Anonymous Usage Analytics</h2>
        </div>
        
        {/* Period Filter */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg gap-1">
          <button
            onClick={() => setPeriod('today')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors text-center ${period === 'today' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('seven_days')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors text-center ${period === 'seven_days' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod('thirty_days')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors text-center ${period === 'thirty_days' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            30 Days
          </button>
          <button
            onClick={() => setPeriod('all_time')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors text-center ${period === 'all_time' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <h3 className="text-sm font-medium text-slate-500 mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex gap-3 mt-8">
        <Users className="w-5 h-5 flex-shrink-0" />
        <p>
          <strong>Privacy Notice:</strong> Analytics are strictly anonymous. We do not collect names, emails, IPs, or any personally identifiable information. Unique visitors are tracked via an anonymous randomized browser identifier to provide reliable usage statistics.
        </p>
      </div>
    </div>
  );
}
