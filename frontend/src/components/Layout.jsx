import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Wallet,
  BedDouble,
  Fingerprint,
  Sun,
  Moon,
  LogOut,
  Building2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/biometric', label: 'Biometric', icon: Fingerprint },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = () => {
    logout()
    // window.location.href = '/login' since we don't have useNavigate imported here
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen text-[var(--ink-1)]">
      <div className="mx-auto max-w-[1440px] p-3 md:p-5 lg:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
          <motion.aside
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="dash-card p-4 md:p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-2)]">Hostel Suite</p>
                <h1 className="display-title text-xl leading-none">RM Ladies</h1>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'text-[var(--ink-2)] hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`
                  }
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-slate-700/70">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.aside>

          <div className="flex min-h-[70vh] flex-col gap-4">
            <header className="dash-card flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
              <div>
                <p className="text-sm font-semibold text-[var(--ink-2)]">Welcome back</p>
                <p className="display-title text-[1.45rem] leading-tight">{user?.username || 'Administrator'}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <div className="flex items-center gap-3 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2">
                  <div className="text-right leading-tight">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-2)]">{user?.role || 'Admin'}</p>
                    <p className="text-sm font-bold">{user?.username || 'Admin User'}</p>
                  </div>
                  <img
                    src={`https://ui-avatars.com/api/?name=${user?.username || 'Admin+User'}&background=e2ece6&color=325f4b`}
                    alt="avatar"
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                </div>
              </div>
            </header>

            <main className="flex-1 rounded-2xl">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
