import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Save, Fingerprint, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const PLANS = [
  { value: 'monthly', label: '1 Month' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: '12months', label: '12 Months' },
]

// Enrollment modal states
const ENROLL_IDLE = 'idle'
const ENROLL_WAITING = 'waiting'
const ENROLL_SUCCESS = 'success'
const ENROLL_ERROR = 'error'

function EnrollmentModal({ student, onClose, onSuccess }) {
  const [enrollState, setEnrollState] = useState(ENROLL_IDLE)
  const [message, setMessage] = useState('')
  const [uid, setUid] = useState(null)
  const [countdown, setCountdown] = useState(30)

  const startEnrollment = async () => {
    setEnrollState(ENROLL_WAITING)
    setMessage('Place your finger on the biometric device now…')

    // Countdown for UX feedback
    let c = 30
    const timer = setInterval(() => {
      c -= 1
      setCountdown(c)
      if (c <= 0) clearInterval(timer)
    }, 1000)

    try {
      const res = await api.post(`/biometric/enroll/${student.id}`)
      clearInterval(timer)
      if (res.data.success) {
        setEnrollState(ENROLL_SUCCESS)
        setUid(res.data.essl_uid)
        setMessage(`Fingerprint enrolled successfully! ESSL UID: ${res.data.essl_uid}`)
        onSuccess(res.data)
      } else {
        setEnrollState(ENROLL_ERROR)
        setMessage(res.data.message || 'Enrollment failed')
      }
    } catch (err) {
      clearInterval(timer)
      setEnrollState(ENROLL_ERROR)
      setMessage(err.response?.data?.error || 'Enrollment failed. Check device connection.')
    }
  }

  useEffect(() => {
    // Auto-start on open
    startEnrollment()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={enrollState !== ENROLL_WAITING ? onClose : undefined}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative glass-card p-8 w-full max-w-md text-center space-y-6"
        style={{ border: '1px solid rgba(168,85,247,0.3)' }}
      >
        {/* Close button (only when not actively scanning) */}
        {enrollState !== ENROLL_WAITING && (
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}

        <div>
          <h2 className="text-xl font-bold text-white">Fingerprint Enrollment</h2>
          <p className="text-sm text-slate-400 mt-1">{student.name}</p>
        </div>

        {/* State icon */}
        <div className="flex justify-center">
          {enrollState === ENROLL_WAITING && (
            <div className="relative w-28 h-28">
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-purple-500/50 animate-ping" style={{ animationDelay: '0.2s' }} />
              <div className="w-28 h-28 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/40">
                <Fingerprint className="w-14 h-14 text-purple-400 animate-pulse" />
              </div>
              <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-slate-400">
                {countdown}s remaining
              </div>
            </div>
          )}
          {enrollState === ENROLL_SUCCESS && (
            <div className="w-28 h-28 rounded-full bg-emerald-600/20 flex items-center justify-center border border-emerald-500/40">
              <CheckCircle className="w-14 h-14 text-emerald-400" />
            </div>
          )}
          {enrollState === ENROLL_ERROR && (
            <div className="w-28 h-28 rounded-full bg-red-600/20 flex items-center justify-center border border-red-500/40">
              <AlertCircle className="w-14 h-14 text-red-400" />
            </div>
          )}
        </div>

        {/* Status message */}
        <div className="pt-4">
          <p className={`text-sm font-medium ${
            enrollState === ENROLL_SUCCESS ? 'text-emerald-400' :
            enrollState === ENROLL_ERROR ? 'text-red-400' : 'text-slate-300'
          }`}>{message}</p>
          {uid && (
            <div className="mt-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-slate-400">ESSL Device UID</p>
              <p className="text-lg font-bold text-purple-300 font-mono">{uid}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {enrollState === ENROLL_ERROR && (
            <button
              onClick={startEnrollment}
              className="btn-neon flex items-center gap-2 px-5 py-2 text-sm"
            >
              <Fingerprint className="w-4 h-4" />
              Retry
            </button>
          )}
          {enrollState !== ENROLL_WAITING && (
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm glass-card border border-white/10 text-slate-300 hover:text-white rounded-xl transition-colors"
            >
              {enrollState === ENROLL_SUCCESS ? 'Done' : 'Close'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function StudentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [savedStudent, setSavedStudent] = useState(null)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollAndSave, setEnrollAndSave] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    parent_contact_no: '',
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
          address: s.address || '',
          parent_contact_no: s.parent_contact_no || '',
          room_id: s.room_id || '',
          plan_type: s.plan_type || 'monthly',
          start_date: s.start_date || '',
          payment_status: s.payment_status || 'pending',
          biometric_id: s.biometric_id || '',
        })
        setSavedStudent(s)
      }).catch(() => toast.error('Failed to load student'))
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const saveStudent = async () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
    if (files.photo) fd.append('photo', files.photo)
    if (files.id_proof) fd.append('id_proof', files.id_proof)

    let student
    if (isEdit) {
      const res = await api.put(`/students/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      student = res.data
      toast.success('Student updated!')
    } else {
      const res = await api.post('/students', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      student = res.data
      toast.success('Student added!')
    }
    return student
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await saveStudent()
      navigate('/students')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterAndEnroll = async (e) => {
    e.preventDefault()
    if (!form.name) { toast.error('Name is required'); return }
    setLoading(true)
    try {
      const student = await saveStudent()
      setSavedStudent(student)
      setEnrollAndSave(true)
      setShowEnrollModal(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollSuccess = (data) => {
    toast.success(`Fingerprint enrolled! UID: ${data.essl_uid}`)
  }

  const handleEnrollClose = () => {
    setShowEnrollModal(false)
    if (enrollAndSave) navigate('/students')
  }

  const canEnroll = isEdit && savedStudent?.id

  return (
    <>
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
            <p className="text-slate-400 text-sm mt-1">
              {isEdit ? 'Update student information' : 'Register a new student & enroll fingerprint'}
            </p>
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
                type="text" name="name" value={form.name} onChange={handleChange}
                required placeholder="Enter full name"
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Phone</label>
              <input
                type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="+91 9999999999"
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="student@email.com"
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Parent Contact No</label>
              <input
                type="tel" name="parent_contact_no" value={form.parent_contact_no} onChange={handleChange}
                placeholder="+91 8888888888"
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5">Address</label>
              <textarea
                name="address" value={form.address} onChange={handleChange}
                placeholder="Full residential address"
                rows="2"
                className="neon-input w-full py-2.5 px-4 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Room</label>
              <select name="room_id" value={form.room_id} onChange={handleChange} className="neon-input w-full py-2.5 px-4 text-sm">
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
              <select name="plan_type" value={form.plan_type} onChange={handleChange} className="neon-input w-full py-2.5 px-4 text-sm">
                {PLANS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Start Date</label>
              <input
                type="date" name="start_date" value={form.start_date} onChange={handleChange}
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Payment Status</label>
              <select name="payment_status" value={form.payment_status} onChange={handleChange} className="neon-input w-full py-2.5 px-4 text-sm">
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Photo</label>
              <input
                type="file" accept="image/*"
                onChange={(e) => setFiles((f) => ({ ...f, photo: e.target.files[0] }))}
                className="neon-input w-full py-2 px-4 text-sm text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600/30 file:text-purple-300 file:text-xs cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">ID Proof</label>
              <input
                type="file" accept="image/*,.pdf"
                onChange={(e) => setFiles((f) => ({ ...f, id_proof: e.target.files[0] }))}
                className="neon-input w-full py-2 px-4 text-sm text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600/30 file:text-purple-300 file:text-xs cursor-pointer"
              />
            </div>
          </div>

          {/* Biometric enrollment info for existing students */}
          {isEdit && savedStudent?.essl_uid && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Fingerprint className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-emerald-300 font-medium">Fingerprint Enrolled</p>
                <p className="text-xs text-emerald-500">ESSL UID: {savedStudent.essl_uid}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading}
              className="btn-neon flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Save Only'}
            </motion.button>

            {!isEdit && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="button"
                disabled={loading}
                onClick={handleRegisterAndEnroll}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl border border-purple-500/40 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 hover:text-purple-200 transition-all disabled:opacity-50"
                style={{ boxShadow: '0 0 16px rgba(168,85,247,0.2)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                Register & Enroll Fingerprint
              </motion.button>
            )}

            {canEnroll && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setShowEnrollModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl border border-purple-500/40 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 hover:text-purple-200 transition-all"
                style={{ boxShadow: '0 0 16px rgba(168,85,247,0.2)' }}
              >
                <Fingerprint className="w-4 h-4" />
                {savedStudent?.essl_uid ? 'Re-enroll Fingerprint' : 'Enroll Fingerprint'}
              </motion.button>
            )}

            <button
              type="button" onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-sm text-slate-400 hover:text-white glass-card border border-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      </div>

      {/* Enrollment Modal */}
      <AnimatePresence>
        {showEnrollModal && savedStudent && (
          <EnrollmentModal
            student={savedStudent}
            onSuccess={handleEnrollSuccess}
            onClose={handleEnrollClose}
          />
        )}
      </AnimatePresence>
    </>
  )
}
