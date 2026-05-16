import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Mail,
  Settings,
  BarChart3,
  TrendingUp,
  X,
} from 'lucide-react';
import { api, PLATFORMS } from '../utils/api';

const TEMPLATES = [
  { id: 'executive', label: 'Executive Summary', desc: 'High-level overview with key metrics' },
  { id: 'detailed', label: 'Detailed Report', desc: 'Comprehensive breakdown of all metrics' },
  { id: 'comparison', label: 'Comparison Report', desc: 'Period-over-period performance comparison' },
];

const METRICS = [
  { id: 'impressions', label: 'Impressions' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'followers', label: 'Followers' },
  { id: 'clicks', label: 'Clicks' },
  { id: 'reach', label: 'Reach' },
  { id: 'shares', label: 'Shares' },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: FileText },
  generating: { label: 'Generating', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  ready: { label: 'Ready', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
};

export default function Reports() {
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // Create report form
  const [reportForm, setReportForm] = useState({
    name: '',
    template: 'executive',
    date_range_start: '',
    date_range_end: '',
    platforms: ['instagram'],
    metrics: ['impressions', 'engagement', 'followers', 'clicks'],
    white_label: false,
  });

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    report_template: 'executive',
    frequency: 'weekly',
    day_of_week: 1,
    time_of_day: '09:00',
    recipients: '',
    platforms: ['instagram'],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [reportsRes, schedulesRes] = await Promise.allSettled([
        api.getReports(),
        api.getScheduledReports(),
      ]);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.reports || []);
      if (schedulesRes.status === 'fulfilled') setSchedules(schedulesRes.value.schedules || []);
    } catch {
      // silent
    }
    setLoading(false);
  }

  async function handleCreateReport(e) {
    e.preventDefault();
    try {
      await api.createReport(reportForm);
      setShowCreate(false);
      setReportForm({
        name: '',
        template: 'executive',
        date_range_start: '',
        date_range_end: '',
        platforms: ['instagram'],
        metrics: ['impressions', 'engagement', 'followers', 'clicks'],
        white_label: false,
      });
      loadData();
    } catch (err) {
      console.error('Create report failed:', err);
    }
  }

  async function handleCreateSchedule(e) {
    e.preventDefault();
    const recipients = scheduleForm.recipients
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    if (recipients.length === 0) return;
    try {
      await api.createScheduledReport({ ...scheduleForm, recipients });
      setShowSchedule(false);
      setScheduleForm({
        report_template: 'executive',
        frequency: 'weekly',
        day_of_week: 1,
        time_of_day: '09:00',
        recipients: '',
        platforms: ['instagram'],
      });
      loadData();
    } catch (err) {
      console.error('Create schedule failed:', err);
    }
  }

  async function handleDeleteReport(id) {
    try {
      await api.deleteReport(id);
      loadData();
    } catch (err) {
      console.error('Delete report failed:', err);
    }
  }

  async function handleDeleteSchedule(id) {
    try {
      await api.deleteScheduledReport(id);
      loadData();
    } catch (err) {
      console.error('Delete schedule failed:', err);
    }
  }

  function togglePlatform(list, setList, pid) {
    if (list.includes(pid)) {
      if (list.length > 1) setList(list.filter((p) => p !== pid));
    } else {
      setList([...list, pid]);
    }
  }

  function toggleMetric(mid) {
    setReportForm((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(mid)
        ? prev.metrics.filter((m) => m !== mid)
        : [...prev.metrics, mid],
    }));
  }

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-sm text-gray-400 mt-1">Generate and schedule performance reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowSchedule(true); setShowCreate(false); }}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Clock className="w-4 h-4" />
            Schedule Report
          </button>
          <button
            onClick={() => { setShowCreate(true); setShowSchedule(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreate && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create Report</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Report Name</label>
              <input
                type="text"
                value={reportForm.name}
                onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
                placeholder="e.g. Monthly Performance - May 2026"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Template</label>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setReportForm({ ...reportForm, template: t.id })}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      reportForm.template === t.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-200">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={reportForm.date_range_start}
                  onChange={(e) => setReportForm({ ...reportForm, date_range_start: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={reportForm.date_range_end}
                  onChange={(e) => setReportForm({ ...reportForm, date_range_end: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const newP = reportForm.platforms.includes(p.id)
                        ? reportForm.platforms.filter((x) => x !== p.id)
                        : [...reportForm.platforms, p.id];
                      if (newP.length > 0) setReportForm({ ...reportForm, platforms: newP });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      reportForm.platforms.includes(p.id)
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Metrics</label>
              <div className="flex flex-wrap gap-2">
                {METRICS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMetric(m.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      reportForm.metrics.includes(m.id)
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reportForm.white_label}
                onChange={(e) => setReportForm({ ...reportForm, white_label: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-300">White-label report (remove PostFlow branding)</span>
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
              >
                Generate Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Report Modal */}
      {showSchedule && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Schedule Recurring Report</h3>
            <button onClick={() => setShowSchedule(false)} className="text-gray-500 hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Template</label>
                <select
                  value={scheduleForm.report_template}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, report_template: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Frequency</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Day</label>
                <select
                  value={scheduleForm.day_of_week}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Time</label>
                <input
                  type="time"
                  value={scheduleForm.time_of_day}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time_of_day: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Recipients (comma-separated emails)</label>
              <input
                type="text"
                value={scheduleForm.recipients}
                onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })}
                placeholder="client@example.com, manager@company.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const newP = scheduleForm.platforms.includes(p.id)
                        ? scheduleForm.platforms.filter((x) => x !== p.id)
                        : [...scheduleForm.platforms, p.id];
                      if (newP.length > 0) setScheduleForm({ ...scheduleForm, platforms: newP });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      scheduleForm.platforms.includes(p.id)
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSchedule(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
              >
                Create Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-gray-800 pb-3">
        {[
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'scheduled', label: 'Scheduled', icon: Clock },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {tab === 'reports' && (
        loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No reports yet</p>
            <p className="text-gray-600 text-sm mt-1">Create your first performance report</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;
              const StatusIcon = statusCfg.icon;
              const platforms = report.platforms || [];
              return (
                <div key={report.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-200 truncate">{report.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="capitalize">{report.template}</span>
                      <span>{report.date_range_start} — {report.date_range_end}</span>
                      <span>{platforms.map((p) => PLATFORMS.find((x) => x.id === p)?.label || p).join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {report.status === 'ready' && (
                      <button className="p-2 text-gray-400 hover:text-green-400 transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Scheduled reports list */}
      {tab === 'scheduled' && (
        schedules.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No scheduled reports</p>
            <p className="text-gray-600 text-sm mt-1">Set up automatic report delivery</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((sched) => (
              <div key={sched.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-200 capitalize">
                    {sched.frequency} {sched.report_template} Report
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{DAYS[sched.day_of_week]} at {sched.time_of_day}</span>
                    <span>{sched.recipients?.length || 0} recipient(s)</span>
                    <span>{(sched.platforms || []).map((p) => PLATFORMS.find((x) => x.id === p)?.label || p).join(', ')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSchedule(sched.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
