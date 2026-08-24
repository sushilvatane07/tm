import React, { useEffect, useRef } from "react";

/* ================================================================
   Creative Holographic Encrypted Vault Matrix Visualizer
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

    // Mouse & Touch Tracking with Smooth Lerp
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 200,
      active: false,
    };

    const pulseRings = [];

    // Floating Data Hexagons & Node Stream
    const NODE_COUNT = Math.min(45, Math.floor((width * height) / 22000));
    const nodes = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 14 + Math.random() * 22,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        alpha: 0.15 + Math.random() * 0.45,
        color: Math.random() > 0.4 ? "#0066CC" : Math.random() > 0.5 ? "#38bdf8" : "#818cf8",
        label: ["AES-256", "E2EE", "0x7F", "RSA", "TLS", "SHA-256"][Math.floor(Math.random() * 6)],
      });
    }

    // Pointer Event Handlers
    const onPointerMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const onPointerDown = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;

      // Spawn concentric pulse ring on click
      pulseRings.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 280,
        alpha: 0.8,
        speed: 7,
      });
    };

    const onPointerLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerleave", onPointerLeave);

    // Draw Regular Hexagon Helper
    const drawHexagon = (x, y, radius, angle, color, alpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = radius * Math.cos(a);
        const py = radius * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    };

    // Main Render Loop
    let time = 0;

    const render = () => {
      time += 0.012;

      // Clear Canvas Frame
      ctx.clearRect(0, 0, width, height);

      // Mouse Smooth Interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Deep Dark Ambient Radial Background
      const bgGrd = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      bgGrd.addColorStop(0, "#0a1329");
      bgGrd.addColorStop(0.4, "#050814");
      bgGrd.addColorStop(1, "#020307");
      ctx.fillStyle = bgGrd;
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // ─── 1. DRAW CENTRAL HOLOGRAPHIC SECURITY SHIELD CORE ───────────
      const coreRadius = Math.min(180, Math.min(width, height) * 0.22);
      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer Rotating Security Ring 1
      ctx.save();
      ctx.rotate(time * 0.15);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 102, 204, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([20, 12, 5, 12]);
      ctx.stroke();
      ctx.restore();

      // Outer Rotating Security Ring 2
      ctx.save();
      ctx.rotate(-time * 0.22);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 2;
      ctx.setLineDash([40, 20, 10, 20]);
      ctx.stroke();
      ctx.restore();

      // Inner Glowing Core Gradient Sphere
      const coreGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 0.6);
      coreGrd.addColorStop(0, "rgba(56, 189, 248, 0.25)");
      coreGrd.addColorStop(0.6, "rgba(0, 102, 204, 0.12)");
      coreGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = coreGrd;
      ctx.fill();

      // Center Encrypted Shield Emblem Symbol
      ctx.save();
      const shieldScale = 1 + Math.sin(time * 2) * 0.04;
      ctx.scale(shieldScale, shieldScale);
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(18, -12);
      ctx.lineTo(18, 8);
      ctx.quadraticCurveTo(18, 22, 0, 28);
      ctx.quadraticCurveTo(-18, 22, -18, 8);
      ctx.lineTo(-18, -12);
      ctx.closePath();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.2;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 16;
      ctx.stroke();

      // Lock Keyhole Dot
      ctx.beginPath();
      ctx.arc(0, 2, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // ─── 2. DRAW CLICK PULSE RINGS ────────────────────────────────
      for (let i = pulseRings.length - 1; i >= 0; i--) {
        const ring = pulseRings[i];
        ring.radius += ring.speed;
        ring.alpha -= 0.018;

        if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
          pulseRings.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${ring.alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      }

      // ─── 3. DRAW FLOATING CRYPTOGRAPHIC DATA NODES ───────────────
      nodes.forEach((n) => {
        n.x += n.speedX;
        n.y += n.speedY;
        n.rotation += n.rotSpeed;

        // Viewport Bounce Bounds
        if (n.x < 0 || n.x > width) n.speedX *= -1;
        if (n.y < 0 || n.y > height) n.speedY *= -1;

        // Mouse Parallax Offset
        let parallaxX = 0;
        let parallaxY = 0;
        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius && dist > 1) {
            const force = (mouse.radius - dist) / mouse.radius;
            parallaxX = (dx / dist) * force * 15;
            parallaxY = (dy / dist) * force * 15;
          }
        }

        const drawX = n.x + parallaxX;
        const drawY = n.y + parallaxY;

        // Draw Hexagon Geometry
        drawHexagon(drawX, drawY, n.size, n.rotation, n.color, n.alpha);

        // Draw Crypto Text Label inside large nodes
        if (n.size > 20) {
          ctx.save();
          ctx.font = "10px monospace";
          ctx.fillStyle = n.color;
          ctx.globalAlpha = n.alpha * 0.85;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(n.label, drawX, drawY);
          ctx.restore();
        }
      });

      // ─── 4. CURSOR GLOW LIGHT SPOTLIGHT ───────────────────────────
      if (mouse.active) {
        ctx.save();
        const cursorGrd = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          80
        );
        cursorGrd.addColorStop(0, "rgba(56, 189, 248, 0.2)");
        cursorGrd.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fillStyle = cursorGrd;
        ctx.fill();
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
          cursor: "default",
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
          color: "rgba(255, 255, 255, 0.5)",
          pointerEvents: "none",
          textAlign: "center",
          userSelect: "none",
          letterSpacing: "0.06em",
          background: "rgba(0, 0, 0, 0.55)",
          padding: "6px 18px",
          borderRadius: "100px",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          zIndex: 100,
        }}
      >
        move cursor to interact &middot; click to trigger security pulse
      </div>
    </div>
  );
}
