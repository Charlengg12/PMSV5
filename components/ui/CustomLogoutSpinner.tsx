import React from "react";

export const CustomLogoutSpinner: React.FC = () => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.7)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        border: "8px solid var(--accent)",
        borderTop: "8px solid transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        background: "none",
      }}
    />
    <div
      style={{
        marginTop: 24,
        color: "#fff",
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: 1,
        textAlign: "center",
        fontFamily: "Manrope, sans-serif",
        textShadow: "0 2px 8px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <span>
        Logging out
        <span className="logout-dots">
          &nbsp;<span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </span>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .logout-dots span {
        opacity: 0;
        animation: dotFade 1.2s infinite;
        font-size: 22px;
        font-weight: bold;
        margin-left: 2px;
      }
      .logout-dots span:nth-child(1) {
        animation-delay: 0s;
      }
      .logout-dots span:nth-child(2) {
        animation-delay: 0.3s;
      }
      .logout-dots span:nth-child(3) {
        animation-delay: 0.6s;
      }
      @keyframes dotFade {
        0% { opacity: 0; }
        20% { opacity: 1; }
        100% { opacity: 0; }
      }
    `}</style>
  </div>
);
