import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
// Analysis page removed - functionality moved to resume bank
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import JobDetail from './pages/JobDetail';
import ResumeBank from './pages/ResumeBank';
import AddResume from './pages/AddResume';
import EditResume from './pages/EditResume';
import CandidateDetail from './pages/CandidateDetail';
import SearchCandidates from './pages/SearchCandidates';
import Settings from './pages/Settings';
import HiringProcesses from './pages/HiringProcesses';
import CreateHiringProcess from './pages/CreateHiringProcess';
import HiringProcessDetail from './pages/HiringProcessDetail';
import Meetings from './pages/Meetings';
import CreateMeeting from './pages/CreateMeeting';
import PublicMeeting from './pages/PublicMeeting';
import PublicJobApplication from './pages/PublicJobApplication';
import MeetingDetail from './pages/MeetingDetail';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected routes with sidebar */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Analysis route removed - functionality moved to resume bank */}
          
          <Route path="/jobs" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/jobs/create" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <CreateJob />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/jobs/:id" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <JobDetail />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/resume-bank" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <ResumeBank />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/resume-bank/add" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <AddResume />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/resume-bank/:id/edit" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <EditResume />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/resume-bank/:candidateId" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <CandidateDetail />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/resume-bank/search-candidates/:jobId" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <SearchCandidates />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/hiring-processes" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <HiringProcesses />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/hiring-processes/create" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <CreateHiringProcess />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/hiring-processes/:id" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <HiringProcessDetail />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Meeting routes */}
          <Route path="/meetings" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <Meetings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/meetings/create" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <CreateMeeting />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/meetings/:id" element={
            <ProtectedRoute>
              <Layout showSidebar={true}>
                <MeetingDetail />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Public meeting route - no authentication required */}
          <Route path="/meeting/:meetingLink" element={<PublicMeeting />} />

          {/* Public job application route - no authentication required */}
          <Route path="/job/:jobId/apply" element={<PublicJobApplication />} />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 