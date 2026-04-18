import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { HiFilter, HiDownload } from 'react-icons/hi'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    student_id: '',
    type: '',
    from: '',
    to: '',
  })

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.student_id) params.student_id = filters.student_id
      if (filters.type) params.type = filters.type
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to + 'T23:59:59'
      const res = await api.get('/logs', { params })
      setLogs(res.data)
    } catch {
      toast.error('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    api.get('/students').then((res) => setStudents(res.data)).catch(() => {})
  }, [])

  const exportCSV = () => {
    if (logs.length === 0) { toast.error('No logs to export'); return }
    const headers = ['ID', 'Student', 'Type', 'Method', 'Device', 'Timestamp']
    const rows = logs.map((l) => [
      l.id,
      l.student_name,
      l.log_type,
      l.method,
      l.device_id || '',
      l.timestamp || '',
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hostel-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  const selectCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-purple-500"
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-purple-500"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white neon-text">Entry / Exit Logs</h1>
          <p className="text-gray-400 text-sm">{logs.length} records found</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl font-medium transition"
        >
          <HiDownload className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <HiFilter className="text-purple-400 w-5 h-5" />
        <select
          className={selectCls}
          value={filters.student_id}
          onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
        >
          <option value="">All Students</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          className={selectCls}
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="entry">Entry</option>
          <option value="exit">Exit</option>
        </select>
        <input
          type="date"
          className={inputCls}
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          title="From date"
        />
        <span className="text-gray-500 text-sm">to</span>
        <input
          type="date"
          className={inputCls}
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          title="To date"
        />
        <button
          onClick={() => setFilters({ student_id: '', type: '', from: '', to: '' })}
          className="px-3 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-sm transition"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-6 py-4">#</th>
                <th className="text-left px-6 py-4">Student</th>
                <th className="text-left px-6 py-4">Type</th>
                <th className="text-left px-6 py-4">Method</th>
                <th className="text-left px-6 py-4">Device</th>
                <th className="text-left px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500">No logs found</td></tr>
              ) : logs.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="px-6 py-3 text-gray-500 text-xs">{log.id}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {log.student_name?.[0] || '?'}
                      </div>
                      <span className="text-white">{log.student_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      log.log_type === 'entry'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {log.log_type}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      log.method === 'fingerprint'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">{log.device_id || '—'}</td>
                  <td className="px-6 py-3 text-gray-300 text-xs">
                    {log.timestamp ? format(new Date(log.timestamp), 'dd MMM yyyy, hh:mm a') : '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
