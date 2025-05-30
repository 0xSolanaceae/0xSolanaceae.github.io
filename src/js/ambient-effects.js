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
        size: Math.random() * 2.5 + 0.8,
        opacity: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.3 + 0.1,
        angle: Math.random() * Math.PI * 2
      });
    }
    
    window.ambientDustParticles = dustParticles;
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
      data[i] += noise;
      data[i + 1] += noise;
      data[i + 2] += noise;
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
  
  window.ambientCanvas = canvas;
  window.ambientCtx = ctx;
  window.ambientBaseTextureCanvas = baseTextureCanvas;
  window.resizeAmbientCanvas = resizeCanvas;
  window.drawAmbientBaseTexture = drawBaseTexture;
  window.ambientGlitchState = { isGlitching, glitchIntensity };
  window.ambientDustParticles = dustParticles;
});
