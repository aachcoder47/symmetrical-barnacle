import { useState } from 'react'
import './App.css'
import LoginPage from './pages/LoginPage'
import EditorPage from './pages/EditorPage'

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })

  const handleLogin = (user) => {
    setCurrentUser(user)
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <div className="app">
      {!currentUser ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <EditorPage user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
