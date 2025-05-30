document.addEventListener('DOMContentLoaded', function() {
  if (typeof window.ambientCanvas === 'undefined') {
    setTimeout(() => {
      initAnimationLoop();
    }, 100);
    return;
  }
  
  initAnimationLoop();
  
  function initAnimationLoop() {
    const canvas = window.ambientCanvas;
    const ctx = window.ambientCtx;
    const baseTextureCanvas = window.ambientBaseTextureCanvas;
    let isGlitching = false;
    let glitchIntensity = 0;
    let glitchTimeout;
    
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
      for (let i = 0; i < window.ambientDustParticles.length; i++) {
        const particle = window.ambientDustParticles[i];
        
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
      
      for (const particle of window.ambientDustParticles) {
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
    
    window.addEventListener('resize', window.resizeAmbientCanvas);
    window.resizeAmbientCanvas();
    scheduleNextGlitch();
    animate();
  }
});
