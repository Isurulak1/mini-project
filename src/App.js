import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import ClientDashboard from './Pages/ClientDashboard';
import PhotographerDashboard from './Pages/PhotographerDashboard';
import Signup from './Pages/SignUp';
import Login from './Pages/Login';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './Pages/PrivateRoute';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/client-dashboard"
              element={
                <PrivateRoute>
                  <ClientDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/photographer-dashboard"
              element={
                <PrivateRoute>
                  <PhotographerDashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
