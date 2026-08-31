import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If there's a backend connection error, show a specific message instead of redirecting
  if (error === "Unable to connect to the Django server.") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Backend Unavailable</h2>
        <p className="text-slate-500 max-w-md">
          Unable to connect to the Django server.
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500">Administrator access required.</p>
      </div>
    );
  }

  return <Outlet />;
}
