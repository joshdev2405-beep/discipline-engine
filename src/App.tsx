import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import AppLayout from "@/components/AppLayout";
import SplashScreen from "@/components/SplashScreen";
import Auth from "@/pages/Auth";
import Index from "./pages/Index";
import Journal from "./pages/Journal";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Vault from "./pages/Vault";
import Leaderboard from "./pages/Leaderboard";
import FeedbackInbox from "./pages/FeedbackInbox";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [appVisible, setAppVisible] = useState(false);

  if (loading) return null;

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => {
            setShowSplash(false);
            setAppVisible(true);
          }} />
        )}
      </AnimatePresence>
      {appVisible && (
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/feedback-inbox" element={<FeedbackInbox />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      )}
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
