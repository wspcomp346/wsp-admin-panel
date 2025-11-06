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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const NewspapersList = () => {
  const [newspapers, setNewspapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentNewspaper, setCurrentNewspaper] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    language: '',
    price: '',
    description: ''
  });

  const fetchNewspapers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('newspaper').select('*');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,language.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setNewspapers(data || []);
    } catch (error) {
      console.error('Error fetching newspapers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewspapers();
  }, [searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleEdit = (newspaper) => {
    setCurrentNewspaper(newspaper);
    setFormData({
      name: newspaper.name || '',
      language: newspaper.language || '',
      price: newspaper.price || '',
      description: newspaper.description || ''
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this newspaper?')) {
      try {
        const { error } = await supabase.from('newspaper').delete().eq('id', id);
        if (error) throw error;
        fetchNewspapers();
      } catch (error) {
        console.error('Error deleting newspaper:', error);
      }
    }
  };

  const handleAdd = () => {
    setCurrentNewspaper(null);
    setFormData({
      name: '',
      language: '',
      price: '',
      description: ''
    });
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

      if (currentNewspaper) {
        // Update existing newspaper
        const { error } = await supabase
          .from('newspaper')
          .update(dataToSubmit)
          .eq('id', currentNewspaper.id);

        if (error) throw error;
      } else {
        // Create new newspaper
        const { error } = await supabase.from('newspaper').insert([dataToSubmit]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchNewspapers();
    } catch (error) {
      console.error('Error saving newspaper:', error);
    }
  };

  const paginatedNewspapers = newspapers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Newspapers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Newspaper
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search newspapers..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Language</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell width={120}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedNewspapers.map((newspaper) => (
                    <TableRow key={newspaper.id}>
                      <TableCell>{newspaper.name || '-'}</TableCell>
                      <TableCell>{newspaper.language || '-'}</TableCell>
                      <TableCell>{newspaper.price ? `₹${newspaper.price}` : '-'}</TableCell>
                      <TableCell>{newspaper.description || '-'}</TableCell>
                      <TableCell>
                        {newspaper.created_at ? new Date(newspaper.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(newspaper)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(newspaper.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedNewspapers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No newspapers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={newspapers.length}
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
          {currentNewspaper ? 'Edit Newspaper' : 'Add New Newspaper'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Newspaper Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="language"
            label="Language"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.language}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="price"
            label="Price"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.price}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentNewspaper ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewspapersList;