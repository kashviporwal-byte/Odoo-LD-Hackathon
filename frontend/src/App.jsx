import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Page Imports
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MyTrips from './pages/MyTrips';
import CreateTrip from './pages/CreateTrip';
import ItineraryBuilder from './pages/ItineraryBuilder';
import ItineraryView from './pages/ItineraryView';
import CitySearch from './pages/CitySearch';
import ActivitySearch from './pages/ActivitySearch';
import BudgetBreakdown from './pages/BudgetBreakdown';
import Timeline from './pages/Timeline';
import PublicItinerary from './pages/PublicItinerary';
import ProfileSettings from './pages/ProfileSettings';
import AdminDashboard from './pages/AdminDashboard';
import AiAssistant from './pages/AiAssistant';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/public/:token" element={<PublicItinerary />} />

              {/* Private Routes (Wrapped in ProtectedRoute) */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/trips" 
                element={
                  <ProtectedRoute>
                    <MyTrips />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/trips/create" 
                element={
                  <ProtectedRoute>
                    <CreateTrip />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/trips/:tripId" 
                element={
                  <ProtectedRoute>
                    <ItineraryBuilder />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/trips/:tripId/view" 
                element={
                  <ProtectedRoute>
                    <ItineraryView />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/trips/:tripId/budget" 
                element={
                  <ProtectedRoute>
                    <BudgetBreakdown />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/trips/:tripId/timeline" 
                element={
                  <ProtectedRoute>
                    <Timeline />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cities" 
                element={
                  <ProtectedRoute>
                    <CitySearch />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/activities" 
                element={
                  <ProtectedRoute>
                    <ActivitySearch />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ai-assistant" 
                element={
                  <ProtectedRoute>
                    <AiAssistant />
                  </ProtectedRoute>
                } 
              />

              {/* Admin-Only Route */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Route Fallbacks */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<div className="p-8 text-center font-semibold text-gray-500">404 — Screen Not Found</div>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
