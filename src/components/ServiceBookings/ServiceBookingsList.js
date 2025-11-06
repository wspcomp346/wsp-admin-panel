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
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const ServiceBookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    service_id: '',
    date: '',
    time_slot: '',
    message: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('service_bookings')
        .select(`
          *,
          service:service_id(id, name)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Bookings fetch error:', bookingsError);
        alert(`Error fetching bookings: ${bookingsError.message}`);
      }

      // Fetch services for dropdown
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name');

      if (servicesError) {
        console.error('Services fetch error:', servicesError);
        alert(`Error fetching services: ${servicesError.message}`);
      }

      // Fetch users from profiles table instead of auth.users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone');

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
      }

      // Process bookings to include user profile data
      const processedBookings = bookingsData?.map(booking => {
        const profile = profilesData?.find(p => p.id === booking.user_id);
        return {
          ...booking,
          user: profile ? { id: profile.id, name: profile.name, phone: profile.phone } : null
        };
      }) || [];

      setBookings(processedBookings);
      setServices(servicesData || []);
      setUsers(profilesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (booking = null) => {
    setCurrentBooking(booking);
    setFormData({
      user_id: booking?.user_id || '',
      service_id: booking?.service_id || '',
      date: booking?.date || '',
      time_slot: booking?.time_slot || '',
      message: booking?.message || '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentBooking(null);
    setFormData({
      user_id: '',
      service_id: '',
      date: '',
      time_slot: '',
      message: '',
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.user_id?.trim()) {
        alert('Please select a user');
        return;
      }
      if (!formData.service_id?.trim()) {
        alert('Please select a service');
        return;
      }
      if (!formData.date?.trim()) {
        alert('Please enter a date');
        return;
      }

      const dataToSubmit = {
        user_id: formData.user_id,
        service_id: formData.service_id,
        date: formData.date,
        time_slot: formData.time_slot,
        message: formData.message,
      };

      if (currentBooking) {
        const { error } = await supabase
          .from('service_bookings')
          .update(dataToSubmit)
          .eq('id', currentBooking.id);

        if (error) throw error;
        alert('Service booking updated successfully!');
      } else {
        const { error } = await supabase
          .from('service_bookings')
          .insert([dataToSubmit]);

        if (error) throw error;
        alert('Service booking created successfully!');
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving booking:', error);
      alert(`Error saving booking: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const { error } = await supabase
          .from('service_bookings')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Delete error:', error);
          alert(`Error deleting booking: ${error.message}`);
          return;
        }

        alert('Service booking deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Unexpected error during deletion:', error);
        alert(`Unexpected error: ${error.message}`);
      }
    }
  };

  const handleStatusToggle = async (bookingId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Status update error:', error);
        alert(`Error updating status: ${error.message}`);
        return;
      }

      // Refresh the data to show updated status
      fetchData();
    } catch (error) {
      console.error('Unexpected error during status update:', error);
      alert(`Unexpected error: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredBookings = bookings.filter(booking =>
    booking.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.user?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.date?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Service Bookings
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Add New Booking
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
                    <TableCell>Service</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time Slot</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBookings
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((booking) => (
                      <TableRow hover key={booking.id}>
                        <TableCell>
                          {booking.user?.name || 'Unknown User'}
                          <Typography variant="caption" display="block" color="textSecondary">
                            Phone: {booking.user?.phone || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {booking.service?.name || 'Unknown Service'}
                        </TableCell>
                        <TableCell>{booking.date || 'N/A'}</TableCell>
                        <TableCell>{booking.time_slot || 'N/A'}</TableCell>
                        <TableCell>
                          {booking.message ? (
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {booking.message}
                            </Typography>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={booking.status || 'pending'}
                            color={booking.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                            icon={booking.status === 'completed' ? <CheckCircleIcon /> : <CancelIcon />}
                          />
                        </TableCell>
                        <TableCell>{formatDate(booking.created_at)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={booking.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}>
                            <IconButton
                              onClick={() => handleStatusToggle(booking.id, booking.status || 'pending')}
                              size="small"
                              color={booking.status === 'completed' ? 'warning' : 'success'}
                            >
                              {booking.status === 'completed' ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View">
                            <IconButton
                              onClick={() => handleOpenDialog(booking)}
                              size="small"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenDialog(booking)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(booking.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredBookings.length}
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
          {currentBooking ? 'Edit Booking' : 'Add New Booking'}
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
              <InputLabel id="service-label">Service</InputLabel>
              <Select
                labelId="service-label"
                name="service_id"
                value={formData.service_id}
                label="Service"
                onChange={handleInputChange}
              >
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="date"
              label="Date"
              type="date"
              fullWidth
              variant="outlined"
              value={formData.date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              name="time_slot"
              label="Time Slot"
              type="time"
              fullWidth
              variant="outlined"
              value={formData.time_slot}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          
          <TextField
            name="message"
            label="Message"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            value={formData.message}
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

export default ServiceBookingsList;