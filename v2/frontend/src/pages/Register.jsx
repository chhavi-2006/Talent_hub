import {
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const BRANCH_OPTIONS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
];

export default function Register() {
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [studentForm, setStudentForm] = useState({
    name: '',
    usn: '',
    email: '',
    password: '',
    branch: 'Computer Science',
    cgpa: 8.0,
    active_backlogs: 0,
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    password: '',
    description: '',
    website: '',
  });

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...studentForm,
        cgpa: parseFloat(studentForm.cgpa),
        active_backlogs: parseInt(studentForm.active_backlogs, 10),
      };
      const { data } = await client.post('/auth/register/student', payload);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/register/company', companyForm);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Company registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create an Account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Register with TalentHub to participate in campus placement drives
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white border border-slate-200/90 py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl sm:px-10 space-y-6">
          {/* Persona Segment Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setRole('STUDENT');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
                role === 'STUDENT'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" /> Student Enrollment
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('COMPANY');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
                role === 'COMPANY'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600" /> Corporate Recruiter
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Student Signup Form */}
          {role === 'STUDENT' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ananya Rao"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    University Roll No / USN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1TH22CS088"
                    value={studentForm.usn}
                    onChange={(e) => setStudentForm({ ...studentForm, usn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    placeholder="ananya@student.talenthub.edu"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Branch / Major
                  </label>
                  <select
                    value={studentForm.branch}
                    onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                  >
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cumulative CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={studentForm.cgpa}
                    onChange={(e) => setStudentForm({ ...studentForm, cgpa: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Active Backlogs
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={studentForm.active_backlogs}
                    onChange={(e) => setStudentForm({ ...studentForm, active_backlogs: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
              >
                {loading ? 'Creating Student Profile...' : 'Complete Registration'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Company Signup Form */}
          {role === 'COMPANY' && (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Databricks India Technologies"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Corporate Email
                  </label>
                  <input
                    type="email"
                    placeholder="talent@databricks.com"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={companyForm.password}
                    onChange={(e) => setCompanyForm({ ...companyForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Website
                </label>
                <input
                  type="url"
                  placeholder="https://databricks.com"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company Overview & Technology Focus
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell students about your company, engineering culture, and products..."
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
              >
                {loading ? 'Registering Corporate Partner...' : 'Create Recruiter Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
