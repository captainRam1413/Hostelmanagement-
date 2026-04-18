import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HiFingerPrint, HiRefresh, HiCheckCircle, HiXCircle } from 'react-icons/hi'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function BiometricPanel() {
  const [students, setStudents] = useState([])
  const [deviceLogs, setDeviceLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [lastSync, setLastSync] = useState(null)
  const [activeUsers, setActiveUsers] = useState(new Set())

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [studentsRes, logsRes] = await Promise.all([
          api.get('/students'),
          api.get('/biometric/logs'),
        ])
        setStudents(studentsRes.data)
        setDeviceLogs(logsRes.data.slice(0, 20))
      } catch {
        toast.error('Failed to load biometric data')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const syncUser = async (student) => {
    setActionLoading((prev) => ({ ...prev, [`sync_${student.id}`]: true }))
    try {
      const res = await api.post('/biometric/sync-user', { student_id: student.id })
      toast.success(res.data.message || 'Synced!')
      setLastSync(new Date())
    } catch {
      toast.error('Sync failed')
    } finally {
      setActionLoading((prev) => ({ ...prev, [`sync_${student.id}`]: false }))
    }
  }

  const toggleAccess = async (student) => {
    const isActive = activeUsers.has(student.id)
    const endpoint = isActive ? '/biometric/deactivate-user' : '/biometric/activate-user'
    setActionLoading((prev) => ({ ...prev, [`toggle_${student.id}`]: true }))
    try {
      const res = await api.post(endpoint, { student_id: student.id })
      toast.success(res.data.message)
      setActiveUsers((prev) => {
        const next = new Set(prev)
        isActive ? next.delete(student.id) : next.add(student.id)
        return next
      })
    } catch {
      toast.error('Failed to update access')
    } finally {
      setActionLoading((prev) => ({ ...prev, [`toggle_${student.id}`]: false }))
    }
  }

  const syncAll = async () => {
    const activeStudents = students.filter((s) => s.is_active)
    toast.loading(`Syncing ${activeStudents.length} students...`, { id: 'syncAll' })
    let success = 0
    for (const s of activeStudents) {
      try {
        await api.post('/biometric/sync-user', { student_id: s.id })
        success++
      } catch {}
    }
    toast.success(`Synced ${success}/${activeStudents.length} students`, { id: 'syncAll' })
    setLastSync(new Date())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white neon-text">Biometric Control</h1>
          <p className="text-gray-400 text-sm">
            Manage fingerprint access · Last sync: {lastSync ? format(lastSync, 'hh:mm a, dd MMM') : 'Never'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={syncAll}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20"
        >
          <HiRefresh className="w-5 h-5" />
          Sync All
        </motion.button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Students table */}
        <div className="xl:col-span-2 glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <HiFingerPrint className="text-purple-400 w-5 h-5" />
            <h2 className="text-white font-semibold">Student Biometric Access</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Student</th>
                  <th className="text-left px-6 py-3">Room</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Access</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500">No students</td></tr>
                ) : students.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                          {s.name[0]}
                        </div>
                        <span className="text-white font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{s.room_number}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${s.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {activeUsers.has(s.id) ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <HiCheckCircle className="w-4 h-4" /> Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500 text-xs">
                          <HiXCircle className="w-4 h-4" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => syncUser(s)}
                          disabled={actionLoading[`sync_${s.id}`]}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs transition disabled:opacity-50"
                        >
                          {actionLoading[`sync_${s.id}`] ? '...' : 'Sync'}
                        </button>
                        <button
                          onClick={() => toggleAccess(s)}
                          disabled={actionLoading[`toggle_${s.id}`]}
                          className={`px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50 ${
                            activeUsers.has(s.id)
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          }`}
                        >
                          {actionLoading[`toggle_${s.id}`] ? '...' : activeUsers.has(s.id) ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Logs */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-4">Device Event Log</h2>
          <div className="space-y-2 overflow-y-auto max-h-96">
            {deviceLogs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No device events yet</p>
            ) : deviceLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/5">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${log.event === 'sync' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                <div>
                  <p className="text-white text-xs font-medium">{log.event}: {log.student_name}</p>
                  <p className="text-gray-500 text-xs">
                    {log.timestamp ? format(new Date(log.timestamp), 'dd MMM, hh:mm a') : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
