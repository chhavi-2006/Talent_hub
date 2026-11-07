import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client.js';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ALL_BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
];

const ROUND_TYPES = [
  { value: 'ONLINE_ASSESSMENT', label: 'Online Assessment / Coding' },
  { value: 'TECHNICAL', label: 'Technical Interview' },
  { value: 'MANAGERIAL', label: 'System Design / Managerial' },
  { value: 'HR', label: 'HR & Cultural Fit Round' },
];

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [candidateSearch, setCandidateSearch] = useState('');

  // Modals & Forms
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [scheduleModalApp, setScheduleModalApp] = useState(null);
  const [scorecardModalData, setScorecardModalData] = useState(null); // { appId, roundNum }
  const [offerModalApp, setOfferModalApp] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // New Drive Form
  const [newDrive, setNewDrive] = useState({
    role_title: '',
    description: '',
    package_lpa: 9.0,
    min_cgpa: 7.0,
    max_backlogs: 0,
    branches: ['Computer Science', 'Information Technology'],
    is_dream_offer: false,
  });

  // Schedule Round Form
  const [scheduleForm, setScheduleForm] = useState({
    round_number: 1,
    round_type: 'TECHNICAL',
    scheduled_at: '',
  });

  // Scorecard Form
  const [scorecardForm, setScorecardForm] = useState({
    result: 'PASS',
    feedback: '',
    score: 8.5,
  });

  // Offer Form
  const [offerPackage, setOfferPackage] = useState('');

  const loadData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        client.get('/jobs/mine'),
        client.get('/applications/company/mine'),
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      console.error('Failed to load company workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBranchToggle = (branch) => {
    setNewDrive((prev) => {
      const current = prev.branches;
      if (current.includes(branch)) {
        return { ...prev, branches: current.filter((b) => b !== branch) };
      } else {
        return { ...prev, branches: [...current, branch] };
      }
    });
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const payload = {
        role_title: newDrive.role_title.trim(),
        description: newDrive.description.trim(),
        package_lpa: parseFloat(newDrive.package_lpa),
        min_cgpa: parseFloat(newDrive.min_cgpa),
        max_backlogs: parseInt(newDrive.max_backlogs, 10),
        eligible_branches:
          newDrive.branches.length === ALL_BRANCHES.length || newDrive.branches.length === 0
            ? 'ALL'
            : newDrive.branches.join(','),
        is_dream_offer: newDrive.is_dream_offer,
      };

      await client.post('/jobs', payload);
      setShowDriveModal(false);
      setNewDrive({
        role_title: '',
        description: '',
        package_lpa: 9.0,
        min_cgpa: 7.0,
        max_backlogs: 0,
        branches: ['Computer Science', 'Information Technology'],
        is_dream_offer: false,
      });
      setFeedback({ ok: true, text: 'Recruitment drive successfully published to college job board!' });
      await loadData();
    } catch (err) {
      setFeedback({ ok: false, text: err?.response?.data?.detail || 'Could not publish recruitment drive.' });
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      await client.patch(`/applications/${appId}/status`, { status });
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Action failed');
    }
  };

  const openScheduleModal = (app) => {
    const rounds = app.interview_rounds || [];
    const nextRound = rounds.length + 1;
    setScheduleForm({
      round_number: nextRound,
      round_type: nextRound === 1 ? 'ONLINE_ASSESSMENT' : 'TECHNICAL',
      scheduled_at: '',
    });
    setScheduleModalApp(app);
  };

  const submitScheduleRound = async (e) => {
    e.preventDefault();
    if (!scheduleForm.scheduled_at) {
      alert('Please select date and time for the interview');
      return;
    }
    try {
      await client.post('/interviews/schedule', {
        application_id: scheduleModalApp.id,
        round_number: scheduleForm.round_number,
        round_type: scheduleForm.round_type,
        scheduled_at: new Date(scheduleForm.scheduled_at).toISOString(),
      });
      setScheduleModalApp(null);
      setFeedback({ ok: true, text: `Round ${scheduleForm.round_number} scheduled successfully!` });
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to schedule round.');
    }
  };

  const openScorecardModal = (appId, round) => {
    setScorecardModalData({ appId, roundNum: round.round_number, roundType: round.round_type });
    setScorecardForm({
      result: 'PASS',
      feedback: round.feedback || '',
      score: round.score !== null ? round.score : 8.0,
    });
  };

  const submitScorecard = async (e) => {
    e.preventDefault();
    try {
      await client.patch(
        `/interviews/${scorecardModalData.appId}/round/${scorecardModalData.roundNum}/result`,
        {
          result: scorecardForm.result,
          feedback: scorecardForm.feedback.trim(),
          score: parseFloat(scorecardForm.score) || null,
        }
      );
      setScorecardModalData(null);
      setFeedback({ ok: true, text: 'Evaluation feedback & scorecard saved successfully!' });
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to submit scorecard.');
    }
  };

  const openOfferModal = (app) => {
    setOfferPackage(app.package_lpa || '');
    setOfferModalApp(app);
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    try {
      await client.post('/offers', {
        application_id: offerModalApp.id,
        package_lpa: parseFloat(offerPackage) || null,
      });
      setOfferModalApp(null);
      setFeedback({ ok: true, text: 'Formal employment offer dispatched to candidate!' });
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to issue offer.');
    }
  };

  const handleCloseDrive = async (jobId) => {
    if (!confirm('Are you sure you want to close applications for this drive?')) return;
    try {
      await client.delete(`/jobs/${jobId}`);
      await loadData();
    } catch (err) {
      alert('Could not update drive status.');
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesJob = selectedJobId === 'ALL' || app.job_id === parseInt(selectedJobId, 10);
    const matchesSearch =
      app.student_name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      app.student_usn.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      app.student_branch.toLowerCase().includes(candidateSearch.toLowerCase());

    let matchesStage = true;
    if (stageFilter === 'APPLIED') matchesStage = app.status === 'APPLIED';
    else if (stageFilter === 'SHORTLISTED') matchesStage = app.status === 'SHORTLISTED';
    else if (stageFilter === 'INTERVIEWING') matchesStage = app.status === 'INTERVIEWING';
    else if (stageFilter === 'INTERVIEW_PASSED') matchesStage = app.status === 'INTERVIEW_PASSED';
    else if (stageFilter === 'OFFERED') matchesStage = app.status === 'OFFERED';
    else if (stageFilter === 'ACCEPTED') matchesStage = app.status === 'ACCEPTED';

    return matchesJob && matchesSearch && matchesStage;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading corporate recruitment suite...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Corporate Partner Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Employer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Corporate Talent Assessment & Hiring Command Center</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowDriveModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Launch Recruitment Drive
        </button>
      </div>

      {/* Action Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm shadow-sm ${
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
            <span className="font-medium text-xs sm:text-sm">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Drives Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" /> Published Job Drives ({jobs.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {jobs.map((j) => (
            <div key={j.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-2.5 hover:border-slate-300 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    {j.role_title}
                    {j.is_dream_offer && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Dream
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-emerald-700">{j.package_lpa} LPA</div>
                </div>
                <StatusBadge status={j.status} size="xs" />
              </div>

              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div>
                  Min CGPA: <strong className="text-slate-800">{j.min_cgpa}</strong> | Max Backlogs: <strong className="text-slate-800">{j.max_backlogs}</strong>
                </div>
                <div className="truncate text-slate-500">
                  Branches: <span className="text-slate-700 font-medium">{j.eligible_branches}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">
                  Posted {new Date(j.created_at).toLocaleDateString()}
                </span>
                {j.status === 'OPEN' && (
                  <button
                    onClick={() => handleCloseDrive(j.id)}
                    className="text-[11px] font-medium text-slate-500 hover:text-rose-600 transition"
                  >
                    Close Drive
                  </button>
                )}
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 text-xs">
              No recruitment drives posted yet. Click 'Launch Recruitment Drive' above to start hiring.
            </div>
          )}
        </div>
      </div>

      {/* Candidate Pipeline Management */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Candidate Pipeline & Evaluation Roster
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-round interview assessment, objective scorecard ratings, and offer management
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
            >
              <option value="ALL">All Roles ({applications.length})</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.role_title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stage Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Applicants' },
            { id: 'APPLIED', label: 'Applied' },
            { id: 'SHORTLISTED', label: 'Shortlisted' },
            { id: 'INTERVIEWING', label: 'In Assessment' },
            { id: 'INTERVIEW_PASSED', label: 'Rounds Cleared' },
            { id: 'OFFERED', label: 'Offer Extended' },
            { id: 'ACCEPTED', label: 'Placed / Hired' },
          ].map((stg) => (
            <button
              key={stg.id}
              onClick={() => setStageFilter(stg.id)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition text-xs ${
                stageFilter === stg.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100/80 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {stg.label}
            </button>
          ))}
        </div>

        {/* Candidate Cards Roster */}
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const rounds = app.interview_rounds || [];
            const lastRound = rounds[rounds.length - 1];
            const canScheduleNext =
              (app.status === 'SHORTLISTED' && rounds.length === 0) ||
              (app.status === 'INTERVIEW_PASSED' && lastRound && lastRound.result === 'PASS');

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 hover:border-slate-300 hover:shadow-sm transition"
              >
                {/* Header: Candidate Identity & Target Job */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-900 text-base">{app.student_name}</span>
                      <span className="font-mono text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md font-semibold">
                        {app.student_usn}
                      </span>
                      <span className="text-xs text-slate-500">• {app.student_branch}</span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3">
                      <span>Target Drive: <strong className="text-slate-800">{app.job_title}</strong></span>
                      <span>CGPA: <strong className="text-indigo-700">{app.student_cgpa}</strong></span>
                      <span>
                        Backlogs:{' '}
                        <strong className={app.student_backlogs > 0 ? 'text-amber-600' : 'text-emerald-700'}>
                          {app.student_backlogs}
                        </strong>
                      </span>
                      <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                  </div>
                </div>

                {/* Initial Screening Controls (APPLIED) */}
                {app.status === 'APPLIED' && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 mr-2 font-medium">Screening Action:</span>
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold shadow-sm transition"
                    >
                      Shortlist for Rounds
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                      className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* Multi-Round Assessment History */}
                {rounds.length > 0 && (
                  <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <span>Hiring Stage History</span>
                      <span>{rounds.length} Stage(s)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rounds.map((rnd) => (
                        <div
                          key={rnd.id}
                          className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              Round {rnd.round_number}: {rnd.round_type.replaceAll('_', ' ')}
                            </span>
                            <StatusBadge status={rnd.result} size="xs" />
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            {new Date(rnd.scheduled_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>

                          {rnd.score !== null && (
                            <div className="text-[11px] text-indigo-700 font-medium">
                              Score: <strong>{rnd.score} / 10</strong>
                            </div>
                          )}

                          {rnd.feedback && (
                            <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                              "{rnd.feedback}"
                            </div>
                          )}

                          {/* Scorecard evaluation button for pending rounds */}
                          {rnd.result === 'PENDING' && (
                            <button
                              onClick={() => openScorecardModal(app.id, rnd)}
                              className="w-full mt-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-[11px] transition shadow-sm"
                            >
                              Submit Scorecard & Decision
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduling Next Round Button */}
                {canScheduleNext && (
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-medium">Candidate cleared prior evaluation stage.</span>
                    <button
                      onClick={() => openScheduleModal(app)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Schedule Round {rounds.length + 1}
                    </button>
                  </div>
                )}

                {/* Offer Extension Button (Only available when INTERVIEW_PASSED) */}
                {app.status === 'INTERVIEW_PASSED' && !app.offer && (
                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 text-xs text-purple-900">
                      <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                      <span>
                        Candidate has successfully cleared all interview stages! Ready to dispatch formal employment
                        contract.
                      </span>
                    </div>

                    <button
                      onClick={() => openOfferModal(app)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition shrink-0"
                    >
                      Extend Employment Offer
                    </button>
                  </div>
                )}

                {/* Active Offer Status */}
                {app.offer && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                    <span className="text-slate-800">
                      Dispatched Offer Package: <strong className="text-emerald-700 font-bold">{app.offer.package_lpa} LPA</strong>
                    </span>
                    <StatusBadge status={app.offer.status} />
                  </div>
                )}
              </div>
            );
          })}

          {filteredApps.length === 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
              No candidates matching current filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: NEW RECRUITMENT DRIVE MODAL */}
      <Modal isOpen={showDriveModal} onClose={() => setShowDriveModal(false)} title="Launch Campus Recruitment Drive">
        <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">Role Title</label>
            <input
              type="text"
              placeholder="e.g. Lead Full-Stack Software Engineer"
              value={newDrive.role_title}
              onChange={(e) => setNewDrive({ ...newDrive, role_title: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">Package (LPA)</label>
              <input
                type="number"
                step="0.1"
                value={newDrive.package_lpa}
                onChange={(e) => setNewDrive({ ...newDrive, package_lpa: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">Min CGPA</label>
              <input
                type="number"
                step="0.1"
                value={newDrive.min_cgpa}
                onChange={(e) => setNewDrive({ ...newDrive, min_cgpa: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">Max Backlogs</label>
              <input
                type="number"
                value={newDrive.max_backlogs}
                onChange={(e) => setNewDrive({ ...newDrive, max_backlogs: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
                required
              />
            </div>
          </div>

          {/* Branch Checklist Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-semibold tracking-wider uppercase text-[11px]">Eligible Academic Branches</label>
              <button
                type="button"
                onClick={() =>
                  setNewDrive((p) => ({
                    ...p,
                    branches: p.branches.length === ALL_BRANCHES.length ? [] : [...ALL_BRANCHES],
                  }))
                }
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                {newDrive.branches.length === ALL_BRANCHES.length ? 'Clear All' : 'Select All Branches'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
              {ALL_BRANCHES.map((b) => (
                <label key={b} className="flex items-center gap-2 text-slate-700 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={newDrive.branches.includes(b)}
                    onChange={() => handleBranchToggle(b)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium">{b}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dream Category Switch */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5">
            <input
              type="checkbox"
              id="dreamFlag"
              checked={newDrive.is_dream_offer}
              onChange={(e) => setNewDrive({ ...newDrive, is_dream_offer: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="dreamFlag" className="text-purple-900 text-xs cursor-pointer">
              <strong>Dream Tier Category:</strong> Permits students who are already placed to apply for an upgrade.
            </label>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">
              Job Description & Candidate Profile
            </label>
            <textarea
              rows={3}
              placeholder="Outline responsibilities, required technical skills, and compensation highlights..."
              value={newDrive.description}
              onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDriveModal(false)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium shadow-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition"
            >
              Publish Job Drive
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: SCHEDULE ROUND MODAL */}
      <Modal
        isOpen={!!scheduleModalApp}
        onClose={() => setScheduleModalApp(null)}
        title={scheduleModalApp ? `Schedule Interview Round ${scheduleForm.round_number}` : 'Schedule Interview'}
      >
        {scheduleModalApp && (
          <form onSubmit={submitScheduleRound} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-semibold text-slate-900">
                Candidate: {scheduleModalApp.student_name} ({scheduleModalApp.student_usn})
              </div>
              <div className="text-slate-500">Position: {scheduleModalApp.job_title}</div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">Assessment Type</label>
              <select
                value={scheduleForm.round_type}
                onChange={(e) => setScheduleForm({ ...scheduleForm, round_type: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm font-medium"
              >
                {ROUND_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>
                    {rt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">
                Date & Time of Interview
              </label>
              <input
                type="datetime-local"
                value={scheduleForm.scheduled_at}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm font-medium"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScheduleModalApp(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium shadow-sm transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition"
              >
                Confirm Schedule
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: EVALUATION SCORECARD MODAL */}
      <Modal
        isOpen={!!scorecardModalData}
        onClose={() => setScorecardModalData(null)}
        title={scorecardModalData ? `Scorecard — Round ${scorecardModalData.roundNum}` : 'Scorecard'}
      >
        {scorecardModalData && (
          <form onSubmit={submitScorecard} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1.5">
                Assessment Outcome Decision
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScorecardForm({ ...scorecardForm, result: 'PASS' })}
                  className={`py-2 rounded-xl font-semibold border transition text-xs ${
                    scorecardForm.result === 'PASS'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Mark Pass / Advance
                </button>
                <button
                  type="button"
                  onClick={() => setScorecardForm({ ...scorecardForm, result: 'FAIL' })}
                  className={`py-2 rounded-xl font-semibold border transition text-xs ${
                    scorecardForm.result === 'FAIL'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Mark Fail / Reject
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">
                Candidate Score (0 to 10)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={scorecardForm.score}
                onChange={(e) => setScorecardForm({ ...scorecardForm, score: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">
                Interviewer Assessment Feedback & Notes
              </label>
              <textarea
                rows={3}
                placeholder="Detail technical strengths, problem solving ability, areas for development..."
                value={scorecardForm.feedback}
                onChange={(e) => setScorecardForm({ ...scorecardForm, feedback: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScorecardModalData(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium shadow-sm transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition"
              >
                Save Scorecard
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: OFFER DISPATCH MODAL */}
      <Modal
        isOpen={!!offerModalApp}
        onClose={() => setOfferModalApp(null)}
        title="Extend Official Employment Offer"
      >
        {offerModalApp && (
          <form onSubmit={submitOffer} className="space-y-4 text-xs">
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="font-semibold text-purple-900">
                Candidate: {offerModalApp.student_name} ({offerModalApp.student_usn})
              </div>
              <div className="text-slate-600 mt-0.5">Role: {offerModalApp.job_title}</div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold tracking-wider uppercase text-[11px] mb-1">
                Annual Compensation Package (CTC in LPA)
              </label>
              <input
                type="number"
                step="0.1"
                value={offerPackage}
                onChange={(e) => setOfferPackage(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Candidate will receive formal notification to accept or decline under institutional placement rules.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOfferModalApp(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium shadow-sm transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-sm transition"
              >
                Dispatch Offer
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
