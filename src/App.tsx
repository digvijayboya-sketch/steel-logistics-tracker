import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/store/appStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DOListPage } from '@/pages/DOListPage'
import { DODetailPage } from '@/pages/DODetailPage'
import { CreateDOPage } from '@/pages/CreateDOPage'
import { JobsListPage } from '@/pages/JobsListPage'
import { JobDetailPage } from '@/pages/JobDetailPage'
import { CreateJobPage } from '@/pages/CreateJobPage'
import { QueuePage } from '@/pages/QueuePage'
import { LogQueuePage } from '@/pages/LogQueuePage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { LogExpensePage } from '@/pages/LogExpensePage'
import { DeliveriesPage } from '@/pages/DeliveriesPage'
import { LogDeliveryPage } from '@/pages/LogDeliveryPage'
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
          {/* DO routes */}
          <Route path="dos" element={<DOListPage />} />
          <Route path="dos/new" element={<CreateDOPage />} />
          <Route path="dos/:id" element={<DODetailPage />} />
          {/* Job routes */}
          <Route path="jobs" element={<JobsListPage />} />
          <Route path="jobs/new" element={<CreateJobPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          {/* Queue routes */}
          <Route path="queue" element={<QueuePage />} />
          <Route path="queue/log" element={<LogQueuePage />} />
          {/* Expense routes */}
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="expenses/log" element={<LogExpensePage />} />
          {/* Delivery routes */}
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route path="deliveries/log" element={<LogDeliveryPage />} />
          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
