import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })

      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('userEmail', email)
      onLogin(response.data.user)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try alice@example.com / password')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = (email) => {
    setEmail(email)
    setPassword('password')
    setTimeout(() => {
      document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }))
    }, 100)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>📝 Collaborative Editor</h1>
        <p>Create and share documents in real-time</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-accounts">
          <p><strong>Demo Accounts:</strong></p>
          <button
            type="button"
            className="demo-account"
            onClick={() => demoLogin('alice@example.com')}
            style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            alice@example.com (password)
          </button>
          <button
            type="button"
            className="demo-account"
            onClick={() => demoLogin('bob@example.com')}
            style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            bob@example.com (password)
          </button>
        </div>
      </div>
    </div>
  )
}
