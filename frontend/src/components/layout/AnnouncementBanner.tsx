import { useState, useEffect } from 'react';
import { Megaphone, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/announcements/`);
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
        }
      } catch (e) {
        // Non-blocking — silently fail
        console.log('Announcements unavailable');
      }
    };
    fetchAnnouncements();
  }, []);

  if (dismissed || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Announcement</span>
                {announcements.length > 1 && (
                  <span className="text-xs text-blue-300">
                    ({currentIndex + 1}/{announcements.length})
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold truncate">{current.title}</p>
              <p className="text-xs text-blue-100 truncate mt-0.5">{current.content}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {announcements.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex(i => (i - 1 + announcements.length) % announcements.length)}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentIndex(i => (i + 1) % announcements.length)}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors ml-2"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
