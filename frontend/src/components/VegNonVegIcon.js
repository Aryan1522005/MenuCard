import React from 'react';

const VegNonVegIcon = ({ isVeg }) => {
  // If isVeg is null or undefined, don't show any icon
  if (isVeg === null || isVeg === undefined) {
    return null;
  }

  // Convert to boolean for comparison
  const isVegetarian = isVeg === true || isVeg === 1 || isVeg === '1' || isVeg === 'true';

  if (isVegetarian) {
    // Vegetarian - Green circle in a green square border
    return (
      <div 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          border: '2px solid #22c55e',
          borderRadius: '2px',
          flexShrink: 0
        }}
        title="Vegetarian"
      >
        <div 
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#22c55e',
            borderRadius: '50%'
          }}
        />
      </div>
    );
  } else {
    // Non-Vegetarian - Red triangle in a red square border
    return (
      <div 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          border: '2px solid #ef4444',
          borderRadius: '2px',
          flexShrink: 0
        }}
        title="Non-Vegetarian"
      >
        <div 
          style={{
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '7px solid #ef4444'
          }}
        />
      </div>
    );
  }
};

export default VegNonVegIcon;

