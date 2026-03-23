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
import { AdminPatients } from '@/pages/admin/Patients';
import { AdminStaff } from '@/pages/admin/Staff';
import { AdminBilling } from '@/pages/admin/Billing';
import { DoctorDashboard } from '@/pages/doctor/Dashboard';
import { DoctorSchedule } from '@/pages/doctor/Schedule';
import { NurseDashboard } from '@/pages/nurse/Dashboard';
import { PatientDashboard } from '@/pages/patient/Dashboard';
import { BookAppointment } from '@/pages/patient/BookAppointment';
import { PatientAppointments } from '@/pages/patient/Appointments';
import { PatientBilling } from '@/pages/patient/Billing';
import { PatientInvoiceDetail } from '@/pages/patient/InvoiceDetail';
import { PatientLabResults } from '@/pages/patient/LabResults';
import { PatientLabResultDetail } from '@/pages/patient/LabResultDetail';
import { DoctorLabOrders } from '@/pages/doctor/LabOrders';
import { AdminLabManagement } from '@/pages/admin/LabManagement';
import { DoctorPrescriptions } from '@/pages/doctor/Prescriptions';
import { NurseDispensingQueue } from '@/pages/nurse/DispensingQueue';
import { PatientPrescriptions } from '@/pages/patient/Prescriptions';
import { AdminPharmacyManagement } from '@/pages/admin/PharmacyManagement';
import { AdminInventoryManagement } from '@/pages/admin/InventoryManagement';
import { NurseInventoryView } from '@/pages/nurse/InventoryView';
import { AdminDocumentManagement } from '@/pages/admin/DocumentManagement';
import { DoctorDocuments } from '@/pages/doctor/Documents';
import { PatientDocuments } from '@/pages/patient/Documents';

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

              {/* Nurse-accessible lab routes (must come before /admin/* wildcard) */}
              <Route path="/admin/lab" element={<ProtectedRoute allowedRoles={['admin', 'nurse']} />}>
                <Route index element={<AdminLabManagement />} />
                <Route path=":id" element={<AdminLabManagement />} />
              </Route>

              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="patients" element={<AdminPatients />} />
                      <Route path="staff" element={<AdminStaff />} />
                      <Route path="billing" element={<AdminBilling />} />
                      <Route path="billing/:id" element={<AdminBilling />} />
                      <Route path="lab" element={<AdminLabManagement />} />
                      <Route path="lab/:id" element={<AdminLabManagement />} />
                      <Route path="pharmacy" element={<AdminPharmacyManagement />} />
                      <Route path="pharmacy/:id" element={<AdminPharmacyManagement />} />
                      <Route path="inventory" element={<AdminInventoryManagement />} />
                      <Route path="documents" element={<AdminDocumentManagement />} />
                      <Route path="documents/:id" element={<AdminDocumentManagement />} />
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
                      <Route path="schedule" element={<DoctorSchedule />} />
                      <Route path="lab" element={<DoctorLabOrders />} />
                      <Route path="prescriptions" element={<DoctorPrescriptions />} />
                      <Route path="documents" element={<DoctorDocuments />} />
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
                      <Route path="dispensing" element={<NurseDispensingQueue />} />
                      <Route path="inventory" element={<NurseInventoryView />} />
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
                      <Route path="book-appointment" element={<BookAppointment />} />
                      <Route path="appointments" element={<PatientAppointments />} />
                      <Route path="billing" element={<PatientBilling />} />
                      <Route path="billing/:id" element={<PatientInvoiceDetail />} />
                      <Route path="lab" element={<PatientLabResults />} />
                      <Route path="lab/:id" element={<PatientLabResultDetail />} />
                      <Route path="prescriptions" element={<PatientPrescriptions />} />
                      <Route path="documents" element={<PatientDocuments />} />
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
