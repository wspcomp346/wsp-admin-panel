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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    subscription_id: '',
    amount: '',
    status: 'pending',
    method: '',
    transaction_id: '',
    description: '',
    payment_method: '',
    paid_at: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch payments without embedded relationships
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      // Fetch users for dropdown and joining
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, phone');

      if (usersError) throw usersError;

      // Fetch subscriptions for dropdown and joining
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('id, newspaper_id');

      if (subscriptionsError) throw subscriptionsError;

      // Fetch newspapers for joining
      const { data: newspapersData, error: newspapersError } = await supabase
        .from('newspaper')
        .select('id, name');

      if (newspapersError) throw newspapersError;

      // Process payments to include user profile and subscription data
      const processedPayments = paymentsData?.map(payment => {
        const profile = usersData?.find(u => u.id === payment.user_id);
        const subscription = subscriptionsData?.find(s => s.id === payment.subscription_id);
        const newspaper = subscription ? newspapersData?.find(n => n.id === subscription.newspaper_id) : null;
        return {
          ...payment,
          profiles: profile || null,
          subscription: subscription ? {
            ...subscription,
            newspaper: newspaper || null
          } : null
        };
      }) || [];

      setPayments(processedPayments);
      setUsers(usersData || []);
      setSubscriptions(subscriptionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (payment.transaction_id && payment.transaction_id.toLowerCase().includes(searchLower)) ||
      (payment.status && payment.status.toLowerCase().includes(searchLower)) ||
      (payment.method && payment.method.toLowerCase().includes(searchLower)) ||
      (payment.profiles && payment.profiles.name && 
        payment.profiles.name.toLowerCase().includes(searchLower))
    );
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

  const handleOpenDialog = (payment = null) => {
    if (payment) {
      setCurrentPayment(payment);
      setFormData({
        user_id: payment.user_id || '',
        subscription_id: payment.subscription_id || '',
        amount: payment.amount || '',
        status: payment.status || 'pending',
        method: payment.method || '',
        transaction_id: payment.transaction_id || '',
        description: payment.description || '',
        payment_method: payment.payment_method || '',
      });
    } else {
      setCurrentPayment(null);
      setFormData({
        user_id: '',
        subscription_id: '',
        amount: '',
        status: 'pending',
        method: '',
        transaction_id: '',
        description: '',
        payment_method: '',
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
      [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value)) : value,
    });
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        amount: parseFloat(formData.amount),
        paid_at: new Date().toISOString(),
      };

      if (currentPayment) {
        // Update existing payment
        const { error } = await supabase
          .from('payments')
          .update(dataToSubmit)
          .eq('id', currentPayment.id);

        if (error) throw error;
      } else {
        // Create new payment
        const { error } = await supabase.from('payments').insert([{
          ...dataToSubmit,
          id: crypto.randomUUID(), // Generate UUID for the id field
        }]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        const { error } = await supabase.from('payments').delete().eq('id', id);

        if (error) throw error;
        fetchData();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const getStatusChipColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
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
          Payments
        </Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add New Payment
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ mr: 1, flexGrow: 1 }}
        />
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
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((payment) => (
                      <TableRow hover key={payment.id}>
                        <TableCell>
                          {payment.profiles?.name || 'Unknown'}
                          {payment.profiles?.phone && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              {payment.profiles.phone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>₹{payment.amount}</TableCell>
                        <TableCell>
                          <Chip 
                            label={payment.status || 'Unknown'} 
                            size="small" 
                            color={getStatusChipColor(payment.status)}
                          />
                        </TableCell>
                        <TableCell>{payment.payment_method || payment.method || '-'}</TableCell>
                        <TableCell>
                          {payment.transaction_id ? (
                            <Typography variant="body2" fontFamily="monospace">
                              {payment.transaction_id.substring(0, 12)}...
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.paid_at
                            ? new Date(payment.paid_at).toLocaleDateString()
                            : new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View">
                            <IconButton
                              onClick={() => handleOpenDialog(payment)}
                              size="small"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenDialog(payment)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(payment.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No payments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredPayments.length}
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
          {currentPayment ? 'Edit Payment' : 'Add New Payment'}
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
              <InputLabel id="subscription-label">Subscription</InputLabel>
              <Select
                labelId="subscription-label"
                name="subscription_id"
                value={formData.subscription_id}
                label="Subscription"
                onChange={handleInputChange}
              >
                {subscriptions.map((subscription) => (
                  <MenuItem key={subscription.id} value={subscription.id}>
                    {subscription.newspaper?.name || 'Unknown Newspaper'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="amount"
              label="Amount"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.amount}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
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
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              name="payment_method"
              label="Payment Method"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.payment_method}
              onChange={handleInputChange}
              placeholder="e.g., Credit Card, UPI, Cash"
            />

            <TextField
              name="transaction_id"
              label="Transaction ID"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.transaction_id}
              onChange={handleInputChange}
            />

            <TextField
              name="paid_at"
              label="Paid At"
              type="datetime-local"
              fullWidth
              variant="outlined"
              value={formData.paid_at}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              name="description"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.description}
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

export default PaymentsList;