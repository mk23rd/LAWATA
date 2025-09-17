import React, { useEffect, useState } from 'react'
import { FiBell } from 'react-icons/fi'
import { auth, db } from '../firebase/firebase-config'
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const NotificationBell = ({ containerClassName = '' }) => {
  const user = auth.currentUser
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setNotifications(items)
      },
      (err) => {
        console.error('Notifications listener error:', err)
      }
    )
    return () => unsub()
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notif-dropdown')) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className={`relative notif-dropdown ${containerClassName}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className='bg-color-e rounded-full w-10 h-10 flex items-center justify-center text-color-d hover:bg-opacity-90 transition-colors'
        aria-label='Notifications'
      >
        <FiBell className='text-xl' />
      </button>
      {unreadCount > 0 && (
        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full'>
          {unreadCount}
        </span>
      )}
      {open && (
        <div className='absolute right-0 mt-2 w-80 bg-color-e rounded-md shadow-lg z-50 p-2'>
          <p className='px-2 py-1 text-sm text-color-d opacity-80'>Notifications</p>
          <div className='max-h-80 overflow-y-auto'>
            {notifications.length === 0 && (
              <p className='text-color-d text-sm px-2 py-3'>No notifications</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                className={`w-full text-left px-3 py-2 rounded-md mb-1 ${n.read ? 'bg-transparent' : 'bg-color-b bg-opacity-10'}`}
                onClick={async () => {
                  try {
                    if (!n.read) await updateDoc(doc(db, 'notifications', n.id), { read: true })
                  } catch (e) {
                    console.error('Failed to mark notification read', e)
                  } finally {
                    setOpen(false)
                    if (n.projectId) {
                     // navigate(`/myProjectInfo/${n.projectId}`)
                      navigate("/projects")
                    }
                  }
                }}
              >
                <div className='flex justify-between items-center'>
                  <span className='text-color-d text-sm'>{n.message}</span>
                  <span className='text-color-d text-xs opacity-60'>
                    {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleDateString() : ''}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell