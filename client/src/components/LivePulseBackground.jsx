import React, { useEffect, useRef } from 'react';

export const LivePulseBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    resizeCanvas();

    // Organic "lub-dub" double-beat heartbeat scale generator
    const getHeartbeatScale = (time) => {
      const cycleMs = 2800; // Heart rate: approx 64 BPM
      const t = (time % cycleMs) / cycleMs; // normalized 0 to 1

      // Lub beat (first wave)
      if (t >= 0.1 && t < 0.22) {
        const progress = (t - 0.1) / 0.12;
        return Math.sin(progress * Math.PI);
      }
      // Dub beat (second wave)
      if (t >= 0.24 && t < 0.34) {
        const progress = (t - 0.24) / 0.1;
        return Math.sin(progress * Math.PI) * 0.65;
      }
      // Baseline vibration
      return 0.15 + Math.sin(time * 0.002) * 0.03;
    };

    // Initialize creative floating particles
    const particleCount = 45;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        size: 1.2 + Math.random() * 3.5,
        alpha: 0.15 + Math.random() * 0.35,
        color: Math.random() > 0.5 ? 1 : 2,
        glowIntensity: 0
      });
    }

    const draw = (timestamp) => {
      const computedStyle = getComputedStyle(canvas);
      const color1 = computedStyle.getPropertyValue('--accent-primary').trim() || '#6366f1';
      const color2 = computedStyle.getPropertyValue('--accent-secondary').trim() || '#8b5cf6';

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const heartbeatScale = getHeartbeatScale(timestamp);

      // 1. Draw Subtle Interactive Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.006)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        // Highlight grid slightly near cursor
        if (mouseRef.current.active) {
          const dx = Math.abs(x - mouseRef.current.x);
          if (dx < 120) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.006 + (1 - dx / 120) * 0.02})`;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.006)';
          }
        }
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        if (mouseRef.current.active) {
          const dy = Math.abs(y - mouseRef.current.y);
          if (dy < 120) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.006 + (1 - dy / 120) * 0.02})`;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.006)';
          }
        }
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. Update and Draw Particles
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;

        // Wrap boundaries
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        // Interaction with mouse cursor
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const force = (160 - dist) / 160;
            // Repel particles slightly
            p.x -= (dx / dist) * force * 1.8;
            p.y -= (dy / dist) * force * 1.8;
            p.glowIntensity = Math.min(1, p.glowIntensity + 0.08);
          } else {
            p.glowIntensity = Math.max(0, p.glowIntensity - 0.02);
          }
        } else {
          p.glowIntensity = Math.max(0, p.glowIntensity - 0.02);
        }

        // Render particles pulsing with the heartbeat
        const sizeScale = 1 + heartbeatScale * 0.6 + p.glowIntensity * 1.0;
        const currentSize = p.size * sizeScale;
        const alpha = p.alpha * (0.35 + heartbeatScale * 0.65) + p.glowIntensity * 0.35;

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = p.color === 1 ? color1 : color2;
        ctx.globalAlpha = Math.min(0.85, alpha);

        if (currentSize > 3.5) {
          ctx.shadowColor = p.color === 1 ? color1 : color2;
          ctx.shadowBlur = currentSize * 2.5;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Draw Siri-style glowing liquid heartbeat waves
      const waveCount = 4;
      const waveColors = [color1, color2, color1, color2];
      const baseHeight = canvas.height * 0.62;

      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.lineWidth = i === 0 ? 3 : 1.5;
        ctx.strokeStyle = waveColors[i];
        
        // Base opacity + extra opacity during heartbeat peak
        ctx.globalAlpha = (i === 0 ? 0.22 : 0.09) * (0.6 + heartbeatScale * 0.4);
        ctx.shadowColor = waveColors[i];
        ctx.shadowBlur = i === 0 ? 20 : 6;

        const phase = (timestamp * 0.0015) + (i * Math.PI * 0.25);
        const frequency = 0.0022 + i * 0.0008;
        
        // Modulate amplitude based on heartbeat rhythm
        const maxAmp = canvas.height * 0.16 * (1 - i * 0.18);
        const currentAmp = maxAmp * (heartbeatScale * 1.1);

        for (let x = 0; x < canvas.width; x += 4) {
          // Fade wave out at screen borders to keep it centered and organic
          const borderFade = Math.sin((x / canvas.width) * Math.PI);
          const y = baseHeight + Math.sin(x * frequency + phase) * currentAmp * borderFade;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: '#0a0b10'
      }}
    />
  );
};
