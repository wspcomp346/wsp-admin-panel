import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

const SubscriptionsList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [newspapers, setNewspapers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  // Filter states
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [activePaymentTypeTab, setActivePaymentTypeTab] = useState('all'); // New state for tab selection
  const [languageFilter, setLanguageFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [deliveryAgentFilter, setDeliveryAgentFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    newspaper_id: '',
    plan_id: '',
    language: '',
    delivery_address: '',
    start_date: '',
    end_date: '',
    status: 'active',
    payment_status: 'pending',
    payment_type: 'prepaid',
    price: '',
    coupon_code: '',
    discount_percent: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subscriptions without embedded relationships
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subscriptionsError) throw subscriptionsError;

      // Fetch all profiles to match with user_ids
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone');

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
      }

      // Fetch newspapers for dropdown and joining
      const { data: newspapersData, error: newspapersError } = await supabase
        .from('newspaper')
        .select('id, name');

      if (newspapersError) throw newspapersError;

      // Fetch subscription plans for dropdown and joining
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, price, duration');

      if (plansError) throw plansError;

      // Fetch areas for dropdown and joining
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('id, name');

      if (areasError) {
        console.error('Areas fetch error:', areasError);
      }

      // Fetch delivery agents for dropdown and joining
      const { data: deliveryAgentsData, error: deliveryAgentsError } = await supabase
        .from('delivery_agents')
        .select('id, name, phone');

      if (deliveryAgentsError) {
        console.error('Delivery agents fetch error:', deliveryAgentsError);
      }

      // Process subscriptions to include user profile, newspaper, plan, area, and delivery agent data
      const processedSubscriptions = subscriptionsData?.map(subscription => {
        const profile = profilesData?.find(p => p.id === subscription.user_id);
        const newspaper = newspapersData?.find(n => n.id === subscription.newspaper_id);
        const plan = plansData?.find(p => p.id === subscription.plan_id);
        const area = areasData?.find(a => a.id === subscription.area_id);
        const deliveryAgent = deliveryAgentsData?.find(da => da.id === subscription.delivery_agent_id);
        return {
          ...subscription,
          profile: profile || null,
          newspaper: newspaper || null,
          plan: plan || null,
          area: area || null,
          deliveryAgent: deliveryAgent || null
        };
      }) || [];

      setSubscriptions(processedSubscriptions);
      setNewspapers(newspapersData || []);
      setPlans(plansData || []);
      setUsers(profilesData || []);
      setAreas(areasData || []);
      setDeliveryAgents(deliveryAgentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (subscription.delivery_address && subscription.delivery_address.toLowerCase().includes(searchLower)) ||
        (subscription.language && subscription.language.toLowerCase().includes(searchLower)) ||
        (subscription.status && subscription.status.toLowerCase().includes(searchLower)) ||
        (subscription.newspaper && subscription.newspaper.name && 
          subscription.newspaper.name.toLowerCase().includes(searchLower))
      );
      if (!matchesSearch) return false;
    }

    // Active tab filter (new logic for postpaid/prepaid buttons)
    if (activePaymentTypeTab === 'postpaid' && subscription.payment_type?.toLowerCase() !== 'postpaid') return false;
    if (activePaymentTypeTab === 'prepaid' && subscription.payment_type?.toLowerCase() !== 'prepaid') return false;

    // Payment type filter (existing dropdown)
    if (paymentTypeFilter) {
      if (paymentTypeFilter === 'prepaid' && subscription.payment_type?.toLowerCase() !== 'prepaid') return false;
      if (paymentTypeFilter === 'postpaid' && subscription.payment_type?.toLowerCase() !== 'postpaid') return false;
    }

    // Language filter
    if (languageFilter && subscription.language !== languageFilter) return false;

    // Area filter
    if (areaFilter && subscription.area_id !== areaFilter) return false;

    // Delivery agent filter
    if (deliveryAgentFilter && subscription.delivery_agent_id !== deliveryAgentFilter) return false;

    return true;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  // Filter handlers
  const handlePaymentTypeFilterChange = (e) => {
    setPaymentTypeFilter(e.target.value);
    setPage(0);
  };

  const handleLanguageFilterChange = (e) => {
    setLanguageFilter(e.target.value);
    setPage(0);
  };

  const handleAreaFilterChange = (e) => {
    setAreaFilter(e.target.value);
    setPage(0);
  };

  const handleDeliveryAgentFilterChange = (e) => {
    setDeliveryAgentFilter(e.target.value);
    setPage(0);
  };

  // Handler for payment type tab buttons
  const handlePaymentTypeTabChange = (tabType) => {
    setActivePaymentTypeTab(tabType);
    setPage(0);
  };

  // Handler for updating subscription status to completed
  const handleMarkCompleted = async (subscriptionId) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'completed' })
        .eq('id', subscriptionId);

      if (error) {
        console.error('Error updating subscription status:', error);
        alert(`Error updating status: ${error.message}`);
        return;
      }

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error updating subscription status:', error);
      alert(`Unexpected error: ${error.message}`);
    }
  };

  // Handler for updating payment status to paid
  const handleMarkPaid = async (subscriptionId) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          payment_status: 'paid'
        })
        .eq('id', subscriptionId);

      if (error) {
        console.error('Error updating payment status:', error);
        alert(`Error updating payment status: ${error.message}`);
        return;
      }

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(`Unexpected error: ${error.message}`);
    }
  };

  // Get unique languages for filter dropdown
  const uniqueLanguages = [...new Set(subscriptions.map(sub => sub.language).filter(Boolean))];

  const handleOpenDialog = (subscription = null) => {
    if (subscription) {
      setCurrentSubscription(subscription);
      setFormData({
        user_id: subscription.user_id || '',
        newspaper_id: subscription.newspaper_id || '',
        plan_id: subscription.plan_id || '',
        language: subscription.language || '',
        area_id: subscription.area_id || '',
        delivery_agent_id: subscription.delivery_agent_id || '',
        delivery_address: subscription.delivery_address || '',
        start_date: subscription.start_date || '',
        end_date: subscription.end_date || '',
        status: subscription.status || 'active',
        payment_status: subscription.payment_status || 'pending',
        payment_type: subscription.payment_type || 'prepaid',
        price: subscription.price || '',
        coupon_code: subscription.coupon_code || '',
        discount_percent: subscription.discount_percent || 0,
      });
    } else {
      setCurrentSubscription(null);
      setFormData({
        user_id: '',
        newspaper_id: '',
        plan_id: '',
        language: '',
        area_id: '',
        delivery_agent_id: '',
        delivery_address: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active',
        payment_status: 'pending',
        payment_type: 'prepaid',
        price: '',
        coupon_code: '',
        discount_percent: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'discount_percent' 
        ? (value === '' ? '' : parseFloat(value)) 
        : value,
    });
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        price: formData.price === '' ? null : parseFloat(formData.price),
        discount_percent: formData.discount_percent === '' ? null : parseFloat(formData.discount_percent),
      };

      if (currentSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update(dataToSubmit)
          .eq('id', currentSubscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase.from('subscriptions').insert([dataToSubmit]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        const { error } = await supabase.from('subscriptions').delete().eq('id', id);

        if (error) throw error;
        fetchData();
      } catch (error) {
        console.error('Error deleting subscription:', error);
      }
    }
  };

  const getStatusChipColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPaymentStatusChipColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Subscriptions
        </Typography>
      </Box>

      {/* Payment Type Filter Buttons */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button
          variant={activePaymentTypeTab === 'all' ? 'contained' : 'outlined'}
          onClick={() => handlePaymentTypeTabChange('all')}
          size="small"
        >
          All Subscriptions
        </Button>
        <Button
          variant={activePaymentTypeTab === 'postpaid' ? 'contained' : 'outlined'}
          onClick={() => handlePaymentTypeTabChange('postpaid')}
          size="small"
          color="info"
        >
          POSTPAID
        </Button>
        <Button
          variant={activePaymentTypeTab === 'prepaid' ? 'contained' : 'outlined'}
          onClick={() => handlePaymentTypeTabChange('prepaid')}
          size="small"
          color="success"
        >
          PREPAID
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ mr: 1, flexGrow: 1 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Area</InputLabel>
          <Select
            value={areaFilter}
            label="Area"
            onChange={handleAreaFilterChange}
          >
            <MenuItem value="">All</MenuItem>
            {areas.map((area) => (
              <MenuItem key={area.id} value={area.id}>
                {area.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Delivery Agent</InputLabel>
          <Select
            value={deliveryAgentFilter}
            label="Delivery Agent"
            onChange={handleDeliveryAgentFilterChange}
          >
            <MenuItem value="">All</MenuItem>
            {deliveryAgents.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                {agent.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton color="primary">
          <SearchIcon />
        </IconButton>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Newspaper</TableCell>
                    <TableCell>Language</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>Delivery Agent</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment Type</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSubscriptions
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((subscription) => (
                      <TableRow hover key={subscription.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box>
                              {subscription.profile?.name || 'Unknown User'}
                              <Typography variant="caption" display="block" color="textSecondary">
                                Phone: {subscription.profile?.phone || 'N/A'}
                              </Typography>
                            </Box>
                            {/* Show tick mark for postpaid subscriptions */}
                            {subscription.payment_type?.toLowerCase() === 'postpaid' && (
                              <Tooltip title={subscription.payment_status === 'paid' ? 'Already Paid' : 'Mark as Paid'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleMarkPaid(subscription.id)}
                                  disabled={subscription.payment_status === 'paid'}
                                  color={subscription.payment_status === 'paid' ? 'success' : 'default'}
                                >
                                  <CheckCircleIcon 
                                    fontSize="small" 
                                    color={subscription.payment_status === 'paid' ? 'success' : 'action'}
                                  />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {subscription.newspaper?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{subscription.language}</TableCell>
                        <TableCell>
                          {subscription.area?.name || 'No Area'}
                        </TableCell>
                        <TableCell>
                          {subscription.deliveryAgent?.name || 'No Agent'}
                          {subscription.deliveryAgent?.phone && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Phone: {subscription.deliveryAgent.phone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {subscription.start_date
                            ? new Date(subscription.start_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {subscription.end_date
                            ? new Date(subscription.end_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={subscription.status || 'Unknown'} 
                            size="small" 
                            color={getStatusChipColor(subscription.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={subscription.payment_type || 'Unknown'} 
                            size="small" 
                            color={subscription.payment_type === 'prepaid' ? 'success' : 'info'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={subscription.payment_status || 'Unknown'} 
                            size="small" 
                            color={getPaymentStatusChipColor(subscription.payment_status)}
                          />
                        </TableCell>
                        <TableCell>
                          {subscription.price ? `₹${subscription.price}` : '-'}
                          {subscription.discount_percent > 0 && (
                            <Typography variant="caption" color="error" display="block">
                              {subscription.discount_percent}% off
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {/* Show completed and paid buttons only for postpaid subscriptions */}
                          {subscription.payment_type === 'postpaid' && (
                            <>
                              {subscription.status !== 'completed' && (
                                <Tooltip title="Mark as Completed">
                                  <IconButton
                                    onClick={() => handleMarkCompleted(subscription.id)}
                                    size="small"
                                    color="success"
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {subscription.payment_status !== 'paid' && (
                                <Tooltip title="Mark as Paid">
                                  <IconButton
                                    onClick={() => handleMarkPaid(subscription.id)}
                                    size="small"
                                    color="primary"
                                  >
                                    <PaymentIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenDialog(subscription)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(subscription.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredSubscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredSubscriptions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentSubscription ? 'Edit Subscription' : 'Add New Subscription'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="user-label">User</InputLabel>
              <Select
                labelId="user-label"
                name="user_id"
                value={formData.user_id}
                label="User"
                onChange={handleInputChange}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.phone})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="newspaper-label">Newspaper</InputLabel>
              <Select
                labelId="newspaper-label"
                name="newspaper_id"
                value={formData.newspaper_id}
                label="Newspaper"
                onChange={handleInputChange}
              >
                {newspapers.map((newspaper) => (
                  <MenuItem key={newspaper.id} value={newspaper.id}>
                    {newspaper.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="plan-label">Subscription Plan</InputLabel>
              <Select
                labelId="plan-label"
                name="plan_id"
                value={formData.plan_id}
                label="Subscription Plan"
                onChange={handleInputChange}
              >
                {plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    ₹{plan.price} - {plan.duration}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="language"
              label="Language"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.language}
              onChange={handleInputChange}
            />

            <FormControl fullWidth>
              <InputLabel id="area-label">Area</InputLabel>
              <Select
                labelId="area-label"
                name="area_id"
                value={formData.area_id || ''}
                label="Area"
                onChange={handleInputChange}
              >
                <MenuItem value="">Select Area</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="delivery-agent-label">Delivery Agent</InputLabel>
              <Select
                labelId="delivery-agent-label"
                name="delivery_agent_id"
                value={formData.delivery_agent_id || ''}
                label="Delivery Agent"
                onChange={handleInputChange}
              >
                <MenuItem value="">Select Delivery Agent</MenuItem>
                {deliveryAgents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="start_date"
              label="Start Date"
              type="date"
              fullWidth
              variant="outlined"
              value={formData.start_date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              name="end_date"
              label="End Date"
              type="date"
              fullWidth
              variant="outlined"
              value={formData.end_date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleInputChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="payment-status-label">Payment Status</InputLabel>
              <Select
                labelId="payment-status-label"
                name="payment_status"
                value={formData.payment_status}
                label="Payment Status"
                onChange={handleInputChange}
              >
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="payment-type-label">Payment Type</InputLabel>
              <Select
                labelId="payment-type-label"
                name="payment_type"
                value={formData.payment_type}
                label="Payment Type"
                onChange={handleInputChange}
              >
                <MenuItem value="prepaid">Prepaid</MenuItem>
                <MenuItem value="postpaid">Postpaid</MenuItem>
              </Select>
            </FormControl>

            <TextField
              name="price"
              label="Price"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.price}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />

            <TextField
              name="coupon_code"
              label="Coupon Code"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.coupon_code}
              onChange={handleInputChange}
            />

            <TextField
              name="discount_percent"
              label="Discount Percentage"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.discount_percent}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />

            <TextField
              name="delivery_address"
              label="Delivery Address"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.delivery_address}
              onChange={handleInputChange}
              multiline
              rows={3}
              sx={{ gridColumn: '1 / span 2' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionsList;