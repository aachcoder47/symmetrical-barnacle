import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import DocumentEditor from '../components/DocumentEditor'
import DocumentList from '../components/DocumentList'
import SharingPanel from '../components/SharingPanel'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function EditorPage({ user, onLogout }) {
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const fileInputRef = useRef(null)

  const getHeaders = () => ({
    'x-user-email': user.email,
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  })

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/documents`, {
        headers: getHeaders()
      })
      setDocuments(response.data)
      if (response.data.length > 0 && !selectedDoc) {
        setSelectedDoc(response.data[0])
      }
    } catch (err) {
      setError('Failed to load documents')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDocument = async () => {
    try {
      const response = await axios.post(`${API_URL}/documents`, {
        title: 'Untitled Document',
        content: ''
      }, { headers: getHeaders() })
      setDocuments([response.data, ...documents])
      setSelectedDoc(response.data)
    } catch (err) {
      setError('Failed to create document')
    }
  }

  const handleRenameDocument = async () => {
    if (!newTitle.trim()) return

    try {
      await axios.put(`${API_URL}/documents/${selectedDoc.id}`, {
        title: newTitle
      }, { headers: getHeaders() })

      const updated = { ...selectedDoc, title: newTitle }
      setSelectedDoc(updated)
      setDocuments(documents.map(d => d.id === selectedDoc.id ? updated : d))
      setShowRenameModal(false)
      setNewTitle('')
    } catch (err) {
      setError('Failed to rename document')
    }
  }

  const handleDeleteDocument = async () => {
    if (!selectedDoc) return
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await axios.delete(`${API_URL}/documents/${selectedDoc.id}`, {
        headers: getHeaders()
      })
      const newDocs = documents.filter(d => d.id !== selectedDoc.id)
      setDocuments(newDocs)
      setSelectedDoc(newDocs.length > 0 ? newDocs[0] : null)
    } catch (err) {
      setError('Failed to delete document')
    }
  }

  const handleSaveDocument = async (content) => {
    if (!selectedDoc) return

    try {
      const response = await axios.put(`${API_URL}/documents/${selectedDoc.id}`, {
        content
      }, { headers: getHeaders() })

      setSelectedDoc(response.data)
      setDocuments(documents.map(d => d.id === selectedDoc.id ? response.data : d))
    } catch (err) {
      setError('Failed to save document')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_URL}/documents/upload/file`, formData, {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })
      setDocuments([response.data, ...documents])
      setSelectedDoc(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1>📝 Collaborative Editor</h1>
        <div className="user-info">
          <span className="user-email">{user.name} ({user.email})</span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="main-content">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="new-doc-btn" onClick={handleCreateDocument}>
              + New
            </button>
            <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
              ⬆️ Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              onChange={handleFileUpload}
              className="hidden-file-input"
            />
          </div>

          <div className="document-list">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : documents.length === 0 ? (
              <div style={{ padding: '20px', color: '#999', fontSize: '13px' }}>
                No documents yet. Create one to get started!
              </div>
            ) : (
              documents.map(doc => (
                <div
                  key={doc.id}
                  className={`document-item ${selectedDoc?.id === doc.id ? 'active' : ''}`}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="doc-item-title">
                    {doc.title}
                    {!doc.isOwned && <span className="badge shared">shared</span>}
                  </div>
                  <div className="doc-item-meta">
                    {doc.isOwned ? 'You' : `by ${doc.ownerName}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="editor-container">
          {error && <div className="error" style={{ margin: '10px 20px 0' }}>{error}</div>}

          {selectedDoc ? (
            <>
              <DocumentEditor
                document={selectedDoc}
                onSave={handleSaveDocument}
                onRename={() => {
                  setNewTitle(selectedDoc.title)
                  setShowRenameModal(true)
                }}
                onDelete={handleDeleteDocument}
                isOwner={selectedDoc.isOwned}
              />

              {selectedDoc.isOwned && (
                <SharingPanel
                  documentId={selectedDoc.id}
                  ownerId={selectedDoc.ownerId}
                  ownerName={selectedDoc.ownerName}
                  onShare={() => loadDocuments()}
                />
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <h2>No document selected</h2>
              <p>Create a new document or select one from the list to get started</p>
            </div>
          )}
        </div>
      </div>

      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Rename Document</h2>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Document title"
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="cancel"
                onClick={() => {
                  setShowRenameModal(false)
                  setNewTitle('')
                }}
              >
                Cancel
              </button>
              <button className="confirm" onClick={handleRenameDocument}>
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
