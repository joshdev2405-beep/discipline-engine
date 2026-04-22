import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Journal from "@/pages/Journal";
import Analytics from "@/pages/Analytics";
import Profile from "@/pages/Profile";
import { initializeSessionSync } from "@/lib/session";

function AppRoutes() {
  const { session, loading } = useAuth();

  useEffect(() => {
    const unsubscribe = initializeSessionSync();
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="h-full w-full bg-background overflow-hidden">
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
