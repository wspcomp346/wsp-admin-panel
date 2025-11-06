import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Avatar,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  People as PeopleIcon,
  Newspaper as NewspaperIcon,
  Subscriptions as SubscriptionsIcon,
  MiscellaneousServices as ServicesIcon,
  Payment as PaymentIcon,
  Notifications as NotificationsIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const [stats, setStats] = useState({
    profiles: 0,
    newspapers: 0,
    subscriptions: 0,
    services: 0,
    payments: 0,
  });
  const [loading, setLoading] = useState(true);

  // Analytics state
  const [statusCounts, setStatusCounts] = useState({});
  const [topNewspapers, setTopNewspapers] = useState([]); // [{ id, name, count }]
  const [payTypeCounts, setPayTypeCounts] = useState({ prepaid: 0, postpaid: 0 });

  // Realtime alert for updated service_bookings
  const [bookingAlert, setBookingAlert] = useState(null); // { name, phone, address }
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertGlow, setAlertGlow] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch counts from each table (using head: true to get count only)
        const promises = [
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('newspaper').select('id', { count: 'exact', head: true }),
          supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
          supabase.from('services').select('id', { count: 'exact', head: true }),
          supabase.from('payments').select('id', { count: 'exact', head: true }),
        ];

        const results = await Promise.allSettled(promises);
        
        const [
          profilesResult,
          newspapersResult,
          subscriptionsResult,
          servicesResult,
          paymentsResult,
        ] = results;

        setStats({
          profiles: profilesResult.status === 'fulfilled' ? (profilesResult.value.count || 0) : 0,
          newspapers: newspapersResult.status === 'fulfilled' ? (newspapersResult.value.count || 0) : 0,
          subscriptions: subscriptionsResult.status === 'fulfilled' ? (subscriptionsResult.value.count || 0) : 0,
          services: servicesResult.status === 'fulfilled' ? (servicesResult.value.count || 0) : 0,
          payments: paymentsResult.status === 'fulfilled' ? (paymentsResult.value.count || 0) : 0,
        });

        // Log any failed requests for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const tableNames = ['profiles', 'newspaper', 'subscriptions', 'services', 'payments'];
            console.warn(`Failed to fetch ${tableNames[index]} count:`, result.reason);
          }
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Set default values if everything fails
        setStats({
          profiles: 0,
          newspapers: 0,
          subscriptions: 0,
          services: 0,
          payments: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        // Pull minimal fields for client-side aggregation
        const { data: subs, error: subsError } = await supabase
          .from('subscriptions')
          .select('id, status, newspaper_id, payment_type')
          .limit(10000); // safety cap
        if (subsError) throw subsError;

        let subsArr = Array.isArray(subs) ? subs : [];

        // Status counts
        const sCounts = subsArr.reduce((acc, s) => {
          const key = s.status || 'unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        // Count by newspaper
        const byPaper = subsArr.reduce((acc, s) => {
          if (!s.newspaper_id) return acc;
          acc[s.newspaper_id] = (acc[s.newspaper_id] || 0) + 1;
          return acc;
        }, {});

        // Prepaid vs Postpaid counts
        const payCounts = subsArr.reduce(
          (acc, s) => {
            const t = (s.payment_type || '').toLowerCase();
            if (t === 'prepaid') acc.prepaid += 1;
            if (t === 'postpaid') acc.postpaid += 1;
            return acc;
          },
          { prepaid: 0, postpaid: 0 }
        );

        setPayTypeCounts(payCounts);

        const newspaperIds = Object.keys(byPaper);
        let namesMap = {};
        if (newspaperIds.length) {
          const { data: papers, error: papersError } = await supabase
            .from('newspaper')
            .select('id, name')
            .in('id', newspaperIds);
          if (papersError) throw papersError;
          const papersArr = Array.isArray(papers) ? papers : [];
          namesMap = papersArr.reduce((acc, n) => {
            acc[n.id] = n.name;
            return acc;
          }, {});
        }

        const top = Object.entries(byPaper)
          .map(([id, count]) => ({ id, name: namesMap[id] || id, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStatusCounts(sCounts);
        setTopNewspapers(top);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      }
    };

    fetchStats();
    fetchAnalytics();

    // Realtime alerts for updated service_bookings
    const channel = supabase
      .channel('service_bookings_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_bookings' },
        async (payload) => {
          try {
            const updated = payload.new;
            // Fetch user details
            let user = null;
            if (updated.user_id) {
              const { data: users, error: userErr } = await supabase
                .from('profiles')
                .select('id, name, phone')
                .eq('id', updated.user_id)
                .limit(1);
              if (userErr) throw userErr;
              user = users && users[0];
            }
            const info = {
              name: user?.name || 'Unknown User',
              phone: user?.phone || 'N/A',
              address: updated.address || 'No address provided',
            };
            setBookingAlert(info);
            setAlertGlow(true);
          } catch (e) {
            console.error('Realtime booking alert error:', e);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        // unsubscribe if available
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe();
        } else if (channel && typeof supabase.removeChannel === 'function') {
          // fallback for older/newer supabase SDKs
          supabase.removeChannel(channel);
        }
      } catch (_) {
        // ignore
      }
    };
  }, []);



  const statCards = [
    {
      title: 'Total Users',
      value: stats.profiles,
      icon: <PeopleIcon fontSize="large" />,
      colorFrom: '#42a5f5',
      colorTo: '#1e88e5',
    },
    {
      title: 'Newspapers',
      value: stats.newspapers,
      icon: <NewspaperIcon fontSize="large" />,
      colorFrom: '#66bb6a',
      colorTo: '#43a047',
    },
    {
      title: 'Subscriptions',
      value: stats.subscriptions,
      icon: <SubscriptionsIcon fontSize="large" />,
      colorFrom: '#ffca28',
      colorTo: '#ffb300',
    },
    {
      title: 'Services',
      value: stats.services,
      icon: <ServicesIcon fontSize="large" />,
      colorFrom: '#ab47bc',
      colorTo: '#8e24aa',
    },
    {
      title: 'Payments',
      value: stats.payments,
      icon: <PaymentIcon fontSize="large" />,
      colorFrom: '#ef5350',
      colorTo: '#e53935',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            WSP Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quick overview of your platform stats
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Badge
            color="error"
            variant={alertGlow ? 'dot' : 'standard'}
            overlap="circular"
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ mr: 1 }}
          >
            <Button
              variant="outlined"
              startIcon={<NotificationsIcon />}
              onClick={() => {
                if (bookingAlert) setAlertOpen(true);
                setAlertGlow(false);
              }}
              sx={{
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(239,83,80, 0.7)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(239,83,80, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(239,83,80, 0)' },
                },
                animation: alertGlow ? 'pulse 1.5s infinite' : 'none',
                borderColor: alertGlow ? 'error.main' : 'divider',
                color: alertGlow ? 'error.main' : 'text.primary',
              }}
            >
              {alertGlow ? 'New Service Booking Update' : 'Alerts'}
            </Button>
          </Badge>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 3,
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(135deg, ${card.colorFrom}0F, ${card.colorTo}14)`,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: index % 2 === 0 ? 'primary.main' : 'secondary.main',
                      width: 56,
                      height: 56,
                      boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
                    }}
                    variant="rounded"
                  >
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Analytics board */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Subscribers by Payment Type
              </Typography>
              {payTypeCounts.prepaid + payTypeCounts.postpaid === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No data
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                  {(() => {
                    const total = payTypeCounts.prepaid + payTypeCounts.postpaid;
                    const prepaidPct = total ? Math.round((payTypeCounts.prepaid / total) * 100) : 0;
                    const postpaidPct = 100 - prepaidPct;
                    return (
                      <>
                        <Box sx={{ position: 'relative', width: 180, height: 180 }}>
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              boxShadow: '0 10px 30px rgba(0,0,0,0.08) inset, 0 8px 20px rgba(0,0,0,0.08)',
                              backgroundImage: `conic-gradient(#42a5f5 0 ${prepaidPct}%, #ef5350 ${prepaidPct}% 100%)`,
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: 110,
                              height: 110,
                              borderRadius: '50%',
                              backgroundColor: 'background.paper',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                            }}
                          />
                          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Total
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                              {total}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'grid', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#42a5f5' }} />
                            <Typography variant="body2">
                              Prepaid: <strong>{payTypeCounts.prepaid}</strong> ({prepaidPct}%)
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef5350' }} />
                            <Typography variant="body2">
                              Postpaid: <strong>{payTypeCounts.postpaid}</strong> ({postpaidPct}%)
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Subscriptions by Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.keys(statusCounts).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No data
                  </Typography>
                )}
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Chip
                    key={status}
                    label={`${status}: ${count}`}
                    color={status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'default'}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Top Newspapers by Subscribers
              </Typography>
              <Paper variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Newspaper</TableCell>
                      <TableCell align="right">Subscribers</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topNewspapers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          No data
                        </TableCell>
                      </TableRow>
                    ) : (
                      topNewspapers.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell>{n.name}</TableCell>
                          <TableCell align="right">{n.count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>



      {/* Alert dialog for booking update */}
      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Service Booking Updated</DialogTitle>
        <DialogContent>
          {bookingAlert ? (
            <Box>
              <Typography>
                <strong>Name:</strong> {bookingAlert.name}
              </Typography>
              <Typography>
                <strong>Mobile:</strong> {bookingAlert.phone}
              </Typography>
              <Typography>
                <strong>Address:</strong> {bookingAlert.address}
              </Typography>
            </Box>
          ) : (
            <Typography>No alert details available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
