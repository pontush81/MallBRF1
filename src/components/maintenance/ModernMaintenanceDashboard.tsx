import React, { useState, useMemo } from 'react';
// Optimized imports for better tree-shaking
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Fab from '@mui/material/Fab';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  Dashboard as DashboardIcon,
  ViewKanban as KanbanIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { MaintenanceTask, MaintenanceStatus } from '../../types/MaintenancePlan';
import { useMaintenanceContext } from '../../context/MaintenanceContext';
import MaintenanceTaskEditor from './MaintenanceTaskEditor';
import MaintenanceKanbanBoard from './MaintenanceKanbanBoard';
import MaintenanceCalendarView from './MaintenanceCalendarView';
import MaintenanceTaskList from './MaintenanceTaskList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`maintenance-tabpanel-${index}`}
      aria-labelledby={`maintenance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const statusConfig: Record<MaintenanceStatus, { label: string; color: 'warning' | 'info' | 'success'; bgColor: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'Pending', 
    color: 'warning', 
    bgColor: '#fff3e0', 
    icon: <ScheduleIcon fontSize="small" /> 
  },
  in_progress: { 
    label: 'In Progress', 
    color: 'info', 
    bgColor: '#e3f2fd', 
    icon: <TimeIcon fontSize="small" /> 
  },
  completed: { 
    label: 'Completed', 
    color: 'success', 
    bgColor: '#e8f5e8', 
    icon: <CheckCircleIcon fontSize="small" /> 
  },
};

const ModernMaintenanceDashboard: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useMaintenanceContext();
  const [tabValue, setTabValue] = useState(0);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Calculate analytics
  const analytics = useMemo(() => {
    const currentYearTasks = tasks.filter(task => task.year.toString() === selectedYear);
    const totalTasks = currentYearTasks.length;
    const completedTasks = currentYearTasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = currentYearTasks.filter(task => task.status === 'in_progress').length;
    const pendingTasks = currentYearTasks.filter(task => task.status === 'pending').length;
    
    // Get overdue tasks (tasks from previous months that are still pending)
    const currentMonth = new Date().getMonth();
    const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
                       'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
    
    const overdueTasks = currentYearTasks.filter(task => {
      if (task.status === 'completed') return false;
      const taskMonths = task.months.map(month => monthNames.indexOf(month));
      return taskMonths.some(monthIndex => monthIndex < currentMonth && monthIndex !== -1);
    });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Category breakdown
    const categoryStats = currentYearTasks.reduce((acc, task) => {
      const category = task.category || 'Övrigt';
      if (!acc[category]) {
        acc[category] = { total: 0, completed: 0 };
      }
      acc[category].total++;
      if (task.status === 'completed') {
        acc[category].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks: overdueTasks.length,
      completionRate,
      categoryStats
    };
  }, [tasks, selectedYear]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsEditorOpen(true);
  };

  const handleEditTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setIsEditorOpen(true);
  };

  const handleSaveTask = async (task: MaintenanceTask) => {
    if (task.id) {
      await updateTask(task.id, task);
    } else {
      await addTask(task);
    }
    setIsEditorOpen(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: MaintenanceStatus) => {
    await updateTask(taskId, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const years = Array.from(new Set(tasks.map(task => task.year))).sort((a, b) => b - a);

  // Dashboard view with analytics cards
  const DashboardView = () => (
    <Box>
      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Totalt Uppgifter
                  </Typography>
                  <Typography variant="h4" component="div">
                    {analytics.totalTasks}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <TaskIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Slutförandegrad
                  </Typography>
                  <Typography variant="h4" component="div">
                    {analytics.completionRate.toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.completionRate} 
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Pågående
                  </Typography>
                  <Typography variant="h4" component="div">
                    {analytics.inProgressTasks}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TimeIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Försenade
                  </Typography>
                  <Typography variant="h4" component="div" color="error.main">
                    {analytics.overdueTasks}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overdue Tasks Alert */}
      {analytics.overdueTasks > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>{analytics.overdueTasks} försenade uppgifter</strong> behöver omedelbar uppmärksamhet.
        </Alert>
      )}

      {/* Category Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kategori-framsteg
              </Typography>
              {Object.entries(analytics.categoryStats).map(([category, stats]) => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      {category}
                    </Typography>
                    <Typography variant="body2">
                      {stats.completed}/{stats.total}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(stats.completed / stats.total) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Snabbåtgärder
              </Typography>
              <List dense>
                <ListItem button onClick={handleAddTask}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <AddIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Lägg till uppgift"
                    secondary="Skapa underhållsuppgift"
                  />
                </ListItem>
                <Divider />
                <ListItem button onClick={() => setTabValue(2)}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                      <KanbanIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Kanban-tavla"
                    secondary="Hantera uppgiftsstatus"
                  />
                </ListItem>
                <Divider />
                <ListItem button onClick={() => setTabValue(1)}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                      <CalendarIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Kalendervy"
                    secondary="Visa schema"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Underhållsplan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Modern underhållshantering för bostadsrättsföreningar
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>År</InputLabel>
              <Select
                value={selectedYear}
                label="År"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map(year => (
                  <MenuItem key={year} value={year.toString()}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Notifieringar">
              <IconButton>
                <Badge badgeContent={analytics.overdueTasks} color="error">
                  <NotificationIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          <Tab 
            icon={<DashboardIcon />} 
            label="Översikt" 
            iconPosition="start"
          />
          <Tab 
            icon={<CalendarIcon />} 
            label="Kalendervy" 
            iconPosition="start"
          />
          <Tab 
            icon={<KanbanIcon />} 
            label="Kanban-tavla" 
            iconPosition="start"
          />
          <Tab 
            icon={<TaskIcon />} 
            label="Uppgiftslista" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <DashboardView />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <MaintenanceCalendarView
          selectedYear={selectedYear}
          onEditTask={handleEditTask}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <MaintenanceKanbanBoard
          selectedYear={selectedYear}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <MaintenanceTaskList
          selectedYear={selectedYear}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      </TabPanel>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="lägg till uppgift"
        onClick={handleAddTask}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Task Editor Dialog */}
      <MaintenanceTaskEditor
        task={editingTask}
        open={isEditorOpen}
        onSave={handleSaveTask}
        onCancel={() => setIsEditorOpen(false)}
      />
    </Container>
  );
};

export default ModernMaintenanceDashboard;