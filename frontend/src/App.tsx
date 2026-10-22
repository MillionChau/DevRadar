import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';

// Auth Pages (SCR-01, SCR-02, SCR-03)
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Community Pages (SCR-04, SCR-05, SCR-06, SCR-07)
import { Newsfeed } from './pages/community/Newsfeed';
import { PostDetail } from './pages/community/PostDetail';
import { TechZones } from './pages/community/TechZones';
import { Leaderboard } from './pages/community/Leaderboard';

// Editor Pages (SCR-08, SCR-09)
import { CreatePost } from './pages/editor/CreatePost';
import { EditPost } from './pages/editor/EditPost';

// Analytics & Radar Pages (SCR-10, SCR-11, SCR-12, SCR-13)
import { TechDashboard } from './pages/analytics/TechDashboard';
import { RepoHealth } from './pages/analytics/RepoHealth';
import { TechCompare } from './pages/analytics/TechCompare';
import { AnalyticsReports } from './pages/analytics/AnalyticsReports';
import { ReportDetail } from './pages/analytics/ReportDetail';

// Profile Pages (SCR-14, SCR-15, SCR-16, SCR-17)
import { MyProfile } from './pages/profile/MyProfile';
import { PublicProfile } from './pages/profile/PublicProfile';
import { Bookmarks } from './pages/profile/Bookmarks';
import { Notifications } from './pages/profile/Notifications';

// Admin Pages (SCR-18, SCR-19, SCR-20, SCR-21, SCR-22)
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminPosts } from './pages/admin/AdminPosts';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminTechReports } from './pages/admin/AdminTechReports';
import { AdminTechZones } from './pages/admin/AdminTechZones';
import { AdminCrawler } from './pages/admin/AdminCrawler';
import { AdminLogs } from './pages/admin/AdminLogs';

// Error Fallback
import { ErrorState } from './components/common/ErrorState';
// Route Guards (RBAC)
import { ProtectedRoute } from './components/common/RouteGuard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
          {/* Main App Shell Layout */}
          <Route element={<Layout />}>
            {/* Public Community & Analytics Routes */}
            <Route path="/" element={<Newsfeed />} />
            <Route path="/trending" element={<Newsfeed />} />
            <Route path="/following" element={<Newsfeed />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/techzones" element={<TechZones />} />
            <Route path="/techzones/:slug" element={<TechZones />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            <Route path="/dashboard" element={<TechDashboard />} />
            <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
            <Route path="/analytics/repo-health" element={<RepoHealth />} />
            <Route path="/analytics/compare" element={<TechCompare />} />
            <Route path="/analytics/reports" element={<AnalyticsReports />} />
            <Route path="/analytics/reports/:id" element={<ReportDetail />} />
            <Route path="/reports/:id" element={<ReportDetail />} />

            <Route path="/profile/:id" element={<PublicProfile />} />

            {/* Direct Auth Aliases */}
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/register" element={<Navigate to="/auth/register" replace />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />

            {/* Authenticated Member Routes (Yêu cầu đăng nhập: Member, Moderator, Admin) */}
            <Route element={<ProtectedRoute allowedRoles={['Member', 'Moderator', 'Admin']} />}>
              <Route path="/editor/new" element={<CreatePost />} />
              <Route path="/editor/edit/:id" element={<EditPost />} />
              <Route path="/profile/me" element={<MyProfile />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* Admin Only Management Routes (Yêu cầu quyền Admin) */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/posts" element={<AdminPosts />} />
              <Route path="/admin/tech-reports" element={<AdminTechReports />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/techzones" element={<AdminTechZones />} />
              <Route path="/admin/crawler" element={<AdminCrawler />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
            </Route>

            {/* 404 Catch-All */}
            <Route
              path="*"
              element={
                <div className="py-12">
                  <ErrorState
                    code={404}
                    title="404 - Không tìm thấy trang"
                    message="Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển."
                  />
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
  );
};

export default App;
