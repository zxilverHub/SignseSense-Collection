"use client"
import { useCallback, useReducer, useRef, useState, useEffect } from "react"
import { AddPrecautions, AddViolations, IsDanger } from "../importer"
import { Link, useNavigate, useParams } from "react-router-dom"
import { db } from "../config/firebaseconfig"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { getDownloadURL, getStorage, uploadBytes, deleteObject } from "firebase/storage"
import { ref } from "firebase/storage"
import "./EditSign.css"

const storage = getStorage()

const DEFAULT_SIGN = {
  name: "",
  purpose: "",
  category: "",
  violation: {
    description: "",
    fine: 0,
  },
  isDanger: false,
  precautions: [
    {
      precaution: "",
      id: 0,
    },
  ],
}

const OPERATIONS = {
  SET_NAME: "set name",
  SET_PURPOSE: "set purpose",
  SET_CATEGORY: "set category",
  SET_VIOLATION: "set violation",
  SET_FINE: "set fine",
  SET_PRECAUTIONS: "set precautions",
  SET_PRECAUTION: "set precaution",
  ADD_PRECAUTION: "add precaution",
  REMOVE_PRECAUTION: "remove precaution",
  SET_ISDANGER: "is danger",
  RESET: "reset",
  LOAD_SIGN: "load sign",
}

function inputReducer(state, action) {
  switch (action.type) {
    case OPERATIONS.LOAD_SIGN: {
      const sign = action.payload
      return {
        ...sign,
        precautions:
          sign.precautions?.length > 0
            ? sign.precautions.map((precaution, index) => ({
                precaution: typeof precaution === "string" ? precaution : precaution.precaution,
                id: index,
              }))
            : [{ precaution: "", id: 0 }],
        violation: sign.violation || { description: "", fine: 0 },
      }
    }
    case OPERATIONS.SET_PRECAUTION: {
      const precautions = state.precautions.map((pc) =>
        pc.id == action.payload.id ? { ...pc, precaution: action.payload.value } : pc,
      )
      return { ...state, precautions: precautions }
    }
    case OPERATIONS.ADD_PRECAUTION: {
      return {
        ...state,
        precautions: [
          ...state.precautions,
          {
            precaution: "",
            id: state.precautions.length,
          },
        ],
      }
    }
    case OPERATIONS.REMOVE_PRECAUTION: {
      const precautions = state.precautions.filter((pc) => pc.id != action.payload.id)
      return { ...state, precautions: precautions }
    }
    case OPERATIONS.SET_NAME:
      return { ...state, name: action.payload.value }
    case OPERATIONS.SET_PURPOSE:
      return { ...state, purpose: action.payload.value }
    case OPERATIONS.SET_CATEGORY:
      return { ...state, category: action.payload.value }
    case OPERATIONS.SET_VIOLATION:
      return { ...state, violation: { ...state.violation, description: action.payload.value } }
    case OPERATIONS.SET_FINE:
      return { ...state, violation: { ...state.violation, fine: action.payload.value } }
    case OPERATIONS.SET_ISDANGER:
      return { ...state, isDanger: action.payload.value }
    case OPERATIONS.RESET:
      return DEFAULT_SIGN
    default:
      return state
  }
}

