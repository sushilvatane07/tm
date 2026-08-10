import React, { useEffect, useRef } from "react";

/* ================================================================
   Interactive 3D Particle Constellation & Shockwave Engine
   ================================================================ */

export default function Vault3DCanvas({ isFullPage = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Mouse & Touch Tracking
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 180,
      active: false,
    };

    const shockwaves = [];

    // Particle Array Generator
    const PARTICLE_COUNT = Math.min(160, Math.floor((width * height) / 9000));
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 500,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: 1.5 + Math.random() * 2.5,
        color: Math.random() > 0.4 ? "#0066CC" : Math.random() > 0.5 ? "#38bdf8" : "#818cf8",
        alpha: 0.3 + Math.random() * 0.7,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseAngle: Math.random() * Math.PI * 2,
      });
    }

    // Pointer Handlers
    const onPointerMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const onPointerDown = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;

      // Spawn shockwave ring on click
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 240,
        alpha: 0.8,
        speed: 8,
      });

      // Scatter nearby particles outward
      particles.forEach((p) => {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 1) {
          const force = (200 - dist) / 10;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      });
    };

    const onPointerLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerleave", onPointerLeave);

    // Animation Render Loop
    let time = 0;

    const render = () => {
      time += 0.015;

      // Clear Frame
      ctx.clearRect(0, 0, width, height);

      // Deep Dark Ambient Radial Gradient Background
      const bgGrd = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      bgGrd.addColorStop(0, "#080d1a");
      bgGrd.addColorStop(0.5, "#050811");
      bgGrd.addColorStop(1, "#030408");
      ctx.fillStyle = bgGrd;
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Render & Update Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += sw.speed;
        sw.alpha -= 0.02;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${sw.alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      // Update & Draw Particles
      particles.forEach((p, idx) => {
        // Natural Drift
        p.x += p.vx;
        p.y += p.vy;

        // Friction / Speed damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Maintain minimum velocity
        if (Math.abs(p.vx) < 0.2) p.vx += (Math.random() - 0.5) * 0.1;
        if (Math.abs(p.vy) < 0.2) p.vy += (Math.random() - 0.5) * 0.1;

        // Viewport Bounce Bounds
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > width) { p.x = width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > height) { p.y = height; p.vy *= -1; }

        // Cursor Magnetic Attraction / Repulsion
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 1) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            
            // Subtle orbital pull around cursor
            p.vx += Math.cos(angle + Math.PI / 2) * force * 0.4;
            p.vy += Math.sin(angle + Math.PI / 2) * force * 0.4;
          }
        }

        // Particle Glow Pulse
        p.pulseAngle += p.pulseSpeed;
        const currentAlpha = Math.max(0.2, p.alpha + Math.sin(p.pulseAngle) * 0.25);
        const currentRadius = Math.max(1, p.radius + Math.sin(p.pulseAngle) * 0.5);

        // Draw Particle Circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();

        // Connect Laser Lines to Nearby Particles
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 130;
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 102, 204, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw Laser Connection Line to Cursor
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const lineAlpha = (1 - dist / mouse.radius) * 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      // Draw Cursor Energy Halo
      if (mouse.active) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 16;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 24 + Math.sin(time * 4) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [isFullPage]);

  return (
    <div
      style={{
        position: isFullPage ? "fixed" : "relative",
        inset: isFullPage ? 0 : "auto",
        width: "100%",
        height: isFullPage ? "100vh" : "480px",
        zIndex: 0,
        pointerEvents: "auto",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: "crosshair",
        }}
      />
      <div
        className="info"
        style={{
          position: "fixed",
          bottom: "14px",
          left: "50%",
          transform: "translateX(-50%)",
          font: "12px/1.4 'Inter', system-ui, sans-serif",
          color: "rgba(255, 255, 255, 0.45)",
          pointerEvents: "none",
          textAlign: "center",
          userSelect: "none",
          letterSpacing: "0.06em",
          background: "rgba(0,0,0,0.5)",
          padding: "5px 16px",
          borderRadius: "100px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          zIndex: 100,
        }}
      >
        move cursor to connect nodes &middot; click to trigger pulse burst
      </div>
    </div>
  );
}
