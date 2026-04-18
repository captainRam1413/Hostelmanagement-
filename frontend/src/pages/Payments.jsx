import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiPlus, HiTrash, HiCreditCard } from 'react-icons/hi'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../api/axios'

const PLAN_OPTIONS = ['Monthly', '3months', '6months', '12months']
const PLAN_AMOUNTS = { Monthly: 3000, '3months': 8500, '6months': 16000, '12months': 30000 }

function PaymentModal({ onClose, onSave }) {
  const [students, setStudents] = useState([])
  const [form, setForm] = useState({
    student_id: '',
    amount: '',
    plan_type: 'Monthly',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/students').then((res) => setStudents(res.data)).catch(() => {})
  }, [])

  const handlePlanChange = (plan) => {
    setForm({ ...form, plan_type: plan, amount: PLAN_AMOUNTS[plan] || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.student_id || !form.amount) {
      toast.error('Student and amount are required')
      return
    }
    setLoading(true)
    try {
      await api.post('/payments', form)
      toast.success('Payment recorded!')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save payment')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card neon-border w-full max-w-md p-6"
      >
        <h2 className="text-white font-bold text-lg mb-5">Add Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Student *</label>
            <select
              className={inputCls}
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} – Room {s.room_number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Plan *</label>
            <select
              className={inputCls}
              value={form.plan_type}
              onChange={(e) => handlePlanChange(e.target.value)}
            >
              {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount (₹) *</label>
            <input
              type="number"
              className={inputCls}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="3000"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Date</label>
            <input
              type="date"
              className={inputCls}
              value={form.payment_date}
              onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes</label>
            <input
              className={inputCls}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/payments')
      setPayments(res.data)
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayments() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return
    try {
      await api.delete(`/payments/${id}`)
      toast.success('Payment deleted')
      fetchPayments()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white neon-text">Payments</h1>
          <p className="text-gray-400 text-sm">Total collected: ₹{total.toLocaleString()}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition"
        >
          <HiPlus className="w-5 h-5" />
          Add Payment
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-6 py-4">Student</th>
                <th className="text-left px-6 py-4">Plan</th>
                <th className="text-left px-6 py-4">Amount</th>
                <th className="text-left px-6 py-4">Duration</th>
                <th className="text-left px-6 py-4">Date</th>
                <th className="text-left px-6 py-4">Notes</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">No payments recorded</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {p.student_name?.[0] || '?'}
                      </div>
                      <span className="text-white font-medium">{p.student_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">{p.plan_type}</span>
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">₹{p.amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-300">{p.duration} month{p.duration > 1 ? 's' : ''}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{p.notes || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <PaymentModal
            onClose={() => setShowModal(false)}
            onSave={() => { setShowModal(false); fetchPayments() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
