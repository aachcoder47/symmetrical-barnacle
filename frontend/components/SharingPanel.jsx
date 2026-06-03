import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function SharingPanel({ documentId, ownerName, onShare }) {
  const [shares, setShares] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const getHeaders = () => ({
    'x-user-email': localStorage.getItem('userEmail'),
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  })

  useEffect(() => {
    loadSharing()
    loadUsers()
  }, [documentId])

  const loadSharing = async () => {
    try {
      const response = await axios.get(`${API_URL}/documents/${documentId}/sharing`, {
        headers: getHeaders()
      })
      setShares(response.data.sharedWith || [])
    } catch (err) {
      console.error('Failed to load sharing info', err)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`)
      setUsers(response.data.filter(u => u.email !== localStorage.getItem('userEmail')))
    } catch (err) {
      console.error('Failed to load users', err)
    }
  }

  const handleShare = async () => {
    if (!selectedUser) return

    try {
      setMessage('Sharing...')
      await axios.post(`${API_URL}/documents/${documentId}/share`, {
        userEmail: selectedUser
      }, { headers: getHeaders() })

      setMessage('Shared successfully ✓')
      setSelectedUser('')
      setTimeout(() => setMessage(''), 2000)
      loadSharing()
      onShare?.()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to share')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleRemoveShare = async (userId) => {
    try {
      await axios.delete(`${API_URL}/documents/${documentId}/share/${userId}`, {
        headers: getHeaders()
      })
      loadSharing()
      onShare?.()
    } catch (err) {
      setMessage('Failed to remove share')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="sharing-panel">
      <h3>📤 Sharing</h3>

      <div className="sharing-section">
        <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Owner:</p>
        <div className="owner-info">
          <strong>{ownerName}</strong>
        </div>
      </div>

      <div className="sharing-section">
        <div className="share-form">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{
              flex: 1,
              border: '1px solid #ddd',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          >
            <option value="">Share with...</option>
            {users.map(user => (
              <option key={user.id} value={user.email}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button onClick={handleShare}>Share</button>
        </div>
        {message && (
          <div style={{
            padding: '8px',
            marginBottom: '10px',
            backgroundColor: '#f6ffed',
            color: '#52c41a',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {message}
          </div>
        )}
      </div>

      <div className="sharing-section">
        <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Shared with:</p>
        {loading ? (
          <div style={{ fontSize: '12px', color: '#999' }}>Loading...</div>
        ) : shares.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#999' }}>Not shared yet</div>
        ) : (
          <div className="share-list">
            {shares.map(share => (
              <div key={share.id} className="share-item">
                <div className="share-item-name">
                  <strong>{share.name}</strong>
                  <div style={{ fontSize: '11px', color: '#999' }}>{share.email}</div>
                </div>
                <button
                  className="share-item-remove"
                  onClick={() => handleRemoveShare(share.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
