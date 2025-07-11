"use client"

function IsDanger({ distpatch, operations, isDanger }) {
  const handleToggle = () => {
    const newValue = !isDanger
    distpatch({ type: operations.SET_ISDANGER, payload: { value: newValue } })
  }

  return (
    <div className="danger-container">
      <div className="toggle-wrapper">
        <div className="toggle-info">
          <span className="toggle-label">Danger Classification</span>
          <span className="toggle-description">Mark this sign as potentially dangerous</span>
        </div>
        <button
          type="button"
          className={`toggle-switch ${isDanger ? "active" : ""}`}
          onClick={handleToggle}
          aria-pressed={isDanger}
        >
          <span className="toggle-slider"></span>
          <span className="toggle-text">{isDanger ? "ON" : "OFF"}</span>
        </button>
      </div>
    </div>
  )
}

export default IsDanger
