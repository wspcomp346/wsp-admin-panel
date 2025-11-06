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
  InputAdornment,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const HomeAnnouncementList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    message: '',
    active: true,
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      let query = supabase.from('home_announcement').select('*');

      if (searchTerm) {
        query = query.ilike('message', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error loading home_announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
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

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setCurrentAnnouncement(announcement);
      setFormData({
        message: announcement.message || '',
        active: announcement.active,
      });
    } else {
      setCurrentAnnouncement(null);
      setFormData({
        message: '',
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
      [name]: value,
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
      if (currentAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('home_announcement')
          .update(formData)
          .eq('id', currentAnnouncement.id);

        if (error) throw error;
      } else {
        // Create new announcement
        const { error } = await supabase.from('home_announcement').insert([formData]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const { error } = await supabase.from('home_announcement').delete().eq('id', id);

        if (error) throw error;
        fetchAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('home_announcement')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement status:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Home Announcements
        </Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add New Announcement
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Search by message"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ mr: 1, flexGrow: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
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
                    <TableCell>Message</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Updated At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {announcements
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((announcement) => (
                      <TableRow hover key={announcement.id}>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 400, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {announcement.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={announcement.active ? 'Active' : 'Inactive'} 
                            color={announcement.active ? 'success' : 'default'}
                            size="small"
                            onClick={() => handleToggleActive(announcement.id, announcement.active)}
                            sx={{ cursor: 'pointer' }}
                          />
                        </TableCell>
                        <TableCell>
                          {announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {announcement.updated_at ? new Date(announcement.updated_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenDialog(announcement)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(announcement.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {announcements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No announcements found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={announcements.length}
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
          {currentAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="message"
            label="Message"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={formData.message}
            onChange={handleInputChange}
            sx={{ mt: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                name="active"
                checked={formData.active}
                onChange={handleSwitchChange}
                color="primary"
              />
            }
            label="Active"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentAnnouncement ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomeAnnouncementList;