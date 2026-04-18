import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiHome,
  HiUsers,
  HiCreditCard,
  HiOfficeBuilding,
  HiFingerPrint,
  HiDocumentReport,
  HiLogout,
} from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: HiHome, label: 'Dashboard' },
  { to: '/students', icon: HiUsers, label: 'Students' },
  { to: '/payments', icon: HiCreditCard, label: 'Payments' },
  { to: '/rooms', icon: HiOfficeBuilding, label: 'Rooms' },
  { to: '/biometric', icon: HiFingerPrint, label: 'Biometric' },
  { to: '/logs', icon: HiDocumentReport, label: 'Logs' },
]

export default function Sidebar() {
  const { logout, user } = useAuth()

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-64 min-h-screen flex flex-col bg-white/5 backdrop-blur-md border-r border-white/10"
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
            RM
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">RM Ladies</p>
            <p className="text-purple-300 text-xs">Hostel Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-purple-500/20 text-purple-300 shadow-lg shadow-purple-500/20 border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-5 h-5 transition-all ${
                    isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-purple-400'
                  }`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.username}</p>
            <p className="text-gray-400 text-xs">Administrator</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <HiLogout className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </motion.aside>
  )
}
