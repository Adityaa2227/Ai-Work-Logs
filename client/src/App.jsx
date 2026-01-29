import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LogManager from './pages/LogManager';
import Analytics from './pages/Analytics';
import Export from './pages/Export';
import Improvement from './pages/Improvement';
import Login from './pages/Login';
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
          <Route path="analytics" element={<Analytics />} />
          <Route path="export" element={<Export />} />
          <Route path="improvement" element={<Improvement />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
