"use client"
import { useCallback, useReducer, useRef, useState } from "react"
import { AddPrecautions, AddViolations, IsDanger } from "../importer"
import { Link } from "react-router-dom"
import { db } from "../config/firebaseconfig"
import { addDoc, collection } from "firebase/firestore"
import { getDownloadURL, getStorage, uploadBytes } from "firebase/storage"
import { ref } from "firebase/storage"
import "./AddSign.css"

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
}

function inputReducer(state, action) {
  switch (action.type) {
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

function AddSign() {
  const [inputs, distpatch] = useReducer(inputReducer, DEFAULT_SIGN)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePrecaution = useCallback((id, e) => {
    distpatch({ type: OPERATIONS.SET_PRECAUTION, payload: { id: id, value: e.target.value } })
  }, [])

  const addNewPrecaution = () => {
    distpatch({ type: OPERATIONS.ADD_PRECAUTION })
  }

  const removePrecaution = (id) => {
    if (inputs.precautions.length == 1) return
    distpatch({ type: OPERATIONS.REMOVE_PRECAUTION, payload: { id: id } })
  }

  const nameRef = useRef()
  const purposeRef = useRef()

  const setName = () => {
    distpatch({ type: OPERATIONS.SET_NAME, payload: { value: nameRef.current.value } })
  }

  const setPurpose = () => {
    distpatch({ type: OPERATIONS.SET_PURPOSE, payload: { value: purposeRef.current.value } })
  }

  const setCategory = (e) => {
    distpatch({ type: OPERATIONS.SET_CATEGORY, payload: { value: e.target.value } })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]

    if (!file) return

    const maxSizeMB = 3
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    if (file.size > maxSizeBytes) {
      alert("File size must be less than 3MB.")
      e.target.value = "" // reset the input
      setImage(null)
      setImagePreview(null)
      return
    }

    setImage(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }


  const handleAddSign = async () => {
    if (image == null) {
      alert("Please select an image for the sign")
      return
    }
    if (!inputs.name || !inputs.purpose || !inputs.category) {
      alert("Please fill in all required fields (Name, Purpose, Category).")
      return
    }

    setIsLoading(true)
    try {
      const imgRef = ref(storage, `images/${inputs.name}`)
      const snapshot = await uploadBytes(imgRef, image)
      const imgUrl = await getDownloadURL(snapshot.ref)

      const cleanInputs = {
        name: inputs.name,
        purpose: inputs.purpose,
        category: inputs.category,
        violation: {
          description: inputs.violation.description,
          fine: inputs.violation.fine,
        },
        isDanger: inputs.isDanger,
        precautions: inputs.precautions.map((pr) => pr.precaution),
        imgUrl: imgUrl,
      }

      await addDoc(collection(db, "signs"), cleanInputs)
      distpatch({ type: OPERATIONS.RESET })
      setImage(null)
      setImagePreview(null)
      alert("Sign added successfully!")
      console.log("UPLOADED")
    } catch (e) {
      console.log(e)
      alert("Error adding sign. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="add-sign-container">
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
            <span className="breadcrumb-current">Add Sign</span>
          </div>
          <div className="header-main">
            <h1 className="professional-title">Create New Sign Entry</h1>
            <p className="professional-subtitle">Add comprehensive sign information to your digital collection</p>
          </div>
        </div>
        <div className="header-actions">
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
                  <div className="image-details">
                    <p className="image-name">{image?.name}</p>
                    <p className="image-size">{image && (image.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
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
                      <span>PNG, JPG, GIF up to 3MB</span>
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
                <IsDanger distpatch={distpatch} operations={OPERATIONS} isDanger={inputs.isDanger} />
              </div>
            </div>

            {/* Violation Information */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Violation Information</h3>
                <span className="optional-indicator">Optional</span>
              </div>
              <div className="card-content">
                <AddViolations distpatch={distpatch} operations={OPERATIONS} violation={inputs.violation} />
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                onClick={handleAddSign}
                className={`submit-btn ${isLoading ? "loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Creating Sign Entry...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Create Sign Entry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddSign
