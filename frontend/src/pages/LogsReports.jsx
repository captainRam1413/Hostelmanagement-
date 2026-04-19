import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Filter } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const EVENT_COLORS = {
  entry: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
  exit: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30',
  sync: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30',
  denied: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30',
}

export default function LogsReports() {
  const [logs, setLogs] = useState([])
  const [eventFilter, setEventFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLogs = () => {
    setLoading(true)
    api.get('/biometric/logs', { params: { event_type: eventFilter, limit: 200 } })
      .then((res) => setLogs(res.data))
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs() }, [eventFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">Logs & Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Entry/exit logs and exportable reports</p>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Export Students CSV', url: '/api/reports/export/students', color: 'from-purple-600 to-blue-600' },
          { label: 'Export Payments CSV', url: '/api/reports/export/payments', color: 'from-blue-600 to-cyan-600' },
          { label: 'Export Logs CSV', url: '/api/reports/export/logs', color: 'from-emerald-600 to-teal-600' },
        ].map(({ label, url, color }, i) => (
          <motion.a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`bg-white dark:bg-slate-800 p-5 flex items-center gap-3 cursor-pointer rounded-[14px] border border-slate-200 dark:border-slate-700 shadow-sm transition-all`}
          >
            <div className={`w-10 h-10 rounded-[10px] ${
              i === 0 ? 'bg-dash-red' : i === 1 ? 'bg-dash-blue' : 'bg-dash-green'
            } flex items-center justify-center flex-shrink-0`}>
              <Download className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-black dark:text-white">{label}</span>
          </motion.a>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[20px] overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <h2 className="text-[18px] font-black text-black dark:text-white">Biometric Activity Logs</h2>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="bg-transparent py-2 text-[13px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Events</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="sync">Sync</option>
              <option value="denied">Denied</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Event</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Device</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-black dark:text-white font-bold text-[13px]">{log.student_name}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${EVENT_COLORS[log.event_type] || 'badge-pending'}`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{log.device_id || '—'}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[13px] max-w-[240px] truncate">{log.notes || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
