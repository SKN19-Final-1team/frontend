import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ConsultationHistoryPage from './pages/ConsultationHistoryPage';
import AfterCallWorkPage from './pages/AfterCallWorkPage';
import ProfilePage from './pages/ProfilePage';
import EmployeesPage from './pages/EmployeesPage';
import SimulationPage from './pages/SimulationPage';
import AdminStatsPage from './pages/AdminStatsPage';
import AdminManagePage from './pages/AdminManagePage';
import AdminNoticePage from './pages/AdminNoticePage';
import NoticePage from './pages/NoticePage';
import RealTimeConsultationPage from './pages/RealTimeConsultationPage';
import AdminConsultationManagePage from './pages/AdminConsultationManagePage';
import { SidebarProvider } from './contexts/SidebarContext';

export default function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          {/* /consultation은 /consultation/live로 리다이렉트 */}
          <Route path="/consultation" element={<Navigate to="/consultation/live" replace />} />
          <Route path="/consultation/history" element={<ProtectedRoute><ConsultationHistoryPage /></ProtectedRoute>} />
          <Route path="/consultation/live" element={<ProtectedRoute><RealTimeConsultationPage /></ProtectedRoute>} />
          <Route path="/acw" element={<ProtectedRoute><AfterCallWorkPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
          <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
          <Route path="/notice" element={<ProtectedRoute><NoticePage /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute><AdminStatsPage /></ProtectedRoute>} />
          <Route path="/admin/manage" element={<ProtectedRoute><AdminManagePage /></ProtectedRoute>} />
          <Route path="/admin/notice" element={<ProtectedRoute><AdminNoticePage /></ProtectedRoute>} />
          <Route path="/admin/consultations" element={<ProtectedRoute><AdminConsultationManagePage /></ProtectedRoute>} />
        </Routes>
      </SidebarProvider>
    </BrowserRouter>
  );
}