import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

// Mock data for the chart
const chartData = [
  { name: 'Jan', Images: 2000, Documents: 3000 },
  { name: 'Feb', Images: 3500, Documents: 4000 },
  { name: 'Mar', Images: 1500, Documents: 2000 },
  { name: 'Apr', Images: 4000, Documents: 3000 },
  { name: 'May', Images: 2000, Documents: 1500 },
  { name: 'Jun', Images: 4500, Documents: 3500 },
  { name: 'Jul', Images: 3000, Documents: 5500 },
  { name: 'Aug', Images: 2500, Documents: 3000 },
  { name: 'Sep', Images: 4000, Documents: 2500 },
  { name: 'Oct', Images: 5000, Documents: 4000 },
  { name: 'Nov', Images: 6000, Documents: 7000 },
  { name: 'Dec', Images: 3000, Documents: 4000 },
]

function XIcon() {
  return (
    <div className="w-10 h-10 rounded-full border-[1.5px] border-white/50 flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-80"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </div>
  )
}

function TopCard({ title, value, percentage, bgColor }) {
  return (
    <div className={`${bgColor} rounded-[14px] p-5 text-white flex flex-col justify-between h-[120px]`}>
      <div className="flex justify-between items-start">
        <XIcon />
        <p className="text-[32px] font-bold leading-none tracking-tight">{value}</p>
      </div>
      <div className="flex justify-between items-end">
        <p className="font-semibold text-sm">{title}</p>
        <div className="bg-white/20 px-2 py-0.5 text-[11px] font-bold">
          {percentage}
        </div>
      </div>
    </div>
  )
}

function BottomCard({ title, value, percentage, colorClass }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-[12px] p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-start mb-2">
        <p className={`text-[28px] font-black ${colorClass}`}>{value}</p>
        <div className={`px-2 py-0.5 text-[11px] font-bold ${colorClass} bg-current/10 flex items-center gap-1`}>
          {percentage} <span className="text-[10px]">↗</span>
        </div>
      </div>
      <p className="text-[13px] font-bold text-black dark:text-slate-300">{title}</p>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-dash-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-dash-hero dark:bg-slate-800 p-6 rounded-[20px]">
        <div>
          <p className="text-dash-text dark:text-slate-300 font-semibold flex items-center gap-2 text-sm">
            <span className="w-[18px] h-[18px] rounded-full border-2 border-dash-text text-dash-text dark:border-white dark:text-white flex items-center justify-center text-[10px] font-bold">✓</span>
            Welcome Back, {user?.username || 'Chao'}.
          </p>
          <h1 className="text-[26px] font-black mt-1 text-dash-text dark:text-white tracking-tight">My Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-12 pr-4">
          <div className="flex items-center gap-3">
            <div className="w-[50px] h-[40px] text-dash-red">
              <svg viewBox="0 0 50 40" className="w-full h-full" preserveAspectRatio="none">
                <path d="M0 40 L10 10 L20 20 L30 5 L40 15 L50 0" stroke="currentColor" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke"/>
              </svg>
            </div>
            <div>
              <p className="text-[22px] font-black text-black dark:text-white leading-tight">
                {(data?.active * 12000)?.toLocaleString() || '$650k'} <span className="text-[14px] text-slate-500 font-bold ml-0.5">↗</span>
              </p>
              <p className="text-[11px] text-black dark:text-slate-400 font-bold">Yearly Revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-[50px] h-[40px] text-dash-blue">
              <svg viewBox="0 0 50 40" className="w-full h-full" preserveAspectRatio="none">
                <path d="M0 40 L10 5 L20 25 L30 10 L40 20 L50 5" stroke="currentColor" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke"/>
              </svg>
            </div>
            <div>
              <p className="text-[22px] font-black text-black dark:text-white leading-tight">
                {(data?.total_students * 12000)?.toLocaleString() || '$960k'} <span className="text-[14px] text-slate-500 font-bold ml-0.5">↗</span>
              </p>
              <p className="text-[11px] text-black dark:text-slate-400 font-bold">Overall Income</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TopCard 
          title="Following" 
          value={data?.total_students || 3890} 
          percentage="50%" 
          bgColor="bg-dash-red" 
        />
        <TopCard 
          title="Followers" 
          value={data?.active || 8360} 
          percentage="50%" 
          bgColor="bg-dash-blue" 
        />
        <TopCard 
          title="Shares" 
          value={data?.occupied_rooms || 3660} 
          percentage="70%" 
          bgColor="bg-dash-green" 
        />
        <TopCard 
          title="Trending" 
          value={data?.expiring_soon || 6690} 
          percentage="50%" 
          bgColor="bg-dash-yellow" 
        />
      </div>

      {/* Statistics Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-[20px] p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-black text-black dark:text-white">Statistics</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 border-2 border-dash-green/30 text-dash-text dark:text-white dark:border-slate-600 rounded-[8px] text-[13px] font-bold hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
        
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorImages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3c614b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3c614b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDocuments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#000', fontSize: 13, fontWeight: 700 }} dy={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="Documents" stroke="#d1d5db" strokeWidth={3} fillOpacity={1} fill="url(#colorDocuments)" />
              <Area type="monotone" dataKey="Images" stroke="#3c614b" strokeWidth={3} fillOpacity={1} fill="url(#colorImages)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center gap-6 mt-4 text-[12px] font-bold text-black dark:text-white">
          <div className="flex items-center gap-2">
            <div className="w-[14px] h-[14px] rounded-full bg-dash-green"></div>
            Images
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[14px] h-[14px] rounded-full bg-slate-200"></div>
            Documents
          </div>
        </div>
      </div>

      {/* 4 Bottom Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BottomCard 
          title="Images Generated" 
          value="36,000" 
          percentage="98%" 
          colorClass="text-dash-red" 
        />
        <BottomCard 
          title="Documents Created" 
          value="45,000" 
          percentage="83%" 
          colorClass="text-dash-blue" 
        />
        <BottomCard 
          title="Files Generated" 
          value="68,000" 
          percentage="69%" 
          colorClass="text-dash-green" 
        />
        <BottomCard 
          title="Prompts Generated" 
          value="89,000" 
          percentage="80%" 
          colorClass="text-dash-yellow" 
        />
      </div>

    </div>
  )
}
