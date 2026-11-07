import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import CoordinatorDashboard from './pages/CoordinatorDashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';

function RoleBasedDashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'STUDENT') return <StudentDashboard />;
  if (user.role === 'COMPANY') return <CompanyDashboard />;
  if (user.role === 'COORDINATOR') return <CoordinatorDashboard />;
  return <Navigate to="/login" replace />;
}

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RoleBasedDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MainLayout>
                  <StudentDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MainLayout>
                  <StudentDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
