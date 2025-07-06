import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CLASSES = [
  {
    name: 'Tank (Easy)',
    description: 'Slow but very durable. Absorbs a lot of damage.',
    stats: 'HP: 10, Speed: Low, Damage: Low',
    skill: 'Invincibility - 3 charges',
    skillDescription: 'Become immune to all damage temporarily'
  },
  {
    name: 'Assault (Medium)',
    description: 'Balanced fighter. Good all-around.',
    stats: 'HP: 5, Speed: Medium, Damage: Medium',
    skill: 'Triple Shot - 4 charges',
    skillDescription: 'Fire three projectiles in a spread pattern'
  },
  {
    name: 'Healer (Hard)',
    description: 'Supports teammates with healing abilities.',
    stats: 'HP: 4, Speed: High, Heal ability',
    skill: 'Heal All - 5 charges',
    skillDescription: 'Restore health to all nearby teammates'
  },
  {
    name: 'Sniper (Challenging)',
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

  useEffect(() => {
    document.title = '💫 Halo Havoc 🚀';
  }, []);

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(120deg, #0f2027, #2c5364 60%, #00ff88 100%)',
        backgroundSize: '200% 200%',
        animation: 'bgMove 10s ease-in-out infinite',
        overflow: 'auto',
      }}
    >
      {/* Animated background gradient keyframes */}
      <style>{`
        @keyframes bgMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          background: 'rgba(20, 30, 40, 0.85)',
          boxShadow: '0 8px 40px 0 rgba(0,255,136,0.10)',
          borderRadius: '24px',
          padding: '2.5rem 2.5rem 1.5rem 2.5rem',
          maxWidth: '900px',
          width: '95vw',
          margin: '2rem 0',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(0,255,136,0.10)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Game Title Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{
            fontSize: '3.6rem',
            letterSpacing: '0.08em',
            color: '#00ffaa',
            textShadow: '0 0 32px #00ff88, 0 2px 24px #00ffaa',
            fontWeight: 900,
            fontFamily: 'Orbitron, sans-serif',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          💫 Halo Havoc 🚀
        </motion.h1>
        <motion.h1 initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ fontSize: '3.5rem', marginBottom: '0.2rem', marginTop: '10rem', letterSpacing: '0.04em', color: '#00ffaa', textShadow: '0 2px 24px #00ff88' }}>
          Welcome to Halo Havoc
        </motion.h1>
        <motion.h1 initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ fontSize: '3rem', marginBottom: '1.2rem', letterSpacing: '0.04em', color: '#00ffaa', textShadow: '0 2px 24px #00ff88' }}>
          🚀 Choose Your Class
        </motion.h1>

        {/* Controls Instructions */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            backgroundColor: 'rgba(26,26,26,0.85)',
            border: '2px solid #333',
            borderRadius: '16px',
            padding: '1.1rem',
            margin: '0 auto 2.2rem auto',
            maxWidth: '600px',
            boxShadow: '0 4px 15px rgba(0, 255, 136, 0.13)'
          }}
        >
          <h3 style={{ color: '#00ffaa', marginBottom: '0.8rem', fontSize: '1.3rem', letterSpacing: '0.03em' }}>🎮 Game Controls</h3>
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

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2.2rem' }}>
          {CLASSES.map((cls) => (
            <motion.div
              key={cls.name}
              onClick={() => setSelectedClass(cls.name)}
              whileHover={{ scale: 1.08, boxShadow: '0 0 32px #00ff88' }}
              whileTap={{ scale: 0.97 }}
              animate={{ borderColor: selectedClass === cls.name ? '#00ff88' : '#444', boxShadow: selectedClass === cls.name ? '0 0 32px #00ff88' : '0 0 10px #222' }}
              style={{
                border: '3px solid',
                borderRadius: '18px',
                padding: '1.7rem',
                width: '230px',
                cursor: 'pointer',
                background: selectedClass === cls.name ? 'linear-gradient(120deg, #222 80%, #00ff88 120%)' : 'rgba(17,17,17,0.95)',
                boxShadow: selectedClass === cls.name ? '0 0 32px #00ff88' : '0 0 10px #222',
                transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
                marginBottom: '0.5rem',
                position: 'relative',
              }}
            >
              <h2 style={{ color: '#00ffaa', fontSize: '1.5rem', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>{cls.name}</h2>
              <p style={{ marginBottom: '0.8rem', color: '#fff', fontWeight: 500 }}>{cls.description}</p>
              <small style={{ color: '#ccc', display: 'block', marginBottom: '0.5rem' }}>{cls.stats}</small>
              <div style={{ 
                background: 'rgba(10,10,10,0.85)', 
                padding: '0.5rem', 
                borderRadius: '8px', 
                border: '1px solid #333',
                marginTop: '0.8rem',
                boxShadow: '0 2px 8px #00ff8855',
              }}>
                <div style={{ color: '#ff6b6b', fontSize: '0.95rem', fontWeight: 'bold' }}>🔥 {cls.skill}</div>
                <div style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '0.3rem' }}>{cls.skillDescription}</div>
              </div>
              {selectedClass === cls.name && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    top: 10, right: 10,
                    background: '#00ff88',
                    color: '#111',
                    borderRadius: '50%',
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '1.1rem',
                    boxShadow: '0 0 8px #00ff88',
                  }}
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Selected Class Skill Highlight */}
        {selectedClassData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'rgba(26,26,26,0.92)',
              border: '2px solid #00ff88',
              borderRadius: '14px',
              padding: '1.1rem',
              margin: '0 auto 2rem auto',
              maxWidth: '400px',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.22)',
              textAlign: 'center',
            }}
          >
            <h4 style={{ color: '#00ffaa', marginBottom: '0.5rem', fontSize: '1.1rem', letterSpacing: '0.02em' }}>✨ Selected Skill</h4>
            <div style={{ color: '#ff6b6b', fontSize: '1.15rem', fontWeight: 'bold' }}>
              {selectedClassData.name}: {selectedClassData.skill}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.95rem', marginTop: '0.3rem' }}>
              {selectedClassData.skillDescription}
            </div>
          </motion.div>
        )}

        {/* Room code input and create button in a card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginBottom: '2.2rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: 'rgba(34,34,34,0.92)',
            border: '1.5px solid #00ffaa44',
            borderRadius: '12px',
            padding: '1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem',
            boxShadow: '0 2px 12px #00ff8844',
            minWidth: 320,
            maxWidth: 420,
          }}>
            <span style={{ fontSize: '1.3rem', color: '#00ffaa', marginRight: 6 }}>🏷️</span>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setJoining(true);
              }}
              placeholder="Enter room code"
              style={{
                padding: '0.7rem',
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                width: '140px',
                marginRight: '0.5rem',
                borderRadius: '8px',
                border: '1.5px solid #00ffaa',
                background: '#181818',
                color: 'lime',
                outline: 'none',
                letterSpacing: '0.12em',
                fontWeight: 600,
                boxShadow: '0 1px 6px #00ff8822',
                transition: 'border 0.2s',
              }}
            />
            <button onClick={generateRoomCode} style={{ padding: '0.7rem 1.2rem', borderRadius: '8px', background: 'linear-gradient(90deg,#00ffaa 60%,#00ff88 100%)', color: '#111', border: 'none', fontWeight: 700, fontSize: '1.05rem', boxShadow: '0 2px 8px #00ff8844', cursor: 'pointer', transition: 'background 0.2s' }}>
              🔄 Create
            </button>
          </div>
        </motion.div>

        <motion.button
          onClick={handleReady}
          disabled={!selectedClass || !roomCode}
          whileHover={selectedClass && roomCode ? { scale: 1.07, boxShadow: '0 0 32px #00ff88' } : {}}
          style={{
            marginBottom: '2.5rem',
            padding: '1.3rem 3.5rem',
            fontSize: '1.45rem',
            fontWeight: 700,
            background: selectedClass && roomCode ? 'linear-gradient(90deg,#00ffaa 60%,#00ff88 100%)' : '#444',
            color: selectedClass && roomCode ? '#111' : '#888',
            border: 'none',
            borderRadius: '16px',
            cursor: selectedClass && roomCode ? 'pointer' : 'not-allowed',
            boxShadow: selectedClass && roomCode ? '0 0 24px #00ff88' : 'none',
            letterSpacing: '0.04em',
            transition: 'all 0.2s cubic-bezier(.4,2,.6,1)',
          }}
        >
          {selectedClass ? `🎮 Enter Room ${roomCode || ''}` : 'Select class & room'}
        </motion.button>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{
          width: '100vw',
          maxWidth: '100vw',
          position: 'fixed',
          left: 0,
          bottom: 0,
          borderTop: '1.5px solid #00ffaa33',
          paddingTop: '1rem',
          paddingBottom: '1.2rem',
          background: 'rgba(20,30,40,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.2rem',
          flexWrap: 'wrap',
          fontSize: '1rem',
          zIndex: 100,
          boxShadow: '0 -2px 16px #00ff8822',
        }}
      >
        <div style={{ color: '#00ffaa', fontWeight: 'bold', letterSpacing: '0.03em' }}>
          Created by Ayush Mann
        </div>
        <div style={{ color: '#555' }}>|</div>
        <a 
          href="https://github.com/ayushmann29" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#00ffaa', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            transition: 'color 0.3s ease',
          }}
        >
          <span>🐙</span> GitHub
        </a>
      </motion.footer>
    </div>
  );
}