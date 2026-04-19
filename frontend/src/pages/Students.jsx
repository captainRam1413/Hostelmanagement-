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
          <h1 className="text-[24px] font-black text-black dark:text-white tracking-tight">Students</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{students.length} students total</p>
        </div>
        <Link to="/students/new">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-dash-green text-white rounded-[12px] font-bold shadow-md hover:bg-dash-green/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Student
          </motion.button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-[20px] p-5 flex gap-4 flex-wrap border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 pl-10 pr-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-black dark:text-white focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-black dark:text-white focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[20px] overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-dash-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Biometric</th>
                  <th className="px-6 py-4 text-right font-bold text-[12px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-[13px] text-black dark:text-white">{s.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-[13px]">{s.room_number || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-[13px]">{s.phone || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-[13px] capitalize">{s.plan_type?.replace('months', ' mo') || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-[13px]">{s.end_date || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${STATUS_CLASS[s.payment_status] || 'badge-pending'}`}>
                        {STATUS_LABELS[s.payment_status] || s.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Fingerprint className={`w-4 h-4 ${s.biometric_enabled ? 'text-dash-green' : 'text-slate-400'}`} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/students/${s.id}/edit`}>
                          <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => deleteStudent(s.id, s.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
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
