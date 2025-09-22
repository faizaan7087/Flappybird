const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreList = document.getElementById('score-list');

// --- INITIALIZE SUPABASE ---
// Add your actual Supabase URL and Anon Key below
const SUPABASE_URL = 'https://fzxgtneqlqdcphkezaps.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eGd0bmVxbHFkY3Boa2V6YXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDAzMDQsImV4cCI6MjA3NDExNjMwNH0.oR-0AXdWwNLAgTIBQCe_9ss0Q_mTL0N9nR33D0_vHSo';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Game Constants & Variables ---
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;
const PIPE_WIDTH = 52;
const GRAVITY = 0.4;
const LIFT = -7;
const PIPE_GAP = 120;
const PIPE_SPEED = 2;

if (window.matchMedia("(max-width: 650px)").matches) {
  // If the screen is narrow (like a phone), slow the game down
  GRAVITY = 0.2;
  PIPE_SPEED = 1;
}

let bird = {
    x: 50,
    y: 150,
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
    velocity: 0
};

let pipes = [];
let score = 0;
let frameCount = 0;
let gameOver = false;
let gameStarted = false;

// --- Image Loading ---
const birdImg = new Image();
const bgImg = new Image();
const topPipeImg = new Image();
const bottomPipeImg = new Image();

birdImg.src = 'images/bird.png';
bgImg.src = 'images/bg.png';
topPipeImg.src = 'images/pipedown.png';
bottomPipeImg.src = 'images/pipeup.png';


// --- Game Functions ---
// Main game loop
function gameLoop() {
    if (gameOver) {
        displayGameOver();
        return;
    }

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Updates game state
function update() {
    // Bird movement
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Pipe generation
    frameCount++;
    if (frameCount % 90 === 0) { // Add a new pipe every 1.5 seconds (90 frames)
        const topPipeHeight = Math.floor(Math.random() * (canvas.height - PIPE_GAP - 100)) + 50;
        pipes.push({
            x: canvas.width,
            y: 0,
            width: PIPE_WIDTH,
            height: topPipeHeight,
            passed: false
        });
        pipes.push({
            x: canvas.width,
            y: topPipeHeight + PIPE_GAP,
            width: PIPE_WIDTH,
            height: canvas.height - topPipeHeight - PIPE_GAP,
            passed: false // Only top pipe needs scoring check
        });
    }

    // Move pipes
    pipes.forEach(pipe => {
        pipe.x -= PIPE_SPEED;
    });

    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

    // Collision detection
    checkCollisions();

    // Scoring
    const firstPipe = pipes[0];
    if (firstPipe && firstPipe.x + firstPipe.width < bird.x && !firstPipe.passed) {
        score++;
        firstPipe.passed = true; // Mark as passed
    }
}

// Renders everything to the canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // Pipes
    for (let i = 0; i < pipes.length; i += 2) {
        ctx.drawImage(topPipeImg, pipes[i].x, pipes[i].y, pipes[i].width, pipes[i].height);
        ctx.drawImage(bottomPipeImg, pipes[i+1].x, pipes[i+1].y, pipes[i+1].width, pipes[i+1].height);
    }
    
    // Bird
    ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '30px "Press Start 2P", cursive';
    ctx.fillText(score, canvas.width / 2 - 15, 50);
}

function checkCollisions() {
    // Ground and ceiling collision
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        endGame();
    }

    // Pipe collision
    for (let i = 0; i < pipes.length; i++) {
        if (
            bird.x < pipes[i].x + pipes[i].width &&
            bird.x + bird.width > pipes[i].x &&
            bird.y < pipes[i].y + pipes[i].height &&
            bird.y + bird.height > pipes[i].y
        ) {
            endGame();
        }
    }
}

function flap() {
    if (!gameStarted) {
        gameStarted = true;
        gameLoop();
    }
    if (!gameOver) {
        bird.velocity = LIFT;
    }
}

function endGame() {
    if (gameOver) return; // Prevents it from running multiple times
    gameOver = true;
    saveScoreAndRefreshLeaderboard();
}

function resetGame() {
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    gameOver = false;
    gameStarted = false;
    drawStartScreen();
}

function displayGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 40);
    ctx.textAlign = 'start'; // Reset alignment
}

function drawStartScreen() {
     ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
     ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
     ctx.fillStyle = 'white';
     ctx.font = '24px Arial';
     ctx.textAlign = 'center';
     ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2);
     ctx.textAlign = 'start';
}

// --- Leaderboard ---
// !! THIS IS WHERE YOU'LL INTEGRATE YOUR DATABASE !!

// --- SUPABASE LEADERBOARD FUNCTIONS ---

// This function saves the player's score and then refreshes the leaderboard
async function saveScoreAndRefreshLeaderboard() {
    const playerName = prompt(`Game Over! Your score is ${score}. Enter your name:`, "Player");
    if (!playerName) return; // Do nothing if the user cancels the prompt

    try {
        // Insert the new score into the 'scores' table
        const { error } = await supabase
            .from('scores')
            .insert([{ player_name: playerName, score: score }]);
        
        if (error) throw error; // If there's an error, jump to the catch block

        // After saving, fetch the new leaderboard data
        await fetchAndDisplayLeaderboard();

    } catch (error) {
        console.error('Error saving score:', error);
    }
}

// This function fetches and displays the top 5 scores from the database
async function fetchAndDisplayLeaderboard() {
    scoreList.innerHTML = '<li>Loading...</li>'; // Show a loading message

    try {
        const { data, error } = await supabase
            .from('scores')
            .select('player_name, score')
            .order('score', { ascending: false })
            .limit(5);

        if (error) throw error;

        // Clear the list and display the fetched scores
        scoreList.innerHTML = '';
        if (data.length === 0) {
            scoreList.innerHTML = '<li>No scores yet!</li>';
        } else {
            data.forEach(s => {
                const li = document.createElement('li');
                li.textContent = `${s.player_name} - ${s.score}`;
                scoreList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error fetching scores:', error);
        scoreList.innerHTML = `<li>Error: Could not load scores.</li>`;
    }
}

// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        flap();
    }
});

canvas.addEventListener('click', () => {
    if (gameOver) {
        resetGame();
    } else {
        flap();
    }
});


// --- Initial Game Start ---
// Wait for images to load before drawing the start screen
window.onload = () => {
    drawStartScreen();
    fetchAndDisplayLeaderboard(); // Fetch scores when the game loads
};
