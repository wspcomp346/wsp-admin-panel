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

const AreasList = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentArea, setCurrentArea] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    active: true,
  });

  const fetchAreas = async () => {
    setLoading(true);
    try {
      let query = supabase.from('areas').select('*');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error('Error loading areas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
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

  const handleOpenDialog = (area = null) => {
    if (area) {
      setCurrentArea(area);
      setFormData({
        name: area.name || '',
        code: area.code || '',
        active: area.active,
      });
    } else {
      setCurrentArea(null);
      setFormData({
        name: '',
        code: '',
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
      // Validate form data
      if (!formData.name.trim()) {
        alert('Area name is required');
        return;
      }
      if (!formData.code.trim()) {
        alert('Area code is required');
        return;
      }

      if (currentArea) {
        // Update existing area
        const { error } = await supabase
          .from('areas')
          .update({
            name: formData.name.trim(),
            code: formData.code.trim(),
            active: formData.active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentArea.id);

        if (error) {
          console.error('Update error:', error);
          alert(`Error updating area: ${error.message}`);
          return;
        }
        alert('Area updated successfully!');
      } else {
        // Create new area
        const { error } = await supabase.from('areas').insert([
          {
            name: formData.name.trim(),
            code: formData.code.trim(),
            active: formData.active,
          },
        ]);

        if (error) {
          console.error('Insert error:', error);
          alert(`Error creating area: ${error.message}`);
          return;
        }
        alert('Area created successfully!');
      }

      fetchAreas();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving area:', error);
      alert(`Unexpected error: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this area?')) {
      try {
        const { error } = await supabase.from('areas').delete().eq('id', id);

        if (error) {
          console.error('Delete error:', error);
          alert(`Error deleting area: ${error.message}`);
          return;
        }
        alert('Area deleted successfully!');
        fetchAreas();
      } catch (error) {
        console.error('Error deleting area:', error);
        alert(`Unexpected error: ${error.message}`);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('areas')
        .update({ 
          active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchAreas();
    } catch (error) {
      console.error('Error updating area status:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Areas
        </Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add New Area
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Search by name or code"
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
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Updated At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {areas
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((area) => (
                      <TableRow hover key={area.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {area.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {area.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={area.active ? 'Active' : 'Inactive'} 
                            color={area.active ? 'success' : 'default'}
                            size="small"
                            onClick={() => handleToggleActive(area.id, area.active)}
                            sx={{ cursor: 'pointer' }}
                          />
                        </TableCell>
                        <TableCell>
                          {area.created_at ? new Date(area.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {area.updated_at ? new Date(area.updated_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenDialog(area)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(area.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {areas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No areas found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={areas.length}
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
          {currentArea ? 'Edit Area' : 'Add New Area'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Area Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            name="code"
            label="Area Code"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.code}
            onChange={handleInputChange}
            sx={{ mt: 2 }}
            helperText="Unique code for the area"
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
            {currentArea ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AreasList;