import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LogManager from './pages/LogManager';
import Export from './pages/Export';
import Login from './pages/Login';
import SystemsTimeline from './pages/SystemsTimeline';
import PRJiraActivity from './pages/PRJiraActivity';
import ManagerReview from './pages/ManagerReview';
import SmartSearch from './pages/SmartSearch';
import LearningTimeline from './pages/LearningTimeline';
import AIFeedback from './pages/AIFeedback';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="logs" element={<LogManager />} />
          <Route path="systems-timeline" element={<SystemsTimeline />} />
          <Route path="pr-activity" element={<PRJiraActivity />} />
          <Route path="learning" element={<LearningTimeline />} />
          <Route path="manager-review" element={<ManagerReview />} />
          <Route path="search" element={<SmartSearch />} />
          <Route path="export" element={<Export />} />
          <Route path="critique" element={<AIFeedback />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
