document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.ambient-container');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  container.appendChild(canvas);
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    drawBaseTexture();
  }
  
  let isGlitching = false;
  let glitchIntensity = 0;
  
  const vignetteSize = 0.75;
  const vignetteIntensity = 0.35;
  
  let baseTextureCanvas = document.createElement('canvas');
  let baseTextureCtx = baseTextureCanvas.getContext('2d');
  
  let dustParticles = [];
  
  function initDustParticles() {
    const numParticles = 60;
    dustParticles = [];
    
    for (let i = 0; i < numParticles; i++) {
      dustParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.3 + 0.1,
        angle: Math.random() * Math.PI * 2
      });
    }
  }
  
  function drawBaseTexture() {
    const width = canvas.width;
    const height = canvas.height;
    
    baseTextureCanvas.width = width;
    baseTextureCanvas.height = height;
    
    const gradient = baseTextureCtx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 1.3
    );
    
    gradient.addColorStop(0, 'rgba(238, 215, 172, 0.8)');
    gradient.addColorStop(0.6, 'rgba(226, 185, 139, 0.85)');
    gradient.addColorStop(1, 'rgba(192, 158, 121, 0.9)');
    
    baseTextureCtx.fillStyle = gradient;
    baseTextureCtx.fillRect(0, 0, width, height);
    
    const cornerSize = Math.min(width, height) * 0.35;
    
    const cornerGradient1 = baseTextureCtx.createRadialGradient(
      0, 0, 0,
      0, 0, cornerSize
    );
    cornerGradient1.addColorStop(0, 'rgba(220, 170, 100, 0.4)');
    cornerGradient1.addColorStop(1, 'rgba(220, 170, 100, 0)');
    baseTextureCtx.fillStyle = cornerGradient1;
    baseTextureCtx.fillRect(0, 0, cornerSize, cornerSize);
    
    const cornerGradient2 = baseTextureCtx.createRadialGradient(
      width, height, 0,
      width, height, cornerSize
    );
    cornerGradient2.addColorStop(0, 'rgba(200, 160, 90, 0.5)');
    cornerGradient2.addColorStop(1, 'rgba(200, 160, 90, 0)');
    baseTextureCtx.fillStyle = cornerGradient2;
    baseTextureCtx.fillRect(width - cornerSize, height - cornerSize, cornerSize, cornerSize);
    
    const imageData = baseTextureCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 16) {
      const noise = Math.random() * 10 - 5;
      data[i] += noise;     // r
      data[i + 1] += noise; // g
      data[i + 2] += noise; // b
    }
    
    baseTextureCtx.putImageData(imageData, 0, 0);
    
    const edgeWidth = Math.max(3, Math.min(width, height) * 0.01);
    const maxRoughness = Math.max(3, Math.min(width, height) * 0.01);
    
    baseTextureCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    
    for (let x = 0; x < width; x += 3) {
      const tearFactor = Math.random() > 0.95 ? 3 : 1;
      const roughness = Math.random() * maxRoughness * tearFactor;
      baseTextureCtx.fillRect(x, 0, 3, roughness * 1.2);
    }
    
    for (let x = 0; x < width; x += 3) {
      const tearFactor = Math.random() > 0.95 ? 3 : 1;
      const roughness = Math.random() * maxRoughness * tearFactor;
      baseTextureCtx.fillRect(x, height - roughness * 1.2, 3, roughness * 1.2);
    }
    
    for (let y = 0; y < height; y += 3) {
      const tearFactor = Math.random() > 0.95 ? 3 : 1;
      const roughness = Math.random() * maxRoughness * tearFactor;
      baseTextureCtx.fillRect(0, y, roughness * 1.2, 3);
    }
    
    for (let y = 0; y < height; y += 3) {
      const tearFactor = Math.random() > 0.95 ? 3 : 1;
      const roughness = Math.random() * maxRoughness * tearFactor;
      baseTextureCtx.fillRect(width - roughness * 1.2, y, roughness * 1.2, 3);
    }
    
    baseTextureCtx.fillStyle = 'rgba(30, 20, 10, 0.4)';
    
    for (let x = 0; x < width; x += 3) {
      const tearFactor = Math.random() > 0.95 ? 3 : 1;
      const roughness = Math.random() * maxRoughness * tearFactor;
      baseTextureCtx.fillRect(x, 0, 3, roughness);
    }
    
    for (let x = 0; x < width; x += 3) {
      const tearFactor = Math.random() > 0.95 ? 3 : 1;
      const roughness = Math.random() * maxRoughness * tearFactor;
      baseTextureCtx.fillRect(x, height - roughness, 3, roughness);
    }
    
    for (let y = 0; y < height; y += 3) {
      const tearFactor = Math.random() > 0.95 ? 3 : 1;
      const roughness = Math.random() * maxRoughness * tearFactor;
      baseTextureCtx.fillRect(0, y, roughness, 3);
    }
    
    for (let y = 0; y < height; y += 3) {
      const tearFactor = Math.random() > 0.95 ? 3 : 1;
      const roughness = Math.random() * maxRoughness * tearFactor;
      baseTextureCtx.fillRect(width - roughness, y, roughness, 3);
    }
    
    const vignette = baseTextureCtx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );
    
    vignette.addColorStop(vignetteSize, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, `rgba(0, 0, 0, ${vignetteIntensity})`);
    
    baseTextureCtx.fillStyle = vignette;
    baseTextureCtx.fillRect(0, 0, width, height);
    
    initDustParticles();
  }
  
  function scheduleNextGlitch() {
    const nextGlitchTime = 5000 + Math.random() * 7000;
    
    glitchTimeout = setTimeout(() => {
      isGlitching = true;
      
      setTimeout(() => {
        isGlitching = false;
        scheduleNextGlitch();
      }, 200 + Math.random() * 600);
      
    }, nextGlitchTime);
  }
  
  function updateDustParticles() {
    for (let i = 0; i < dustParticles.length; i++) {
      const particle = dustParticles[i];
      
      particle.x += Math.cos(particle.angle) * particle.speed;
      particle.y += Math.sin(particle.angle) * particle.speed;
      
      if (Math.random() > 0.99) {
        particle.angle += (Math.random() - 0.5) * 0.2;
      }
      
      if (particle.x < 0 || particle.x > canvas.width || 
          particle.y < 0 || particle.y > canvas.height) {
        particle.x = Math.random() * canvas.width;
        particle.y = Math.random() * canvas.height;
        particle.angle = Math.random() * Math.PI * 2;
      }
    }
  }
  
  function drawDustParticles() {
    ctx.save();
    
    for (const particle of dustParticles) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  function applyGlitchEffect() {
    if (!isGlitching) return;
    
    glitchIntensity = Math.random() * 12;
    
    const numGlitchLines = Math.floor(Math.random() * 10) + 3;
    
    for (let i = 0; i < numGlitchLines; i++) {
      const y = Math.floor(Math.random() * canvas.height);
      const height = Math.floor(Math.random() * 5) + 1;
      const offset = (Math.random() * 20 - 10) * glitchIntensity;
      
      const imageData = ctx.getImageData(0, y, canvas.width, height);
      
      ctx.clearRect(0, y, canvas.width, height);
      
      ctx.putImageData(imageData, offset, y);
    }
    
    if (Math.random() > 0.5) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.12})`;
      ctx.fillRect(
        Math.random() * 12 - 6,
        Math.random() * 12 - 6,
        canvas.width, 
        canvas.height
      );
      ctx.globalCompositeOperation = 'source-over';
    }
    
    if (Math.random() > 0.7) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = Math.random() > 0.5 ? 
        `rgba(0, 0, 255, ${Math.random() * 0.08})` :
        `rgba(0, 255, 0, ${Math.random() * 0.08})`;
      ctx.fillRect(
        Math.random() * 12 - 6,
        Math.random() * 12 - 6,
        canvas.width, 
        canvas.height
      );
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  
  function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(baseTextureCanvas, 0, 0);
    
    ctx.globalAlpha = 1;
    
    updateDustParticles();
    drawDustParticles();
    
    if (Math.random() < 0.002) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      
      if (Math.random() > 0.5) {
        const y = Math.random() * canvas.height;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      } else {
        const x = Math.random() * canvas.width;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      
      ctx.stroke();
    }
    
    applyGlitchEffect();
    
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  scheduleNextGlitch();
  animate();
});
