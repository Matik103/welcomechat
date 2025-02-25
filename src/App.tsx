
import { Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { Routes, Route } from "react-router-dom";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ClientList from "@/pages/ClientList";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Index />} />
        <Route path="/clients" element={<ClientList />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
