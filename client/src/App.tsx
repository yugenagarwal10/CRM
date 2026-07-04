import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StatusProvider } from './context/StatusContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Settings from './pages/Settings';
import SourcesSettings from './pages/SourcesSettings';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StatusProvider>
          <Toaster 
            position="top-center" 
            toastOptions={{
              duration: 3500,
              style: {
                fontWeight: 'bold',
                borderRadius: '12px',
                fontSize: '13px',
              }
            }} 
          />
          <Routes>
            {/* Public login/register page */}
            <Route path="/login" element={<Login />} />

            {/* Protected workspace routes inside Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/leads" element={<Leads />} />
                      <Route path="/leads/:id" element={<LeadDetail />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/settings/sources" element={<SourcesSettings />} />
                      <Route path="/reports" element={<Reports />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </StatusProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
