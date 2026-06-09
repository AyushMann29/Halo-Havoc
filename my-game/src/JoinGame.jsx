import React, { useState } from 'react';
import { socket } from './socket';
import { motion } from 'framer-motion';

export default function JoinGame({ selectedClass, onBack }) {
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');

  const handleJoin = () => {
    if (!roomCode.trim()) return;
    socket.emit('joinRoom', {
      roomCode: roomCode.trim().toUpperCase(),
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
          Join Game
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ color: '#889', fontSize: '0.85rem', fontWeight: 600 }}>Room Code</label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 5))}
            placeholder="Enter 5-character code"
            maxLength={5}
            style={{
              padding: '0.6rem 0.8rem', fontSize: '1.2rem', borderRadius: '10px',
              border: '1px solid rgba(0,255,136,0.12)', background: 'rgba(0,0,0,0.35)',
              color: '#00ffaa', outline: 'none', letterSpacing: '0.2em',
              fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ color: '#889', fontSize: '0.85rem', fontWeight: 600 }}>Password (optional)</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank if no password"
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
            onClick={handleJoin}
            disabled={!roomCode.trim()}
            style={{
              flex: 2, padding: '0.7rem', fontSize: '1rem', fontWeight: 700,
              background: roomCode.trim() ? 'linear-gradient(135deg, #00ffaa, #00dd88)' : 'rgba(60,60,60,0.4)',
              color: roomCode.trim() ? '#0a0a0a' : '#555',
              border: 'none', borderRadius: '10px',
              cursor: roomCode.trim() ? 'pointer' : 'not-allowed',
              boxShadow: roomCode.trim() ? '0 4px 20px rgba(0,255,136,0.25)' : 'none',
            }}
          >
            Join
          </button>
        </div>
      </motion.div>
    </div>
  );
}
