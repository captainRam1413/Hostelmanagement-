import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiPlus, HiSearch, HiPencil, HiTrash, HiFilter } from 'react-icons/hi'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../api/axios'

const PLAN_OPTIONS = ['All', 'Monthly', '3months', '6months', '12months']

export default function Students() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ is_active: '', plan_type: '' })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = { search }
      if (filter.is_active !== '') params.is_active = filter.is_active
      if (filter.plan_type && filter.plan_type !== 'All') params.plan_type = filter.plan_type
      const res = await api.get('/students', { params })
      setStudents(res.data)
    } catch (err) {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [search, filter])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"?`)) return
    try {
      await api.delete(`/students/${id}`)
      toast.success('Student deleted')
      fetchStudents()
    } catch (err) {
      toast.error('Failed to delete student')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white neon-text">Students</h1>
          <p className="text-gray-400 text-sm mt-1">{students.length} students total</p>
        </div>
        <Link
          to="/students/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition"
        >
          <HiPlus className="w-5 h-5" />
          Add Student
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>
        <select
          value={filter.is_active}
          onChange={(e) => setFilter({ ...filter, is_active: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          value={filter.plan_type}
          onChange={(e) => setFilter({ ...filter, plan_type: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-purple-500"
        >
          {PLAN_OPTIONS.map((p) => (
            <option key={p} value={p === 'All' ? '' : p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-6 py-4">Name</th>
                <th className="text-left px-6 py-4">Phone</th>
                <th className="text-left px-6 py-4">Room</th>
                <th className="text-left px-6 py-4">Plan</th>
                <th className="text-left px-6 py-4">End Date</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">No students found</td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {s.name[0]}
                          </div>
                          <span className="text-white font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{s.phone}</td>
                      <td className="px-6 py-4 text-gray-300">{s.room_number}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                          {s.plan_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {s.end_date ? format(new Date(s.end_date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            s.is_active
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/students/${s.id}/edit`)}
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                            title="Edit"
                          >
                            <HiPencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                            title="Delete"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
