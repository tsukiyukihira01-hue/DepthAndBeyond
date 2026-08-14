import React, { useEffect, useRef } from 'react';

export const LandingCanvasBg: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create 65 animated magic particles & embers
    const particleCount = 65;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 0.5,
      color:
        Math.random() > 0.6
          ? '#f59e0b' // Amber
          : Math.random() > 0.3
          ? '#a855f7' // Purple
          : '#38bdf8', // Cyan
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.7 - 0.2, // Upward floating ember effect
      alpha: Math.random() * 0.8 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    // Floating rune glyphs
    const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ'];
    const runeCount = 12;
    const floatingRunes = Array.from({ length: runeCount }, () => ({
      glyph: runes[Math.floor(Math.random() * runes.length)],
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.floor(Math.random() * 16 + 14),
      alpha: Math.random() * 0.25 + 0.05,
      vy: -Math.random() * 0.2 - 0.05,
      vx: (Math.random() - 0.5) * 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render floating magical embers
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.01;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, p.alpha));
        ctx.shadowBlur = p.radius * 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Render subtle background runes
      ctx.font = '16px serif';
      floatingRunes.forEach((r) => {
        r.x += r.vx;
        r.y += r.vy;

        if (r.y < -20) {
          r.y = height + 20;
          r.x = Math.random() * width;
        }

        ctx.fillStyle = '#f59e0b';
        ctx.globalAlpha = r.alpha;
        ctx.fillText(r.glyph, r.x, r.y);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-75" />;
};
