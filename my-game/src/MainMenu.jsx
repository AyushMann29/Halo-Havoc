import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CLASSES = [
  {
    name: 'Tank',
    description: 'Slow but very durable. Absorbs a lot of damage.',
    stats: 'HP: 10, Speed: Low, Damage: Low',
    skill: 'Invincibility - 3 charges',
    skillDescription: 'Become immune to all damage temporarily'
  },
  {
    name: 'Assault',
    description: 'Balanced fighter. Good all-around.',
    stats: 'HP: 5, Speed: Medium, Damage: Medium',
    skill: 'Triple Shot - 4 charges',
    skillDescription: 'Fire three projectiles in a spread pattern'
  },
  {
    name: 'Healer',
    description: 'Supports teammates with healing abilities.',
    stats: 'HP: 4, Speed: High, Heal ability',
    skill: 'Heal All - 5 charges',
    skillDescription: 'Restore health to all nearby teammates'
  },
  {
    name: 'Sniper',
    description: 'Fast and deadly, but fragile.',
    stats: 'HP: 3, Speed: Very High, Damage: High',
    skill: 'Great Shot - 4 charges',
    skillDescription: 'Fire a high-damage piercing shot'
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

  const selectedClassData = CLASSES.find(cls => cls.name === selectedClass);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', background: '#0d0d0d', minHeight: '100vh', color: '#fff', fontFamily: 'monospace' }}>
      <motion.h1 initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        🚀 Choose Your Class
      </motion.h1>

      {/* Controls Instructions */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{
          backgroundColor: '#1a1a1a',
          border: '2px solid #333',
          borderRadius: '12px',
          padding: '1rem',
          margin: '0 auto 2rem auto',
          maxWidth: '600px',
          boxShadow: '0 4px 15px rgba(0, 255, 136, 0.1)'
        }}
      >
        <h3 style={{ color: '#00ffaa', marginBottom: '0.8rem', fontSize: '1.3rem' }}>🎮 Game Controls</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ backgroundColor: '#333', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem' }}>←→</span>
            <span style={{ color: '#ccc' }}>Rotate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ backgroundColor: '#333', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem' }}>↑</span>
            <span style={{ color: '#ccc' }}>Use Skill</span>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
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
            <p style={{ marginBottom: '0.8rem' }}>{cls.description}</p>
            <small style={{ color: '#ccc', display: 'block', marginBottom: '0.5rem' }}>{cls.stats}</small>
            <div style={{ 
              backgroundColor: '#0a0a0a', 
              padding: '0.5rem', 
              borderRadius: '8px', 
              border: '1px solid #333',
              marginTop: '0.8rem'
            }}>
              <div style={{ color: '#ff6b6b', fontSize: '0.9rem', fontWeight: 'bold' }}>🔥 {cls.skill}</div>
              <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '0.3rem' }}>{cls.skillDescription}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Class Skill Highlight */}
      {selectedClassData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: '#1a1a1a',
            border: '2px solid #00ff88',
            borderRadius: '12px',
            padding: '1rem',
            margin: '0 auto 2rem auto',
            maxWidth: '400px',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)'
          }}
        >
          <h4 style={{ color: '#00ffaa', marginBottom: '0.5rem' }}>✨ Selected Skill</h4>
          <div style={{ color: '#ff6b6b', fontSize: '1.1rem', fontWeight: 'bold' }}>
            {selectedClassData.name}: {selectedClassData.skill}
          </div>
          <div style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            {selectedClassData.skillDescription}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginBottom: '2rem' }}>
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
          marginBottom: '3rem',
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

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{
          borderTop: '1px solid #333',
          paddingTop: '1rem',
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ color: '#888', fontSize: '0.9rem' }}>
          Created by <span style={{ color: '#00ffaa', fontWeight: 'bold' }}>Ayush Mann</span>
        </div>
        <div style={{ color: '#555' }}>|</div>
        <a 
          href="https://github.com/ayushmann29" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#888', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#00ffaa'}
          onMouseLeave={(e) => e.target.style.color = '#888'}
        >
          <span>🐙</span> GitHub
        </a>
      </motion.footer>
    </div>
  );
}
