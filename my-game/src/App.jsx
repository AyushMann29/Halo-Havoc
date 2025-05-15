import React, { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import { sketch } from './sketch';
import p5 from 'p5';
import MainMenu from './MainMenu';

export default function App() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOverState, setGameOverState] = useState(null); // victory or defeat
  const sketchRef = useRef(null);
  const p5Instance = useRef(null);

  useEffect(() => {
    socket.on('gameOver', ({ outcome }) => {
      setGameOverState(outcome);
    });

    return () => {
      socket.off('gameOver');
    };
  }, []);

  useEffect(() => {
    if (selectedClass) {
      socket.emit('ready', selectedClass);
      socket.on('init', () => {
        setGameStarted(true);
      });
    }
  }, [selectedClass]);

  useEffect(() => {
    if (gameStarted && !p5Instance.current) {
      p5Instance.current = new p5(sketch(socket, selectedClass), sketchRef.current);
    }

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, [gameStarted]);

  return (
    <>
      {!gameStarted ? (
        <MainMenu onReady={setSelectedClass} />
      ) : (
        <>
          <div ref={sketchRef} style={{ position: 'relative' }} />
          {gameOverState && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '3rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10
            }}>
              {gameOverState === 'victory' ? '🎉 Victory!' : '💀 Defeat!'}
            </div>
          )}
        </>
      )}
    </>
  );
}
