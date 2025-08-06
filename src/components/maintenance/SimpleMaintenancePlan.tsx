import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Checkbox,
  TextField,
  Button,
  Divider,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Photo as PhotoIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import {
  MaintenanceTask,
  MajorProject,
  getMaintenanceTasksByYear,
  getMajorProjects,
  saveMaintenanceTask,
  saveMajorProject,
  deleteMaintenanceTask,
  deleteMajorProject,
  createAnnualMaintenancePlan,
  uploadProjectDocument,
  getProjectDocuments,
  deleteProjectDocument
} from '../../services/maintenanceService';





const CATEGORY_LABELS = {
  spring: 'Vår',
  summer: 'Sommar', 
  autumn: 'Höst',
  winter: 'Vinter',
  ongoing: 'Löpande'
};

const CATEGORY_COLORS = {
  spring: '#4caf50',
  summer: '#ff9800',
  autumn: '#f44336', 
  winter: '#2196f3',
  ongoing: '#9c27b0'
};

const SimpleMaintenancePlan: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [majorProjects, setMajorProjects] = useState<MajorProject[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [newProjectDialog, setNewProjectDialog] = useState(false);
  const [newProject, setNewProject] = useState<Partial<MajorProject>>({});
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState<Partial<MaintenanceTask>>({});
  const [editTaskDialog, setEditTaskDialog] = useState(false);
  const [editTask, setEditTask] = useState<Partial<MaintenanceTask>>({});
  const [editProjectDialog, setEditProjectDialog] = useState(false);
  const [editProject, setEditProject] = useState<Partial<MajorProject>>({});
  const [projectDocuments, setProjectDocuments] = useState<any[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [sortBy, setSortBy] = useState<'category' | 'due_date' | 'status' | 'name' | 'created_at'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ladda eller skapa årets underhållslista
  useEffect(() => {
    loadMaintenanceData();
  }, [selectedYear]);

  const loadMaintenanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ladda underhållsuppgifter för valt år
      const existingTasks = await getMaintenanceTasksByYear(selectedYear);
      
      if (existingTasks.length === 0) {
        // Skapa ny årlig underhållsplan om ingen finns
        const newTasks = await createAnnualMaintenancePlan(selectedYear);
        setTasks(newTasks);
      } else {
        setTasks(existingTasks);
      }

      // Ladda större projekt
      const projects = await getMajorProjects();
      setMajorProjects(projects);
      
    } catch (err) {
      setError('Kunde inte ladda underhållsdata. Försök igen senare.');
      console.error('Error loading maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    const isCompleted = !taskToUpdate.completed;
    const updatedTask = {
      ...taskToUpdate,
      completed: isCompleted,
      completed_date: isCompleted ? new Date().toISOString().split('T')[0] : undefined
    };

    // Uppdatera lokalt state omedelbart för bättre UX
    setTasks(tasks.map(task => 
      task.id === taskId ? updatedTask : task
    ));

    // Spara till Supabase
    await saveMaintenanceTask(updatedTask);
  };

  const handleTaskNoteChange = async (taskId: string, notes: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    const updatedTask = { ...taskToUpdate, notes };
    
    // Uppdatera lokalt state
    setTasks(tasks.map(task => 
      task.id === taskId ? updatedTask : task
    ));

    // Spara till Supabase (med debounce skulle vara bättre i produktion)
    await saveMaintenanceTask(updatedTask);
  };

  const handleAddMajorProject = async () => {
    if (!newProject.name || !newProject.estimated_year) return;
    
    const project: Partial<MajorProject> = {
      id: `project_${Date.now()}`,
      name: newProject.name,
      description: newProject.description || '',
      estimated_year: newProject.estimated_year,
      estimated_cost: newProject.estimated_cost,
      priority: newProject.priority || 'medium',
      category: newProject.category,
      approval_status: newProject.approval_status || 'pending',
      contractor: newProject.contractor,
      status: 'planned'
    };

    // Spara till Supabase
    const savedProject = await saveMajorProject(project);
    if (savedProject) {
      setMajorProjects([...majorProjects, savedProject]);
    }
    
    setNewProjectDialog(false);
    setNewProject({});
  };

  const handleAddMaintenanceTask = async () => {
    if (!newTask.name || !newTask.category) return;
    
    try {
      const task: Partial<MaintenanceTask> = {
        id: `task_${Date.now()}`,
        name: newTask.name,
        description: newTask.description || '',
        category: newTask.category,
        year: selectedYear,
        due_date: newTask.due_date || undefined,
        completed: false
      };

      console.log('🔍 Adding new task:', task);

      // Spara till Supabase
      const savedTask = await saveMaintenanceTask(task);
      if (savedTask) {
        console.log('✅ Task saved successfully:', savedTask);
        setTasks([...tasks, savedTask]);
      } else {
        console.error('❌ Failed to save task - no response from saveMaintenanceTask');
      }
      
      setNewTaskDialog(false);
      setNewTask({});
    } catch (error) {
      console.error('❌ Error adding maintenance task:', error);
    }
  };

  const handleEditTask = (task: MaintenanceTask) => {
    setEditTask(task);
    setEditTaskDialog(true);
  };

  const handleUpdateTask = async () => {
    if (!editTask.name || !editTask.category || !editTask.id) return;
    
    // Spara till Supabase
    const savedTask = await saveMaintenanceTask(editTask);
    if (savedTask) {
      setTasks(tasks.map(task => 
        task.id === savedTask.id ? savedTask : task
      ));
    }
    
    setEditTaskDialog(false);
    setEditTask({});
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Är du säker på att du vill ta bort denna uppgift?')) return;
    
    const success = await deleteMaintenanceTask(taskId);
    if (success) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const sortTasks = (tasksToSort: MaintenanceTask[]) => {
    return [...tasksToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'due_date':
          const aDate = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
          const bDate = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
          comparison = aDate.getTime() - bDate.getTime();
          break;
        case 'status':
          if (a.completed !== b.completed) {
            comparison = a.completed ? 1 : -1; // Ej klara först
          } else {
            comparison = a.name.localeCompare(b.name, 'sv');
          }
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'sv');
          break;
        case 'created_at':
          const aCreated = a.created_at ? new Date(a.created_at) : new Date(0);
          const bCreated = b.created_at ? new Date(b.created_at) : new Date(0);
          comparison = aCreated.getTime() - bCreated.getTime();
          break;
        case 'category':
        default:
          const categoryOrder = ['winter', 'spring', 'summer', 'autumn', 'ongoing'];
          comparison = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
          if (comparison === 0) {
            comparison = a.name.localeCompare(b.name, 'sv');
          }
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const getTasksByCategory = (category: keyof typeof CATEGORY_LABELS) => {
    const filteredTasks = tasks.filter(task => task.category === category);
    return sortBy === 'category' ? filteredTasks : sortTasks(filteredTasks);
  };

  const getAllTasksSorted = () => {
    return sortTasks(tasks);
  };

  // Helper functions för större projekt
  const getProjectStatusLabel = (status: string) => {
    const statusLabels = {
      'planned': 'Planerat',
      'approved': 'Godkänt', 
      'tendering': 'Upphandling',
      'in_progress': 'Pågår',
      'completed': 'Slutfört'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const getProjectCategoryLabel = (category: string) => {
    const categoryLabels = {
      'structure': 'Byggnad',
      'heating': 'Värme',
      'plumbing': 'VVS', 
      'electrical': 'El',
      'exterior': 'Exteriör',
      'interior': 'Interiör'
    };
    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  const handleEditProject = async (project: MajorProject) => {
    setEditProject(project);
    setEditProjectDialog(true);
    
    // Ladda projektdokument
    const docs = await getProjectDocuments(project.id);
    setProjectDocuments(docs);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editProject.id) return;

    try {
      setUploadingDoc(true);
      const uploadedDoc = await uploadProjectDocument(editProject.id, file);
      setProjectDocuments([...projectDocuments, uploadedDoc]);
      
      // Rensa input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentDelete = async (filePath: string) => {
    if (!window.confirm('Är du säker på att du vill ta bort detta dokument?')) return;
    
    const success = await deleteProjectDocument(filePath);
    if (success) {
      setProjectDocuments(projectDocuments.filter(doc => doc.id !== filePath));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Är du säker på att du vill ta bort detta projekt?')) return;
    
    const success = await deleteMajorProject(projectId);
    if (success) {
      setMajorProjects(majorProjects.filter(project => project.id !== projectId));
    }
  };

  const handleUpdateProject = async () => {
    if (!editProject.name || !editProject.estimated_year || !editProject.id) return;
    
    try {
      const updatedProject = await saveMajorProject(editProject);
      if (updatedProject) {
        setMajorProjects(majorProjects.map(project => 
          project.id === updatedProject.id ? updatedProject : project
        ));
      }
      
      setEditProjectDialog(false);
      setEditProject({});
    } catch (error) {
      console.error('❌ Error updating project:', error);
    }
  };

  const renderTaskItem = (task: MaintenanceTask) => (
    <ListItem key={task.id} sx={{ pl: 0, pr: 10, flexDirection: 'column', alignItems: 'stretch' }}>
      <Box display="flex" alignItems="flex-start" width="100%">
        <ListItemIcon sx={{ minWidth: '42px', mt: '9px' }}>
          <Checkbox
            checked={task.completed}
            onChange={() => handleTaskToggle(task.id)}
            color="primary"
          />
        </ListItemIcon>
        <ListItemText
          sx={{ flex: 1 }}
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography 
                sx={{ 
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? 'text.secondary' : 'text.primary'
                }}
              >
                {task.name}
              </Typography>
              {sortBy !== 'category' && (
                <Chip 
                  label={CATEGORY_LABELS[task.category]}
                  size="small"
                  sx={{ 
                    backgroundColor: CATEGORY_COLORS[task.category],
                    color: 'white',
                    height: '20px',
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Box>
          }
          secondary={
            <Box>
              {task.description && (
                <Typography variant="body2" color="text.secondary" component="span">
                  {task.description}
                </Typography>
              )}
              {task.due_date && (
                <Typography 
                  variant="caption" 
                  component="div"
                  color={
                    task.completed 
                      ? 'text.secondary' 
                      : new Date(task.due_date) < new Date() 
                        ? 'error.main' 
                        : 'text.secondary'
                  }
                  sx={{ mt: task.description ? 0.5 : 0 }}
                >
                  Förfaller: {task.due_date}
                </Typography>
              )}
              {task.completed && task.completed_date && (
                <Typography 
                  variant="caption" 
                  component="div"
                  color="success.main" 
                  sx={{ mt: 0.5 }}
                >
                  Slutfört: {task.completed_date}
                </Typography>
              )}
            </Box>
          }
        />
        <Box sx={{ display: 'flex', alignItems: 'flex-start', ml: 1 }}>
          <IconButton
            size="small"
            onClick={() => handleEditTask(task)}
            sx={{ mr: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteTask(task.id)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ ml: '42px', mr: '88px', mt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Anteckningar..."
          value={task.notes || ''}
          onChange={(e) => handleTaskNoteChange(task.id, e.target.value)}
          multiline
          rows={1}
        />
      </Box>
    </ListItem>
  );

  const getCompletionStats = () => {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getCompletionStats();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Laddar underhållsplan...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadMaintenanceData}>
          Försök igen
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Underhållsplan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enkel översikt över årets underhållsarbeten och större projekt
            </Typography>
          </Box>
          
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>År</InputLabel>
              <Select value={selectedYear} label="År" onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {availableYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Visa som</InputLabel>
              <Select value={sortBy} label="Visa som" onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <MenuItem value="category">📂 Grupperat per kategori</MenuItem>
                <MenuItem value="due_date">🗓️ Sorterat efter förfallodatum</MenuItem>
                <MenuItem value="status">✅ Sorterat efter status</MenuItem>
                <MenuItem value="name">📝 Sorterat efter namn</MenuItem>
                <MenuItem value="created_at">📅 Sorterat efter skapad</MenuItem>
              </Select>
            </FormControl>
            
{sortBy !== 'category' && (
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Ordning</InputLabel>
                <Select value={sortOrder} label="Ordning" onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
                  <MenuItem value="asc">Stigande</MenuItem>
                  <MenuItem value="desc">Fallande</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>

        {/* Progress Stats */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color="primary">
            Framsteg {selectedYear}: {stats.completed} av {stats.total} uppgifter slutförda ({stats.percentage}%)
          </Typography>
          {stats.percentage === 100 && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Fantastiskt! Alla underhållsuppgifter för {selectedYear} är slutförda!
            </Alert>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Årets Underhållschecklista */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">
                  <CheckIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Underhållschecklista {selectedYear}
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={() => setNewTaskDialog(true)}
                >
                  Lägg till uppgift
                </Button>
              </Box>
              
{sortBy === 'category' ? (
                // Kategorivy - grupperat per kategori
                Object.entries(CATEGORY_LABELS).map(([category, label]) => {
                  const categoryTasks = getTasksByCategory(category as keyof typeof CATEGORY_LABELS);
                  if (categoryTasks.length === 0) return null;

                  return (
                    <Box key={category} sx={{ mb: 3 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip 
                          label={label}
                          size="small"
                          sx={{ 
                            backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
                            color: 'white'
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {categoryTasks.filter(t => t.completed).length} av {categoryTasks.length} slutförda
                        </Typography>
                      </Box>
                      
                      <List dense>
                        {categoryTasks.map(task => renderTaskItem(task))}
                      </List>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  );
                })
              ) : (
                // Sorterad listvy - alla uppgifter i en lista
                <List dense>
                  {getAllTasksSorted().map(task => renderTaskItem(task))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Större Projekt & Historik */}
        <Grid item xs={12} lg={4}>
          {/* Större Projekt */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <BuildIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Större Projekt
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={() => setNewProjectDialog(true)}
                >
                  Lägg till
                </Button>
              </Box>

              {majorProjects.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Inga större projekt planerade än.
                </Typography>
              ) : (
                <List dense>
                  {majorProjects
                    .sort((a, b) => a.estimated_year - b.estimated_year)
                    .map(project => (
                                              <ListItem key={project.id} sx={{ pl: 0, pr: 10 }}>
                        <ListItemIcon>
                          {project.status === 'completed' ? (
                            <CheckIcon color="success" />
                          ) : project.status === 'in_progress' ? (
                            <BuildIcon color="warning" />
                          ) : project.status === 'tendering' ? (
                            <ScheduleIcon color="info" />
                          ) : project.priority === 'urgent' ? (
                            <WarningIcon color="error" />
                          ) : project.estimated_year <= currentYear ? (
                            <WarningIcon color="warning" />
                          ) : (
                            <ScheduleIcon color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1">
                                {project.name}
                              </Typography>
                              {project.priority === 'urgent' && (
                                <Chip label="AKUT" size="small" color="error" />
                              )}
                              {project.priority === 'high' && (
                                <Chip label="HÖG" size="small" color="warning" />
                              )}
                              {project.approval_status === 'agm_approved' && (
                                <Chip label="✅ Årsstämma" size="small" color="success" />
                              )}
                              {project.approval_status === 'board_approved' && (
                                <Chip label="✅ Styrelse" size="small" color="primary" />
                              )}
                              
                              {/* STATUS CHIPS - visar var projektet befinner sig */}
                              {project.status === 'planned' && (
                                <Chip label="📋 Planerat" size="small" variant="outlined" color="default" />
                              )}
                              {project.status === 'approved' && (
                                <Chip label="✅ Godkänt" size="small" color="success" />
                              )}
                              {project.status === 'tendering' && (
                                <Chip label="📄 Upphandling" size="small" color="info" />
                              )}
                              {project.status === 'in_progress' && (
                                <Chip label="🚧 Pågår" size="small" color="warning" />
                              )}
                              {project.status === 'completed' && (
                                <Chip label="✅ Slutfört" size="small" color="success" />
                              )}

                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {project.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {project.status === 'completed' 
                                  ? `Slutfört ${project.completed_year}`
                                  : `Planerat ${project.estimated_year}`
                                }
                                {project.estimated_cost && (
                                  <> • Budget: {project.estimated_cost.toLocaleString('sv-SE')} kr</>
                                )}
                                {project.contractor && (
                                  <> • Entreprenör: {project.contractor}</>
                                )}
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                Status: {getProjectStatusLabel(project.status)}
                                {project.category && <> • Kategori: {getProjectCategoryLabel(project.category)}</>}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditProject(project)}
                            sx={{ mb: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteProject(project.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Föregående År */}
          {selectedYear < currentYear && (
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <HistoryIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Historik {selectedYear}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Slutförandegrad: {stats.percentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.completed} av {stats.total} uppgifter slutförda
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Dialog för nytt större projekt */}
      <Dialog open={newProjectDialog} onClose={() => setNewProjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lägg till större projekt</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Projektnamn"
              value={newProject.name || ''}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Beskrivning"
              value={newProject.description || ''}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Planerat år"
              type="number"
              value={newProject.estimated_year || ''}
              onChange={(e) => setNewProject({...newProject, estimated_year: Number(e.target.value)})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Beräknad kostnad (kr)"
              type="number"
              value={newProject.estimated_cost || ''}
              onChange={(e) => setNewProject({...newProject, estimated_cost: Number(e.target.value)})}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Prioritet</InputLabel>
              <Select
                value={newProject.priority || 'medium'}
                onChange={(e) => setNewProject({...newProject, priority: e.target.value as MajorProject['priority']})}
                label="Prioritet"
              >
                <MenuItem value="low">Låg</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">Hög</MenuItem>
                <MenuItem value="urgent">🚨 Akut</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={newProject.category || ''}
                onChange={(e) => setNewProject({...newProject, category: e.target.value as MajorProject['category']})}
                label="Kategori"
              >
                <MenuItem value="structure">🏗️ Byggnad</MenuItem>
                <MenuItem value="heating">🔥 Värme</MenuItem>
                <MenuItem value="plumbing">🚰 VVS</MenuItem>
                <MenuItem value="electrical">⚡ El</MenuItem>
                <MenuItem value="exterior">🏠 Exteriör</MenuItem>
                <MenuItem value="interior">🏡 Interiör</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Godkännandestatus</InputLabel>
              <Select
                value={newProject.approval_status || 'pending'}
                onChange={(e) => setNewProject({...newProject, approval_status: e.target.value as MajorProject['approval_status']})}
                label="Godkännandestatus"
              >
                <MenuItem value="pending">⏳ Väntar på godkännande</MenuItem>
                <MenuItem value="board_approved">✅ Styrelse godkänt</MenuItem>
                <MenuItem value="agm_approved">✅ Årsstämma godkänt</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Entreprenör/Leverantör"
              value={newProject.contractor || ''}
              onChange={(e) => setNewProject({...newProject, contractor: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProjectDialog(false)}>Avbryt</Button>
          <Button onClick={handleAddMajorProject} variant="contained">
            Lägg till
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog för ny underhållsuppgift */}
      <Dialog open={newTaskDialog} onClose={() => setNewTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lägg till underhållsuppgift</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Uppgiftsnamn"
              value={newTask.name || ''}
              onChange={(e) => setNewTask({...newTask, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Beskrivning"
              value={newTask.description || ''}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={newTask.category || ''}
                onChange={(e) => setNewTask({...newTask, category: e.target.value as MaintenanceTask['category']})}
                label="Kategori"
              >
                <MenuItem value="winter">Vinter</MenuItem>
                <MenuItem value="spring">Vår</MenuItem>
                <MenuItem value="summer">Sommar</MenuItem>
                <MenuItem value="autumn">Höst</MenuItem>
                <MenuItem value="ongoing">Löpande</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Förfallodatum"
              type="date"
              value={newTask.due_date || ''}
              onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTaskDialog(false)}>Avbryt</Button>
          <Button onClick={handleAddMaintenanceTask} variant="contained">
            Lägg till
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog för redigering av underhållsuppgift */}
      <Dialog open={editTaskDialog} onClose={() => setEditTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Redigera underhållsuppgift</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Uppgiftsnamn"
              value={editTask.name || ''}
              onChange={(e) => setEditTask({...editTask, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Beskrivning"
              value={editTask.description || ''}
              onChange={(e) => setEditTask({...editTask, description: e.target.value})}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={editTask.category || ''}
                onChange={(e) => setEditTask({...editTask, category: e.target.value as MaintenanceTask['category']})}
                label="Kategori"
              >
                <MenuItem value="winter">Vinter</MenuItem>
                <MenuItem value="spring">Vår</MenuItem>
                <MenuItem value="summer">Sommar</MenuItem>
                <MenuItem value="autumn">Höst</MenuItem>
                <MenuItem value="ongoing">Löpande</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Förfallodatum"
              type="date"
              value={editTask.due_date || ''}
              onChange={(e) => setEditTask({...editTask, due_date: e.target.value})}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTaskDialog(false)}>Avbryt</Button>
          <Button onClick={handleUpdateTask} variant="contained">
            Spara ändringar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog för redigering av större projekt */}
      <Dialog open={editProjectDialog} onClose={() => setEditProjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Redigera större projekt</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Projektnamn"
              value={editProject.name || ''}
              onChange={(e) => setEditProject({...editProject, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Beskrivning"
              value={editProject.description || ''}
              onChange={(e) => setEditProject({...editProject, description: e.target.value})}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Planerat år"
              type="number"
              value={editProject.estimated_year || ''}
              onChange={(e) => setEditProject({...editProject, estimated_year: Number(e.target.value)})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Beräknad kostnad (kr)"
              type="number"
              value={editProject.estimated_cost || ''}
              onChange={(e) => setEditProject({...editProject, estimated_cost: Number(e.target.value)})}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={editProject.status || 'planned'}
                onChange={(e) => setEditProject({...editProject, status: e.target.value as MajorProject['status']})}
                label="Status"
              >
                <MenuItem value="planned">📋 Planerat</MenuItem>
                <MenuItem value="approved">✅ Godkänt</MenuItem>
                <MenuItem value="tendering">📄 Upphandling</MenuItem>
                <MenuItem value="in_progress">🚧 Pågår</MenuItem>
                <MenuItem value="completed">✅ Slutfört</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Prioritet</InputLabel>
              <Select
                value={editProject.priority || 'medium'}
                onChange={(e) => setEditProject({...editProject, priority: e.target.value as MajorProject['priority']})}
                label="Prioritet"
              >
                <MenuItem value="low">Låg</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">Hög</MenuItem>
                <MenuItem value="urgent">🚨 Akut</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={editProject.category || ''}
                onChange={(e) => setEditProject({...editProject, category: e.target.value as MajorProject['category']})}
                label="Kategori"
              >
                <MenuItem value="structure">🏗️ Byggnad</MenuItem>
                <MenuItem value="heating">🔥 Värme</MenuItem>
                <MenuItem value="plumbing">🚰 VVS</MenuItem>
                <MenuItem value="electrical">⚡ El</MenuItem>
                <MenuItem value="exterior">🏠 Exteriör</MenuItem>
                <MenuItem value="interior">🏡 Interiör</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Godkännandestatus</InputLabel>
              <Select
                value={editProject.approval_status || 'pending'}
                onChange={(e) => setEditProject({...editProject, approval_status: e.target.value as MajorProject['approval_status']})}
                label="Godkännandestatus"
              >
                <MenuItem value="pending">⏳ Väntar på godkännande</MenuItem>
                <MenuItem value="board_approved">✅ Styrelse godkänt</MenuItem>
                <MenuItem value="agm_approved">✅ Årsstämma godkänt</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Entreprenör/Leverantör"
              value={editProject.contractor || ''}
              onChange={(e) => setEditProject({...editProject, contractor: e.target.value})}
              sx={{ mb: 2 }}
            />
            {editProject.status === 'completed' && (
              <>
                <TextField
                  fullWidth
                  label="Slutförd år"
                  type="number"
                  value={editProject.completed_year || ''}
                  onChange={(e) => setEditProject({...editProject, completed_year: Number(e.target.value)})}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Verklig kostnad (kr)"
                  type="number"
                  value={editProject.actual_cost || ''}
                  onChange={(e) => setEditProject({...editProject, actual_cost: Number(e.target.value)})}
                  sx={{ mb: 2 }}
                />
              </>
            )}
            <TextField
              fullWidth
              label="Anteckningar"
              value={editProject.notes || ''}
              onChange={(e) => setEditProject({...editProject, notes: e.target.value})}
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />

            {/* DOKUMENTHANTERING - Återanvänder befintligt system! */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              📄 Projektdokument
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                onChange={handleDocumentUpload}
                style={{ display: 'none' }}
                id="document-upload"
                disabled={uploadingDoc}
              />
              <label htmlFor="document-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={uploadingDoc ? <CircularProgress size={20} /> : <AttachFileIcon />}
                  disabled={uploadingDoc}
                >
                  {uploadingDoc ? 'Laddar upp...' : 'Ladda upp dokument'}
                </Button>
              </label>
            </Box>

            {projectDocuments.length > 0 && (
              <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                {projectDocuments.map((doc) => (
                  <ListItem key={doc.id}>
                    <ListItemIcon>
                      {doc.mimetype?.includes('pdf') ? (
                        <PictureAsPdfIcon color="error" />
                      ) : doc.mimetype?.includes('image') ? (
                        <PhotoIcon color="primary" />
                      ) : (
                        <AttachFileIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.originalName}
                      secondary={`${(doc.size / 1024).toFixed(1)} KB • ${new Date(doc.uploadedAt).toLocaleDateString('sv-SE')}`}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        href={doc.url}
                        target="_blank"
                        title="Öppna dokument"
                      >
                        <OpenInNewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDocumentDelete(doc.id)}
                        color="error"
                        title="Ta bort dokument"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}

            {projectDocuments.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                Inga dokument uppladdade ännu. Ladda upp kontrakt, tillstånd, foton, etc.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProjectDialog(false)}>Avbryt</Button>
          <Button onClick={handleUpdateProject} variant="contained">
            Spara ändringar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SimpleMaintenancePlan;