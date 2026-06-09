import React from 'react';
import { socket } from './socket';
import { motion } from 'framer-motion';

const CLASS_ICONS = {
  Reimu: '⛩️',
  Marisa: '🧙',
  Eirin: '🏹',
  Youmu: '⚔️',
};

export default function Lobby({ roomCode, isHost, players, onBack }) {
  const handleStart = () => {
    socket.emit('startGame');
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
          minWidth: '360px', maxWidth: '420px',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
          alignItems: 'center',
        }}
      >
        <h2 style={{ color: '#00ffaa', margin: 0, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
          Lobby
        </h2>

        <div style={{
          background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
          padding: '0.6rem 1.2rem',
          border: '1px solid rgba(0,255,136,0.1)',
          fontFamily: 'monospace', fontSize: '1.3rem',
          color: '#00ffaa', letterSpacing: '0.3em', fontWeight: 700,
        }}>
          {roomCode}
        </div>

        <div style={{
          width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          <div style={{ color: '#889', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Players ({players.length})
          </div>
          {players.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0.8rem', borderRadius: '10px',
                background: 'rgba(0,0,0,0.25)',
                border: p.isHost ? '1px solid rgba(0,255,136,0.2)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{CLASS_ICONS[p.className] || '?'}</span>
              <span style={{ color: '#ccc', fontWeight: 500, fontSize: '0.95rem' }}>{p.className}</span>
              {p.isHost && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.7rem', color: '#00ffaa',
                  background: 'rgba(0,255,136,0.1)', padding: '0.15rem 0.5rem',
                  borderRadius: '6px', fontWeight: 600,
                }}>
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={players.length < 1}
            style={{
              width: '100%', padding: '0.8rem', fontSize: '1.1rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #00ffaa, #00dd88)',
              color: '#0a0a0a', border: 'none', borderRadius: '12px',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,255,136,0.25)',
              marginTop: '0.3rem',
            }}
          >
            Start Game
          </button>
        ) : (
          <div style={{
            width: '100%', textAlign: 'center', padding: '0.8rem',
            color: '#667', fontSize: '0.9rem', fontStyle: 'italic',
          }}>
            Waiting for host to start...
          </div>
        )}

        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1.2rem', fontSize: '0.85rem', fontWeight: 600,
            background: 'rgba(255,255,255,0.04)', color: '#667',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px',
            cursor: 'pointer', marginTop: '0.3rem',
          }}
        >
          Leave Lobby
        </button>
      </motion.div>
    </div>
  );
}
