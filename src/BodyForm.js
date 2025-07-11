import React from 'react';

const BodyForm = ({ bodies, onBodyChange }) => {
  return (
    <div className="body-form">
      <h2>Body Configuration</h2>
      <div className="bodies-grid">
        {bodies.map(body => (
          <div key={body.id} className="body-config-compact">
            <h3 style={{ color: body.color }}>Body {body.id}</h3>
            
            <div className="form-row-compact">
              <label>
                X:
                <input
                  type="number"
                  step="0.1"
                  value={body.x}
                  onChange={(e) => onBodyChange(body.id, 'x', e.target.value)}
                />
              </label>
              
              <label>
                Y:
                <input
                  type="number"
                  step="0.1"
                  value={body.y}
                  onChange={(e) => onBodyChange(body.id, 'y', e.target.value)}
                />
              </label>
              
              <label>
                Vx:
                <input
                  type="number"
                  step="0.1"
                  value={body.vx}
                  onChange={(e) => onBodyChange(body.id, 'vx', e.target.value)}
                />
              </label>
              
              <label>
                Vy:
                <input
                  type="number"
                  step="0.1"
                  value={body.vy}
                  onChange={(e) => onBodyChange(body.id, 'vy', e.target.value)}
                />
              </label>
              
              <label>
                Mass:
                <input
                  type="number"
                  step="0.1"
                  value={body.mass}
                  onChange={(e) => onBodyChange(body.id, 'mass', e.target.value)}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BodyForm;