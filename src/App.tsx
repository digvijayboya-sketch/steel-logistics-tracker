import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/store/appStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DOListPage } from '@/pages/DOListPage'
import { DODetailPage } from '@/pages/DODetailPage'
import { JobsListPage } from '@/pages/JobsListPage'
import { JobDetailPage } from '@/pages/JobDetailPage'
import { QueuePage } from '@/pages/QueuePage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { DeliveriesPage } from '@/pages/DeliveriesPage'
import { ReportsPage } from '@/pages/ReportsPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dos" element={<DOListPage />} />
          <Route path="dos/:id" element={<DODetailPage />} />
          <Route path="jobs" element={<JobsListPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
