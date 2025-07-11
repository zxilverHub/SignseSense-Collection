"use client"

function AddViolations({ distpatch, operations, violation }) {
  return (
    <div className="violations-container">
      <div className="input-group">
        <label className="input-label">Violation Description</label>
        <input
          type="text"
          placeholder="Describe what constitutes a violation"
          value={violation.description}
          className="form-input"
          onChange={(e) => {
            distpatch({ type: operations.SET_VIOLATION, payload: { value: e.target.value } })
          }}
        />
      </div>
      <div className="input-group">
        <label className="input-label">Fine Amount</label>
        <div className="currency-input-wrapper">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            placeholder="0.00"
            value={violation.fine}
            className="form-input currency-input"
            min="0"
            step="0.01"
            onChange={(e) => {
              distpatch({ type: operations.SET_FINE, payload: { value: e.target.value } })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default AddViolations
