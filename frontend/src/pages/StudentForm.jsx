import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const PLANS = [
  { value: 'monthly', label: '1 Month' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: '12months', label: '12 Months' },
]

export default function StudentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    room_id: '',
    plan_type: 'monthly',
    start_date: '',
    payment_status: 'pending',
    biometric_id: '',
  })
  const [files, setFiles] = useState({ photo: null, id_proof: null })

  useEffect(() => {
    api.get('/rooms').then((res) => setRooms(res.data)).catch(() => {})
    if (isEdit) {
      api.get(`/students/${id}`).then((res) => {
        const s = res.data
        setForm({
          name: s.name || '',
          phone: s.phone || '',
          email: s.email || '',
          room_id: s.room_id || '',
          plan_type: s.plan_type || 'monthly',
          start_date: s.start_date || '',
          payment_status: s.payment_status || 'pending',
          biometric_id: s.biometric_id || '',
        })
      }).catch(() => toast.error('Failed to load student'))
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      if (files.photo) fd.append('photo', files.photo)
      if (files.id_proof) fd.append('id_proof', files.id_proof)

      if (isEdit) {
        await api.put(`/students/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Student updated!')
      } else {
        await api.post('/students', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Student added!')
      }
      navigate('/students')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit Student' : 'Add Student'}</h1>
          <p className="text-slate-400 text-sm mt-1">{isEdit ? 'Update student information' : 'Register a new student'}</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card p-6 space-y-5"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1.5">Full Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter full name"
              className="neon-input w-full py-2.5 px-4 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 9999999999"
              className="neon-input w-full py-2.5 px-4 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="student@email.com"
              className="neon-input w-full py-2.5 px-4 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Room</label>
            <select
              name="room_id"
              value={form.room_id}
              onChange={handleChange}
              className="neon-input w-full py-2.5 px-4 text-sm"
            >
              <option value="">Select room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} (Floor: {r.floor || '—'}, {r.vacant} vacant)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Plan Type</label>
            <select
              name="plan_type"
              value={form.plan_type}
              onChange={handleChange}
              className="neon-input w-full py-2.5 px-4 text-sm"
            >
              {PLANS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="neon-input w-full py-2.5 px-4 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Payment Status</label>
            <select
              name="payment_status"
              value={form.payment_status}
              onChange={handleChange}
              className="neon-input w-full py-2.5 px-4 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Biometric ID</label>
            <input
              type="text"
              name="biometric_id"
              value={form.biometric_id}
              onChange={handleChange}
              placeholder="ESSL fingerprint ID"
              className="neon-input w-full py-2.5 px-4 text-sm"
            />
          </div>
        </div>

        {/* File Uploads */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFiles((f) => ({ ...f, photo: e.target.files[0] }))}
              className="neon-input w-full py-2 px-4 text-sm text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600/30 file:text-purple-300 file:text-xs cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">ID Proof</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFiles((f) => ({ ...f, id_proof: e.target.files[0] }))}
              className="neon-input w-full py-2 px-4 text-sm text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600/30 file:text-purple-300 file:text-xs cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-neon flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Student'}
          </motion.button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-sm text-slate-400 hover:text-white glass-card border border-white/10 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  )
}
