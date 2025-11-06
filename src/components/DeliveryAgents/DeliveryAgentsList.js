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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const DeliveryAgentsList = () => {
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [selectedAgentUsers, setSelectedAgentUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    area_id: '',
    active: true,
  });

  const fetchConnectedUsers = async (agentId) => {
    setLoadingUsers(true);
    try {
      // First get subscriptions for this delivery agent
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('delivery_agent_id', agentId);

      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError);
        alert(`Error fetching subscriptions: ${subscriptionsError.message}`);
        return;
      }

      if (!subscriptionsData || subscriptionsData.length === 0) {
        setSelectedAgentUsers([]);
        return;
      }

      // Extract unique, valid user IDs (filter out null/invalid values)
      const rawUserIds = subscriptionsData.map((sub) => sub.user_id);
      const userIds = [...new Set(rawUserIds.filter((id) => id && id !== 'null'))];

      if (userIds.length === 0) {
        setSelectedAgentUsers([]);
        return;
      }

      // Then fetch user profiles for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        alert(`Error fetching user profiles: ${profilesError.message}`);
        return;
      }

      setSelectedAgentUsers(profilesData || []);
    } catch (error) {
      console.error('Error fetching connected users:', error);
      alert(`Unexpected error: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleShowAgentDetails = async (agent) => {
    setCurrentAgent(agent);
    setOpenDetailsDialog(true);
    await fetchConnectedUsers(agent.id);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedAgentUsers([]);
    setCurrentAgent(null);
  };

  const fetchAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error('Error loading areas:', err);
    }
  };

  const fetchDeliveryAgents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('delivery_agents')
        .select(`
          *,
          areas:area_id (
            id,
            name,
            code
          )
        `);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setDeliveryAgents(data || []);
    } catch (err) {
      console.error('Error loading delivery agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
    fetchDeliveryAgents();
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

  const handleOpenDialog = (agent = null) => {
    if (agent) {
      setCurrentAgent(agent);
      setFormData({
        name: agent.name || '',
        code: agent.code || '',
        phone: agent.phone || '',
        area_id: agent.area_id || '',
        active: agent.active,
      });
    } else {
      setCurrentAgent(null);
      setFormData({
        name: '',
        code: '',
        phone: '',
        area_id: '',
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
        alert('Delivery agent name is required');
        return;
      }
      if (!formData.code.trim()) {
        alert('Delivery agent code is required');
        return;
      }
      if (!formData.area_id) {
        alert('Please select an area');
        return;
      }

      if (currentAgent) {
        // Update existing delivery agent
        const { error } = await supabase
          .from('delivery_agents')
          .update({
            name: formData.name.trim(),
            code: formData.code.trim(),
            phone: formData.phone.trim(),
            area_id: formData.area_id,
            active: formData.active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentAgent.id);

        if (error) {
          console.error('Update error:', error);
          alert(`Error updating delivery agent: ${error.message}`);
          return;
        }
        alert('Delivery agent updated successfully!');
      } else {
        // Create new delivery agent
        const { error } = await supabase.from('delivery_agents').insert([
          {
            name: formData.name.trim(),
            code: formData.code.trim(),
            phone: formData.phone.trim(),
            area_id: formData.area_id,
            active: formData.active,
          },
        ]);

        if (error) {
          console.error('Insert error:', error);
          alert(`Error creating delivery agent: ${error.message}`);
          return;
        }
        alert('Delivery agent created successfully!');
      }

      fetchDeliveryAgents();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving delivery agent:', error);
      alert(`Unexpected error: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery agent?')) {
      try {
        const { error } = await supabase.from('delivery_agents').delete().eq('id', id);

        if (error) {
          console.error('Delete error:', error);
          alert(`Error deleting delivery agent: ${error.message}`);
          return;
        }
        alert('Delivery agent deleted successfully!');
        fetchDeliveryAgents();
      } catch (error) {
        console.error('Error deleting delivery agent:', error);
        alert(`Unexpected error: ${error.message}`);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('delivery_agents')
        .update({ 
          active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchDeliveryAgents();
    } catch (error) {
      console.error('Error updating delivery agent status:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Delivery Agents
        </Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add New Delivery Agent
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Search by name, code, or phone"
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
                    <TableCell>Phone</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Updated At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveryAgents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((agent) => (
                      <TableRow hover key={agent.id}>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              cursor: 'pointer', 
                              color: 'primary.main',
                              textDecoration: 'underline',
                              '&:hover': {
                                color: 'primary.dark'
                              }
                            }}
                            onClick={() => handleShowAgentDetails(agent)}
                          >
                            {agent.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {agent.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {agent.phone || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {agent.areas ? `${agent.areas.name} (${agent.areas.code})` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={agent.active ? 'Active' : 'Inactive'} 
                            color={agent.active ? 'success' : 'default'}
                            size="small"
                            onClick={() => handleToggleActive(agent.id, agent.active)}
                            sx={{ cursor: 'pointer' }}
                          />
                        </TableCell>
                        <TableCell>
                          {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {agent.updated_at ? new Date(agent.updated_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleOpenDialog(agent)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(agent.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {deliveryAgents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No delivery agents found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={deliveryAgents.length}
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
          {currentAgent ? 'Edit Delivery Agent' : 'Add New Delivery Agent'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Agent Name"
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
            label="Agent Code"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.code}
            onChange={handleInputChange}
            sx={{ mt: 2 }}
            helperText="Unique code for the delivery agent"
          />
          <TextField
            margin="dense"
            name="phone"
            label="Phone Number"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.phone}
            onChange={handleInputChange}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Area</InputLabel>
            <Select
              name="area_id"
              value={formData.area_id}
              onChange={handleInputChange}
              label="Area"
            >
              {areas.map((area) => (
                <MenuItem key={area.id} value={area.id}>
                  {area.name} ({area.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
            {currentAgent ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
       </Dialog>

       {/* Agent Details Dialog */}
       <Dialog 
         open={openDetailsDialog} 
         onClose={handleCloseDetailsDialog} 
         maxWidth="md" 
         fullWidth
       >
         <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <Box sx={{ display: 'flex', alignItems: 'center' }}>
             <PeopleIcon sx={{ mr: 1 }} />
             Connected Users - {currentAgent?.name}
           </Box>
           <IconButton onClick={handleCloseDetailsDialog} size="small">
             <CloseIcon />
           </IconButton>
         </DialogTitle>
         <DialogContent>
           {currentAgent && (
             <Box sx={{ mb: 2 }}>
               <Typography variant="h6" gutterBottom>
                 Delivery Agent Information
               </Typography>
               <Typography variant="body2" color="textSecondary">
                 <strong>Code:</strong> {currentAgent.code}
               </Typography>
               <Typography variant="body2" color="textSecondary">
                 <strong>Phone:</strong> {currentAgent.phone || 'N/A'}
               </Typography>
               <Typography variant="body2" color="textSecondary">
                 <strong>Area:</strong> {currentAgent.areas ? `${currentAgent.areas.name} (${currentAgent.areas.code})` : 'N/A'}
               </Typography>
               <Typography variant="body2" color="textSecondary">
                 <strong>Status:</strong> {currentAgent.active ? 'Active' : 'Inactive'}
               </Typography>
             </Box>
           )}
           
           <Divider sx={{ my: 2 }} />
           
           <Typography variant="h6" gutterBottom>
             Connected Users ({selectedAgentUsers.length})
           </Typography>
           
           {loadingUsers ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
               <CircularProgress />
             </Box>
           ) : selectedAgentUsers.length > 0 ? (
             <List>
               {selectedAgentUsers.map((user, index) => (
                 <React.Fragment key={user.id}>
                   <ListItem>
                     <ListItemText
                       primary={user.name || 'Unknown User'}
                       secondary={`Phone: ${user.phone || 'N/A'}`}
                     />
                   </ListItem>
                   {index < selectedAgentUsers.length - 1 && <Divider />}
                 </React.Fragment>
               ))}
             </List>
           ) : (
             <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
               No users connected to this delivery agent
             </Typography>
           )}
         </DialogContent>
         <DialogActions>
           <Button onClick={handleCloseDetailsDialog}>Close</Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };

 export default DeliveryAgentsList;