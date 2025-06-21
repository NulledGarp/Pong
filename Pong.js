const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

const music = document.getElementById("bgm");
const hitSound = document.getElementById("hitSound");
const scoreSound = document.getElementById("scoreSound");
const pauseOverlay = document.getElementById("pauseOverlay");
const pauseBtn = document.getElementById("pauseBtn");

const user = { x: 0, y: 150, w: 10, h: 100, score: 0 };
const ai = { x: 590, y: 150, w: 10, h: 100, score: 0 };
const ball = { x: 300, y: 200, r: 10, speed: 5, vx: 5, vy: 5 };

let keys = {};
let gameRunning = false;
let paused = false;
let aiLevel = 0.1;
let moveDir = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let prevHighScore = parseInt(localStorage.getItem("prevHighScore")) || 0;
let showRainbow = false;

function drawRect(x, y, w, h, color = "white") {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function drawCircle(x, y, r, color = "white") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function drawText(text, x, y) {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(text, x, y);
}
function drawNet() {
  for (let i = 0; i < canvas.height; i += 20)
    drawRect(canvas.width / 2 - 1, i, 2, 10);
}
function fadeMusic(target = 0.5, delay = 1000) {
  const step = (target - music.volume) / 10;
  let count = 0;
  const fade = setInterval(() => {
    if (count++ >= 10) return clearInterval(fade);
    music.volume = Math.min(1, Math.max(0, music.volume + step));
  }, delay / 10);
}
function reduceMusicTemporarily() {
  music.volume = 0.2;
  fadeMusic(0.5, 1000);
}
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speed = 5 + aiLevel * 20;

  let angle = Math.random() * Math.PI / 2 - Math.PI / 4; // -45° to 45°
  let dir = Math.random() < 0.5 ? 1 : -1;

  ball.vx = dir * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);

  // Prevent stuck vx near 0
  if (Math.abs(ball.vx) < 2) {
    ball.vx = dir * 4;
  }
}
function collide(p, b) {
  return (
    b.x - b.r < p.x + p.w &&
    b.x + b.r > p.x &&
    b.y - b.r < p.y + p.h &&
    b.y + b.r > p.y
  );
}
function update() {
  if (paused) return;

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height)
    ball.vy *= -1;

  ai.y += (ball.y - (ai.y + ai.h / 2)) * aiLevel;

  let playerSpeed = aiLevel < 0.06 ? 4 : 6;
  if (keys["ArrowUp"] || moveDir === -1) user.y -= playerSpeed;
  if (keys["ArrowDown"] || moveDir === 1) user.y += playerSpeed;
  user.y = Math.max(0, Math.min(canvas.height - user.h, user.y));

  const paddle = ball.x < canvas.width / 2 ? user : ai;
  if (collide(paddle, ball)) {
    hitSound.pause();
    hitSound.currentTime = 0;
    hitSound.play();
    reduceMusicTemporarily();

    let collidePoint = ball.y - (paddle.y + paddle.h / 2);
    collidePoint /= paddle.h / 2;
    let angle = collidePoint * Math.PI / 4;
    let direction = ball.x < canvas.width / 2 ? 1 : -1;

    ball.vx = direction * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
    ball.speed += 0.5;
  }

  if (ball.x - ball.r < 0) {
    ai.score++;
    scoreSound.pause(); scoreSound.currentTime = 0; scoreSound.play();
    reduceMusicTemporarily();
    resetBall();
  }

  if (ball.x + ball.r > canvas.width) {
    user.score++;
    if (user.score > highScore) {
      prevHighScore = highScore;
      highScore = user.score;
      localStorage.setItem("highScore", highScore);
      localStorage.setItem("prevHighScore", prevHighScore);
      showRainbow = true;
    }
    scoreSound.pause(); scoreSound.currentTime = 0; scoreSound.play();
    reduceMusicTemporarily();
    resetBall();
  }
}
function render() {
  drawRect(0, 0, canvas.width, canvas.height, "black");
  drawNet();
  drawText(`You: ${user.score}`, 40, 40);
  drawText(`AI: ${ai.score}`, 480, 40);
  drawText(`High: ${highScore}`, 230, 30);
  drawText(`Prev: ${prevHighScore}`, 220, 390);

  drawRect(user.x, user.y, user.w, user.h);
  drawRect(ai.x, ai.y, ai.w, ai.h);

  if (showRainbow) {
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 5, ball.x, ball.y, 20);
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.2, "orange");
    gradient.addColorStop(0.4, "yellow");
    gradient.addColorStop(0.6, "green");
    gradient.addColorStop(0.8, "blue");
    gradient.addColorStop(1, "purple");
    drawCircle(ball.x, ball.y, ball.r, gradient);
  } else {
    drawCircle(ball.x, ball.y, ball.r);
  }
}
function loop() {
  if (!gameRunning) return;
  update();
  render();
  requestAnimationFrame(loop);
}

// Controls
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key.toLowerCase() === "p") {
    togglePause();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function moveUp() { moveDir = -1; }
function moveDown() { moveDir = 1; }
function stopMove() { moveDir = 0; }

document.addEventListener("touchmove", (e) => {
  if (gameRunning) e.preventDefault();
}, { passive: false });

function togglePause() {
  paused = !paused;
  pauseOverlay.style.display = paused ? "flex" : "none";
  if (!paused) loop();
}

function startGame(level) {
  aiLevel = level;
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  pauseBtn.style.display = "block";
  music.volume = 0.5;
  music.play();
  gameRunning = true;
  paused = false;
  user.score = 0;
  ai.score = 0;
  showRainbow = false;
  resetBall();
  loop();
}
