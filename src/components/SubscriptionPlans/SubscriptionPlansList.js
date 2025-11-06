import React, { useEffect, useState, useCallback } from 'react';
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
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const SubscriptionPlansList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [formData, setFormData] = useState({
    price: '',
    duration: '',
    discount: '',
  });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('subscription_plans').select('*');

      if (searchTerm) {
        query = query.or(`duration.ilike.%${searchTerm}%,discount.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

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

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setCurrentPlan(plan);
      setFormData({
        price: plan.price || '',
        duration: plan.duration || '',
        discount: plan.discount || '',
      });
    } else {
      setCurrentPlan(null);
      setFormData({
        price: '',
        duration: '',
        discount: '',
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
      [name]: name === 'price' ? (value === '' ? '' : parseFloat(value)) : value,
    });
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        price: formData.price === '' ? null : parseFloat(formData.price),
      };

      if (currentPlan) {
        // Update existing plan
        const { error } = await supabase
          .from('subscription_plans')
          .update(dataToSubmit)
          .eq('id', currentPlan.id);

        if (error) throw error;
      } else {
        // Create new plan
        const { error } = await supabase.from('subscription_plans').insert([dataToSubmit]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchPlans();
    } catch (error) {
      console.error('Error saving subscription plan:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      try {
        const { error } = await supabase.from('subscription_plans').delete().eq('id', id);

        if (error) throw error;
        fetchPlans();
      } catch (error) {
        console.error('Error deleting subscription plan:', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Subscription Plans
        </Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add New Plan
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
                    <TableCell>Price</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plans
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((plan) => (
                      <TableRow hover key={plan.id}>
                        <TableCell>₹{plan.price}</TableCell>
                        <TableCell>{plan.duration}</TableCell>
                        <TableCell>{plan.discount || '-'}</TableCell>
                        <TableCell>
                          {new Date(plan.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenDialog(plan)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(plan.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {plans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No subscription plans found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={plans.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentPlan ? 'Edit Subscription Plan' : 'Add New Subscription Plan'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="price"
            label="Price"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.price}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
          <TextField
            margin="dense"
            name="duration"
            label="Duration (e.g., '1 Month', '3 Months', '1 Year')"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.duration}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="discount"
            label="Discount (e.g., '10% off', 'Buy 1 Get 1 Free')"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.discount}
            onChange={handleInputChange}
          />
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

export default SubscriptionPlansList;