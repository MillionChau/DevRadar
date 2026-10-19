import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

// Profile Pages (SCR-14, SCR-15, SCR-16, SCR-17)
import { MyProfile } from './pages/profile/MyProfile';
import { PublicProfile } from './pages/profile/PublicProfile';
import { Bookmarks } from './pages/profile/Bookmarks';
import { Notifications } from './pages/profile/Notifications';

// Admin Pages (SCR-18, SCR-19, SCR-20, SCR-21, SCR-22)
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminPosts } from './pages/admin/AdminPosts';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminTechZones } from './pages/admin/AdminTechZones';
import { AdminCrawler } from './pages/admin/AdminCrawler';

// Error Fallback
import { ErrorState } from './components/common/ErrorState';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main App Shell Layout */}
          <Route element={<Layout />}>
            {/* Community Routes */}
            <Route path="/" element={<Newsfeed />} />
            <Route path="/trending" element={<Newsfeed />} />
            <Route path="/following" element={<Newsfeed />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/techzones" element={<TechZones />} />
            <Route path="/techzones/:slug" element={<TechZones />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Editor Routes */}
            <Route path="/editor/new" element={<CreatePost />} />
            <Route path="/editor/edit/:id" element={<EditPost />} />

            {/* Analytics & Radar Routes */}
            <Route path="/dashboard" element={<TechDashboard />} />
            <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
            <Route path="/analytics/repo-health" element={<RepoHealth />} />
            <Route path="/analytics/compare" element={<TechCompare />} />
            <Route path="/analytics/reports" element={<AnalyticsReports />} />

            {/* Profile & User Activity */}
            <Route path="/profile/me" element={<MyProfile />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Admin Management Routes */}
            <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/posts" element={<AdminPosts />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/techzones" element={<AdminTechZones />} />
            <Route path="/admin/crawler" element={<AdminCrawler />} />

            {/* Auth Routes inside shell */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />

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
    </AuthProvider>
  );
};

export default App;
