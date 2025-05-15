import React, { useState } from 'react';

const CLASSES = [
  {
    name: 'Tank',
    description: 'Slow but very durable. Absorbs a lot of damage.',
    stats: 'HP: 10, Speed: Low, Damage: Low',
  },
  {
    name: 'Assault',
    description: 'Balanced fighter. Good all-around.',
    stats: 'HP: 5, Speed: Medium, Damage: Medium',
  },
  {
    name: 'Healer',
    description: 'Supports teammates with healing abilities.',
    stats: 'HP: 4, Speed: High, Heal ability',
  },
  {
    name: 'Sniper',
    description: 'Fast and deadly, but fragile.',
    stats: 'HP: 3, Speed: Very High, Damage: High',
  },
];

export default function MainMenu({ onReady }) {
  const [selectedClass, setSelectedClass] = useState(null);

  const handleSelect = (cls) => {
    setSelectedClass(cls);
  };

  const handleReady = () => {
    if (selectedClass) {
      onReady(selectedClass);
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Choose Your Class</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {CLASSES.map((cls) => (
          <div
            key={cls.name}
            onClick={() => handleSelect(cls.name)}
            style={{
              border: selectedClass === cls.name ? '3px solid lime' : '2px solid gray',
              borderRadius: '10px',
              padding: '1rem',
              width: '200px',
              cursor: 'pointer',
              backgroundColor: selectedClass === cls.name ? '#222' : '#111',
              color: 'white'
            }}
          >
            <h2>{cls.name}</h2>
            <p>{cls.description}</p>
            <small>{cls.stats}</small>
          </div>
        ))}
      </div>

      <button
        onClick={handleReady}
        disabled={!selectedClass}
        style={{
          marginTop: '2rem',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          backgroundColor: selectedClass ? 'lime' : 'gray',
          border: 'none',
          borderRadius: '10px',
          cursor: selectedClass ? 'pointer' : 'not-allowed'
        }}
      >
        {selectedClass ? `Ready as ${selectedClass}` : 'Select a class'}
      </button>
    </div>
  );
}
