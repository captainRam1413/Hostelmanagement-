import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HiUsers, HiCheckCircle, HiXCircle, HiOfficeBuilding, HiTrendingUp } from 'react-icons/hi'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { format, subMonths } from 'date-fns'
import api from '../api/axios'

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 flex items-center gap-4"
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-white text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  )
}

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-sm">
        <p className="text-gray-300 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, rooms: 0 })
  const [recentLogs, setRecentLogs] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [studentsRes, roomsRes, logsRes] = await Promise.all([
          api.get('/students'),
          api.get('/rooms'),
          api.get('/logs'),
        ])

        const students = studentsRes.data
        const active = students.filter((s) => s.is_active).length
        const expired = students.filter((s) => !s.is_active).length

        setStats({
          total: students.length,
          active,
          expired,
          rooms: roomsRes.data.length,
        })

        setRecentLogs(logsRes.data.slice(0, 10))

        // Build chart: last 6 months
        const now = new Date()
        const chart = Array.from({ length: 6 }, (_, i) => {
          const month = subMonths(now, 5 - i)
          const label = format(month, 'MMM')
          const monthStr = format(month, 'yyyy-MM')
          const activeCount = students.filter(
            (s) => s.is_active && s.start_date?.startsWith(monthStr)
          ).length
          const expiredCount = students.filter(
            (s) => !s.is_active && s.end_date?.startsWith(monthStr)
          ).length
          return { month: label, Active: activeCount, Expired: expiredCount }
        })
        setChartData(chart)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white neon-text">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">RM Ladies Hostel overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.total} icon={HiUsers} color="bg-purple-500/20 border border-purple-500/30" subtitle="All registered" />
        <StatCard title="Active Students" value={stats.active} icon={HiCheckCircle} color="bg-emerald-500/20 border border-emerald-500/30" subtitle="Currently staying" />
        <StatCard title="Expired / Inactive" value={stats.expired} icon={HiXCircle} color="bg-red-500/20 border border-red-500/30" subtitle="Plan expired" />
        <StatCard title="Total Rooms" value={stats.rooms} icon={HiOfficeBuilding} color="bg-blue-500/20 border border-blue-500/30" subtitle="All floors" />
      </div>

      {/* Chart + Recent Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <HiTrendingUp className="text-purple-400 w-5 h-5" />
            <h2 className="text-white font-semibold">Monthly Student Activity</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Bar dataKey="Active" fill="#a855f7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expired" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Logs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-white font-semibold mb-4">Recent Entry/Exit Logs</h2>
          <div className="space-y-2 overflow-y-auto max-h-64">
            {recentLogs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No logs yet</p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/5 border border-white/5"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{log.student_name}</p>
                    <p className="text-gray-500 text-xs">
                      {log.timestamp ? format(new Date(log.timestamp), 'dd MMM, hh:mm a') : '—'}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      log.log_type === 'entry'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}
                  >
                    {log.log_type}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
