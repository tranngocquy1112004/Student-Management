import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { ToastProvider } from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import LoadingInterceptorSetup from './components/LoadingInterceptorSetup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import { AdminDashboard, TeacherDashboard, StudentDashboard } from './pages/Dashboard';
import Users from './pages/Users';
import Faculties from './pages/Faculties';
import Subjects from './pages/Subjects';
import Classes from './pages/Classes';
import ClassDetail from './pages/ClassDetail';
import SubmitAssignment from './pages/SubmitAssignment';
import AssignmentSubmissions from './pages/AssignmentSubmissions';
import GradeSubmissions from './pages/GradeSubmissions';
import AttendanceQR from './pages/AttendanceQR';
import CheckIn from './pages/CheckIn';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import LeaveRequest from './pages/LeaveRequest';
import StudentLeaveStatus from './pages/StudentLeaveStatus';
import AdminLeaveRequests from './pages/AdminLeaveRequests';
import AdminExpulsionManagement from './pages/AdminExpulsionManagement';
import StudentExpulsionView from './pages/StudentExpulsionView';
import StudentWarningsView from './pages/StudentWarningsView';
import TeacherViolationReports from './pages/TeacherViolationReports';

const NavLink = ({ to, children }) => {
  const loc = useLocation();
  return (
    <Link to={to} className={loc.pathname === to ? 'active' : ''}>
      <span className="nav-icon">•</span>
      <span className="nav-text">{children}</span>
    </Link>
  );
};

const AdminSidebar = () => (
  <>
    <NavLink to="/">Dashboard</NavLink>
    <NavLink to="/users">Người dùng</NavLink>
    <NavLink to="/faculties">Khoa</NavLink>
    <NavLink to="/subjects">Môn học</NavLink>
    <NavLink to="/classes">Lớp học</NavLink>
    <NavLink to="/admin/leave-requests">Quản lý bảo lưu</NavLink>
    <NavLink to="/admin/expulsions">Quản lý đuổi học</NavLink>
    <NavLink to="/notifications">Thông báo</NavLink>
    <NavLink to="/profile">Tài khoản</NavLink>
  </>
);

const TeacherSidebar = () => (
  <>
    <NavLink to="/">Dashboard</NavLink>
    <NavLink to="/classes">Lớp của tôi</NavLink>
    <NavLink to="/teacher/violations">Báo cáo vi phạm</NavLink>
    <NavLink to="/notifications">Thông báo</NavLink>
    <NavLink to="/profile">Tài khoản</NavLink>
  </>
);

const StudentSidebar = () => (
  <>
    <NavLink to="/">Dashboard</NavLink>
    <NavLink to="/classes">Lớp của tôi</NavLink>
    <NavLink to="/leave/status">Bảo lưu</NavLink>
    <NavLink to="/student/expulsion">Đuổi học</NavLink>
    <NavLink to="/student/warnings">Cảnh báo</NavLink>
    <NavLink to="/notifications">Thông báo</NavLink>
    <NavLink to="/profile">Tài khoản</NavLink>
  </>
);

const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  return <StudentDashboard />;
};

const LayoutWrapper = ({ children }) => {
  const { user } = useAuth();
  const { isLoading } = useLoading();
  const sidebar = user?.role === 'admin' ? <AdminSidebar /> : user?.role === 'teacher' ? <TeacherSidebar /> : <StudentSidebar />;
  return (
    <>
      {isLoading && <LoadingSpinner />}
      <Layout sidebar={sidebar}>{children}</Layout>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <LoadingProvider>
            <LoadingInterceptorSetup>
              <SocketProvider>
                <ToastProvider />
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/check-in/:sessionId" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
                    <Route path="/" element={<ProtectedRoute><LayoutWrapper><DashboardRouter /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute roles={['admin']}><LayoutWrapper><Users /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/faculties" element={<ProtectedRoute roles={['admin']}><LayoutWrapper><Faculties /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/subjects" element={<ProtectedRoute roles={['admin']}><LayoutWrapper><Subjects /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/classes" element={<ProtectedRoute><LayoutWrapper><Classes /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/classes/:id" element={<ProtectedRoute><LayoutWrapper><ClassDetail /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/assignments/:id/submit" element={<ProtectedRoute><LayoutWrapper><SubmitAssignment /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/assignments/:id/submissions" element={<ProtectedRoute><LayoutWrapper><AssignmentSubmissions /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/assignments/:id/grade" element={<ProtectedRoute><LayoutWrapper><GradeSubmissions /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/classes/:classId/attendance/:sessionId/qr" element={<ProtectedRoute><LayoutWrapper><AttendanceQR /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><LayoutWrapper><Notifications /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><LayoutWrapper><Profile /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/leave/request" element={<ProtectedRoute roles={['student']}><LayoutWrapper><LeaveRequest /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/leave/status" element={<ProtectedRoute roles={['student']}><LayoutWrapper><StudentLeaveStatus /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/admin/leave-requests" element={<ProtectedRoute roles={['admin']}><LayoutWrapper><AdminLeaveRequests /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/admin/expulsions" element={<ProtectedRoute roles={['admin']}><LayoutWrapper><AdminExpulsionManagement /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/student/expulsion" element={<ProtectedRoute roles={['student']}><LayoutWrapper><StudentExpulsionView /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/student/warnings" element={<ProtectedRoute roles={['student']}><LayoutWrapper><StudentWarningsView /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="/teacher/violations" element={<ProtectedRoute roles={['teacher']}><LayoutWrapper><TeacherViolationReports /></LayoutWrapper></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </SocketProvider>
            </LoadingInterceptorSetup>
          </LoadingProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
