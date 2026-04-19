import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart2, PieChart, Handshake, CheckSquare, List, Smile,
  Menu, Settings, Bell, Activity, Sun, Moon, LogOut, Hexagon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { to: '/', icon: BarChart2, end: true },
  { to: '/students', icon: PieChart },
  { to: '/payments', icon: Handshake },
  { to: '/rooms', icon: CheckSquare },
  { to: '/biometric', icon: List },
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
    <div className="flex h-screen bg-white text-dash-text dark:bg-slate-900 dark:text-white transition-colors duration-200 font-sans">
      
      {/* Floating Side Navigation */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-[70px] bg-dash-green rounded-r-[32px] flex flex-col items-center py-8 shadow-lg my-12"
      >
        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center mb-8">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <nav className="flex flex-col gap-6">
          {navItems.map(({ to, icon: Icon, end }, idx) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-5 h-5 text-white opacity-90" />
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-8">
          <button 
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10 group"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 text-red-300 group-hover:text-red-200 transition-colors" />
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full px-4 lg:px-8">
        
        {/* Top Header */}
        <header className="h-24 flex items-center justify-between shrink-0">
          
          <div className="flex items-center gap-6">
            {/* Logo area */}
            <div className="flex items-center gap-2">
              <Hexagon className="w-8 h-8 text-dash-green fill-dash-green/30" />
              <h1 className="text-[22px] font-black text-black tracking-tight dark:text-white">RM Ladies</h1>
            </div>
            
            {/* Menu Button */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-black text-white text-sm font-semibold shadow-md hover:bg-slate-800 transition-colors">
              <Menu className="w-4 h-4" />
              Menu
            </button>
          </div>

          <div className="flex items-center gap-6">
            {/* Utility Icons */}
            <div className="flex items-center gap-4 text-dash-text dark:text-slate-400">
              <button onClick={toggleTheme} className="hover:text-black dark:hover:text-white transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="hover:text-black dark:hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="hover:text-black dark:hover:text-white transition-colors">
                <Activity className="w-5 h-5" />
              </button>
              <button className="hover:text-black dark:hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-dash-red rounded-full"></span>
              </button>
            </div>

            {/* Upgrade Button removed */}

            {/* Profile */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{user?.role || 'Admin'}</p>
                <p className="text-sm font-bold text-black">{user?.username || 'Chao Xing'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative">
                {/* Fallback image if no avatar */}
                <img src={`https://ui-avatars.com/api/?name=${user?.username || 'Chao+Xing'}&background=e6ede9&color=1d3d2e`} alt="avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-8">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
