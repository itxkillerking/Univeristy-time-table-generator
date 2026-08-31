import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../lib/api/apiClient';
import { Megaphone, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_at: string;
}

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/announcements/');
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setStatus('DRAFT');
    setIsEditing(true);
    setError(null);
  };

  const handleEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setStatus(ann.status === 'ARCHIVED' ? 'DRAFT' : ann.status);
    setIsEditing(true);
    setError(null);
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm('Are you sure you want to archive this announcement?')) return;
    try {
      const res = await fetchWithAuth(`/api/admin/announcements/${id}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadAnnouncements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/admin/announcements/${editingId}/` : '/api/admin/announcements/';
      
      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify({ title, content, status })
      });
      
      if (!res.ok) throw new Error('Failed to save announcement.');
      
      setIsEditing(false);
      loadAnnouncements();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading announcements...</div>;

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex gap-2 items-center">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input 
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Timetable Updated for Fall 2026"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
              <textarea 
                rows={6} value={content} onChange={e => setContent(e.target.value)}
                placeholder="Details about the update..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 resize-y"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select 
                value={status} onChange={e => setStatus(e.target.value as any)}
                className="w-full md:w-1/3 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
              >
                <option value="DRAFT">DRAFT (Hidden)</option>
                <option value="PUBLISHED">PUBLISHED (Visible to public)</option>
              </select>
            </div>
            
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                type="button" onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Announcements</h2>
        </div>
        <button 
          onClick={handleCreateNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>
      
      <div className="divide-y divide-slate-100">
        {announcements.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No announcements found. Create one to notify students!</div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="p-6 flex flex-col md:flex-row justify-between gap-4 group">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-slate-900 text-lg">{ann.title}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    ann.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                    ann.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {ann.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-2">{ann.content}</p>
                <span className="text-xs text-slate-400">Created: {new Date(ann.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(ann)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {ann.status !== 'ARCHIVED' && (
                  <button 
                    onClick={() => handleArchive(ann.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Archive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
