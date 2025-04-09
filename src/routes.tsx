
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import WidgetSettings from "./pages/WidgetSettings";
import NotFound from "./pages/NotFound";
import ErrorDisplay from "./components/ErrorDisplay";
import Auth from "./pages/Auth";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/widget-settings" element={<WidgetSettings />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/error" element={<ErrorDisplay />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
