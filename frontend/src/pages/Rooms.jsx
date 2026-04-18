import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

function RoomModal({ room, onClose, onSaved }) {
  const [form, setForm] = useState({
    room_number: room?.room_number || '',
    capacity: room?.capacity || 1,
    floor: room?.floor || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (room) {
        await api.put(`/rooms/${room.id}`, form)
        toast.success('Room updated!')
      } else {
        await api.post('/rooms', form)
        toast.success('Room added!')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 w-full max-w-sm shadow-neon"
      >
        <h2 className="text-xl font-semibold text-white mb-5">{room ? 'Edit Room' : 'Add Room'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Room Number *</label>
            <input
              type="text"
              value={form.room_number}
              onChange={(e) => setForm((f) => ({ ...f, room_number: e.target.value }))}
              required
              placeholder="101"
              className="neon-input w-full py-2.5 px-4 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Capacity</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) }))}
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Floor</label>
              <input
                type="text"
                value={form.floor}
                onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                placeholder="1st"
                className="neon-input w-full py-2.5 px-4 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-neon flex-1 py-2.5 text-sm disabled:opacity-50">
              {loading ? 'Saving...' : room ? 'Update' : 'Add Room'}
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

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [editRoom, setEditRoom] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchRooms = () => {
    setLoading(true)
    api.get('/rooms')
      .then((res) => setRooms(res.data))
      .catch(() => toast.error('Failed to load rooms'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRooms() }, [])

  const deleteRoom = async (id, roomNumber) => {
    if (!confirm(`Delete room ${roomNumber}?`)) return
    try {
      await api.delete(`/rooms/${id}`)
      toast.success('Room deleted')
      fetchRooms()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete')
    }
  }

  const openEdit = (room) => { setEditRoom(room); setShowModal(true) }
  const openAdd = () => { setEditRoom(null); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditRoom(null) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rooms</h1>
          <p className="text-slate-400 text-sm mt-1">{rooms.length} rooms registered</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAdd}
          className="btn-neon flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Room
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room, i) => {
            const pct = room.capacity > 0 ? (room.occupied / room.capacity) * 100 : 0
            const isFull = room.occupied >= room.capacity
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">Room {room.room_number}</h3>
                    <p className="text-xs text-slate-400">Floor: {room.floor || '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${isFull ? 'badge-expired' : 'badge-active'}`}>
                    {isFull ? 'Full' : 'Available'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">
                    {room.occupied}/{room.capacity} occupied
                  </span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(room)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id, room.room_number)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {rooms.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500 glass-card">No rooms added yet.</div>
      )}

      {showModal && (
        <RoomModal
          room={editRoom}
          onClose={closeModal}
          onSaved={() => { closeModal(); fetchRooms() }}
        />
      )}
    </div>
  )
}
