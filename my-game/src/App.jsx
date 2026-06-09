import React, { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from './socket';
import { sketch } from './sketch';
import p5 from 'p5';
import MainMenu from './MainMenu';
import HostSetup from './HostSetup';
import JoinGame from './JoinGame';
import Lobby from './Lobby';
import gameSong from './assets/game_song.mp3';
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [selectedClass, setSelectedClass] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [gameOverState, setGameOverState] = useState(null);
  const sketchRef = useRef(null);
  const p5Instance = useRef(null);

  const goToMenu = useCallback(() => {
    if (p5Instance.current) {
      p5Instance.current.remove();
      p5Instance.current = null;
    }
    setScreen('menu');
    setRoomCode('');
    setIsHost(false);
    setHostId('');
    setLobbyPlayers([]);
    setGameOverState(null);
  }, []);

  useEffect(() => {
    socket.on('roomCreated', ({ roomCode: code, hostId: hid }) => {
      setRoomCode(code);
      setHostId(hid);
      setIsHost(true);
      setScreen('lobby');
    });

    socket.on('joinSuccess', ({ hostId: hid, players }) => {
      setHostId(hid);
      setIsHost(false);
      setLobbyPlayers(players);
      setScreen('lobby');
    });

    socket.on('joinError', ({ message }) => {
      alert(message);
    });

    socket.on('playerList', ({ players }) => {
      setLobbyPlayers(players);
    });

    socket.on('gameStarted', () => {
      setScreen('game');
    });

    socket.on('gameOver', ({ outcome }) => {
      setGameOverState(outcome);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('joinSuccess');
      socket.off('joinError');
      socket.off('playerList');
      socket.off('gameStarted');
      socket.off('gameOver');
    };
  }, []);

  useEffect(() => {
    if (screen === 'game' && !p5Instance.current) {
      try {
        p5Instance.current = new p5(sketch(socket, selectedClass, roomCode), sketchRef.current);
      } catch (error) {
        setScreen('menu');
      }
    }

    return () => {
      if (p5Instance.current) {
        try { p5Instance.current.remove(); } catch (e) { /* ignore */ }
        p5Instance.current = null;
      }
    };
  }, [screen, selectedClass, roomCode]);

  if (screen === 'menu') {
    return (
      <>
        <MainMenu
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
          onHost={() => setScreen('host')}
          onJoin={() => setScreen('join')}
        />
        <Analytics />
      </>
    );
  }

  if (screen === 'host') {
    return (
      <>
        <HostSetup selectedClass={selectedClass} onBack={goToMenu} />
        <Analytics />
      </>
    );
  }

  if (screen === 'join') {
    return (
      <>
        <JoinGame selectedClass={selectedClass} onBack={goToMenu} />
        <Analytics />
      </>
    );
  }

  if (screen === 'lobby') {
    return (
      <>
        <Lobby
          roomCode={roomCode}
          isHost={isHost}
          hostId={hostId}
          players={lobbyPlayers}
          onBack={goToMenu}
        />
        <Analytics />
      </>
    );
  }

  return (
    <>
      <div ref={sketchRef} style={{ position: 'relative' }} />
      <audio src={gameSong} autoPlay loop preload="auto" style={{ display: 'none' }} />
      {gameOverState && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', color: 'white',
          fontSize: '3rem', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 10, flexDirection: 'column', gap: 20
        }}>
          <span>{gameOverState === 'victory' ? 'VICTORY!' : 'DEFEAT'}</span>
          <button
            onClick={goToMenu}
            style={{ padding: '12px 32px', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            Back to Menu
          </button>
        </div>
      )}
      <Analytics />
    </>
  );
}
