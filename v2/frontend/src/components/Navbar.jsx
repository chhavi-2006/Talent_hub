import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">TalentHub</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Campus Placement Portal</p>
          </div>
        </Link>

        {/* Persona Navigation Links */}
        <nav className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium">
          {user.role === 'STUDENT' && (
            <>
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                  isActive('/dashboard')
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Overview</span>
              </Link>

              <Link
                to="/jobs"
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                  isActive('/jobs')
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Job Drives</span>
              </Link>

              <Link
                to="/applications"
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                  isActive('/applications')
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>My Applications</span>
              </Link>
            </>
          )}

          {user.role === 'COMPANY' && (
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                isActive('/dashboard')
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Hiring Hub</span>
            </Link>
          )}

          {user.role === 'COORDINATOR' && (
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                isActive('/dashboard')
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Placement Cell Command</span>
            </Link>
          )}
        </nav>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs md:text-sm font-semibold text-slate-800 flex items-center gap-2 justify-end">
              <span>{user.name}</span>
              {user.role === 'STUDENT' && user.placement_status && (
                <StatusBadge status={user.placement_status} size="xs" />
              )}
              {user.role === 'COMPANY' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Partner
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500">{user.email}</div>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition shadow-sm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
