import React, { useEffect, useRef } from 'react';

export const LivePulseBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Heartbeat offset generator
    const getHeartbeatOffset = (t) => {
      if (t < 0.1) return 0;
      if (t < 0.15) {
        const p = (t - 0.1) / 0.05;
        return Math.sin(p * Math.PI) * 15;
      }
      if (t < 0.22) return 0;
      if (t < 0.25) {
        const q = (t - 0.22) / 0.03;
        return -Math.sin(q * Math.PI) * 10;
      }
      if (t < 0.3) {
        const r = (t - 0.25) / 0.05;
        return Math.sin(r * Math.PI) * 110;
      }
      if (t < 0.34) {
        const s = (t - 0.3) / 0.04;
        return -Math.sin(s * Math.PI) * 35;
      }
      if (t < 0.42) return 0;
      if (t < 0.52) {
        const tWave = (t - 0.42) / 0.1;
        return Math.sin(tWave * Math.PI) * 30;
      }
      return 0;
    };

    // State for the travelers
    const pulses = [
      {
        travelerX: -160,
        speed: 2.2,
        pulseWidth: 160,
        baseHeightPercent: 0.65,
        opacity: 0.16,
        glow: 14,
        lineWidth: 2
      },
      {
        travelerX: -300,
        speed: 1.4,
        pulseWidth: 200,
        baseHeightPercent: 0.35,
        opacity: 0.08,
        glow: 8,
        lineWidth: 1.5
      }
    ];

    const draw = () => {
      // Fetch dynamic colors from the canvas element style to support dynamic theme changes
      const computedStyle = getComputedStyle(canvas);
      const color1 = computedStyle.getPropertyValue('--accent-primary').trim() || '#6366f1';
      const color2 = computedStyle.getPropertyValue('--accent-secondary').trim() || '#8b5cf6';

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw faint ECG Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.008)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw each pulse line
      pulses.forEach(pulse => {
        const baseHeight = canvas.height * pulse.baseHeightPercent;

        // Move traveler
        pulse.travelerX += pulse.speed;
        if (pulse.travelerX > canvas.width + pulse.pulseWidth) {
          pulse.travelerX = -pulse.pulseWidth;
        }

        // Draw main pulse line
        ctx.beginPath();
        ctx.lineWidth = pulse.lineWidth;
        
        // Gradient for line
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.5, color2);
        gradient.addColorStop(1, color1);
        ctx.strokeStyle = gradient;

        // Visual opacity and glow
        ctx.globalAlpha = pulse.opacity;
        ctx.shadowColor = color1;
        ctx.shadowBlur = pulse.glow;

        for (let x = 0; x < canvas.width; x += 3) {
          const dx = x - pulse.travelerX;
          let offset = 0;
          if (dx >= -pulse.pulseWidth/2 && dx <= pulse.pulseWidth/2) {
            const t = (dx + pulse.pulseWidth/2) / pulse.pulseWidth;
            offset = getHeartbeatOffset(t);
          }
          const y = baseHeight - offset;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Draw traveler active head glow dot
        const headX = pulse.travelerX + (pulse.pulseWidth * 0.05); // slightly ahead of R-peak
        if (headX > 0 && headX < canvas.width) {
          const dx = headX - pulse.travelerX;
          const t = (dx + pulse.pulseWidth/2) / pulse.pulseWidth;
          const headY = baseHeight - getHeartbeatOffset(t);

          ctx.beginPath();
          ctx.arc(headX, headY, 3, 0, Math.PI * 2);
          ctx.fillStyle = color2;
          ctx.globalAlpha = pulse.opacity * 2;
          ctx.shadowBlur = pulse.glow * 1.5;
          ctx.fill();
        }
      });

      // Restore defaults
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
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
