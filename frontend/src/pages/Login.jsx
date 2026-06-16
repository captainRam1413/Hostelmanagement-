import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Lock, User, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl grid lg:grid-cols-2 gap-5"
      >
        <div className="glass-card hidden lg:flex flex-col justify-between p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)] text-xs font-bold uppercase tracking-[0.16em]">
              <Sparkles className="h-3.5 w-3.5" />
              Hostel Console
            </div>
            <h1 className="display-title text-4xl mt-5 leading-tight">Manage rooms, students, and payments from one calm workspace.</h1>
            <p className="mt-4 text-sm text-[var(--ink-2)] max-w-md">
              Built for hostel admins who need clarity, not clutter. Check occupancy, dues, and activity in a single flow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-8 text-sm">
            <div className="dash-card p-3">
              <p className="text-[var(--ink-2)]">Occupancy</p>
              <p className="display-title text-2xl">96%</p>
            </div>
            <div className="dash-card p-3">
              <p className="text-[var(--ink-2)]">Payments Logged</p>
              <p className="display-title text-2xl">1,240</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-7 md:p-8 lg:p-9">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)] shadow-md mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="display-title text-3xl">RM Ladies Hostel</h2>
            <p className="text-sm text-[var(--ink-2)] mt-1">Sign in to your management panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[var(--ink-2)] mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-2)]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="neon-input w-full py-3 pl-10 pr-4 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--ink-2)] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-2)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="neon-input w-full py-3 pl-10 pr-4 text-sm"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-neon w-full py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-xs text-[var(--ink-2)] mt-6">
            Default: admin / admin123
          </p>
        </div>
      </motion.div>
    </div>
  )
}
