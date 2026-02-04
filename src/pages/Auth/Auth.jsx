import React, { Component } from 'react'
import './Auth.css'
import { Mail, User, Lock, ArrowRight, X } from 'lucide-react'
import ThemeToggle from '../assets/ThemeToggle'
import { login, signup } from '../../api/auth'

class Auth extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeTab: props.initialMode || 'login',
      loginEmail: '',
      loginPassword: '',
      signupEmail: '',
      signupUsername: '',
      signupPassword: '',
      signupConfirmPassword: '',
      error: '',
      loading: false
    }
  }

  componentDidMount() {
    if (this.props.inline) {
      document.body.style.overflow = 'hidden'
    }
  }

  componentWillUnmount() {
    document.body.style.overflow = ''
  }

  componentDidUpdate(prevProps) {
    if (prevProps.initialMode !== this.props.initialMode) {
      this.setState({ activeTab: this.props.initialMode || 'login' })
    }

    if (this.props.inline && !prevProps.inline) {
      document.body.style.overflow = 'hidden'
    } else if (!this.props.inline && prevProps.inline) {
      document.body.style.overflow = ''
    }
  }

  handleLoginSubmit = async (e) => {
    e.preventDefault()
    this.setState({ error: '', loading: true })

    try {
      const result = await login(this.state.loginEmail, this.state.loginPassword)
      if (result.success) {
        if (this.props.onLoginSuccess) {
          this.props.onLoginSuccess()
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        this.setState({ error: result.error || 'Login failed' })
      }
    } catch (err) {
      this.setState({ error: 'An error occurred. Please try again.' })
    } finally {
      this.setState({ loading: false })
    }
  }

  handleSignupSubmit = async (e) => {
    e.preventDefault()
    this.setState({ error: '' })

    if (this.state.signupPassword !== this.state.signupConfirmPassword) {
      this.setState({ error: 'Passwords do not match' })
      return
    }

    if (this.state.signupPassword.length < 6) {
      this.setState({ error: 'Password must be at least 6 characters' })
      return
    }

    this.setState({ loading: true })

    try {
      const result = await signup(
        this.state.signupEmail,
        this.state.signupPassword,
        this.state.signupConfirmPassword
      )
      if (result.success) {
        if (this.props.onLoginSuccess) {
          this.props.onLoginSuccess()
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        this.setState({ error: result.error || 'Signup failed' })
      }
    } catch (err) {
      this.setState({ error: 'An error occurred. Please try again.' })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { inline, onClose } = this.props
    const { activeTab, error, loading } = this.state

    return (
      <div className={`auth-page ${inline ? 'auth-inline' : ''}`}>
        {!inline && (
          <div className="auth-bg">
            <div className="auth-bg-circle auth-bg-circle-1"></div>
            <div className="auth-bg-circle auth-bg-circle-2"></div>
          </div>
        )}

        <div className="auth-container">
          {inline && onClose && (
            <button className="auth-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}

          {!inline && (
            <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20 }}>
              <ThemeToggle />
            </div>
          )}

          {!inline && (
            <div className="auth-logo">
              <div className="auth-logo-icon"></div>
              <span className="auth-logo-text">Edu<span className="auth-logo-highlight">Nova</span></span>
            </div>
          )}

          <div className="auth-card">
            <div className="auth-card-glow"></div>

            <div className="auth-switcher">
              <button
                className={`auth-switcher-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => this.setState({ activeTab: 'login', error: '' })}
              >
                Login
              </button>
              <button
                className={`auth-switcher-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => this.setState({ activeTab: 'signup', error: '' })}
              >
                Sign Up
              </button>
              <div
                className="auth-switcher-indicator"
                style={{ transform: activeTab === 'login' ? 'translateX(0)' : 'translateX(100%)' }}
              ></div>
            </div>

            <div className="auth-form-container">
              <div
                className="auth-form-slider"
                style={{ transform: activeTab === 'login' ? 'translateX(0)' : 'translateX(-50%)' }}
              >
                {/* Login Form */}
                <div className="auth-form-wrapper">
                  <h1 className="auth-title">Welcome Back</h1>
                  {error && <div className="auth-error">{error}</div>}
                  <form className="auth-form" onSubmit={this.handleLoginSubmit}>
                    <div className="auth-input-group">
                      <div className="auth-input-icon"><Mail size={18} /></div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={this.state.loginEmail}
                        onChange={(e) => this.setState({ loginEmail: e.target.value })}
                        className="auth-input"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="auth-input-group">
                      <div className="auth-input-icon"><Lock size={18} /></div>
                      <input
                        type="password"
                        placeholder="Password"
                        value={this.state.loginPassword}
                        onChange={(e) => this.setState({ loginPassword: e.target.value })}
                        className="auth-input"
                        required
                        disabled={loading}
                      />
                    </div>
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                      <span>{loading ? 'Logging in...' : 'Log In'}</span>
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </form>
                </div>

                {/* Sign Up Form */}
                <div className="auth-form-wrapper">
                  <h1 className="auth-title">Create an account</h1>
                  {error && <div className="auth-error">{error}</div>}
                  <form className="auth-form" onSubmit={this.handleSignupSubmit}>
                    <div className="auth-input-group">
                      <div className="auth-input-icon"><Mail size={18} /></div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={this.state.signupEmail}
                        onChange={(e) => this.setState({ signupEmail: e.target.value })}
                        className="auth-input"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="auth-input-group">
                      <div className="auth-input-icon"><User size={18} /></div>
                      <input
                        type="text"
                        placeholder="Username"
                        value={this.state.signupUsername}
                        onChange={(e) => this.setState({ signupUsername: e.target.value })}
                        className="auth-input"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="auth-input-group">
                      <div className="auth-input-icon"><Lock size={18} /></div>
                      <input
                        type="password"
                        placeholder="Password"
                        value={this.state.signupPassword}
                        onChange={(e) => this.setState({ signupPassword: e.target.value })}
                        className="auth-input"
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>
                    <div className="auth-input-group">
                      <div className="auth-input-icon"><Lock size={18} /></div>
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={this.state.signupConfirmPassword}
                        onChange={(e) => this.setState({ signupConfirmPassword: e.target.value })}
                        className="auth-input"
                        required
                        disabled={loading}
                      />
                    </div>
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                      <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Auth
