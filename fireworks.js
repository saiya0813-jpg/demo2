(function () {
  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;
  let particles = [];
  let rockets = [];
  let running = false;
  let rafId = null;
  let launchTimer = null;

  const COLORS = [
    "#ff6b4a", "#ff8f6b", "#ffd166", "#4ade80",
    "#7c5cff", "#a78bfa", "#f472b6", "#38bdf8", "#ffffff",
  ];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pickColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  class Rocket {
    constructor() {
      this.x = rand(width * 0.15, width * 0.85);
      this.y = height;
      this.targetY = rand(height * 0.15, height * 0.45);
      this.speed = rand(10, 16);
      this.color = pickColor();
      this.trail = [];
    }

    update() {
      this.trail.push({ x: this.x, y: this.y, alpha: 1 });
      if (this.trail.length > 12) this.trail.shift();
      this.trail.forEach((t) => (t.alpha -= 0.08));

      this.y -= this.speed;
      this.speed *= 0.98;

      if (this.y <= this.targetY || this.speed < 2) {
        explode(this.x, this.y, this.color);
        return false;
      }
      return true;
    }

    draw() {
      this.trail.forEach((t) => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 180, ${t.alpha})`;
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff8e7";
      ctx.fill();
    }
  }

  class Particle {
    constructor(x, y, color) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2, 9);
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.color = color;
      this.alpha = 1;
      this.decay = rand(0.012, 0.028);
      this.size = rand(1.5, 3.5);
      this.gravity = 0.06;
      this.friction = 0.98;
      this.sparkle = Math.random() > 0.6;
    }

    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
      return this.alpha > 0;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      if (this.sparkle && this.alpha > 0.4) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  function explode(x, y, color) {
    const count = Math.floor(rand(50, 90));
    for (let i = 0; i < count; i++) {
      const c = Math.random() > 0.3 ? color : pickColor();
      particles.push(new Particle(x, y, c));
    }
    if (Math.random() > 0.5) {
      setTimeout(() => {
        for (let i = 0; i < 25; i++) {
          particles.push(new Particle(x, y, pickColor()));
        }
      }, 180);
    }
  }

  function launchRocket() {
    rockets.push(new Rocket());
  }

  function tick() {
    ctx.fillStyle = "rgba(10, 10, 18, 0.22)";
    ctx.fillRect(0, 0, width, height);

    rockets = rockets.filter((r) => {
      const alive = r.update();
      if (alive) r.draw();
      return alive;
    });

    particles = particles.filter((p) => {
      const alive = p.update();
      if (alive) p.draw();
      return alive;
    });

    if (running) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function scheduleLaunches() {
    if (!running) return;
    launchRocket();
    if (Math.random() > 0.4) {
      setTimeout(launchRocket, rand(80, 200));
    }
    launchTimer = setTimeout(scheduleLaunches, rand(350, 700));
  }

  window.Fireworks = {
    start() {
      if (running) return;
      resize();
      running = true;
      canvas.classList.add("active");
      particles = [];
      rockets = [];
      scheduleLaunches();
      tick();
    },

    stop() {
      running = false;
      clearTimeout(launchTimer);
      if (rafId) cancelAnimationFrame(rafId);
      setTimeout(() => {
        if (!running) {
          canvas.classList.remove("active");
          ctx.clearRect(0, 0, width, height);
          particles = [];
          rockets = [];
        }
      }, 2000);
    },
  };

  window.addEventListener("resize", resize);
  resize();
})();
