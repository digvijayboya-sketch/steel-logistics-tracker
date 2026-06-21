import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/store/appStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
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
import { NotFoundPage } from '@/pages/NotFoundPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthStore()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-steel-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading session…</p>
        </div>
      </div>
    )
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dos" replace />} />
          <Route path="dos"            element={<DOListPage />} />
          <Route path="dos/new"        element={<CreateDOPage />} />
          <Route path="dos/:id"        element={<DODetailPage />} />
          <Route path="jobs"           element={<JobsListPage />} />
          <Route path="jobs/new"       element={<CreateJobPage />} />
          <Route path="jobs/:id"       element={<JobDetailPage />} />
          <Route path="queue"          element={<QueuePage />} />
          <Route path="queue/log"      element={<LogQueuePage />} />
          <Route path="expenses"       element={<ExpensesPage />} />
          <Route path="expenses/log"   element={<LogExpensePage />} />
          <Route path="deliveries"     element={<DeliveriesPage />} />
          <Route path="deliveries/log" element={<LogDeliveryPage />} />
          <Route path="reports"        element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
