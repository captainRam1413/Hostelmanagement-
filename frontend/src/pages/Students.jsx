import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, Fingerprint } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const STATUS_LABELS = { active: 'Active', expired: 'Expired', pending: 'Pending' }
const STATUS_CLASS = { active: 'badge-active', expired: 'badge-expired', pending: 'badge-pending' }

export default function Students() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchStudents = () => {
    setLoading(true)
    api.get('/students', { params: { search, status: statusFilter } })
      .then((res) => setStudents(res.data))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStudents() }, [search, statusFilter])

  const deleteStudent = async (id, name) => {
    if (!confirm(`Delete student "${name}"?`)) return
    try {
      await api.delete(`/students/${id}`)
      toast.success('Student deleted')
      fetchStudents()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-slate-400 text-sm mt-1">{students.length} students total</p>
        </div>
        <Link to="/students/new">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-neon flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Student
          </motion.button>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neon-input w-full py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="neon-input py-2 px-4 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-6 py-4 text-left font-medium">Name</th>
                  <th className="px-6 py-4 text-left font-medium">Room</th>
                  <th className="px-6 py-4 text-left font-medium">Phone</th>
                  <th className="px-6 py-4 text-left font-medium">Plan</th>
                  <th className="px-6 py-4 text-left font-medium">End Date</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-left font-medium">Biometric</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                    <td className="px-6 py-4 text-slate-300">{s.room_number || '—'}</td>
                    <td className="px-6 py-4 text-slate-300">{s.phone || '—'}</td>
                    <td className="px-6 py-4 text-slate-300 capitalize">{s.plan_type?.replace('months', ' mo') || '—'}</td>
                    <td className="px-6 py-4 text-slate-300">{s.end_date || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_CLASS[s.payment_status] || 'badge-pending'}`}>
                        {STATUS_LABELS[s.payment_status] || s.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Fingerprint className={`w-4 h-4 ${s.biometric_enabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/students/${s.id}/edit`}>
                          <button className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => deleteStudent(s.id, s.name)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
