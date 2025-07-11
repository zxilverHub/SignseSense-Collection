"use client"

function AddPrecautions({ precautions, addNewPrecaution, removePrecaution, handlePrecaution }) {
  return (
    <div className="precautions-container">
      <div className="precautions-header">
        <button onClick={addNewPrecaution} className="add-precaution-btn">
          <span className="plus-icon">+</span>
          Add Precaution
        </button>
      </div>
      <div className="precautions-list">
        {precautions.map((pc, index) => (
          <div key={"precaution" + pc.id} className="precaution-item">
            <div className="precaution-number">{index + 1}</div>
            <input
              type="text"
              placeholder="Enter safety precaution"
              onChange={(e) => handlePrecaution(pc.id, e)}
              value={pc.precaution}
              className="precaution-input"
            />
            <button
              onClick={() => removePrecaution(pc.id)}
              className="remove-precaution-btn"
              disabled={precautions.length === 1}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AddPrecautions
