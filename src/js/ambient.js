(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.ambient-container');
    if (!container || prefersReducedMotion) {
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    container.appendChild(canvas);

    const baseTexture = document.createElement('canvas');
    const baseCtx = baseTexture.getContext('2d', { alpha: false });

    let particles = [];
    let running = true;
    let lastTimestamp = 0;
    let glitchCooldown = getNextGlitchDelay();

    function getNextGlitchDelay() {
      return 5000 + Math.random() * 6000;
    }

    function resize() {
      const { innerWidth: width, innerHeight: height } = window;
      canvas.width = width;
      canvas.height = height;
      baseTexture.width = width;
      baseTexture.height = height;

      paintBaseTexture(width, height);
      seedParticles(width, height);
    }

    function paintBaseTexture(width, height) {
      const gradient = baseCtx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 1.3
      );

      gradient.addColorStop(0, 'rgba(238, 215, 172, 0.82)');
      gradient.addColorStop(0.6, 'rgba(226, 185, 139, 0.86)');
      gradient.addColorStop(1, 'rgba(192, 158, 121, 0.9)');

      baseCtx.fillStyle = gradient;
      baseCtx.fillRect(0, 0, width, height);

      const vignette = baseCtx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );

      vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.32)');

      baseCtx.fillStyle = vignette;
      baseCtx.fillRect(0, 0, width, height);
    }

    function seedParticles(width, height) {
      const count = Math.max(40, Math.floor((width + height) / 60));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.6,
        opacity: Math.random() * 0.6 + 0.25,
        speed: Math.random() * 0.25 + 0.08,
        angle: Math.random() * Math.PI * 2
      }));
    }

    function updateParticles(width, height) {
      particles.forEach((p) => {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        if (Math.random() > 0.995) {
          p.angle += (Math.random() - 0.5) * 0.4;
        }

        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.angle = Math.random() * Math.PI * 2;
        }
      });
    }

    function drawParticles() {
      ctx.save();
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.35})`;
        ctx.arc(p.x, p.y, p.size * 1.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function applyGlitch(width, height) {
      const slices = Math.floor(Math.random() * 6) + 2;
      const intensity = Math.random() * 14;

      for (let i = 0; i < slices; i++) {
        const y = Math.floor(Math.random() * height);
        const sliceHeight = Math.floor(Math.random() * 6) + 2;
        const offset = (Math.random() * 20 - 10) * intensity;

        const data = ctx.getImageData(0, y, width, sliceHeight);
        ctx.clearRect(0, y, width, sliceHeight);
        ctx.putImageData(data, offset, y);
      }

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.12})`;
      ctx.fillRect(0, 0, width, height);

      if (Math.random() > 0.5) {
        ctx.fillStyle = `rgba(0, 255, 0, ${Math.random() * 0.1})`;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.globalCompositeOperation = 'source-over';
    }

    function drawScanline(width, height) {
      if (Math.random() > 0.995) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        if (Math.random() > 0.5) {
          const y = Math.random() * height;
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        } else {
          const x = Math.random() * width;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        ctx.stroke();
      }
    }

    function step(timestamp) {
      if (!running) {
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      const delta = lastTimestamp ? (timestamp - lastTimestamp) : 16;
      lastTimestamp = timestamp;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(baseTexture, 0, 0);

      updateParticles(width, height);
      drawParticles();
      drawScanline(width, height);

      glitchCooldown -= delta;
      if (glitchCooldown <= 0) {
        applyGlitch(width, height);
        glitchCooldown = getNextGlitchDelay();
      }

      requestAnimationFrame(step);
    }

    function handleVisibility() {
      running = !document.hidden;
      if (running) {
        lastTimestamp = 0;
        requestAnimationFrame(step);
      }
    }

    window.addEventListener('resize', debounce(resize, 120));
    document.addEventListener('visibilitychange', handleVisibility);

    resize();
    requestAnimationFrame(step);
  });

  function debounce(fn, wait) {
    let timer;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }
})();
