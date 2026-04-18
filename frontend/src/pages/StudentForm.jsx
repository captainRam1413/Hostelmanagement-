import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowLeft, HiSave } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { format, addMonths } from 'date-fns'
import api from '../api/axios'

const PLAN_DURATIONS = { Monthly: 1, '3months': 3, '6months': 6, '12months': 12 }

const defaultForm = {
  name: '',
  phone: '',
  room_number: '',
  plan_type: 'Monthly',
  start_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
  is_active: true,
  photo_url: '',
  id_proof_url: '',
}

export default function StudentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    api.get('/rooms').then((res) => setRooms(res.data)).catch(() => {})
    if (isEdit) {
      api.get(`/students/${id}`)
        .then((res) => {
          const s = res.data
          setForm({
            name: s.name || '',
            phone: s.phone || '',
            room_number: s.room_number || '',
            plan_type: s.plan_type || 'Monthly',
            start_date: s.start_date || '',
            end_date: s.end_date || '',
            is_active: s.is_active,
            photo_url: s.photo_url || '',
            id_proof_url: s.id_proof_url || '',
          })
        })
        .catch(() => toast.error('Failed to load student'))
    }
  }, [id])

  const handlePlanChange = (plan) => {
    const months = PLAN_DURATIONS[plan] || 1
    const end = format(addMonths(new Date(form.start_date || new Date()), months), 'yyyy-MM-dd')
    setForm({ ...form, plan_type: plan, end_date: end })
  }

  const handleStartChange = (start) => {
    const months = PLAN_DURATIONS[form.plan_type] || 1
    const end = format(addMonths(new Date(start), months), 'yyyy-MM-dd')
    setForm({ ...form, start_date: start, end_date: end })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const required = ['name', 'phone', 'room_number', 'plan_type', 'start_date', 'end_date']
    for (const f of required) {
      if (!form[f]) { toast.error(`${f} is required`); return }
    }
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/students/${id}`, form)
        toast.success('Student updated!')
      } else {
        await api.post('/students', form)
        toast.success('Student added!')
      }
      navigate('/students')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      {children}
    </div>
  )

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition text-sm"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white neon-text">
            {isEdit ? 'Edit Student' : 'Add Student'}
          </h1>
          <p className="text-gray-400 text-sm">{isEdit ? 'Update student details' : 'Register a new student'}</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Full Name *">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Student name"
            />
          </Field>
          <Field label="Phone *">
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 9999999999"
            />
          </Field>
          <Field label="Room Number *">
            <select
              className={inputCls}
              value={form.room_number}
              onChange={(e) => setForm({ ...form, room_number: e.target.value })}
            >
              <option value="">Select room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.room_number}>
                  {r.room_number} (Floor {r.floor}) – {r.available} of {r.capacity} free
                </option>
              ))}
            </select>
          </Field>
          <Field label="Plan Type *">
            <select
              className={inputCls}
              value={form.plan_type}
              onChange={(e) => handlePlanChange(e.target.value)}
            >
              {Object.keys(PLAN_DURATIONS).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Start Date *">
            <input
              type="date"
              className={inputCls}
              value={form.start_date}
              onChange={(e) => handleStartChange(e.target.value)}
            />
          </Field>
          <Field label="End Date *">
            <input
              type="date"
              className={inputCls}
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </Field>
          <Field label="Photo URL">
            <input
              className={inputCls}
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          <Field label="ID Proof URL">
            <input
              className={inputCls}
              value={form.id_proof_url}
              onChange={(e) => setForm({ ...form, id_proof_url: e.target.value })}
              placeholder="https://..."
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, is_active: !form.is_active })}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-purple-500' : 'bg-gray-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-gray-300 text-sm">
            {form.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition disabled:opacity-50"
          >
            <HiSave className="w-5 h-5" />
            {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
          </motion.button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition font-medium text-sm"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  )
}
