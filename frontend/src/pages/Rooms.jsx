import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiPlus, HiPencil, HiTrash, HiOfficeBuilding } from 'react-icons/hi'
import toast from 'react-hot-toast'
import api from '../api/axios'

function RoomModal({ room, onClose, onSave }) {
  const [form, setForm] = useState(
    room || { room_number: '', capacity: 2, occupied: 0, floor: 1, description: '' }
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.room_number) { toast.error('Room number required'); return }
    setLoading(true)
    try {
      if (room) {
        await api.put(`/rooms/${room.id}`, form)
        toast.success('Room updated!')
      } else {
        await api.post('/rooms', form)
        toast.success('Room added!')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save room')
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
        <h2 className="text-white font-bold text-lg mb-5">{room ? 'Edit Room' : 'Add Room'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Room Number *</label>
            <input className={inputCls} value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} placeholder="101" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Floor</label>
              <input type="number" className={inputCls} value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} min={1} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Capacity</label>
              <input type="number" className={inputCls} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} min={1} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Occupied</label>
              <input type="number" className={inputCls} value={form.occupied} onChange={(e) => setForm({ ...form, occupied: e.target.value })} min={0} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50">
              {loading ? 'Saving...' : room ? 'Update' : 'Add Room'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white transition">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | room object

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await api.get('/rooms')
      setRooms(res.data)
    } catch {
      toast.error('Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRooms() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return
    try {
      await api.delete(`/rooms/${id}`)
      toast.success('Room deleted')
      fetchRooms()
    } catch {
      toast.error('Failed to delete room')
    }
  }

  const floors = [...new Set(rooms.map((r) => r.floor))].sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white neon-text">Rooms</h1>
          <p className="text-gray-400 text-sm">{rooms.length} rooms across {floors.length} floor{floors.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition"
        >
          <HiPlus className="w-5 h-5" />
          Add Room
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        floors.map((floor) => (
          <div key={floor}>
            <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">Floor {floor}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.filter((r) => r.floor === floor).map((room) => {
                const pct = room.capacity > 0 ? (room.occupied / room.capacity) * 100 : 0
                const isFull = room.occupied >= room.capacity
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-card p-5 border ${isFull ? 'border-red-500/30' : 'border-white/10'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${isFull ? 'bg-red-500/20' : 'bg-purple-500/20'}`}>
                          <HiOfficeBuilding className={`w-5 h-5 ${isFull ? 'text-red-400' : 'text-purple-400'}`} />
                        </div>
                        <div>
                          <p className="text-white font-bold">Room {room.room_number}</p>
                          <p className="text-gray-500 text-xs">Floor {room.floor}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setModal(room)} className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition">
                          <HiPencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(room.id)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
                          <HiTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{room.occupied}/{room.capacity} occupied</span>
                        <span className={isFull ? 'text-red-400' : 'text-emerald-400'}>
                          {isFull ? 'Full' : `${room.available} free`}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-purple-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {room.description && (
                      <p className="text-gray-500 text-xs mt-2 truncate">{room.description}</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <AnimatePresence>
        {modal && (
          <RoomModal
            room={modal === 'add' ? null : modal}
            onClose={() => setModal(null)}
            onSave={() => { setModal(null); fetchRooms() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
