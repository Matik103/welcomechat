import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppRoutes } from "@/routes";
import { Toaster } from "sonner";
import { LoadingScreen } from "@/components/layout/LoadingScreen";

const AppContent = () => {
  const { isInitialized, isLoading } = useAuth();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return <AppRoutes />;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}
