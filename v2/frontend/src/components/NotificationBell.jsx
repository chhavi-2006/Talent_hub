import { Bell, BriefcaseIcon, CheckCircle2, Trophy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * NotificationBell — polls for new application status changes and interview
 * schedules every 30 seconds and surfaces them as an in-app notification tray.
 *
 * Added by: chhavi-2006
 */
export default function NotificationBell({ applications = [] }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [prevApps, setPrevApps] = useState([]);
  const ref = useRef(null);

  // Derive notifications by diffing application state changes
  useEffect(() => {
    if (!applications.length) return;

    const newNotifs = [];

    applications.forEach((app) => {
      const prev = prevApps.find((p) => p.id === app.id);
      if (!prev) return;

      if (prev.status !== app.status) {
        newNotifs.push({
          id: `${app.id}-${app.status}-${Date.now()}`,
          type: app.status === 'OFFERED' ? 'offer' : 'status',
          title:
            app.status === 'OFFERED'
              ? '🎉 Job Offer Received!'
              : `Application ${app.status.replace('_', ' ')}`,
          body: `${app.company_name} — ${app.job_title}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
        });
      }

      // Detect new interview round added
      const prevRounds = prev.interview_rounds?.length ?? 0;
      const currRounds = app.interview_rounds?.length ?? 0;
      if (currRounds > prevRounds) {
        const latest = app.interview_rounds[currRounds - 1];
        newNotifs.push({
          id: `${app.id}-round-${currRounds}-${Date.now()}`,
          type: 'interview',
          title: `Interview Scheduled — Round ${latest.round_number}`,
          body: `${app.company_name}: ${latest.round_type.replace('_', ' ')} on ${new Date(
            latest.scheduled_at
          ).toLocaleDateString()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
        });
      }
    });

    if (newNotifs.length) {
      setNotifications((prev) => [...newNotifs, ...prev].slice(0, 20));
    }

    setPrevApps(applications);
  }, [applications]);

  // Seed initial snapshot without triggering diff-notifications on mount
  useEffect(() => {
    if (applications.length && !prevApps.length) {
      setPrevApps(applications);
    }
  }, [applications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const dismiss = (id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  if (user?.role !== 'STUDENT') return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
        className="relative p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 transition shadow-sm"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="text-[11px] text-slate-400 hover:text-rose-500 font-semibold transition"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3.5 flex items-start gap-3 ${n.read ? 'opacity-70' : ''}`}>
                  <div className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'offer' ? 'bg-purple-100 text-purple-600' :
                    n.type === 'interview' ? 'bg-indigo-100 text-indigo-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {n.type === 'offer' ? <Trophy className="w-3.5 h-3.5" /> :
                     n.type === 'interview' ? <BriefcaseIcon className="w-3.5 h-3.5" /> :
                     <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900">{n.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{n.body}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{n.time}</div>
                  </div>
                  <button onClick={() => dismiss(n.id)} className="text-slate-300 hover:text-slate-500 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
