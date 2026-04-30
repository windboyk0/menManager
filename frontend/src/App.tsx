import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ToastContextProvider } from './components/ui/toast'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { UpdatePasswordPage } from './pages/auth/UpdatePasswordPage'
import { ProjectListPage } from './pages/projects/ProjectListPage'
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage'
import { ProjectNewPage } from './pages/projects/ProjectNewPage'
import { ProjectHistoryPage } from './pages/projects/ProjectHistoryPage'
import { EmployeeListPage } from './pages/employees/EmployeeListPage'
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage'
import { EmployeeNewPage } from './pages/employees/EmployeeNewPage'
import { EmployeeHistoryPage } from './pages/employees/EmployeeHistoryPage'
import { EmployeeSkillsPage } from './pages/employees/EmployeeSkillsPage'
import { AssignmentListPage } from './pages/assignments/AssignmentListPage'
import { AssignmentDetailPage } from './pages/assignments/AssignmentDetailPage'
import { AssignmentNewPage } from './pages/assignments/AssignmentNewPage'
import { AssignmentHistoryPage } from './pages/assignments/AssignmentHistoryPage'
import { SkillListPage } from './pages/skills/SkillListPage'
import { ApiKeyPage } from './pages/mypage/ApiKeyPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectListPage />} />
              <Route path="/projects/new" element={<ProjectNewPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/projects/:id/history" element={<ProjectHistoryPage />} />
              <Route path="/employees" element={<EmployeeListPage />} />
              <Route path="/employees/new" element={<EmployeeNewPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/employees/:id/history" element={<EmployeeHistoryPage />} />
              <Route path="/employees/:id/skills" element={<EmployeeSkillsPage />} />
              <Route path="/assignments" element={<AssignmentListPage />} />
              <Route path="/assignments/new" element={<AssignmentNewPage />} />
              <Route path="/assignments/:empId/:projCode" element={<AssignmentDetailPage />} />
              <Route path="/assignments/:empId/:projCode/history" element={<AssignmentHistoryPage />} />
              <Route path="/skills" element={<SkillListPage />} />
              <Route path="/mypage/apikey" element={<ApiKeyPage />} />
              <Route path="/update/:id/updatePW" element={<UpdatePasswordPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastContextProvider>
    </QueryClientProvider>
  )
}
