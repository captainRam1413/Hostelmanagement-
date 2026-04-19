import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, Fingerprint, Power, PowerOff, Activity,
  Wifi, WifiOff, Settings, Download, RotateCcw, Trash2,
  Server, Shield, Clock, ChevronRight,
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TAB_USERS = 'users'
const TAB_DEVICE = 'device'

export default function BiometricPanel() {
  const [tab, setTab] = useState(TAB_USERS)
  const [students, setStudents] = useState([])
  const [status, setStatus] = useState(null)
  const [device, setDevice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncingId, setSyncingId] = useState(null)
  const [testLoading, setTestLoading] = useState(false)
  const [pullLoading, setPullLoading] = useState(false)
  const [pullUsersLoading, setPullUsersLoading] = useState(false)
  const [restartLoading, setRestartLoading] = useState(false)
  const [clearLoading, setClearLoading] = useState(false)
  const [deviceForm, setDeviceForm] = useState({ ip_address: '', port: 4370 })
  const [enrollingId, setEnrollingId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sRes, stRes, dRes] = await Promise.all([
        api.get('/students'),
        api.get('/biometric/status'),
        api.get('/biometric/device'),
      ])
      setStudents(sRes.data)
      setStatus(stRes.data)
      setDevice(dRes.data)
      setDeviceForm({ ip_address: dRes.data.ip_address, port: dRes.data.port })
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ── Device actions ────────────────────────────────────────────────────────

  const saveDeviceConfig = async () => {
    try {
      await api.put('/biometric/device', deviceForm)
      toast.success('Device config saved')
      fetchData()
    } catch {
      toast.error('Failed to save device config')
    }
  }

  const testConnection = async () => {
    setTestLoading(true)
    try {
      const res = await api.post('/biometric/device/test', deviceForm)
      if (res.data.success) {
        toast.success(`Connected! SN: ${res.data.info?.serial_number || 'N/A'}`)
      } else {
        toast.error(`Connection failed: ${res.data.error}`)
      }
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Connection failed')
      fetchData()
    } finally {
      setTestLoading(false)
    }
  }

  const pullLogs = async () => {
    setPullLoading(true)
    try {
      const res = await api.post('/biometric/device/pull-logs')
      toast.success(`Imported ${res.data.imported} log entries`)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Pull logs failed')
    } finally {
      setPullLoading(false)
    }
  }

  const pullUsers = async () => {
    setPullUsersLoading(true)
    try {
      const res = await api.post('/biometric/device/pull-users')
      toast.success(`Imported ${res.data.imported}, Updated ${res.data.updated} users`)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Pull users failed')
    } finally {
      setPullUsersLoading(false)
    }
  }

  const restartDevice = async () => {
    if (!window.confirm('Are you sure you want to restart the device?')) return
    setRestartLoading(true)
    try {
      const res = await api.post('/biometric/device/restart')
      toast.success(res.data.message)
    } catch {
      toast.error('Restart failed')
    } finally {
      setRestartLoading(false)
    }
  }

  const clearDeviceData = async () => {
    if (!window.confirm('DANGER: This will clear ALL attendance logs from the device. Continue?')) return
    setClearLoading(true)
    try {
      const res = await api.post('/biometric/device/clear')
      toast.success(res.data.message)
    } catch {
      toast.error('Clear failed')
    } finally {
      setClearLoading(false)
    }
  }

  // ── Per-student actions ───────────────────────────────────────────────────

  const enrollStudent = async (id) => {
    setEnrollingId(id)
    toast('📍 Place finger on device now…', { duration: 20000, id: 'enroll' })
    try {
      const res = await api.post(`/biometric/enroll/${id}`)
      toast.dismiss('enroll')
      if (res.data.success) {
        toast.success(`Fingerprint enrolled! UID: ${res.data.essl_uid}`)
      } else {
        toast.error(res.data.message)
      }
      fetchData()
    } catch (err) {
      toast.dismiss('enroll')
      toast.error(err.response?.data?.error || 'Enrollment failed')
    } finally {
      setEnrollingId(null)
    }
  }

  const syncStudent = async (id) => {
    setSyncingId(id)
    try {
      const res = await api.post(`/biometric/sync/${id}`)
      toast.success(res.data.message)
      fetchData()
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  const overrideAccess = async (id, enable) => {
    setSyncingId(id)
    try {
      const endpoint = enable ? `/biometric/activate/${id}` : `/biometric/deactivate/${id}`
      const res = await api.post(endpoint)
      toast.success(res.data.message)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Override failed')
    } finally {
      setSyncingId(null)
    }
  }

  const syncAll = async () => {
    setSyncing(true)
    try {
      const res = await api.post('/biometric/sync-all')
      toast.success(`Synced ${res.data.synced} students`)
      fetchData()
    } catch {
      toast.error('Sync all failed')
    } finally {
      setSyncing(false)
    }
  }

  const isConnected = device?.status === 'connected'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-black text-black dark:text-white tracking-tight">Biometric Control Panel</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ESSL / ZKTeco device management & fingerprint access control</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Device status pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : device?.status === 'disconnected'
              ? 'bg-red-500/10 text-red-400 border-red-500/30'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'Connected' : device?.status === 'disconnected' ? 'Disconnected' : 'Unknown'}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={syncAll} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-dash-green text-white rounded-[12px] font-bold shadow-md hover:bg-dash-green/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All'}
          </motion.button>
        </div>
      </div>

      {/* Status Cards */}
      {status && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: status.total, color: 'bg-purple-600', icon: Fingerprint },
            { label: 'Enrolled', value: status.enrolled, color: 'bg-blue-600', icon: Shield },
            { label: 'Access Enabled', value: status.enabled, color: 'bg-emerald-600', icon: Activity },
            { label: 'Access Disabled', value: status.disabled, color: 'bg-red-600', icon: PowerOff },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-[20px] p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[12px] font-bold">{label}</p>
                <p className="text-2xl font-black text-black dark:text-white">{value ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 w-fit rounded-[14px] border border-slate-200 dark:border-slate-700 shadow-sm">
        {[{ id: TAB_USERS, label: 'Students', icon: Fingerprint }, { id: TAB_DEVICE, label: 'Device Settings', icon: Settings }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-bold transition-all ${
              tab === t.id ? 'bg-slate-100 text-black dark:bg-slate-700 dark:text-white shadow-sm' : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === TAB_USERS ? (
          <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {/* Student Table */}
            <div className="bg-white dark:bg-slate-800 rounded-[20px] overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-dash-green border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Room</th>
                        <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">ESSL UID</th>
                        <th className="px-6 py-4 text-left font-bold text-[12px] uppercase tracking-wider">Access</th>
                        <th className="px-6 py-4 text-right font-bold text-[12px] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-black dark:text-white font-bold text-[13px]">
                            <div>{s.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{s.phone || '—'}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-[13px]">{s.room_number || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                              s.payment_status === 'active' ? 'badge-active' :
                              s.payment_status === 'expired' ? 'badge-expired' : 'badge-pending'
                            }`}>
                              {s.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                            {s.essl_uid ?? <span className="text-slate-600 italic">Not enrolled</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Fingerprint className={`w-4 h-4 ${s.biometric_enabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                              <span className={`text-xs font-medium ${s.biometric_enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {s.biometric_enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Enroll */}
                              <button
                                onClick={() => enrollStudent(s.id)}
                                disabled={enrollingId === s.id}
                                title="Enroll fingerprint"
                                className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 text-xs"
                              >
                                {enrollingId === s.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                              </button>
                              {/* Sync */}
                              <button
                                onClick={() => syncStudent(s.id)}
                                disabled={syncingId === s.id}
                                title="Auto-sync based on payment status"
                                className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                              >
                                <RefreshCw className={`w-4 h-4 ${syncingId === s.id ? 'animate-spin' : ''}`} />
                              </button>
                              {/* Enable */}
                              <button
                                onClick={() => overrideAccess(s.id, true)}
                                disabled={syncingId === s.id || s.biometric_enabled}
                                title="Enable access"
                                className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30"
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              {/* Disable */}
                              <button
                                onClick={() => overrideAccess(s.id, false)}
                                disabled={syncingId === s.id || !s.biometric_enabled}
                                title="Disable access"
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-30"
                              >
                                <PowerOff className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <div className="text-center py-12 text-slate-500">No students registered yet.</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="device" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
            {/* Connection Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-[20px] p-6 space-y-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center">
                  <Server className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Device Connection</h2>
                  <p className="text-xs text-slate-400">Configure your ESSL / ZKTeco device IP and port</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Device IP Address</label>
                  <input
                    type="text"
                    value={deviceForm.ip_address}
                    onChange={e => setDeviceForm(f => ({ ...f, ip_address: e.target.value }))}
                    placeholder="192.168.1.201"
                    className="neon-input w-full py-2.5 px-4 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Port</label>
                  <input
                    type="number"
                    value={deviceForm.port}
                    onChange={e => setDeviceForm(f => ({ ...f, port: parseInt(e.target.value) }))}
                    placeholder="4370"
                    className="neon-input w-full py-2.5 px-4 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={testConnection} disabled={testLoading}
                  className="btn-neon flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {testLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  {testLoading ? 'Testing...' : 'Test Connection'}
                </motion.button>
                <button
                  onClick={saveDeviceConfig}
                  className="px-5 py-2.5 text-sm glass-card border border-white/10 text-slate-300 hover:text-white rounded-xl transition-colors"
                >
                  Save Config
                </button>
              </div>
            </div>

            {/* Device Info */}
            {device && (
              <div className="bg-white dark:bg-slate-800 rounded-[20px] p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Device Information</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Status', value: device.status, badge: true },
                    { label: 'IP Address', value: device.ip_address },
                    { label: 'Port', value: device.port },
                    { label: 'Serial Number', value: device.device_serial || 'N/A' },
                    { label: 'Firmware', value: device.firmware_version || 'N/A' },
                    { label: 'Last Sync', value: device.last_sync ? new Date(device.last_sync).toLocaleString() : 'Never' },
                  ].map(({ label, value, badge }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500">{label}</span>
                      {badge ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full border w-fit font-medium ${
                          value === 'connected' ? 'badge-active' :
                          value === 'disconnected' ? 'badge-expired' : 'badge-pending'
                        }`}>{value}</span>
                      ) : (
                        <span className="text-sm text-white font-mono">{value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-[20px] p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-600/30 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Device Actions</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ActionCard
                  icon={RefreshCw}
                  label="Sync All Students"
                  desc="Push all active users to device"
                  color="text-blue-400"
                  bg="bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40"
                  loading={syncing}
                  onClick={syncAll}
                />
                <ActionCard
                  icon={Download}
                  label="Pull Attendance Logs"
                  desc="Fetch and import device logs"
                  color="text-emerald-400"
                  bg="bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"
                  loading={pullLoading}
                  onClick={pullLogs}
                />
                <ActionCard
                  icon={Download}
                  label="Pull Device Users"
                  desc="Fetch existing device users into DB"
                  color="text-purple-400"
                  bg="bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40"
                  loading={pullUsersLoading}
                  onClick={pullUsers}
                />
                <ActionCard
                  icon={RotateCcw}
                  label="Restart Device"
                  desc="Send restart command to device"
                  color="text-amber-400"
                  bg="bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40"
                  loading={restartLoading}
                  onClick={restartDevice}
                />
                <ActionCard
                  icon={Trash2}
                  label="Clear Attendance Logs"
                  desc="Remove all logs from device"
                  color="text-red-400"
                  bg="bg-red-500/10 border-red-500/20 hover:border-red-500/40"
                  loading={clearLoading}
                  onClick={clearDeviceData}
                  danger
                />
              </div>
            </div>

            {/* Last sync info */}
            {status?.last_sync && (
              <div className="glass-card p-4 flex items-center gap-3 text-sm text-slate-400">
                <Clock className="w-4 h-4 text-purple-400" />
                Last sync: <span className="text-white">{new Date(status.last_sync).toLocaleString()}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ActionCard({ icon: Icon, label, desc, color, bg, loading, onClick, danger }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left disabled:opacity-50 ${bg}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/20' : 'bg-white/5'}`}>
        {loading ? <RefreshCw className={`w-5 h-5 ${color} animate-spin`} /> : <Icon className={`w-5 h-5 ${color}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-500 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
    </motion.button>
  )
}
