import React, { useState } from 'react';
import { socket } from './socket';
import { motion } from 'framer-motion';

export default function HostSetup({ selectedClass, onBack }) {
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [password, setPassword] = useState('');

  const handleCreate = () => {
    socket.emit('createRoom', {
      maxPlayers,
      password: password.trim() || null,
      className: selectedClass
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f14, #0d1b1a 40%, #0a1a14 70%, #0f2027)',
      fontFamily: 'system-ui, -apple-system, sans-serif', gap: '1.5rem',
    }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(15,25,30,0.92), rgba(20,30,35,0.88))',
          border: '1px solid rgba(0,255,136,0.08)',
          borderRadius: '20px', padding: '2rem',
          display: 'flex', flexDirection: 'column', gap: '1.2rem',
          minWidth: '320px', maxWidth: '400px',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{ color: '#00ffaa', margin: 0, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
          Host Game
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ color: '#889', fontSize: '0.85rem', fontWeight: 600 }}>Max Players</label>
          <input
            type="number"
            min={1}
            max={8}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 1)}
            style={{
              padding: '0.6rem 0.8rem', fontSize: '1rem', borderRadius: '10px',
              border: '1px solid rgba(0,255,136,0.12)', background: 'rgba(0,0,0,0.35)',
              color: '#eee', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ color: '#889', fontSize: '0.85rem', fontWeight: 600 }}>Password (optional)</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank for no password"
            style={{
              padding: '0.6rem 0.8rem', fontSize: '1rem', borderRadius: '10px',
              border: '1px solid rgba(0,255,136,0.12)', background: 'rgba(0,0,0,0.35)',
              color: '#eee', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
          <button
            onClick={onBack}
            style={{
              flex: 1, padding: '0.7rem', fontSize: '1rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', color: '#889',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
          <button
            onClick={handleCreate}
            style={{
              flex: 2, padding: '0.7rem', fontSize: '1rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #00ffaa, #00dd88)', color: '#0a0a0a',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,255,136,0.25)',
            }}
          >
            Create Lobby
          </button>
        </div>
      </motion.div>
    </div>
  );
}
