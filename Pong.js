const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

const user = { x: 0, y: 150, w: 10, h: 100, score: 0 };
const ai = { x: 590, y: 150, w: 10, h: 100, score: 0 };
const ball = { x: 300, y: 200, r: 10, speed: 5, vx: 5, vy: 5 };

let aiLevel = 0.1;
let gameRunning = false;

// Draw functions
function rect(x, y, w, h, color = "white") {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function circle(x, y, r, color = "white") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function text(text, x, y) {
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText(text, x, y);
}
function net() {
  for (let i = 0; i < canvas.height; i += 20) {
    rect(canvas.width / 2 - 1, i, 2, 10);
  }
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.vx *= -1;
  ball.speed = 5;
}

// Collision
function collide(p, b) {
  return (
    b.x - b.r < p.x + p.w &&
    b.x + b.r > p.x &&
    b.y - b.r < p.y + p.h &&
    b.y + b.r > p.y
  );
}

// Game update
function update() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Bounce top/bottom
  if (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height)
    ball.vy *= -1;

  // AI movement
  ai.y += (ball.y - (ai.y + ai.h / 2)) * aiLevel;

  // Player collision
  let player = ball.x < canvas.width / 2 ? user : ai;

  if (collide(player, ball)) {
    let collidePoint = ball.y - (player.y + player.h / 2);
    collidePoint /= player.h / 2;
    let angle = collidePoint * Math.PI / 4;
    let direction = ball.x < canvas.width / 2 ? 1 : -1;
    ball.vx = direction * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
    ball.speed += 0.5;
  }

  // Score
  if (ball.x - ball.r < 0) {
    ai.score++;
    resetBall();
  }
  if (ball.x + ball.r > canvas.width) {
    user.score++;
    resetBall();
  }
}

// Render game
function render() {
  rect(0, 0, canvas.width, canvas.height, "black");
  net();
  text(user.score, 150, 50);
  text(ai.score, 450, 50);
  rect(user.x, user.y, user.w, user.h);
  rect(ai.x, ai.y, ai.w, ai.h);
  circle(ball.x, ball.y, ball.r);
}

// Game loop
function loop() {
  if (!gameRunning) return;
  update();
  render();
  requestAnimationFrame(loop);
}

// Control player paddle
canvas.addEventListener("mousemove", e => {
  let rectCanvas = canvas.getBoundingClientRect();
  user.y = e.clientY - rectCanvas.top - user.h / 2;
});

// Start game from menu
function startGame(level) {
  aiLevel = level;
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  gameRunning = true;
  loop();
}