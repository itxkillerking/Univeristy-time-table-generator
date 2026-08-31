import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Layout Components
import Navbar from './components/layout/Navbar.tsx';
import AnnouncementBanner from './components/layout/AnnouncementBanner.tsx';
import Footer from './components/layout/Footer.tsx';
// Page Components
import HomePage from './pages/HomePage.tsx';
import BuilderPage from './pages/BuilderPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import ReportPage from './pages/ReportPage.tsx';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';
import { AuthProvider } from './context/AuthContext.tsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <AnnouncementBanner />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/builder" element={<BuilderPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/report" element={<ReportPage />} />
              
              {/* Admin-only Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

