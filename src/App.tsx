import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import ClientSetup from "./pages/ClientSetup";
import ClientView from "./pages/client/ClientView";
import ClientEdit from "./pages/client/ClientEdit";
import WidgetSettings from "./pages/client/WidgetSettings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountSettings from "@/pages/client/AccountSettings";

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" />;
  }

  return children;
};

const ClientRoute = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || userRole !== 'client') {
    return <Navigate to="/auth" />;
  }

  return (
    <>
      <ClientView />
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/client/setup" element={<ClientSetup />} />

        <Route path="/" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        <Route path="/client" element={<ClientRoute />}>
          <Route path="view" element={<ClientView />} />
          <Route path="edit" element={<ClientEdit />} />
          <Route path="widget-settings" element={<WidgetSettings />} />
          <Route path="account-settings" element={<AccountSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
