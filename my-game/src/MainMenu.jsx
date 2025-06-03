import React, { useState } from 'react';
import { motion } from 'framer-motion';

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
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleReady = () => {
    if (selectedClass && roomCode.trim()) {
      onReady({ selectedClass, roomCode: roomCode.trim().toUpperCase() });
    }
  };

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substr(2, 5).toUpperCase();
    setRoomCode(code);
    setJoining(false);
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center', background: '#0d0d0d', minHeight: '100vh', color: '#fff', fontFamily: 'monospace' }}>
      <motion.h1 initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        🚀 Choose Your Class
      </motion.h1>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {CLASSES.map((cls) => (
          <motion.div
            key={cls.name}
            onClick={() => setSelectedClass(cls.name)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ borderColor: selectedClass === cls.name ? '#00ff88' : '#444' }}
            style={{
              border: '3px solid',
              borderRadius: '15px',
              padding: '1.5rem',
              width: '220px',
              cursor: 'pointer',
              backgroundColor: selectedClass === cls.name ? '#222' : '#111',
              boxShadow: selectedClass === cls.name ? '0 0 20px #00ff88' : '0 0 10px #333'
            }}
          >
            <h2 style={{ color: '#00ffaa' }}>{cls.name}</h2>
            <p>{cls.description}</p>
            <small style={{ color: '#ccc' }}>{cls.stats}</small>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: '2rem' }}>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => {
            setRoomCode(e.target.value.toUpperCase());
            setJoining(true);
          }}
          placeholder="Enter room code"
          style={{
            padding: '0.6rem',
            fontSize: '1rem',
            textTransform: 'uppercase',
            width: '220px',
            marginRight: '0.5rem',
            borderRadius: '8px',
            border: '1px solid #555',
            backgroundColor: '#222',
            color: 'lime'
          }}
        />
        <button onClick={generateRoomCode} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', backgroundColor: '#444', color: '#fff', border: 'none' }}>
          🔄 Create
        </button>
      </motion.div>

      <motion.button
        onClick={handleReady}
        disabled={!selectedClass || !roomCode}
        whileHover={selectedClass && roomCode ? { scale: 1.05 } : {}}
        style={{
          marginTop: '2.5rem',
          padding: '1rem 2.5rem',
          fontSize: '1.2rem',
          backgroundColor: selectedClass && roomCode ? '#00ff88' : '#444',
          color: '#000',
          border: 'none',
          borderRadius: '12px',
          cursor: selectedClass && roomCode ? 'pointer' : 'not-allowed',
          boxShadow: selectedClass && roomCode ? '0 0 15px #00ff88' : 'none'
        }}
      >
        {selectedClass ? `🎮 Enter Room ${roomCode || ''}` : 'Select class & room'}
      </motion.button>
    </div>
  );
}
