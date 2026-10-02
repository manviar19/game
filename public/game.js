document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const GRID_SIZE = 20;
    const TILE_COUNT = 20; // 400px / 20 = 20x20 tiles

    let snake = [];
    let food = { x: 5, y: 5, type: 'normal' };
    let dx = 1;
    let dy = 0;
    let nextDx = 1;
    let nextDy = 0;
    let score = 0;
    let level = 1;
    let speed = 110; // ms per frame
    let gameInterval = null;
    let isRunning = false;
    let isPaused = false;
    let particles = [];

    // Web Audio Synthesizer for Arcade Sound Effects
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playBeep(freq, type, duration) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
    }

    // Initialize / Reset Game
    function resetGame() {
        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        dx = 1;
        dy = 0;
        nextDx = 1;
        nextDy = 0;
        score = 0;
        level = 1;
        speed = 110;
        particles = [];
        spawnFood();
        updateStats();
    }

    // Spawn Food Item
    function spawnFood() {
        food.x = Math.floor(Math.random() * TILE_COUNT);
        food.y = Math.floor(Math.random() * TILE_COUNT);
        // Ensure food doesn't land on snake body
        for (let seg of snake) {
            if (seg.x === food.x && seg.y === food.y) {
                spawnFood();
                break;
            }
        }
        food.type = Math.random() > 0.8 ? 'bonus' : 'normal';
    }

    // Particle Explosion on Food Pickup
    function addParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: x * GRID_SIZE + GRID_SIZE / 2,
                y: y * GRID_SIZE + GRID_SIZE / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                color
            });
        }
    }

    // Game Loop Step
    function gameStep() {
        if (isPaused || !isRunning) return;

        dx = nextDx;
        dy = nextDy;

        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Wall Collision Check
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
            return gameOver();
        }

        // Self Collision Check
        for (let seg of snake) {
            if (head.x === seg.x && head.y === seg.y) {
                return gameOver();
            }
        }

        snake.unshift(head);

        // Food Collision Check
        if (head.x === food.x && head.y === food.y) {
            const points = food.type === 'bonus' ? 30 : 10;
            score += points;
            playBeep(food.type === 'bonus' ? 880 : 587, 'square', 0.12);
            addParticles(food.x, food.y, food.type === 'bonus' ? '#f43f5e' : '#06b6d4');

            // Level progression every 50 points
            const newLevel = Math.floor(score / 50) + 1;
            if (newLevel > level) {
                level = newLevel;
                speed = Math.max(50, 110 - (level - 1) * 8);
                clearInterval(gameInterval);
                gameInterval = setInterval(gameStep, speed);
                playBeep(1046, 'triangle', 0.25);
            }

            spawnFood();
            updateStats();
        } else {
            snake.pop();
        }

        draw();
    }

    // Render Canvas
    function draw() {
        // Clear Background Grid
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Subdued Grid Lines
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < TILE_COUNT; i++) {
            ctx.beginPath();
            ctx.moveTo(i * GRID_SIZE, 0);
            ctx.lineTo(i * GRID_SIZE, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * GRID_SIZE);
            ctx.lineTo(canvas.width, i * GRID_SIZE);
            ctx.stroke();
        }

        // Render Food
        ctx.shadowBlur = 12;
        if (food.type === 'bonus') {
            ctx.fillStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e';
        } else {
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
        }
        ctx.beginPath();
        ctx.arc(
            food.x * GRID_SIZE + GRID_SIZE / 2,
            food.y * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE / 2.5,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Render Snake
        snake.forEach((seg, index) => {
            const isHead = index === 0;
            ctx.shadowBlur = isHead ? 15 : 6;
            ctx.shadowColor = isHead ? '#a855f7' : '#06b6d4';
            ctx.fillStyle = isHead ? '#c084fc' : `rgba(6, 182, 212, ${1 - index / (snake.length + 3)})`;

            ctx.fillRect(
                seg.x * GRID_SIZE + 1,
                seg.y * GRID_SIZE + 1,
                GRID_SIZE - 2,
                GRID_SIZE - 2
            );
        });

        // Render Particles
        particles.forEach((p, idx) => {
            ctx.shadowBlur = 4;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, 3, 3);
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) particles.splice(idx, 1);
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    // UI Updates
    function updateStats() {
        document.getElementById('current-score').textContent = String(score).padStart(4, '0');
        document.getElementById('current-level').textContent = level;
    }

    // Start Game
    function startGame() {
        resetGame();
        isRunning = true;
        isPaused = false;
        document.getElementById('gameOverlay').classList.add('opacity-0', 'pointer-events-none');
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameStep, speed);
    }

    // Game Over Handler
    function gameOver() {
        isRunning = false;
        clearInterval(gameInterval);
        playBeep(150, 'sawtooth', 0.4);

        document.getElementById('modalFinalScore').textContent = score;
        document.getElementById('scoreModal').classList.remove('hidden');
        document.getElementById('scoreModal').classList.add('flex');
    }

    // Controls Logic
    function handleKey(key) {
        if (!isRunning || isPaused) return;
        if ((key === 'ArrowUp' || key === 'w' || key === 'W') && dy === 0) {
            nextDx = 0; nextDy = -1;
        } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && dy === 0) {
            nextDx = 0; nextDy = 1;
        } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && dx === 0) {
            nextDx = -1; nextDy = 0;
        } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && dx === 0) {
            nextDx = 1; nextDy = 0;
        }
    }

    window.addEventListener('keydown', (e) => handleKey(e.key));

    // Touch Buttons
    document.getElementById('btnUp').addEventListener('click', () => handleKey('ArrowUp'));
    document.getElementById('btnDown').addEventListener('click', () => handleKey('ArrowDown'));
    document.getElementById('btnLeft').addEventListener('click', () => handleKey('ArrowLeft'));
    document.getElementById('btnRight').addEventListener('click', () => handleKey('ArrowRight'));

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('overlayBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', () => {
        if (!isRunning) return;
        isPaused = !isPaused;
        document.getElementById('pauseBtn').innerHTML = isPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
    });

    // Leaderboard Fetching & Submission
    async function fetchLeaderboard() {
        try {
            const res = await fetch('/api/leaderboard');
            const scores = await res.json();
            const tbody = document.getElementById('leaderboard-body');
            
            if (scores.length > 0) {
                document.getElementById('nav-high-score').textContent = `${scores[0].score} pts`;
            }

            tbody.innerHTML = scores.map((s, idx) => {
                let badge = `<span class="text-slate-400 font-bold">${idx + 1}</span>`;
                if (idx === 0) badge = `<span class="text-amber-400 font-bold"><i class="fa-solid fa-crown mr-1"></i>1</span>`;
                if (idx === 1) badge = `<span class="text-slate-300 font-bold">2</span>`;
                if (idx === 2) badge = `<span class="text-amber-600 font-bold">3</span>`;

                return `
                    <tr class="hover:bg-slate-900 transition">
                        <td class="p-2.5 font-mono">${badge}</td>
                        <td class="p-2.5 font-semibold text-slate-200">${s.player}</td>
                        <td class="p-2.5 text-right font-bold text-cyan-400 font-mono">${s.score}</td>
                        <td class="p-2.5 text-right text-fuchsia-400 font-mono">${s.level || 1}</td>
                    </tr>
                `;
            }).join('');
        } catch (e) {
            console.error("Leaderboard fetch failed", e);
        }
    }

    async function fetchStats() {
        try {
            const res = await fetch('/api/stats');
            const stats = await res.json();
            document.getElementById('stat-total-games').textContent = stats.totalGamesPlayed;
            document.getElementById('stat-top-score').textContent = stats.topScore;
        } catch (e) {}
    }

    // Submit Score Form
    document.getElementById('scoreForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const player = document.getElementById('playerNameInput').value;
        if (!player) return;

        try {
            await fetch('/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player, score, level })
            });
            document.getElementById('scoreModal').classList.add('hidden');
            document.getElementById('scoreModal').classList.remove('flex');
            fetchLeaderboard();
            fetchStats();
            document.getElementById('overlayTitle').textContent = "Score Saved!";
            document.getElementById('overlaySub').textContent = `Awesome job ${player}! You scored ${score} pts.`;
            document.getElementById('gameOverlay').classList.remove('opacity-0', 'pointer-events-none');
        } catch (err) {
            alert("Error submitting score");
        }
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.getElementById('scoreModal').classList.add('hidden');
        document.getElementById('scoreModal').classList.remove('flex');
        document.getElementById('gameOverlay').classList.remove('opacity-0', 'pointer-events-none');
    });

    // Initial Load & Initial Render
    fetchLeaderboard();
    fetchStats();
    resetGame();
    draw();
});
