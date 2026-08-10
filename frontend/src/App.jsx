import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import PublicSharePage from "./pages/PublicSharePage";

import "./styles/index.css";

function AppContent() {
  const { session, loading } = useAuth();
  const [view, setView] = useState("landing");
  const [authMode, setAuthMode] = useState("signin");
  const [activeTab, setActiveTab] = useState("overview");
  const [shareToken, setShareToken] = useState(null);

  useEffect(() => {
    // 1. Check URL query parameters for ?share=token
    const params = new URLSearchParams(window.location.search);
    const token = params.get("share");
    if (token) {
      setShareToken(token);
    }

    // 2. Check URL hash or path for tab state (e.g. #files, #shared, #activity, #settings, #profile)
    const hash = window.location.hash.replace("#", "");
    if (["overview", "files", "shared", "activity", "settings", "profile"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  function handleTabChange(newTab) {
    setActiveTab(newTab);
    window.location.hash = newTab;
  }

  // Public Share Token View
  if (shareToken) {
    return (
      <PublicSharePage
        shareToken={shareToken}
        onGoHome={() => {
          window.history.pushState({}, "", window.location.pathname);
          setShareToken(null);
        }}
      />
    );
  }

  // Global Loading Spinner
  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader" />
      </div>
    );
  }

  // Guest Landing Page
  if (!session && view === "landing") {
    return (
      <LandingPage
        onGetStarted={() => {
          setAuthMode("signup");
          setView("auth");
        }}
        onSignIn={() => {
          setAuthMode("signin");
          setView("auth");
        }}
      />
    );
  }

  // Guest Authentication Page (Login / Signup)
  if (!session && view === "auth") {
    return (
      <AuthPage
        initialMode={authMode}
        onBackToLanding={() => setView("landing")}
      />
    );
  }

  // Authenticated User Dashboard
  return (
    <DashboardPage
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}