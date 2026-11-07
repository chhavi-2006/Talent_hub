import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Download,
  Filter,
  GraduationCap,
  Percent,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function CoordinatorDashboard() {
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = async () => {
    try {
      const [statsRes, appsRes, studentsRes] = await Promise.all([
        client.get('/coordinator/stats'),
        client.get('/coordinator/applications'),
        client.get('/students'),
      ]);
      setStats(statsRes.data);
      setApplications(appsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error('Failed to load coordinator analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserActive = async (userId) => {
    try {
      await client.patch(`/coordinator/users/${userId}/toggle-active`);
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Could not update user account status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading institutional placement analytics...</span>
        </div>
      </div>
    );
  }

  // Calculate Branch-wise statistics
  const branchMap = {};
  students.forEach((s) => {
    if (!branchMap[s.branch]) {
      branchMap[s.branch] = { total: 0, placed: 0 };
    }
    branchMap[s.branch].total += 1;
    if (s.placement_status === 'PLACED') {
      branchMap[s.branch].placed += 1;
    }
  });

  const branchStats = Object.keys(branchMap).map((b) => {
    const data = branchMap[b];
    const pct = data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0;
    return { branch: b, total: data.total, placed: data.placed, percentage: pct };
  });

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student_usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = branchFilter === 'ALL' || app.student_branch === branchFilter;
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  const kpis = [
    {
      label: 'Placement Percentage',
      value: `${stats.placement_percentage}%`,
      sub: `${stats.placed_students} Placed of ${stats.total_students} Students`,
      color: 'text-emerald-700',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    },
    {
      label: 'Average Annual CTC',
      value: `${stats.avg_package_lpa} LPA`,
      sub: `Highest Recorded: ${stats.highest_package_lpa} LPA`,
      color: 'text-indigo-700',
      icon: DollarSign,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    },
    {
      label: 'Active Job Drives',
      value: stats.active_jobs,
      sub: `${stats.total_jobs} Total Published Drives`,
      color: 'text-amber-700',
      icon: Briefcase,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    },
    {
      label: 'Unplaced Candidates',
      value: stats.unplaced_students,
      sub: 'Eligible for Upcoming Drives',
      color: 'text-rose-700',
      icon: Users,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
    },
    {
      label: 'Total Applications',
      value: stats.total_applications,
      sub: `${stats.offers_issued} Formal Offers Dispatched`,
      color: 'text-sky-700',
      icon: CheckCircle2,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200/80',
    },
    {
      label: 'Partner Employers',
      value: stats.total_companies,
      sub: 'Verified Corporate Recruiters',
      color: 'text-purple-700',
      icon: Building2,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200/80',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Cell Control Center</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Authority View
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Institutional Recruitment Analytics, Policy Enforcement & Multi-Department KPIs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-800 block">Placement Season Active</span>
            <span className="text-[11px] text-emerald-700 font-medium">One-Offer Policy Enforced</span>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-slate-300 transition"
            >
              <div className={`p-3.5 border rounded-2xl shrink-0 ${k.iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className={`text-2xl font-black ${k.color} tracking-tight`}>{k.value}</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">{k.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department-Wise Placement Performance */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" /> Academic Branch Placement Performance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branchStats.map((bs) => (
            <div key={bs.branch} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{bs.branch}</span>
                <span className="font-bold text-emerald-700">{bs.percentage}% Placed</span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${bs.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>
                  {bs.placed} Placed of {bs.total} Enrolled
                </span>
                <span>{bs.total - bs.placed} Seeking</span>
              </div>
            </div>
          ))}

          {branchStats.length === 0 && (
            <p className="text-xs text-slate-500 py-4 col-span-full text-center">No branch statistics available.</p>
          )}
        </div>
      </div>

      {/* Master Audit Log & Applications Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> University Master Application & Hiring Audit Log ({filteredApps.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking across all departments, corporate recruitment drives, and interview stages
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student, USN, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm w-56 font-medium"
              />
            </div>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
            >
              <option value="ALL">All Branches</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electrical">Electrical</option>
              <option value="Civil">Civil</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEWING">In Assessment</option>
              <option value="INTERVIEW_PASSED">Rounds Cleared</option>
              <option value="OFFERED">Offer Extended</option>
              <option value="ACCEPTED">Offer Accepted</option>
              <option value="DECLINED">Declined</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN_PLACED">Auto-Withdrawn (Placed)</option>
            </select>
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Student & USN</th>
                <th className="py-3 px-4">Branch & CGPA</th>
                <th className="py-3 px-4">Employer Drive</th>
                <th className="py-3 px-4">Offered Package</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4">Rounds</th>
                <th className="py-3 px-4">Offer State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredApps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{a.student_name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{a.student_usn}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 font-medium">{a.student_branch}</div>
                    <div className="text-[11px] text-indigo-700 font-mono font-medium">
                      CGPA {a.student_cgpa} • Backlogs: {a.student_backlogs}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{a.company_name}</div>
                    <div className="text-[11px] text-slate-500">{a.job_title}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    {a.package_lpa} LPA
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={a.status} size="xs" />
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700 text-[11px] font-medium">
                      {a.interview_rounds?.length || 0} Stage(s)
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {a.offer ? (
                      <div className="space-y-0.5">
                        <StatusBadge status={a.offer.status} size="xs" />
                        <div className="text-[10px] text-emerald-700 font-semibold">{a.offer.package_lpa} LPA</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No matching applications found in the audit database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
