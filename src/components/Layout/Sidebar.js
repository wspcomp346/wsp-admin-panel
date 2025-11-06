import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Newspaper as NewspaperIcon,
  Subscriptions as SubscriptionsIcon,
  LocalOffer as CouponsIcon,
  Payment as PaymentIcon,
  MiscellaneousServices as ServicesIcon,
  EventNote as BookingsIcon,
  CalendarToday as PlansIcon,
  LocationOn as LocationIcon,
  DeliveryDining as DeliveryIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Profiles', icon: <PeopleIcon />, path: '/profiles' },
  { text: 'Newspapers', icon: <NewspaperIcon />, path: '/newspapers' },
  { text: 'Subscriptions', icon: <SubscriptionsIcon />, path: '/subscriptions' },
  { text: 'Coupons', icon: <CouponsIcon />, path: '/coupons' },
  { text: 'Services', icon: <ServicesIcon />, path: '/services' },
  { text: 'Service Bookings', icon: <BookingsIcon />, path: '/service-bookings' },
  { text: 'Areas', icon: <LocationIcon />, path: '/areas' },
  { text: 'Delivery Agents', icon: <DeliveryIcon />, path: '/delivery-agents' },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Sign out from Supabase to clear authenticated session
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    } finally {
      navigate('/');
    }
  };

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          WSP Admin Panel
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;