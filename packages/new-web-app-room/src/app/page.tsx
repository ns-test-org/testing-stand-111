'use client';

import { useEffect, useRef, useState } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];

export default function PacManGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const pacManRef = useRef<Position>({ x: 10, y: 10 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const dotsRef = useRef<boolean[][]>([]);
  const ghostsRef = useRef<Position[]>([]);
  const mouthOpenRef = useRef(true);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
          nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
          nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
          nextDirectionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      updateGame();
      drawGame();
    }, INITIAL_SPEED);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, score]);

  const initializeGame = () => {
    // Initialize dots
    const dots: boolean[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      dots[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        dots[y][x] = true;
      }
    }
    dotsRef.current = dots;

    // Initialize ghosts
    ghostsRef.current = [
      { x: 5, y: 5 },
      { x: 14, y: 5 },
      { x: 5, y: 14 },
      { x: 14, y: 14 },
    ];

    drawGame();
  };

  const updateGame = () => {
    // Update direction
    directionRef.current = nextDirectionRef.current;

    // Move Pac-Man
    const newPos = { ...pacManRef.current };
    switch (directionRef.current) {
      case 'UP':
        newPos.y = (newPos.y - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'DOWN':
        newPos.y = (newPos.y + 1) % GRID_SIZE;
        break;
      case 'LEFT':
        newPos.x = (newPos.x - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'RIGHT':
        newPos.x = (newPos.x + 1) % GRID_SIZE;
        break;
    }
    pacManRef.current = newPos;

    // Check dot collision
    if (dotsRef.current[newPos.y]?.[newPos.x]) {
      dotsRef.current[newPos.y][newPos.x] = false;
      setScore((prev) => prev + 10);
    }

    // Move ghosts
    ghostsRef.current = ghostsRef.current.map((ghost) => {
      const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const randomDir = directions[Math.floor(Math.random() * directions.length)];
      
      const newGhost = { ...ghost };
      switch (randomDir) {
        case 'UP':
          newGhost.y = (newGhost.y - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'DOWN':
          newGhost.y = (newGhost.y + 1) % GRID_SIZE;
          break;
        case 'LEFT':
          newGhost.x = (newGhost.x - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'RIGHT':
          newGhost.x = (newGhost.x + 1) % GRID_SIZE;
          break;
      }
      return newGhost;
    });

    // Check ghost collision
    for (const ghost of ghostsRef.current) {
      if (ghost.x === pacManRef.current.x && ghost.y === pacManRef.current.y) {
        setGameOver(true);
        return;
      }
    }

    // Toggle mouth animation
    mouthOpenRef.current = !mouthOpenRef.current;

    // Check win condition
    const allDotsEaten = dotsRef.current.every((row) => row.every((dot) => !dot));
    if (allDotsEaten) {
      setGameOver(true);
    }
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw dots
    ctx.fillStyle = '#FFB852';
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (dotsRef.current[y]?.[x]) {
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    // Draw Pac-Man
    const pacMan = pacManRef.current;
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    
    let startAngle = 0;
    let endAngle = Math.PI * 2;
    
    if (mouthOpenRef.current) {
      switch (directionRef.current) {
        case 'RIGHT':
          startAngle = 0.2 * Math.PI;
          endAngle = 1.8 * Math.PI;
          break;
        case 'LEFT':
          startAngle = 1.2 * Math.PI;
          endAngle = 0.8 * Math.PI;
          break;
        case 'UP':
          startAngle = 1.7 * Math.PI;
          endAngle = 1.3 * Math.PI;
          break;
        case 'DOWN':
          startAngle = 0.7 * Math.PI;
          endAngle = 0.3 * Math.PI;
          break;
      }
    }
    
    ctx.arc(
      pacMan.x * CELL_SIZE + CELL_SIZE / 2,
      pacMan.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      startAngle,
      endAngle
    );
    ctx.lineTo(
      pacMan.x * CELL_SIZE + CELL_SIZE / 2,
      pacMan.y * CELL_SIZE + CELL_SIZE / 2
    );
    ctx.fill();

    // Draw ghosts
    ghostsRef.current.forEach((ghost, index) => {
      ctx.fillStyle = GHOST_COLORS[index];
      
      // Ghost body
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        Math.PI,
        0
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + CELL_SIZE - 2,
        ghost.y * CELL_SIZE + CELL_SIZE - 2
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + CELL_SIZE - 5,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 + 3
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE - 2
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + 5,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 + 3
      );
      ctx.lineTo(ghost.x * CELL_SIZE + 2, ghost.y * CELL_SIZE + CELL_SIZE - 2);
      ctx.closePath();
      ctx.fill();

      // Ghost eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 - 3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2,
        2,
        0,
        Math.PI * 2
      );
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 + 3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = '#0000FF';
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 - 3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2,
        1,
        0,
        Math.PI * 2
      );
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 + 3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2,
        1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    pacManRef.current = { x: 10, y: 10 };
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    initializeGame();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">PAC-MAN</h1>
        <p className="text-white text-xl">Score: {score}</p>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-4 border-blue-600 rounded-lg"
        />

        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
            <button
              onClick={startGame}
              className="px-8 py-4 bg-yellow-400 text-black font-bold text-xl rounded-lg hover:bg-yellow-300 transition-colors"
            >
              START GAME
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <p className="text-white text-2xl mb-4">
              {dotsRef.current.every((row) => row.every((dot) => !dot))
                ? 'YOU WIN!'
                : 'GAME OVER!'}
            </p>
            <p className="text-white text-xl mb-4">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-yellow-400 text-black font-bold text-xl rounded-lg hover:bg-yellow-300 transition-colors"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-white text-center">
        <p className="text-sm">Use arrow keys to move</p>
        <p className="text-xs text-gray-400 mt-2">Eat all dots and avoid ghosts!</p>
      </div>
    </div>
  );
}

