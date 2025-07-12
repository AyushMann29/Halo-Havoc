import React, { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import { sketch } from './sketch';
import p5 from 'p5';
import MainMenu from './MainMenu';
import gameSong from './assets/game_song.mp3';
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOverState, setGameOverState] = useState(null);
  const sketchRef = useRef(null);
  const p5Instance = useRef(null);

  const handleReady = ({ selectedClass, roomCode }) => {
    setSelectedClass(selectedClass);
    setRoomCode(roomCode);

    socket.emit('joinRoom', { selectedClass, roomCode });

    socket.once('init', () => {
      setGameStarted(true);
    });
  };

  useEffect(() => {
    socket.on('gameOver', ({ outcome }) => {
      setGameOverState(outcome);
    });

    return () => {
      socket.off('gameOver');
    };
  }, []);

  useEffect(() => {
    if (gameStarted && !p5Instance.current) {
      try {
        p5Instance.current = new p5(sketch(socket, selectedClass, roomCode), sketchRef.current);
      } catch (error) {
        console.error('Error creating p5 instance:', error);
        // Reset game state on error
        setGameStarted(false);
        setGameOverState(null);
      }
    }

    return () => {
      if (p5Instance.current) {
        try {
          p5Instance.current.remove();
        } catch (error) {
          console.error('Error removing p5 instance:', error);
        }
        p5Instance.current = null;
      }
    };
  }, [gameStarted, selectedClass, roomCode]);

  return (
    <>
      {!gameStarted ? (
        <MainMenu onReady={handleReady} />
      ) : (
        <>
          <div ref={sketchRef} style={{ position: 'relative' }} />
          {/* Game music audio, plays when game starts */}
          <audio 
            src={gameSong} 
            autoPlay 
            loop 
            preload="auto"
            style={{ display: 'none' }} 
          />
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
      <Analytics />
    </>
  );
}
