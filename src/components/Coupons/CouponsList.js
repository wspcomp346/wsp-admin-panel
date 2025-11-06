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
  Switch,
  FormControlLabel,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const CouponsList = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    active: true,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      let query = supabase.from('coupons').select('*');

      if (searchTerm) {
        query = query.ilike('code', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [searchTerm]);

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

  const handleOpenDialog = (coupon = null) => {
    if (coupon) {
      setCurrentCoupon(coupon);
      setFormData({
        code: coupon.code || '',
        discount_percent: coupon.discount_percent || '',
        active: coupon.active,
      });
    } else {
      setCurrentCoupon(null);
      setFormData({
        code: '',
        discount_percent: '',
        active: true,
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
      [name]: name === 'discount_percent' ? (value === '' ? '' : parseFloat(value)) : value,
    });
  };

  const handleSwitchChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked,
    });
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        discount_percent: parseFloat(formData.discount_percent),
      };

      if (currentCoupon) {
        // Update existing coupon
        const { error } = await supabase
          .from('coupons')
          .update(dataToSubmit)
          .eq('id', currentCoupon.id);

        if (error) throw error;
      } else {
        // Create new coupon
        const { error } = await supabase.from('coupons').insert([dataToSubmit]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        const { error } = await supabase.from('coupons').delete().eq('id', id);

        if (error) throw error;
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon status:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Coupons
        </Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add New Coupon
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Search by code"
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
                    <TableCell>Code</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coupons
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((coupon) => (
                      <TableRow hover key={coupon.id}>
                        <TableCell>
                          <Typography fontWeight="bold" fontFamily="monospace">
                            {coupon.code}
                          </Typography>
                        </TableCell>
                        <TableCell>{coupon.discount_percent}%</TableCell>
                        <TableCell>
                          <Chip 
                            label={coupon.active ? 'Active' : 'Inactive'} 
                            color={coupon.active ? 'success' : 'default'}
                            size="small"
                            onClick={() => handleToggleActive(coupon.id, coupon.active)}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(coupon.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenDialog(coupon)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(coupon.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {coupons.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No coupons found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={coupons.length}
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
          {currentCoupon ? 'Edit Coupon' : 'Add New Coupon'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="code"
            label="Coupon Code"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.code}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            helperText="Coupon code must be unique"
          />
          <TextField
            margin="dense"
            name="discount_percent"
            label="Discount Percentage"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.discount_percent}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.active}
                onChange={handleSwitchChange}
                name="active"
                color="primary"
              />
            }
            label="Active"
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

export default CouponsList;