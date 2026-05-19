import React from 'react';

export const GazeDot: React.FC = () => {
  return (
    <div
      id="gaze-dot-overlay"
      className="gaze-dot"
      aria-hidden="true"
      style={{ display: 'none' }}
    />
  );
};
