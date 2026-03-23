import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store';
import { queryClient } from '@/lib/queryClient';
import { useAppSelector } from '@/store/hooks';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthInitializer } from '@/components/Auth/AuthInitializer';
import { SignIn } from '@/pages/public/SignIn';
import { SignUp } from '@/pages/public/SignUp';
import { Unauthorized } from '@/pages/public/Unauthorized';
import { NotFound } from '@/pages/public/NotFound';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { DoctorDashboard } from '@/pages/doctor/Dashboard';
import { NurseDashboard } from '@/pages/nurse/Dashboard';
import { PatientDashboard } from '@/pages/patient/Dashboard';

function DashboardRouter() {
  const user = useAppSelector(s => s.auth.user);

  if (!user) return <Navigate to="/sign-in" replace />;

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'nurse':
      return <Navigate to="/nurse/dashboard" replace />;
    case 'patient':
      return <Navigate to="/patient/dashboard" replace />;
    case 'receptionist':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/sign-in" replace />;
  }
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthInitializer>
          <Routes>
            {/* Public routes */}
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardRouter />} />

              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/doctor/*"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <Routes>
                      <Route path="dashboard" element={<DoctorDashboard />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/nurse/*"
                element={
                  <ProtectedRoute allowedRoles={['nurse']}>
                    <Routes>
                      <Route path="dashboard" element={<NurseDashboard />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/patient/*"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <Routes>
                      <Route path="dashboard" element={<PatientDashboard />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthInitializer>
        </BrowserRouter>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </Provider>
  );
}
