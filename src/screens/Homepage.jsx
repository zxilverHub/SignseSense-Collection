"use client"

import { useEffect, useState } from "react"
import { auth, db } from "../config/firebaseconfig"
import { signOut } from "firebase/auth"
import { Link, useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { collection, getDocs } from "firebase/firestore"
import "./Homepage.css" // Import the new CSS file

const CATEGORIES = [
  "All Categories", // Added for filter reset
  "Road signs",
  "Environmental sign",
  "Facility signs",
  "Guide signs",
  "Health and safety signs",
  "Informational signs",
  "Regulatory signs",
  "Utilities and Sustainability signs",
  "Warning signs",
]

function Homepage() {
  const [isLoadingUser, setLoadingUser] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [signs, setSigns] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const nav = useNavigate()

  useEffect(() => {
    const getSigns = async () => {
      try {
        const response = await getDocs(collection(db, "signs"))
        const signsData = response.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setSigns(signsData)
      } catch (error) {
        console.error("Error fetching signs:", error)
        // Optionally show an error message to the user
      }
    }

    const subs = onAuthStateChanged(auth, (user) => {
      if (!user) {
        nav("/SignseSense-Collection") // Redirect to login if not authenticated
      } else {
        setIsLoggedIn(true)
        getSigns() // Fetch signs only if logged in
      }
      setLoadingUser(false)
    })

    return () => {
      subs()
      // No need to call getSigns here on unmount, it's handled by onAuthStateChanged
    }
  }, [nav]) // Add nav to dependency array

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      nav("/SignseSense-Collection")
    } catch (error) {
      console.error("Error signing out:", error)
      // Optionally show an error message
    }
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
  }

  const filteredSigns = signs.filter((sign) => {
    const matchesSearchTerm =
      sign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sign.purpose.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "All Categories" || sign.category === selectedCategory

    return matchesSearchTerm && matchesCategory
  })

  return (
    <div className="homepage-container">
      {isLoadingUser ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading Homepage...</h2>
        </div>
      ) : (
        <>
          <header className="homepage-header">
            <h1 className="page-title">Traffic Sign Library</h1>
            <div className="header-actions">
              {isLoggedIn && (
                <Link to="/SignseSense-Collection/addsign" className="add-sign-btn">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-plus"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Add New Sign
                </Link>
              )}
              <button onClick={handleSignOut} className="logout-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-log-out"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="17 16 22 12 17 8" />
                  <line x1="22" x2="10" y1="12" y2="12" />
                </svg>
                Log Out
              </button>
            </div>
          </header>

          <div className="search-filter-bar">
            <div className="search-input-wrapper">
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
                className="lucide lucide-search"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search signs by name or purpose..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            <div className="filter-select-wrapper">
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
                className="lucide lucide-filter"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <select value={selectedCategory} onChange={handleCategoryChange} className="filter-select">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <main className="signs-grid-container">
            {filteredSigns.length === 0 && !isLoadingUser ? (
              <div className="no-signs-found">
                <p>No signs found matching your criteria.</p>
                <p>Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="signs-grid">
                {filteredSigns.map((sign) => (
                  <div key={sign.id} className="sign-card">
                    <div className="sign-image-wrapper">
                      <img src={sign.imgUrl || "/placeholder.svg"} alt={sign.name} className="sign-image" />
                      {sign.isDanger && (
                        <span className="danger-badge">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-triangle-alert"
                          >
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                          </svg>
                          Danger
                        </span>
                      )}
                    </div>
                    <div className="sign-info">
                      <h3 className="sign-name">{sign.name}</h3>
                      <p className="sign-category">{sign.category}</p>
                      <p className="sign-purpose">{sign.purpose}</p>
                      {sign.violation && sign.violation.description && (
                        <div className="sign-violation">
                          <span className="violation-label">Violation:</span> {sign.violation.description}
                          {sign.violation.fine > 0 && (
                            <span className="violation-fine"> ({sign.violation.fine})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </>
      )}
    </div>
  )
}

export default Homepage
