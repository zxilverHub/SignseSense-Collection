"use client"

import { useEffect, useRef, useState } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../config/firebaseconfig"
import { useNavigate } from "react-router-dom"
import "./Login.css" // Import the new CSS file

function Login() {
  const [isShowPass, setShowPass] = useState(false)
  const emailRef = useRef()
  const passwordRef = useRef()
  const nav = useNavigate()
  const [isLoading, setIsLoading] = useState(true) // For initial auth check
  const [signingIn, setSigningIn] = useState(false) // For login button loading state
  const [error, setError] = useState("") // State for login errors

  useEffect(() => {
    const subs = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        nav("/SignseSense-Collection/home") // Redirect to home if already logged in
      }
      setIsLoading(false) // Auth check complete
    })
    return () => {
      subs()
    }
  }, [nav])

  async function handleLogin() {
    setError("") // Clear previous errors
    const email = emailRef.current.value
    const pass = passwordRef.current.value

    if (!email || !pass) {
      setError("Please enter both email and password.")
      return
    }

    setSigningIn(true) // Set loading state for button
    try {
      await signInWithEmailAndPassword(auth, email, pass)
      // Redirection handled by onAuthStateChanged listener
    } catch (e) {
      console.error("Login error:", e.code, e.message)
      if (e.code === "auth/invalid-email") {
        setError("Invalid email address.")
      } else if (e.code === "auth/user-disabled") {
        setError("This user account has been disabled.")
      } else if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password") {
        setError("Invalid email or password.")
      } else {
        setError("Failed to log in. Please check your credentials.")
      }
    } finally {
      setSigningIn(false) // Reset loading state for button
    }
  }

  return (
    <div className="login-container">
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading...</h2>
        </div>
      ) : (
        <div className="login-card">
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">Sign in to manage your traffic signs.</p>

          <div className="input-group">
            <label htmlFor="email-input" className="input-label">
              Email
            </label>
            <input
              type="email"
              id="email-input"
              placeholder="your.email@example.com"
              ref={emailRef}
              className="login-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password-input" className="input-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={isShowPass ? "text" : "password"}
                id="password-input"
                placeholder="••••••••"
                ref={passwordRef}
                className="login-input"
              />
              <button type="button" onClick={() => setShowPass(!isShowPass)} className="toggle-password-btn">
                {isShowPass ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-eye-off"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" x2="23" y1="1" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-eye"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button onClick={handleLogin} className="login-btn" disabled={signingIn}>
            {signingIn ? (
              <>
                <div className="spinner-small"></div> Logging In...
              </>
            ) : (
              "Log In"
            )}
          </button>

          <div className="registration-info">
            <p>
              New user? Registration is currently disabled.
              <br />
              Please contact the developer:{" "}
              <a href="mailto:silveddaveramos@gmail.com" className="developer-email">
                silveddaveramos@gmail.com
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
