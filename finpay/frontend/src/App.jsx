import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import MerchantTerminal from './pages/MerchantTerminal.jsx';
import Reconciliation from './pages/Reconciliation.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';

function RoleLanding() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'MERCHANT') return <Navigate to="/merchant" replace />;
  if (user.role === 'AUDITOR') return <Navigate to="/reconciliation" replace />;
  return <StudentDashboard />;
}

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MainLayout>
                  <RoleLanding />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/merchant"
            element={
              <ProtectedRoute allowedRoles={['MERCHANT']}>
                <MainLayout>
                  <MerchantTerminal />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reconciliation"
            element={
              <ProtectedRoute allowedRoles={['AUDITOR']}>
                <MainLayout>
                  <Reconciliation />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
