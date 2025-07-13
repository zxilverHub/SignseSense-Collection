"use client"
import { useEffect, useState } from "react"
import { auth, db } from "../config/firebaseconfig"
import { signOut } from "firebase/auth"
import { Link, useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { collection, getDocs } from "firebase/firestore"
import "./Homepage.css"

const CATEGORIES = [
  "All Categories",
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

const ITEMS_PER_PAGE = 12

function Homepage() {
  const [isLoadingUser, setLoadingUser] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [signs, setSigns] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

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
      }
    }

    const subs = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/SignseSense-Collection")
      } else {
        setIsLoggedIn(true)
        getSigns()
      }
      setLoadingUser(false)
    })

    return () => {
      subs()
    }
  }, [navigate])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate("/SignseSense-Collection")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
    setCurrentPage(1)
  }

  const filteredSigns = signs.filter((sign) => {
    const matchesSearchTerm =
      sign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sign.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All Categories" || sign.category === selectedCategory
    return matchesSearchTerm && matchesCategory
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredSigns.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentSigns = filteredSigns.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push("...")
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i)
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...")
      }

      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (isLoadingUser) {
    return (
      <div className="homepage-wrapper">
        <div className="homepage-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2 className="loading-text">Loading your sign collection...</h2>
            <p className="loading-subtitle">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="homepage-wrapper">
      <div className="homepage-container">
        {/* Professional Header */}
        <div className="professional-header">
          <div className="header-content">
            <div className="header-main">
              <h1 className="professional-title">Sign Collection</h1>
            </div>
          </div>
          <div className="header-actions">
            {isLoggedIn && (
              <Link to="/SignseSense-Collection/addsign" className="add-sign-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Add New Sign
              </Link>
            )}
            <button onClick={handleSignOut} className="logout-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,16 21,12 16,8" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-filter-card">
            <div className="search-group">
              <label className="search-label">Search Signs</label>
              <div className="search-input-wrapper">
                <svg
                  className="search-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or purpose..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">Filter by Category</label>
              <div className="filter-select-wrapper">
                <svg
                  className="filter-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
          </div>
        </div>

        {/* Results Summary */}
        {filteredSigns.length > 0 && (
          <div className="results-summary">
            <div className="results-info">
              <h3 className="results-title">
                {filteredSigns.length} {filteredSigns.length === 1 ? "Sign" : "Signs"} Found
              </h3>
              <p className="results-description">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredSigns.length)} of {filteredSigns.length} results
                {selectedCategory !== "All Categories" && ` in "${selectedCategory}"`}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
            {totalPages > 1 && (
              <div className="page-info">
                <span className="page-text">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <main className="main-content">
          {filteredSigns.length === 0 && !isLoadingUser ? (
            <div className="no-results-card">
              <div className="no-results-content">
                <div className="no-results-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <h3 className="no-results-title">No signs found</h3>
                <p className="no-results-description">
                  {searchTerm || selectedCategory !== "All Categories"
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Get started by adding your first sign to the collection."}
                </p>
                {!searchTerm && selectedCategory === "All Categories" && (
                  <Link to="/SignseSense-Collection/addsign" className="add-first-sign-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Add Your First Sign
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="signs-grid">
              {currentSigns.map((sign) => (
                <div
                  key={sign.id}
                  className="sign-card"
                  onClick={() => navigate(`/SignseSense-Collection/sign/${sign.id}`)}
                >
                  <div className="sign-image-container">
                    <img src={sign.imgUrl || "/placeholder.svg"} alt={sign.name} className="sign-image" />
                    {sign.isDanger && (
                      <div className="danger-badge">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                        Danger
                      </div>
                    )}
                  </div>
                  <div className="sign-content">
                    <div className="sign-header">
                      <h3 className="sign-name">{sign.name}</h3>
                      <div className="sign-category">{sign.category}</div>
                    </div>
                    {/* Removed sign.purpose, sign.precautions, sign.violation from here */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Pagination */}
        {filteredSigns.length > 0 && totalPages > 1 && (
          <div className="pagination-section">
            <div className="pagination-container">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`pagination-btn pagination-prev ${currentPage === 1 ? "disabled" : ""}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Previous
              </button>
              <div className="pagination-numbers">
                {generatePageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === "number" && handlePageChange(page)}
                    disabled={page === "..."}
                    className={`pagination-number ${page === currentPage ? "active" : ""} ${
                      page === "..." ? "ellipsis" : ""
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`pagination-btn pagination-next ${currentPage === totalPages ? "disabled" : ""}`}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Homepage
