import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Filter } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const EVENT_COLORS = {
  entry: 'badge-active',
  exit: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sync: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  denied: 'badge-expired',
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
        <h1 className="text-2xl font-bold text-white">Logs & Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Entry/exit logs and exportable reports</p>
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
            className={`glass-card p-5 flex items-center gap-3 cursor-pointer border border-white/10 hover:border-white/20 transition-all`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Download className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white">{label}</span>
          </motion.a>
        ))}
      </div>

      {/* Logs Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white flex-1">Biometric Activity Logs</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="neon-input py-1.5 px-3 text-xs"
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
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="px-6 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-6 py-3 text-left font-medium">Student</th>
                  <th className="px-6 py-3 text-left font-medium">Event</th>
                  <th className="px-6 py-3 text-left font-medium">Device</th>
                  <th className="px-6 py-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-6 py-3 text-slate-300 text-xs font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-white font-medium">{log.student_name}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${EVENT_COLORS[log.event_type] || 'badge-pending'}`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-400 font-mono text-xs">{log.device_id || '—'}</td>
                    <td className="px-6 py-3 text-slate-400 max-w-[240px] truncate">{log.notes || '—'}</td>
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
