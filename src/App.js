import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import { supabase } from './supabaseClient';

// Auth Components
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Dashboard Components
import Dashboard from './components/Dashboard/Dashboard';
import ProfilesList from './components/Profiles/ProfilesList';
import NewspapersList from './components/Newspapers/NewspapersList';
import SubscriptionsList from './components/Subscriptions/SubscriptionsList';
import CouponsList from './components/Coupons/CouponsList';
import ServicesList from './components/Services/ServicesList';
import ServiceBookingsList from './components/ServiceBookings/ServiceBookingsList';
import AreasList from './components/Areas/AreasList';
import DeliveryAgentsList from './components/DeliveryAgents/DeliveryAgentsList';

const theme = createTheme({
  palette: {
    primary: {
      // Teal Blue
      main: '#0f766e',
      light: '#14b8a6',
      dark: '#115e59',
      contrastText: '#ffffff',
    },
    secondary: {
      // Emerald
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7f6',
    },
  },
});

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/" element={!session ? <Navigate to="/login" /> : <Navigate to="/dashboard" />} />
          
          <Route element={<ProtectedRoute session={session} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profiles" element={<ProfilesList />} />
            <Route path="/newspapers" element={<NewspapersList />} />
            <Route path="/subscriptions" element={<SubscriptionsList />} />
            <Route path="/coupons" element={<CouponsList />} />
            <Route path="/services" element={<ServicesList />} />
            <Route path="/service-bookings" element={<ServiceBookingsList />} />
            <Route path="/areas" element={<AreasList />} />
            <Route path="/delivery-agents" element={<DeliveryAgentsList />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
