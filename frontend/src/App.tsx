import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';

// Layouts
import { MainLayout } from '@/layouts/MainLayout';

// Pages
import { LoginPage } from '@/features/auth/LoginPage';
import { CashierPOSPage } from '@/features/cashier/CashierPOSPage';
import { OrderQueuePage } from '@/features/cashier/OrderQueuePage';
import { CustomerDisplayPage } from '@/features/display/CustomerDisplayPage';
import { QRMenuPage } from '@/features/qr-menu/QRMenuPage';
import { TenantQRMenuPage } from '@/features/qr-menu/TenantQRMenuPage';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { MenuManagementPage } from '@/features/admin/MenuManagementPage';
import { StaffManagementPage } from '@/features/admin/StaffManagementPage';
import { SettingsPage } from '@/features/admin/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public TV Display Screen & QR Menu */}
          <Route path="/display" element={<CustomerDisplayPage />} />
          <Route path="/qr-menu" element={<QRMenuPage />} />
          <Route path="/:canteenSlug/menu" element={<TenantQRMenuPage />} />
          
          {/* Auth Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/pos" element={<CashierPOSPage />} />
            <Route path="/orders" element={<OrderQueuePage />} />
            <Route path="/admin/menu" element={<MenuManagementPage />} />
            
            {/* Admin Exclusive Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <StaffManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Default Fallback */}
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
