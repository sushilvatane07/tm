import React from "react";

/* ================================================================
   Static Ambient Glowing Backdrop (Google App Dark Aura Style)
   Zero animation, 100% clean, high contrast, elegant dark theme
   ================================================================ */

export default function Vault3DCanvas({ isFullPage = true }) {
  return (
    <div
      style={{
        position: isFullPage ? "fixed" : "relative",
        inset: isFullPage ? 0 : "auto",
        width: "100%",
        height: isFullPage ? "100vh" : "480px",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#090D16",
      }}
    >
      {/* Primary Emerald Mint Glowing Ambient Sphere */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "20%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0) 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Secondary Deep Indigo Glowing Ambient Sphere */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          right: "10%",
          width: "650px",
          height: "650px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, rgba(99, 102, 241, 0) 70%)",
          filter: "blur(120px)",
        }}
      />

      {/* Bottom Teal Mint Accent Ambient Glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "30%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, rgba(52, 211, 153, 0) 70%)",
          filter: "blur(110px)",
        }}
      />
    </div>
  );
}