const CATEGORIES = [
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

function EditSign() {
  const [inputs, dispatch] = useReducer(inputReducer, DEFAULT_SIGN)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentImageUrl, setCurrentImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSign, setIsLoadingSign] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [originalSign, setOriginalSign] = useState(null)

  const { signId } = useParams()
  const navigate = useNavigate()

  const handlePrecaution = useCallback((id, e) => {
    dispatch({ type: OPERATIONS.SET_PRECAUTION, payload: { id: id, value: e.target.value } })
  }, [])

  const addNewPrecaution = () => {
    dispatch({ type: OPERATIONS.ADD_PRECAUTION })
  }

  const removePrecaution = (id) => {
    if (inputs.precautions.length == 1) return
    dispatch({ type: OPERATIONS.REMOVE_PRECAUTION, payload: { id: id } })
  }

  const nameRef = useRef()
  const purposeRef = useRef()

  const setName = () => {
    dispatch({ type: OPERATIONS.SET_NAME, payload: { value: nameRef.current.value } })
  }

  const setPurpose = () => {
    dispatch({ type: OPERATIONS.SET_PURPOSE, payload: { value: purposeRef.current.value } })
  }

  const setCategory = (e) => {
    dispatch({ type: OPERATIONS.SET_CATEGORY, payload: { value: e.target.value } })
  }

  // Load sign data on component mount
  useEffect(() => {
    const loadSign = async () => {
      if (!signId) {
        console.error("No sign ID provided for editing. Redirecting to home.")
        alert("No sign ID provided for editing. Redirecting to home.")
        navigate("/SignseSense-Collection/home")
        setIsLoadingSign(false) // Ensure loading state is cleared
        return
      }

      try {
        const signDoc = await getDoc(doc(db, "signs", signId))
        if (signDoc.exists()) {
          const signData = { id: signDoc.id, ...signDoc.data() }
          setOriginalSign(signData)
          dispatch({ type: OPERATIONS.LOAD_SIGN, payload: signData })
          setCurrentImageUrl(signData.imgUrl || "")
          setImagePreview(signData.imgUrl || "")
        } else {
          alert("Sign not found!")
          navigate("/SignseSense-Collection/home")
        }
      } catch (error) {
        console.error("Error loading sign:", error)
        alert("Error loading sign data")
        navigate("/SignseSense-Collection/home")
      } finally {
        setIsLoadingSign(false)
      }
    }

    loadSign() // Always call loadSign, which now handles the ID check internally
  }, [signId, navigate, dispatch]) // Add dispatch to dependencies

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setImage(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(currentImageUrl)
    }
  }

  const handleUpdateSign = async () => {
    if (!inputs.name || !inputs.purpose || !inputs.category) {
      alert("Please fill in all required fields (Name, Purpose, Category).")
      return
    }

    setIsLoading(true)
    try {
      let imgUrl = currentImageUrl

      // Upload new image if one was selected
      if (image) {
        // Delete old image if it exists and is different from the new one
        if (currentImageUrl && originalSign?.name !== inputs.name) {
          try {
            const oldImageRef = ref(storage, `images/${originalSign.name}`)
            await deleteObject(oldImageRef)
          } catch (error) {
            console.log("Old image not found or couldn't be deleted:", error)
          }
        }

        const imgRef = ref(storage, `images/${inputs.name}`)
        const snapshot = await uploadBytes(imgRef, image)
        imgUrl = await getDownloadURL(snapshot.ref)
      } else if (originalSign?.name !== inputs.name && currentImageUrl) {
        // If name changed but no new image, update the image reference
        try {
          const oldImageRef = ref(storage, `images/${originalSign.name}`)
          const newImageRef = ref(storage, `images/${inputs.name}`)

          // Download the current image and re-upload with new name
          const response = await fetch(currentImageUrl)
          const blob = await response.blob()
          const snapshot = await uploadBytes(newImageRef, blob)
          imgUrl = await getDownloadURL(snapshot.ref)

          // Delete old image
          await deleteObject(oldImageRef)
        } catch (error) {
          console.log("Error updating image reference:", error)
        }
      }

      const cleanInputs = {
        name: inputs.name,
        purpose: inputs.purpose,
        category: inputs.category,
        violation: {
          description: inputs.violation.description,
          fine: inputs.violation.fine,
        },
        isDanger: inputs.isDanger,
        precautions: inputs.precautions.map((pr) => pr.precaution).filter((p) => p.trim() !== ""),
        imgUrl: imgUrl,
      }

      await updateDoc(doc(db, "signs", signId), cleanInputs)
      alert("Sign updated successfully!")
      navigate("/SignseSense-Collection/home")
    } catch (error) {
      console.error("Error updating sign:", error)
      alert("Error updating sign. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSign = async () => {
    setIsDeleting(true)
    try {
      // Delete the image from storage
      if (currentImageUrl && originalSign?.name) {
        try {
          const imageRef = ref(storage, `images/${originalSign.name}`)
          await deleteObject(imageRef)
        } catch (error) {
          console.log("Image not found or couldn't be deleted:", error)
        }
      }

      // Delete the document from Firestore
      await deleteDoc(doc(db, "signs", signId))
      alert("Sign deleted successfully!")
      navigate("/SignseSense-Collection/home")
    } catch (error) {
      console.error("Error deleting sign:", error)
      alert("Error deleting sign. Please try again.")
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoadingSign) {
    return (
      <div className="edit-sign-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2 className="loading-text">Loading sign data...</h2>
          <p className="loading-subtitle">Please wait while we fetch the sign information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="edit-sign-container">
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
            <span className="breadcrumb-current">Edit Sign</span>
          </div>
          <div className="header-main">
            <h1 className="professional-title">Edit Sign Entry</h1>
            <p className="professional-subtitle">Update sign information in your digital collection</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowDeleteModal(true)} className="delete-btn" disabled={isLoading || isDeleting}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2 2 0 0,1 2,2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            Delete Sign
          </button>
          <Link to="/SignseSense-Collection/home" className="cancel-btn">
            Cancel
          </Link>
        </div>
      </div>

      <div className="main-content">
        {/* Left Side - Image Upload */}
        <div className="image-section">
          <div className="image-card">
            <div className="card-header">
              <h3 className="card-title">Sign Image</h3>
              <span className="required-indicator">Required</span>
            </div>
            <div className="image-upload-area">
              <input
                type="file"
                id="image-upload"
                className="file-input"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="preview-image" />
                  <div className="image-overlay">
                    <label htmlFor="image-upload" className="change-image-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Change
                    </label>
                  </div>
                  {image && (
                    <div className="image-details">
                      <p className="image-name">{image.name}</p>
                      <p className="image-size">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
              ) : (
                <label htmlFor="image-upload" className="upload-zone">
                  <div className="upload-content">
                    <div className="upload-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                      </svg>
                    </div>
                    <h4>Upload Sign Image</h4>
                    <p>Click to browse or drag and drop</p>
                    <div className="file-formats">
                      <span>PNG, JPG, GIF up to 10MB</span>
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="form-section">
          <div className="form-container">
            {/* Basic Information */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Basic Information</h3>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label className="form-label">
                    Sign Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter the sign name"
                    onChange={setName}
                    ref={nameRef}
                    value={inputs.name}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Purpose <span className="required">*</span>
                  </label>
                  <textarea
                    placeholder="Describe the purpose and function of this sign"
                    onChange={setPurpose}
                    ref={purposeRef}
                    value={inputs.purpose}
                    className="form-textarea"
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Category <span className="required">*</span>
                  </label>
                  <select className="form-select" value={inputs.category} onChange={setCategory}>
                    <option value="" disabled>
                      Select a category
                    </option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Safety Precautions */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Safety Precautions</h3>
                <span className="optional-indicator">Optional</span>
              </div>
              <div className="card-content">
                <AddPrecautions
                  precautions={inputs.precautions}
                  addNewPrecaution={addNewPrecaution}
                  removePrecaution={removePrecaution}
                  handlePrecaution={handlePrecaution}
                />
              </div>
            </div>

            {/* Danger Classification */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Danger Classification</h3>
                <span className="optional-indicator">Optional</span>
              </div>
              <div className="card-content">
                <IsDanger distpatch={dispatch} operations={OPERATIONS} isDanger={inputs.isDanger} />
              </div>
            </div>

            {/* Violation Information */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Violation Information</h3>
                <span className="optional-indicator">Optional</span>
              </div>
              <div className="card-content">
                <AddViolations distpatch={dispatch} operations={OPERATIONS} violation={inputs.violation} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                onClick={handleUpdateSign}
                className={`submit-btn ${isLoading ? "loading" : ""}`}
                disabled={isLoading || isDeleting}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Updating Sign...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17,21 17,13 7,13 7,21" />
                      <polyline points="7,3 7,8 15,8" />
                    </svg>
                    Update Sign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Delete Sign</h3>
              <button onClick={() => setShowDeleteModal(false)} className="modal-close" disabled={isDeleting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <h4 className="warning-title">Are you sure you want to delete this sign?</h4>
              <p className="warning-message">
                This action cannot be undone. The sign "{inputs.name}" and its associated image will be permanently
                deleted from your collection.
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="cancel-modal-btn" disabled={isDeleting}>
                Cancel
              </button>
              <button
                onClick={handleDeleteSign}
                className={`delete-modal-btn ${isDeleting ? "loading" : ""}`}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="loading-spinner"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2 2 0 0,1 2,2v2" />
                    </svg>
                    Delete Sign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditSign
