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
  category: "", // New category field
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
  SET_CATEGORY: "set category", // New operation
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
    case OPERATIONS.SET_CATEGORY: // Handle new category
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
    setImage(file)

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
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
        category: inputs.category, // Save category to Firestore
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
      <div className="add-sign-header">
        <Link to="/SignseSense-Collection/home" className="back-link">
          <span className="back-arrow">←</span> Back to Home
        </Link>
        <h1 className="page-title">Add New Traffic Sign</h1>
      </div>

      <div className="main-content">
        {/* Left Side - Image Upload */}
        <div className="image-section">
          <div className="image-upload-container">
            <h2 className="section-title">Sign Image</h2>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="image-upload"
                className="file-input"
                accept="image/*"
                onChange={handleImageChange}
              />
              <label htmlFor="image-upload" className="file-input-label">
                <span className="upload-icon">📁</span>
                Choose Sign Image
              </label>
            </div>

            <div className="image-preview-container">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="preview-image" />
                  <div className="image-info">
                    <p className="image-name">{image?.name}</p>
                    <p className="image-size">{image && (image.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div className="image-placeholder">
                  <div className="placeholder-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21,15 16,10 5,21" />
                    </svg>
                  </div>
                  <p>No image selected</p>
                  <p className="placeholder-hint">Upload an image to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Form Inputs */}
        <div className="form-section">
          <div className="form-scroll-container">
            <div className="input-section">
              <h2 className="section-title">Basic Information</h2>
              <div className="input-group">
                <label className="input-label">Sign Name</label>
                <input
                  type="text"
                  placeholder="Enter the name of the sign"
                  onChange={setName}
                  ref={nameRef}
                  value={inputs.name}
                  className="form-input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Purpose</label>
                <textarea
                  placeholder="Describe the purpose of this sign in detail..."
                  onChange={setPurpose}
                  ref={purposeRef}
                  value={inputs.purpose}
                  className="form-textarea"
                  rows="3"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Category</label>
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

            <div className="input-section">
              <h2 className="section-title">Safety Precautions</h2>
              <AddPrecautions
                precautions={inputs.precautions}
                addNewPrecaution={addNewPrecaution}
                removePrecaution={removePrecaution}
                handlePrecaution={handlePrecaution}
              />
            </div>

            <div className="input-section">
              <h2 className="section-title">Danger Classification</h2>
              <IsDanger distpatch={distpatch} operations={OPERATIONS} isDanger={inputs.isDanger} />
            </div>

            <div className="input-section">
              <h2 className="section-title">Violation Information</h2>
              <AddViolations distpatch={distpatch} operations={OPERATIONS} violation={inputs.violation} />
            </div>

            <div className="form-actions">
              <button
                onClick={handleAddSign}
                className={`submit-btn ${isLoading ? "loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? "Adding Sign..." : "Add New Sign"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddSign
