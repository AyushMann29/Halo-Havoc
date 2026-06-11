import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const CLASSES = [
  {
    name: 'Reimu',
    icon: '⛩️',
    color: '#e83030',
    description: 'Shrine maiden of the Hakurei shrine. Barrier specialist.',
    hp: 10,
    speed: 2,
    damage: 2,
    skill: 'Shield Barrier - 10 charges, 30s CD',
    skillDescription: 'Create a protective barrier that blocks all bullets'
  },
  {
    name: 'Marisa',
    icon: '🧙',
    color: '#ff7b24',
    description: 'Ordinary witch. Loves firepower and flashy attacks.',
    hp: 5,
    speed: 4,
    damage: 4,
    skill: 'Master Spark - 5 charges, 10s CD',
    skillDescription: 'Fire a massive laser beam dealing 100 damage'
  },
  {
    name: 'Eirin',
    icon: '🏹',
    color: '#2e8bcc',
    description: 'Lunar sage and physician. Supports allies.',
    hp: 4,
    speed: 3,
    damage: 3,
    skill: 'Team Heal - 10 charges, 30s CD',
    skillDescription: 'Restore 1 HP to all teammates'
  },
  {
    name: 'Youmu',
    icon: '⚔️',
    color: '#38b86a',
    description: 'Half-human half-phantom swordswoman. Precise and deadly.',
    hp: 3,
    speed: 5,
    damage: 5,
    skill: 'Phantom Slash - 5 charges, no CD',
    skillDescription: 'Unleash 4 diagonal slashes dealing 10 damage each'
  },
];

function StatBar({ value, max, color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%' }}>
      <span style={{ color: '#999', fontSize: '0.7rem', width: '1rem', fontFamily: 'monospace' }}>{label}</span>
      <div style={{ flex: 1, height: '4px', background: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: '2px' }} />
      </div>
    </div>
  );
}

function FloatingOrbs() {
  const orbs = Array.from({ length: 4 }, (_, i) => ({
    size: Math.random() * 60 + 30,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: i * 1.5,
    duration: Math.random() * 6 + 8,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,255,136,0.08), transparent)`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function MainMenu({ selectedClass, onSelectClass, onHost, onJoin }) {
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    document.title = 'Halo Havoc';

    const checkOrientation = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowRotatePrompt(isMobile && isSmallScreen && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

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
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0a0f14, #0d1b1a 40%, #0a1a14 70%, #0f2027)',
        overflow: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <style>{`
        @keyframes bgDrift {
          0% { background-position: 0% 30%; }
          50% { background-position: 100% 70%; }
          100% { background-position: 0% 30%; }
        }
        body { margin: 0; }
        input::selection { background: #00ff88; color: #111; }
      `}</style>

      <FloatingOrbs />

      {showRotatePrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            background: 'radial-gradient(ellipse at center, #0d1b1a, #0a0f14)',
            zIndex: 1000, padding: '2rem',
          }}
        >
          <motion.div
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '5rem', marginBottom: '2rem', filter: 'drop-shadow(0 0 20px #00ff8866)' }}
          >
            📱
          </motion.div>
          <h1 style={{ fontSize: '2rem', color: '#00ffaa', textAlign: 'center', marginBottom: '0.5rem', textShadow: '0 0 30px #00ff8866', fontWeight: 700 }}>
            Rotate Your Device
          </h1>
          <p style={{ fontSize: '1rem', color: '#889', textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>
            Halo Havoc works best in landscape mode
          </p>
        </motion.div>
      )}

      {!showRotatePrompt && (
        <>
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginTop: '2rem', marginBottom: '0.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}
          >
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '0.06em',
              color: '#00ffaa', textShadow: '0 0 40px #00ff8844, 0 0 80px #00ff8822',
              fontWeight: 800, fontFamily: 'Orbitron, system-ui, sans-serif',
              margin: 0, lineHeight: 1.1,
            }}>
              HALO HAVOC
            </h1>
            <div style={{ height: '3px', width: '60px', background: 'linear-gradient(90deg, transparent, #00ffaa, transparent)', margin: '0.5rem auto 0' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              position: 'relative', zIndex: 1, width: '95vw', maxWidth: '1000px',
              margin: '0.5rem auto 1rem', padding: '1.5rem 2rem 1.2rem',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(15,25,30,0.92), rgba(20,30,35,0.88))',
              border: '1px solid rgba(0,255,136,0.08)',
              boxShadow: '0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Controls badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                display: 'flex', gap: '1rem', flexWrap: 'wrap',
                justifyContent: 'center', marginBottom: '0.8rem',
                padding: '0.5rem 1rem', borderRadius: '30px',
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ background: 'rgba(0,255,136,0.12)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#00ffaa', fontFamily: 'monospace', fontWeight: 700 }}>WASD / Arrows</span>
                <span style={{ color: '#778', fontSize: '0.8rem' }}>Move</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ background: 'rgba(255,100,100,0.15)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#ff6b6b', fontFamily: 'monospace', fontWeight: 700 }}>Z</span>
                <span style={{ color: '#778', fontSize: '0.8rem' }}>Bomb</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ background: 'rgba(0,255,136,0.12)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#00ffaa', fontFamily: 'monospace', fontWeight: 700 }}>X</span>
                <span style={{ color: '#778', fontSize: '0.8rem' }}>Skill</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ background: 'rgba(100,200,255,0.15)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#64c8ff', fontFamily: 'monospace', fontWeight: 700 }}>Shift</span>
                <span style={{ color: '#778', fontSize: '0.8rem' }}>Focus</span>
              </div>
            </motion.div>

            {/* Class cards */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', width: '100%' }}>
              {CLASSES.map((cls) => {
                const isSelected = selectedClass === cls.name;
                return (
                  <motion.div
                    key={cls.name}
                    onClick={() => onSelectClass(cls.name)}
                    whileHover={{ y: -4, boxShadow: `0 8px 30px ${cls.color}22` }}
                    whileTap={{ scale: 0.97 }}
                    animate={{
                      borderColor: isSelected ? cls.color : 'rgba(255,255,255,0.06)',
                      boxShadow: isSelected ? `0 0 30px ${cls.color}22, inset 0 0 30px ${cls.color}11` : '0 4px 16px rgba(0,0,0,0.3)',
                    }}
                    style={{
                      border: '2px solid', borderRadius: '16px', padding: '1.2rem 1rem',
                      width: '190px', cursor: 'pointer',
                      background: isSelected ? 'linear-gradient(145deg, rgba(30,35,40,0.95), rgba(20,25,30,0.9))' : 'rgba(15,18,22,0.8)',
                      transition: 'border-color 0.2s', position: 'relative', flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="selectedGlow"
                        style={{ position: 'absolute', inset: -2, borderRadius: '18px', border: `2px solid ${cls.color}`, pointerEvents: 'none' }}
                      />
                    )}
                    <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.2rem', filter: isSelected ? 'none' : 'grayscale(0.3)' }}>{cls.icon}</div>
                    <h3 style={{ color: cls.color, fontSize: '1.1rem', margin: '0 0 0.2rem', textAlign: 'center', fontWeight: 700, letterSpacing: '0.02em' }}>{cls.name}</h3>
                    <p style={{ margin: '0 0 0.5rem', color: '#667', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.3 }}>{cls.description}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.2rem 0.1rem' }}>
                      <StatBar value={cls.hp} max={10} color="#e74c3c" label="HP" />
                      <StatBar value={cls.speed} max={5} color="#3498db" label="SP" />
                      <StatBar value={cls.damage} max={5} color="#f39c12" label="AT" />
                    </div>
                    <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.4rem 0.35rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${cls.color}22` }}>
                      <div style={{ color: '#ff6b6b', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>{cls.skill}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Skill detail */}
            {selectedClassData && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                style={{
                  background: 'rgba(0,0,0,0.2)', border: `1px solid ${selectedClassData.color}22`,
                  borderRadius: '10px', padding: '0.5rem 1rem', textAlign: 'center',
                  width: '100%', maxWidth: '600px', marginBottom: '1.2rem',
                }}
              >
                <div style={{ color: selectedClassData.color, fontSize: '0.85rem', fontWeight: 600 }}>
                  {selectedClassData.icon} {selectedClassData.skill}
                </div>
                <div style={{ color: '#667', fontSize: '0.8rem', marginTop: '0.1rem' }}>{selectedClassData.skillDescription}</div>
              </motion.div>
            )}

            {/* Host / Join buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
              <motion.button
                onClick={onHost}
                disabled={!selectedClass}
                whileHover={selectedClass ? { scale: 1.04 } : {}}
                style={{
                  padding: '0.8rem 2.5rem', fontSize: '1.1rem', fontWeight: 700,
                  background: selectedClass ? 'linear-gradient(135deg, #00ffaa, #00dd88)' : 'rgba(60,60,60,0.4)',
                  color: selectedClass ? '#0a0a0a' : '#555',
                  border: 'none', borderRadius: '12px',
                  cursor: selectedClass ? 'pointer' : 'not-allowed',
                  boxShadow: selectedClass ? '0 4px 24px rgba(0,255,136,0.25)' : 'none',
                  letterSpacing: '0.03em', transition: 'all 0.15s',
                }}
              >
                Host Game
              </motion.button>

              <motion.button
                onClick={onJoin}
                disabled={!selectedClass}
                whileHover={selectedClass ? { scale: 1.04 } : {}}
                style={{
                  padding: '0.8rem 2.5rem', fontSize: '1.1rem', fontWeight: 700,
                  background: selectedClass ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,60,0.4)',
                  color: selectedClass ? '#eee' : '#555',
                  border: selectedClass ? '1px solid rgba(255,255,255,0.15)' : 'none',
                  borderRadius: '12px',
                  cursor: selectedClass ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                Join Game
              </motion.button>
            </div>

            {/* How to Play button */}
            <motion.button
              onClick={() => setShowHowToPlay(true)}
              whileHover={{ scale: 1.05 }}
              style={{
                padding: '0.6rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
                background: 'rgba(100,200,255,0.1)',
                color: '#64c8ff',
                border: '1px solid rgba(100,200,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              How to Play
            </motion.button>
          </motion.div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ position: 'relative', zIndex: 1, padding: '0.8rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem', color: '#445' }}
          >
            <span style={{ color: '#00ffaa88' }}>Created by Ayush Mann</span>
            <span style={{ color: '#334' }}>|</span>
            <a href="https://github.com/ayushmann29" target="_blank" rel="noopener noreferrer" style={{ color: '#00ffaa88', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#00ffaa'}
              onMouseLeave={(e) => e.target.style.color = '#00ffaa88'}
            >GitHub</a>
          </motion.footer>

          {/* How to Play Modal */}
          {showHowToPlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHowToPlay(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                padding: '2rem',
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'linear-gradient(135deg, #0a0f14, #0d1b1a)',
                  border: '1px solid rgba(0,255,136,0.2)',
                  borderRadius: '16px',
                  padding: '2rem',
                  maxWidth: '700px',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  boxShadow: '0 8px 40px rgba(0,255,136,0.1)',
                }}
              >
                <h2 style={{ color: '#00ffaa', fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center', fontFamily: 'Orbitron, system-ui, sans-serif' }}>
                  How to Play
                </h2>

                {/* Movement */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                  <h3 style={{ color: '#00ffaa', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Movement</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <div style={{ width: '30px', height: '30px', background: 'rgba(0,255,136,0.2)', border: '1px solid #00ffaa', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffaa', fontFamily: 'monospace', fontWeight: 700 }}>W</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <div style={{ width: '30px', height: '30px', background: 'rgba(0,255,136,0.2)', border: '1px solid #00ffaa', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffaa', fontFamily: 'monospace', fontWeight: 700 }}>A</div>
                      <div style={{ width: '30px', height: '30px', background: 'rgba(0,255,136,0.2)', border: '1px solid #00ffaa', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffaa', fontFamily: 'monospace', fontWeight: 700 }}>S</div>
                      <div style={{ width: '30px', height: '30px', background: 'rgba(0,255,136,0.2)', border: '1px solid #00ffaa', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffaa', fontFamily: 'monospace', fontWeight: 700 }}>D</div>
                    </div>
                    <span style={{ color: '#aab', fontSize: '0.9rem' }}>or Arrow Keys to move</span>
                  </div>
                </div>

                {/* Charges */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                  <h3 style={{ color: '#ffdd44', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Charges</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                      <div style={{ position: 'absolute', inset: 0, border: '2px solid #ff4444', borderRadius: '50%', opacity: 0.5 }} />
                      <div style={{ position: 'absolute', inset: '8px', border: '2px dashed #ffdd44', borderRadius: '50%' }} />
                      <div style={{ position: 'absolute', inset: '22px', background: '#fff', borderRadius: '50%' }} />
                    </div>
                    <div style={{ color: '#aab', fontSize: '0.9rem', maxWidth: '400px' }}>
                      Get dangerously close to enemy bullets to <span style={{ color: '#ffdd44', fontWeight: 600 }}>graze</span> them. Each graze gives +1 charge. Use charges for skills and bombs!
                    </div>
                  </div>
                </div>

                {/* Bomb */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                  <h3 style={{ color: '#ff6b6b', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Bomb (30 charges)</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,100,100,0.3)', border: '2px solid #ff6b6b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem' }}>Z</div>
                    <span style={{ color: '#aab', fontSize: '0.9rem' }}>Clears all bullets and grants brief invincibility</span>
                  </div>
                </div>

                {/* Skill */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                  <h3 style={{ color: '#00ffaa', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Skill</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(0,255,136,0.2)', border: '2px solid #00ffaa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffaa', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem' }}>X</div>
                    <span style={{ color: '#aab', fontSize: '0.9rem' }}>Each character has a unique skill. Check the skill panel in-game for details!</span>
                  </div>
                </div>

                {/* Focus */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                  <h3 style={{ color: '#64c8ff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Focus Mode</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '60px', height: '30px', background: 'rgba(100,200,255,0.2)', border: '2px solid #64c8ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64c8ff', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>Shift</div>
                    <span style={{ color: '#aab', fontSize: '0.9rem' }}>Slows movement and reveals your precise hitbox for tight dodging</span>
                  </div>
                </div>

                {/* Objective */}
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Objective</h3>
                  <p style={{ color: '#aab', fontSize: '0.9rem', margin: 0 }}>
                    Defeat all 3 boss phases to win! Work together with your team to dodge bullets, graze for charges, and unleash your skills.
                  </p>
                </div>

                <motion.button
                  onClick={() => setShowHowToPlay(false)}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.7rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #00ffaa, #00dd88)',
                    color: '#0a0a0a',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Got it!
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
