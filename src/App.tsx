import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/store/appStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DOListPage } from '@/pages/DOListPage'
import { DODetailPage } from '@/pages/DODetailPage'
import { CreateDOPage } from '@/pages/CreateDOPage'
import { PlanningWorkbenchPage } from '@/pages/PlanningWorkbenchPage'
import { JobsListPage } from '@/pages/JobsListPage'
import { JobDetailPage } from '@/pages/JobDetailPage'
import { QueuePage } from '@/pages/QueuePage'
import { LogQueuePage } from '@/pages/LogQueuePage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { LogExpensePage } from '@/pages/LogExpensePage'
import { DeliveriesPage } from '@/pages/DeliveriesPage'
import { LogDeliveryPage } from '@/pages/LogDeliveryPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ReconciliationPage } from '@/pages/ReconciliationPage'
import { AuditTrailPage } from '@/pages/AuditTrailPage'
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
          <Route path="planning"       element={<PlanningWorkbenchPage />} />
          <Route path="jobs"           element={<JobsListPage />} />
          {/* Jobs are only ever created via Planning Workbench (a job must be tied to a DO) */}
          <Route path="jobs/new"       element={<Navigate to="/planning" replace />} />
          <Route path="jobs/:id"       element={<JobDetailPage />} />
          <Route path="queue"          element={<QueuePage />} />
          <Route path="queue/log"      element={<LogQueuePage />} />
          <Route path="expenses"       element={<ExpensesPage />} />
          <Route path="expenses/log"   element={<LogExpensePage />} />
          <Route path="deliveries"     element={<DeliveriesPage />} />
          <Route path="deliveries/log" element={<LogDeliveryPage />} />
          <Route path="reports"        element={<ReportsPage />} />
          <Route path="reconciliation" element={<ReconciliationPage />} />
          <Route path="audit"          element={<AuditTrailPage />} />
          <Route path="master"         element={<MasterDataPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
