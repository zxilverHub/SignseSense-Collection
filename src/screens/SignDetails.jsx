"use client"
import { useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { db } from "../config/firebaseconfig"
import { doc, getDoc } from "firebase/firestore"
import "./SignDetails.css"

function SignDetails() {
  const { signId } = useParams()
  const navigate = useNavigate()
  const [sign, setSign] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSignDetails = async () => {
      try {
        const signDocRef = doc(db, "signs", signId)
        const signDocSnap = await getDoc(signDocRef)

        if (signDocSnap.exists()) {
          setSign({ id: signDocSnap.id, ...signDocSnap.data() })
        } else {
          setError("Sign not found.")
        }
      } catch (err) {
        console.error("Error fetching sign details:", err)
        setError("Failed to load sign details. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (signId) {
      fetchSignDetails()
    }
  }, [signId])

  if (isLoading) {
    return (
      <div className="sign-details-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2 className="loading-text">Loading sign details...</h2>
          <p className="loading-subtitle">Please wait while we fetch the sign information</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sign-details-container">
        <div className="error-state">
          <div className="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </div>
          <h2 className="error-title">Error</h2>
          <p className="error-message">{error}</p>
          <Link to="/SignseSense-Collection/home" className="back-home-btn">
            Back to Homepage
          </Link>
        </div>
      </div>
    )
  }

  if (!sign) {
    return null // Should not happen if error state is handled
  }

  return (
    <div className="sign-details-container">
      {/* Professional Header */}
      <div className="professional-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to="/SignseSense-Collection/home" className="breadcrumb-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              Home
            </Link>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
            <span className="breadcrumb-current">{sign.name}</span>
          </div>
          <div className="header-main">
            <h1 className="professional-title">{sign.name}</h1>
          </div>
        </div>
        <div className="header-actions">
          <Link to={`/SignseSense-Collection/edit/${sign.id}`} className="edit-sign-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit Sign
          </Link>
          <button onClick={() => navigate(-1)} className="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <div className="main-content">
        {/* Left Side - Image */}
        <div className="image-section">
          <div className="image-card">
            <div className="card-header">
              <h3 className="card-title">Sign Image</h3>
              {sign.isDanger && (
                <div className="danger-indicator">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                  Danger Sign
                </div>
              )}
            </div>
            <div className="image-display-area">
              <img src={sign.imgUrl || "/placeholder.svg"} alt={sign.name} className="sign-image-full" />
            </div>
          </div>
        </div>

        {/* Right Side - Details */}
        <div className="details-section">
          <div className="details-card">
            <div className="card-header">
              <h3 className="card-title">Basic Information</h3>
            </div>
            <div className="card-content">
              <div className="detail-group">
                <span className="detail-label">Sign Name:</span>
                <span className="detail-value">{sign.name}</span>
              </div>
              <div className="detail-group">
                <span className="detail-label">Category:</span>
                <span className="detail-value category-badge">{sign.category}</span>
              </div>
              <div className="detail-group full-width">
                <span className="detail-label">Purpose:</span>
                <p className="detail-value purpose-text">{sign.purpose}</p>
              </div>
            </div>
          </div>

          {sign.precautions && sign.precautions.length > 0 && sign.precautions[0].precaution !== "" && (
            <div className="details-card">
              <div className="card-header">
                <h3 className="card-title">Safety Precautions</h3>
              </div>
              <div className="card-content">
                <ul className="precautions-list">
                  {sign.precautions.map((p, index) => (
                    <li key={index} className="precaution-item">
                      <span className="precaution-number">{index + 1}</span>
                      <span className="precaution-text">{typeof p === "string" ? p : p.precaution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {sign.violation && (sign.violation.description || sign.violation.fine > 0) && (
            <div className="details-card">
              <div className="card-header">
                <h3 className="card-title">Violation Information</h3>
              </div>
              <div className="card-content">
                {sign.violation.description && (
                  <div className="detail-group full-width">
                    <span className="detail-label">Description:</span>
                    <p className="detail-value">{sign.violation.description}</p>
                  </div>
                )}
                {sign.violation.fine > 0 && (
                  <div className="detail-group">
                    <span className="detail-label">Fine Amount:</span>
                    <span className="detail-value fine-amount-text">${sign.violation.fine}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SignDetails
