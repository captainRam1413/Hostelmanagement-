import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Fingerprint, Power, PowerOff, Activity } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function BiometricPanel() {
  const [students, setStudents] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncingId, setSyncingId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sRes, stRes] = await Promise.all([api.get('/students'), api.get('/biometric/status')])
      setStudents(sRes.data)
      setStatus(stRes.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const syncStudent = async (id) => {
    setSyncingId(id)
    try {
      const res = await api.post(`/biometric/sync/${id}`)
      toast.success(res.data.message)
      fetchData()
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  const overrideAccess = async (id, enable) => {
    setSyncingId(id)
    try {
      const res = await api.post(`/biometric/override/${id}`, { enable })
      toast.success(res.data.message)
      fetchData()
    } catch {
      toast.error('Override failed')
    } finally {
      setSyncingId(null)
    }
  }

  const syncAll = async () => {
    setSyncing(true)
    try {
      const res = await api.post('/biometric/sync-all')
      toast.success(`Synced ${res.data.synced} students`)
      fetchData()
    } catch {
      toast.error('Sync all failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Biometric Control Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Manage fingerprint access for all students</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={syncAll}
          disabled={syncing}
          className="btn-neon flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync All'}
        </motion.button>
      </div>

      {/* Status Cards */}
      {status && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Students', value: status.total, color: 'bg-purple-600', icon: Fingerprint },
            { label: 'Access Enabled', value: status.enabled, color: 'bg-emerald-600', icon: Activity },
            { label: 'Access Disabled', value: status.disabled, color: 'bg-red-600', icon: PowerOff },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-6 py-4 text-left font-medium">Student</th>
                  <th className="px-6 py-4 text-left font-medium">Room</th>
                  <th className="px-6 py-4 text-left font-medium">Payment Status</th>
                  <th className="px-6 py-4 text-left font-medium">Biometric ID</th>
                  <th className="px-6 py-4 text-left font-medium">Access</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-white font-medium">{s.name}</td>
                    <td className="px-6 py-4 text-slate-300">{s.room_number || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                        s.payment_status === 'active' ? 'badge-active' :
                        s.payment_status === 'expired' ? 'badge-expired' : 'badge-pending'
                      }`}>
                        {s.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{s.biometric_id || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Fingerprint className={`w-4 h-4 ${s.biometric_enabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <span className={`text-xs font-medium ${s.biometric_enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {s.biometric_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => syncStudent(s.id)}
                          disabled={syncingId === s.id}
                          title="Auto-sync based on payment status"
                          className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncingId === s.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => overrideAccess(s.id, true)}
                          disabled={syncingId === s.id || s.biometric_enabled}
                          title="Enable access"
                          className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => overrideAccess(s.id, false)}
                          disabled={syncingId === s.id || !s.biometric_enabled}
                          title="Disable access"
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-30"
                        >
                          <PowerOff className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
