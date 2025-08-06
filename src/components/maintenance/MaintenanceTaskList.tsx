import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Paper,
  Collapse,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Done as CompleteIcon
} from '@mui/icons-material';
import { MaintenanceTask, MaintenanceStatus } from '../../types/MaintenancePlan';
import { useMaintenanceContext } from '../../context/MaintenanceContext';
import { maintenanceCategoriesData } from '../../data/maintenanceTasksData';

interface TaskCardProps {
  task: MaintenanceTask;
  onEdit: (task: MaintenanceTask) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: MaintenanceStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);

  const isOverdue = useMemo(() => {
    if (task.status === 'completed') return false;
    const currentMonth = new Date().getMonth();
    const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
                       'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
    
    const taskMonths = task.months.map(month => monthNames.indexOf(month));
    return taskMonths.some(monthIndex => monthIndex < currentMonth && monthIndex !== -1);
  }, [task]);

  const statusConfig = {
    pending: { color: '#ff9800', bgColor: '#fff3e0', icon: <ScheduleIcon />, label: 'Pending' },
    in_progress: { color: '#2196f3', bgColor: '#e3f2fd', icon: <TimeIcon />, label: 'In Progress' },
    completed: { color: '#4caf50', bgColor: '#e8f5e8', icon: <CheckCircleIcon />, label: 'Completed' }
  };

  const status = statusConfig[task.status];

  const handleStatusChange = (newStatus: MaintenanceStatus) => {
    onStatusChange(task.id, newStatus);
  };

  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 2, 
        border: isOverdue ? '2px solid #f44336' : 'none',
        position: 'relative',
        '&:hover': { elevation: 4 }
      }}
    >
      {isOverdue && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: '#f44336'
          }}
        />
      )}

      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Avatar
                sx={{
                  bgcolor: status.color,
                  width: 32,
                  height: 32
                }}
              >
                {React.cloneElement(status.icon, { fontSize: 'small' })}
              </Avatar>
              
              <Typography variant="h6" component="h3">
                {task.task}
              </Typography>
              
              {isOverdue && (
                <Badge badgeContent="!" color="error">
                  <WarningIcon color="error" fontSize="small" />
                </Badge>
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {task.description}
            </Typography>
          </Box>

          <IconButton
            onClick={() => setExpanded(!expanded)}
            aria-label="expand"
            size="small"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Tags and Info */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
          <Chip
            icon={<CategoryIcon />}
            label={task.category || 'Övrigt'}
            size="small"
            variant="outlined"
            color="primary"
          />
          
          <Chip
            icon={<PersonIcon />}
            label={task.responsible}
            size="small"
            variant="outlined"
            color="secondary"
          />

          <Chip
            icon={<ScheduleIcon />}
            label={task.months.join(', ')}
            size="small"
            variant="outlined"
          />

          <Chip
            label={task.year.toString()}
            size="small"
            variant="outlined"
          />

          <Chip
            icon={status.icon}
            label={status.label}
            size="small"
            sx={{
              backgroundColor: status.bgColor,
              color: status.color,
              border: `1px solid ${status.color}`
            }}
          />
        </Stack>

        {/* Expanded Content */}
        <Collapse in={expanded}>
          <Divider sx={{ mb: 2 }} />
          
          {task.comments && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Comments:
              </Typography>
              <Typography variant="body2">
                {task.comments}
              </Typography>
            </Box>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(task.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Updated: {new Date(task.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>

          {/* Status Change Buttons */}
          <Box display="flex" gap={1} mb={2}>
            {task.status !== 'pending' && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={() => handleStatusChange('pending')}
              >
                Mark Pending
              </Button>
            )}
            
            {task.status !== 'in_progress' && (
              <Button
                size="small"
                variant="outlined"
                color="info"
                startIcon={<StartIcon />}
                onClick={() => handleStatusChange('in_progress')}
              >
                Start Task
              </Button>
            )}
            
            {task.status !== 'completed' && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<CompleteIcon />}
                onClick={() => handleStatusChange('completed')}
              >
                Complete
              </Button>
            )}
          </Box>
        </Collapse>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Edit Task">
            <IconButton onClick={() => onEdit(task)} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete Task">
            <IconButton 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  onDelete(task.id);
                }
              }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

interface MaintenanceTaskListProps {
  selectedYear: string;
  onEditTask: (task: MaintenanceTask) => void;
  onDeleteTask: (taskId: string) => void;
}

const MaintenanceTaskList: React.FC<MaintenanceTaskListProps> = ({
  selectedYear,
  onEditTask,
  onDeleteTask
}) => {
  const { tasks, updateTask } = useMaintenanceContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => task.year.toString() === selectedYear);

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.task.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search) ||
        task.category?.toLowerCase().includes(search) ||
        task.responsible.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    if (responsibleFilter !== 'all') {
      filtered = filtered.filter(task => task.responsible === responsibleFilter);
    }

    return filtered;
  }, [tasks, selectedYear, searchTerm, statusFilter, categoryFilter, responsibleFilter]);

  const responsibleOptions = useMemo(() => {
    const responsible = Array.from(new Set(tasks.map(task => task.responsible)));
    return responsible.sort();
  }, [tasks]);

  const handleStatusChange = async (taskId: string, newStatus: MaintenanceStatus) => {
    await updateTask(taskId, { 
      status: newStatus, 
      updatedAt: new Date().toISOString() 
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setResponsibleFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || responsibleFilter !== 'all';

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Task List - {selectedYear} ({filteredTasks.length} tasks)
        </Typography>
        
        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            onClick={clearFilters}
            startIcon={<FilterIcon />}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {maintenanceCategoriesData.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Responsible</InputLabel>
              <Select
                value={responsibleFilter}
                label="Responsible"
                onChange={(e) => setResponsibleFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {responsibleOptions.map(responsible => (
                  <MenuItem key={responsible} value={responsible}>
                    {responsible}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Task Cards */}
      {filteredTasks.length > 0 ? (
        <Box>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={handleStatusChange}
            />
          ))}
        </Box>
      ) : (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasActiveFilters 
              ? 'Try adjusting your filters or search terms'
              : 'No maintenance tasks for the selected year'
            }
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MaintenanceTaskList;