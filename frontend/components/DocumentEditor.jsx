import { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

export default function DocumentEditor({ document, onSave, onRename, onDelete, isOwner }) {
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const [saveStatus, setSaveStatus] = useState('')
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Initialize Quill
    quillRef.current = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          ['header', { header: 2 }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image']
        ]
      },
      placeholder: 'Start typing...'
    })

    // Set initial content
    if (document.content) {
      quillRef.current.setContents(
        typeof document.content === 'string'
          ? { ops: [{ insert: document.content }] }
          : document.content
      )
    }

    // Handle content changes
    const handleChange = () => {
      setSaveStatus('Saving...')
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        const content = quillRef.current.getContents()
        onSave(JSON.stringify(content))
        setSaveStatus('Saved ✓')
        setTimeout(() => setSaveStatus(''), 2000)
      }, 1000)
    }

    quillRef.current.on('text-change', handleChange)

    return () => {
      clearTimeout(saveTimeoutRef.current)
    }
  }, [document.id])

  return (
    <div className="editor-body">
      <div className="editor-header">
        <input
          type="text"
          className="editor-title"
          value={document.title}
          onChange={() => {}}
          onClick={isOwner ? onRename : undefined}
          readOnly={!isOwner}
          title={isOwner ? 'Click to rename' : 'Read-only'}
        />
        <div className="editor-actions">
          {saveStatus && <span style={{ fontSize: '12px', color: '#666' }}>{saveStatus}</span>}
          {isOwner && (
            <>
              <button className="icon-btn" onClick={onRename} title="Rename">
                ✏️
              </button>
              <button className="icon-btn" onClick={onDelete} title="Delete">
                🗑️
              </button>
            </>
          )}
          {!isOwner && <span style={{ fontSize: '12px', color: '#999' }}>Read-only</span>}
        </div>
      </div>
      <div className="editor-wrapper">
        <div ref={editorRef}></div>
      </div>
    </div>
  )
}
