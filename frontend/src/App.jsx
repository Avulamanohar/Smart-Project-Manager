import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyTasks from './pages/MyTasks';
import Calendar from './pages/Calendar';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Layout from './components/Layout';

import FloatingChatbot from './components/FloatingChatbot';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? (
    <>
      {children}
      <FloatingChatbot />
    </>
  ) : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/my-tasks" element={
            <PrivateRoute>
              <Layout>
                <MyTasks />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/calendar" element={
            <PrivateRoute>
              <Layout>
                <Calendar />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/team" element={
            <PrivateRoute>
              <Layout>
                <Team />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/project/:id" element={
            <PrivateRoute>
              <ProjectDetails />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
