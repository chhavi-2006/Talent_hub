import {
  AlertCircle,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  GraduationCap,
  Info,
  Search,
  Sparkles,
  Trophy,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client.js';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function StudentDashboard() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'applications'

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [dreamOnly, setDreamOnly] = useState(false);

  // Modals State
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [offerModalApp, setOfferModalApp] = useState(null);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadData = async () => {
    try {
      const [profRes, jobsRes, appsRes] = await Promise.all([
        client.get('/students/me'),
        client.get('/jobs'),
        client.get('/applications/me'),
      ]);
      setProfile(profRes.data);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const appliedJobIds = new Set(applications.map((a) => a.job_id));
  const isPlaced = profile?.placement_status === 'PLACED';
  const minDreamPackage = profile
    ? Math.max(profile.current_package_lpa * 1.5, 12.0).toFixed(1)
    : '12.0';

  const handleApply = async (jobId) => {
    setSubmittingApp(true);
    setFeedback(null);
    try {
      await client.post('/applications', { job_id: jobId });
      setFeedback({ ok: true, text: 'Application submitted successfully to company review pipeline!' });
      setJobModalOpen(false);
      await loadData();
      await refreshUser();
    } catch (err) {
      setFeedback({
        ok: false,
        text: err?.response?.data?.detail || 'Application could not be submitted. Check policy requirements.',
      });
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleOfferRespond = async (appId, accept) => {
    setFeedback(null);
    try {
      await client.patch(`/offers/${appId}/respond`, { accept });
      setOfferModalApp(null);
      setFeedback({
        ok: true,
        text: accept
          ? '🎉 Congratulations! Offer officially accepted. Under university policy, your status is now PLACED and standard applications have been auto-withdrawn.'
          : 'You have declined this job offer.',
      });
      await loadData();
      await refreshUser();
    } catch (err) {
      setFeedback({ ok: false, text: err?.response?.data?.detail || 'Could not process offer response.' });
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.role_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.company_name && j.company_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBranch =
      branchFilter === 'ALL' ||
      j.eligible_branches.toUpperCase() === 'ALL' ||
      j.eligible_branches.toLowerCase().includes(branchFilter.toLowerCase());

    const matchesDream = !dreamOnly || j.is_dream_offer;

    return matchesSearch && matchesBranch && matchesDream;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading student career portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Hero Student Profile Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-100 shrink-0">
              {profile?.name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile?.name}</h1>
                <StatusBadge status={profile?.placement_status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 text-slate-700 font-semibold">
                  {profile?.usn}
                </span>
                <span>•</span>
                <span className="text-indigo-600 font-bold">{profile?.branch}</span>
                <span>•</span>
                <span>{profile?.email}</span>
              </div>
            </div>
          </div>

          {/* Academic Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center min-w-[95px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">CGPA</span>
              <span className="text-xl font-black text-indigo-600">{profile?.cgpa?.toFixed(2)}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center min-w-[95px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Backlogs</span>
              <span
                className={`text-xl font-black ${
                  profile?.active_backlogs > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {profile?.active_backlogs}
              </span>
            </div>

            {isPlaced ? (
              <div className="col-span-2 sm:col-span-1 bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center min-w-[115px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Placed CTC</span>
                <span className="text-xl font-black text-emerald-700">{profile?.current_package_lpa} LPA</span>
              </div>
            ) : (
              <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center min-w-[115px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Applications</span>
                <span className="text-xl font-black text-slate-800">{applications.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-World One-Offer Policy Banner */}
        {isPlaced ? (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-indigo-50 to-purple-50 border border-emerald-200 flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-emerald-900 font-bold block mb-0.5">
                University Placement Policy Active: One Offer Policy Enforced
              </strong>
              You have secured confirmed placement at <strong>{profile?.current_package_lpa} LPA</strong>. In
              accordance with campus placement regulations, your ongoing standard drives have been completed and
              auto-withdrawn to give opportunities to peers. You are now unlocked to apply exclusively to{' '}
              <strong className="text-purple-700 font-bold">Dream Tier Opportunities (&ge; {minDreamPackage} LPA)</strong>.
            </div>
          </div>
        ) : (
          <div className="mt-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              General Campus Drives: Review eligibility checklist before applying.
            </span>
            <span className="text-slate-500 hidden sm:inline font-medium">Policy: 1 Offer Lock + Dream Upgrade</span>
          </div>
        )}
      </div>

      {/* Floating Action / Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm shadow-md transition-all ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.ok ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('drives')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'drives'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Active Recruitment Drives ({jobs.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'applications'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" /> My Applications & Interviews ({applications.length})
        </button>
      </div>

      {/* TAB 1: RECRUITMENT DRIVES */}
      {activeTab === 'drives' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search company or role title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 font-medium"
              >
                <option value="ALL">All Branches</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="Civil">Civil</option>
              </select>

              <button
                type="button"
                onClick={() => setDreamOnly((d) => !d)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  dreamOnly
                    ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Dream Tier Only
              </button>
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => {
              const hasApplied = appliedJobIds.has(job.id);
              const branchMatch =
                job.eligible_branches.toUpperCase() === 'ALL' ||
                job.eligible_branches.toLowerCase().includes(profile?.branch?.toLowerCase() || '');

              return (
                <div
                  key={job.id}
                  className="bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md rounded-2xl p-6 shadow-sm flex flex-col justify-between transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {job.company_name}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {job.role_title}
                        </h3>
                      </div>

                      {job.is_dream_offer && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                          <Sparkles className="w-3 h-3 text-purple-600" /> Dream Tier
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-600">{job.package_lpa} LPA</span>
                      <span className="text-[11px] text-slate-500 font-medium">Annual Package</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{job.description}</p>

                    {/* Eligibility Tags */}
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 font-medium">
                        Min CGPA: <strong>{job.min_cgpa}</strong>
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 font-medium">
                        Max Backlogs: <strong>{job.max_backlogs}</strong>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border font-medium ${
                          branchMatch
                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                      >
                        Branches: {job.eligible_branches}
                      </span>
                    </div>

                    {/* Policy Reason Alert if Ineligible */}
                    {!job.eligible && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                        <span>{job.eligibility_reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setJobModalOpen(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                    >
                      Check Criteria & Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {hasApplied ? (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200">
                        ✓ Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setJobModalOpen(true);
                        }}
                        disabled={!job.eligible}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition"
                      >
                        Apply Drive
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredJobs.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <Briefcase className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm">No campus recruitment drives matched your current filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPLICATIONS & INTERVIEW TIMELINES */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.map((app) => {
            const rounds = app.interview_rounds || [];

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {app.company_name}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{app.job_title}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Offered Package: <span className="text-emerald-600 font-bold">{app.package_lpa} LPA</span> |
                      Applied on {new Date(app.applied_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                  </div>
                </div>

                {/* Multi-Round Progress Tracker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Hiring Assessment Progression</span>
                    <span>
                      {rounds.length} Stage{rounds.length !== 1 ? 's' : ''} Completed / Scheduled
                    </span>
                  </div>

                  {rounds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rounds.map((rnd) => (
                        <div
                          key={rnd.id}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              Round {rnd.round_number}: {rnd.round_type.replaceAll('_', ' ')}
                            </span>
                            <StatusBadge status={rnd.result} size="xs" />
                          </div>

                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            {new Date(rnd.scheduled_at).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </div>

                          {rnd.score !== null && (
                            <div className="text-[11px] text-indigo-700 font-medium">
                              Evaluation Score: <strong>{rnd.score} / 10</strong>
                            </div>
                          )}

                          {rnd.feedback && (
                            <div className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                              "{rnd.feedback}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 text-center font-medium">
                      {app.status === 'APPLIED'
                        ? 'Application submitted. Corporate recruiters are currently reviewing your academic profile.'
                        : 'No interview rounds scheduled yet.'}
                    </div>
                  )}
                </div>

                {/* Offer Extended Banner & Action */}
                {app.offer && app.status === 'OFFERED' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-100">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Official Placement Offer Extended!</div>
                        <div className="text-xs text-slate-600">
                          Package: <strong className="text-emerald-700">{app.offer.package_lpa} LPA</strong> ({app.company_name})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        onClick={() => setOfferModalApp(app)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 transition"
                      >
                        Review & Accept Offer
                      </button>
                      <button
                        onClick={() => handleOfferRespond(app.id, false)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-xl text-xs font-bold transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {applications.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm">You haven't applied to any job drives yet.</p>
              <button
                onClick={() => setActiveTab('drives')}
                className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Browse active drives &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: JOB ELIGIBILITY CHECKLIST MODAL */}
      <Modal
        isOpen={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        title={selectedJob ? `${selectedJob.company_name} — ${selectedJob.role_title}` : 'Job Details'}
      >
        {selectedJob && (
          <div className="space-y-5">
            <div>
              <div className="text-2xl font-black text-emerald-600">{selectedJob.package_lpa} LPA</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedJob.description}</p>
            </div>

            {/* Interactive Policy Checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Automated Policy & Eligibility Breakdown
              </h4>

              <div className="space-y-2 text-xs">
                {/* Branch check */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-600">
                    Academic Branch: <strong className="text-slate-900">{profile?.branch}</strong>
                  </span>
                  {selectedJob.eligible_branches.toUpperCase() === 'ALL' ||
                  selectedJob.eligible_branches.toLowerCase().includes(profile?.branch?.toLowerCase() || '') ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Allowed
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <X className="w-4 h-4" /> Ineligible Branch
                    </span>
                  )}
                </div>

                {/* CGPA check */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-600">
                    CGPA: <strong className="text-slate-900">{profile?.cgpa?.toFixed(2)}</strong> (Req:{' '}
                    {selectedJob.min_cgpa})
                  </span>
                  {profile && profile.cgpa >= selectedJob.min_cgpa ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Qualified
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <X className="w-4 h-4" /> Below Min CGPA
                    </span>
                  )}
                </div>

                {/* Backlogs check */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-600">
                    Active Backlogs: <strong className="text-slate-900">{profile?.active_backlogs}</strong> (Max:{' '}
                    {selectedJob.max_backlogs})
                  </span>
                  {profile && profile.active_backlogs <= selectedJob.max_backlogs ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Clear
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <X className="w-4 h-4" /> Exceeds Ceiling
                    </span>
                  )}
                </div>

                {/* One-offer / Dream check */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-600">Placement Policy Clearance:</span>
                  {selectedJob.eligible ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Approved
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Policy Block
                    </span>
                  )}
                </div>
              </div>

              {!selectedJob.eligible && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                  {selectedJob.eligibility_reason}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setJobModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>

              {appliedJobIds.has(selectedJob.id) ? (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                  Already Applied
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApply(selectedJob.id)}
                  disabled={!selectedJob.eligible || submittingApp}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition flex items-center gap-2"
                >
                  {submittingApp ? 'Submitting...' : 'Confirm & Apply for Drive'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: FORMAL OFFER ACCEPTANCE & POLICY MODAL */}
      <Modal
        isOpen={!!offerModalApp}
        onClose={() => setOfferModalApp(null)}
        title="Official Placement Offer Confirmation"
      >
        {offerModalApp && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Congratulations, {profile?.name}!</h4>
                <p className="text-slate-600 mt-0.5">
                  <strong>{offerModalApp.company_name}</strong> has extended a formal employment offer for the position
                  of <strong>{offerModalApp.job_title}</strong> at{' '}
                  <strong className="text-emerald-700 text-sm">{offerModalApp.offer.package_lpa} LPA</strong>.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-slate-700">
              <span className="font-bold text-indigo-700 block uppercase tracking-wider text-[11px]">
                University Placement Policy Agreement
              </span>
              <p className="leading-relaxed">
                By accepting this job offer:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>
                  Your status will officially update to <strong className="text-emerald-700">PLACED</strong>.
                </li>
                <li>
                  Under university rules, your ongoing non-dream applications will be{' '}
                  <strong className="text-orange-700">automatically withdrawn</strong> to give placement slots to your
                  peers.
                </li>
                <li>
                  You will remain eligible to apply solely for verified <strong>Dream Category</strong> opportunities (
                  &ge; {(offerModalApp.offer.package_lpa * 1.5).toFixed(1)} LPA).
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setOfferModalApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Review Later
              </button>
              <button
                type="button"
                onClick={() => handleOfferRespond(offerModalApp.id, true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-100 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Accept & Confirm Placement
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
