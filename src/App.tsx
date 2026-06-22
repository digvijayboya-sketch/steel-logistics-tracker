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
import { MasterDataPage } from '@/pages/MasterDataPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthStore()
  if (loading) {
    return (
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#0d1117' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', border:'4px solid #2dd4bf', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)' }}>Loading session…</p>
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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"      element={<DashboardPage />} />
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
          <Route path="master"         element={<MasterDataPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
