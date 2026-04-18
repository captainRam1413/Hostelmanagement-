import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, CheckCircle, XCircle, Clock, DoorOpen, Fingerprint, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        </div>
      </div>
    </motion.div>
  )
}

function LogBadge({ type }) {
  const map = {
    entry: 'bg-green-500/20 text-green-400 border-green-500/30',
    exit: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    sync: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    denied: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${map[type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
      {type}
    </span>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome to RM Ladies Hostel Management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Students" value={data?.total_students} color="bg-purple-600" delay={0} />
        <StatCard icon={CheckCircle} label="Active" value={data?.active} color="bg-emerald-600" delay={0.05} />
        <StatCard icon={XCircle} label="Expired" value={data?.expired} color="bg-red-600" delay={0.1} />
        <StatCard icon={Clock} label="Expiring Soon" value={data?.expiring_soon} color="bg-amber-600" delay={0.15} />
        <StatCard icon={DoorOpen} label="Total Rooms" value={data?.total_rooms} color="bg-blue-600" delay={0.2} />
        <StatCard icon={Fingerprint} label="Occupied" value={data?.occupied_rooms} color="bg-cyan-600" delay={0.25} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expiring Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">⚠️ Expiring Soon</h2>
            <Link to="/payments" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.expiring_students?.length === 0 ? (
            <p className="text-slate-500 text-sm">No students expiring in the next 7 days.</p>
          ) : (
            <div className="space-y-2">
              {data?.expiring_students?.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="text-sm text-white font-medium">{s.name}</p>
                    <p className="text-xs text-slate-400">Room {s.room_number || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-amber-400">Expires {s.end_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link to="/logs" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.recent_logs?.length === 0 ? (
            <p className="text-slate-500 text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {data?.recent_logs?.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="text-sm text-white font-medium">{log.student_name}</p>
                    <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <LogBadge type={log.event_type} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
