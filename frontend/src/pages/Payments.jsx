import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Download } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const PLANS = [
  { value: 'monthly', label: '1 Month' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: '12months', label: '12 Months' },
]

function AddPaymentModal({ students, onClose, onSaved }) {
  const [form, setForm] = useState({
    student_id: '',
    amount: '',
    plan_type: 'monthly',
    paid_date: new Date().toISOString().split('T')[0],
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/payments', form)
      toast.success('Payment recorded!')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 w-full max-w-md shadow-neon"
      >
        <h2 className="text-xl font-semibold text-white mb-5">Record Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Student *</label>
            <select
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              required
              className="neon-input w-full py-2.5 px-4 text-sm"
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Amount (₹) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
                placeholder="5000"
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Plan</label>
              <select
                value={form.plan_type}
                onChange={(e) => setForm((f) => ({ ...f, plan_type: e.target.value }))}
                className="neon-input w-full py-2.5 px-4 text-sm"
              >
                {PLANS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Paid Date</label>
              <input
                type="date"
                value={form.paid_date}
                onChange={(e) => setForm((f) => ({ ...f, paid_date: e.target.value }))}
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Optional notes..."
              className="neon-input w-full py-2.5 px-4 text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-neon flex-1 py-2.5 text-sm disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm text-slate-400 glass-card border border-white/10 rounded-xl">
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
  const [students, setStudents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([api.get('/payments'), api.get('/students')])
      .then(([pRes, sRes]) => {
        setPayments(pRes.data)
        setStudents(sRes.data)
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const deletePayment = async (id) => {
    if (!confirm('Delete this payment record?')) return
    try {
      await api.delete(`/payments/${id}`)
      toast.success('Deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const exportCSV = () => {
    window.open('/api/reports/export/payments', '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-slate-400 text-sm mt-1">{payments.length} records</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 glass-card border border-white/10 rounded-xl hover:bg-white/5">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="btn-neon flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </motion.button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No payments recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-6 py-4 text-left font-medium">Student</th>
                  <th className="px-6 py-4 text-left font-medium">Amount</th>
                  <th className="px-6 py-4 text-left font-medium">Plan</th>
                  <th className="px-6 py-4 text-left font-medium">Paid Date</th>
                  <th className="px-6 py-4 text-left font-medium">Valid Until</th>
                  <th className="px-6 py-4 text-left font-medium">Notes</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-white font-medium">{p.student_name}</td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">₹{p.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-300 capitalize">{p.plan_type}</td>
                    <td className="px-6 py-4 text-slate-300">{p.paid_date}</td>
                    <td className="px-6 py-4 text-slate-300">{p.end_date}</td>
                    <td className="px-6 py-4 text-slate-400 max-w-[160px] truncate">{p.notes || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deletePayment(p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddPaymentModal
          students={students}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData() }}
        />
      )}
    </div>
  )
}
