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
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Popover,
  CircularProgress,
  Tooltip,
  Backdrop,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  useTheme,
  Collapse,
  SpeedDial,
  SpeedDialAction
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
  OpenInNew as OpenInNewIcon,
  ChevronLeft,
  ChevronRight
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
  // createAnnualMaintenancePlan, // Tillfälligt inaktiverad
  uploadProjectDocument,
  getProjectDocuments,
  deleteProjectDocument,
  getUsers,

  User
} from '../../services/maintenanceService';
import { sendTaskNotification } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContextNew';







const SimpleMaintenancePlan: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  
  const currentYear = new Date().getFullYear();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [majorProjects, setMajorProjects] = useState<MajorProject[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
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
  const [clearingData, setClearingData] = useState(false);
  const [allProjectDocuments, setAllProjectDocuments] = useState<{[key: string]: any[]}>({});
  const [documentsMenuAnchor, setDocumentsMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProjectDocuments, setSelectedProjectDocuments] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'due_date' | 'status' | 'name' | 'created_at'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingRecurring, setIsGeneratingRecurring] = useState(false);
  const [recurringProgress, setRecurringProgress] = useState({
    isVisible: false,
    currentStep: 0,
    totalSteps: 0,
    stepDescription: '',
    percentage: 0,
    instancesCreated: 0,
    estimatedTimeRemaining: ''
  });



  // 🎹 Keyboard navigation för år-väljare
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Bara om vi inte är i en input/textarea
      if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as Element).tagName)) {
        return;
      }
      
      if (event.key === 'ArrowLeft' && selectedYear > currentYear - 3) {
        setSelectedYear(selectedYear - 1);
        event.preventDefault();
      } else if (event.key === 'ArrowRight' && selectedYear < currentYear + 6) {
        setSelectedYear(selectedYear + 1);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedYear, currentYear]);

  const loadAllProjectDocuments = async (projects: MajorProject[]) => {
    const documentsMap: {[key: string]: any[]} = {};
    
    // Ladda dokument för alla projekt parallellt
    await Promise.all(
      projects.map(async (project) => {
        try {
          const docs = await getProjectDocuments(project.id);
          documentsMap[project.id] = docs;
        } catch (error) {
          console.error(`Error loading documents for project ${project.id}:`, error);
          documentsMap[project.id] = [];
        }
      })
    );
    
    setAllProjectDocuments(documentsMap);
  };

  // Ladda årets underhållslista - ENKEL VERSION utan on-demand generering
  useEffect(() => {
    loadMaintenanceData();
  }, [selectedYear]);

  const loadMaintenanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ladda underhållsuppgifter för valt år
      const existingTasks = await getMaintenanceTasksByYear(selectedYear);
      
      // TILLFÄLLIGT INAKTIVERAT - Låt användaren själv välja vilka uppgifter som ska skapas
      // Nu med återkommande funktionalitet kan användaren skapa exakt det de behöver
      // if (existingTasks.length === 0) {
      //   // Skapa ny årlig underhållsplan om ingen finns
      //   const newTasks = await createAnnualMaintenancePlan(selectedYear);
      //   setTasks(newTasks);
      // } else {
        setTasks(existingTasks);
      // }

      // Ladda större projekt och användare
      const [projects, usersData] = await Promise.all([
        getMajorProjects(),
        getUsers()
      ]);
      setMajorProjects(projects);
      setUsers(usersData);
      
      // Ladda dokument för alla projekt
      await loadAllProjectDocuments(projects);
      
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

    // 📧 Skicka slutförd-notifiering om uppgiften var tilldelad
    if (isCompleted && taskToUpdate.assignee_id) {
      try {
        await sendTaskNotification({
          type: 'TASK_COMPLETED',
          taskId: taskToUpdate.id,
          assigneeId: taskToUpdate.assignee_id,
          taskName: taskToUpdate.name,
          description: taskToUpdate.description
        });
        console.log('✅ Task completion notification sent successfully');
      } catch (notificationError) {
        console.error('⚠️ Failed to send completion notification:', notificationError);
      }
    }
    
    // 🔄 ÅTERKOMMANDE LOGIK: Skapa nästa instans när uppgiften slutförs
    console.log('🔍 Task toggle debug:', {
      isCompleted,
      is_recurring: taskToUpdate.is_recurring,
      next_due_date: taskToUpdate.next_due_date,
      taskName: taskToUpdate.name
    });
    
    if (isCompleted && taskToUpdate.is_recurring) {
      console.log('🔄 Task is completed and recurring, creating next instance...');
      
      // Om next_due_date saknas, beräkna det från due_date
      if (!taskToUpdate.next_due_date && taskToUpdate.due_date) {
        console.log('⚠️ next_due_date missing, calculating from due_date');
        taskToUpdate.next_due_date = calculateNextDueDate(taskToUpdate.due_date, taskToUpdate.recurrence_pattern);
        console.log('✅ Calculated next_due_date:', taskToUpdate.next_due_date);
      }
      
      if (taskToUpdate.next_due_date) {
        await createNextRecurringInstance(taskToUpdate);
      } else {
        console.error('❌ Cannot create recurring instance: no next_due_date available');
        alert('⚠️ Kunde inte skapa nästa återkommande instans - kontrollera förfallodatum');
      }
    }
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
    console.log('🚀 handleAddMaintenanceTask called with:', newTask);
    
    if (!newTask.name) {
      console.warn('❌ Missing required fields:', { name: newTask.name });
      return;
    }
    
    try {
      // 🎯 FIX: Använd året från förfallodatum, inte valt år!
      const taskYear = newTask.due_date ? new Date(newTask.due_date).getFullYear() : selectedYear;
      
      const task: Partial<MaintenanceTask> = {
        id: `task_${Date.now()}`,
        name: newTask.name,
        description: newTask.description || '',

        year: taskYear, // ✅ Korrekt år baserat på förfallodatum
        due_date: newTask.due_date || undefined,
        completed: false,
        // Återkommande funktionalitet enligt Perplexity
        is_recurring: newTask.is_recurring || false,
        recurrence_pattern: newTask.recurrence_pattern,
        is_template: false,
        next_due_date: newTask.is_recurring ? calculateNextDueDate(newTask.due_date, newTask.recurrence_pattern) : undefined,
        end_date: newTask.end_date, // Slutdatum för återkommande uppgifter
        // Tilldelning
        assignee_id: newTask.assignee_id,
        assigned_at: newTask.assignee_id ? new Date().toISOString() : undefined,
        assigned_by: newTask.assignee_id ? currentUser?.id || null : undefined // Use current user ID if available
      };

      console.log('🔍 Adding new task:', task);
      console.log(`📅 Task year determined: ${taskYear} (from due_date: ${newTask.due_date}, selected year: ${selectedYear})`);

      // Spara till Supabase
      const savedTask = await saveMaintenanceTask(task);
      if (savedTask) {
        console.log('✅ Task saved successfully:', savedTask);
        
        // 🔄 ÅTERKOMMANDE: Skapa alla instanser direkt i databasen!
        if (savedTask.is_recurring) {
          console.log(`🔄 Creating ALL recurring instances for: ${savedTask.name} (${savedTask.recurrence_pattern})`);
          
          // Stäng dialog för att progress UI ska synas bättre
          setNewTaskDialog(false);
          
          const allInstances = await createAllRecurringInstances(savedTask);
          console.log(`✅ Created ${allInstances.length} recurring instances in database`);
          
          // Lägg till alla instanser för aktuellt år i UI
          const currentYearInstances = allInstances.filter(instance => instance.year === selectedYear);
          setTasks([...tasks, ...currentYearInstances]);
          
          // Mer informativt meddelande
          const yearSpread = [...new Set(allInstances.map(i => i.year))].sort();
          const yearRange = yearSpread.length > 1 ? `${yearSpread[0]}-${yearSpread[yearSpread.length - 1]}` : yearSpread[0];
          const endDateInfo = savedTask.end_date ? `\n🏁 Slutar: ${savedTask.end_date}` : '';
          
          // Progress UI visar redan all information - ingen extra alert behövs
        } else {
          // Inte återkommande - lägg bara till om det är för valt år
          if (savedTask.year === selectedYear) {
            setTasks([...tasks, savedTask]);
          }
          // Stäng dialog för icke-återkommande uppgifter
          setNewTaskDialog(false);
        }

        // 📧 Skicka notifiering om uppgiften tilldelats någon
        if (savedTask.assignee_id) {
          try {
            await sendTaskNotification({
              type: 'TASK_ASSIGNED',
              taskId: savedTask.id,
              assigneeId: savedTask.assignee_id,
              assignedBy: savedTask.assigned_by,
              taskName: savedTask.name,
              dueDate: savedTask.due_date,
              description: savedTask.description
            });
            console.log('✅ Assignment notification sent successfully');
          } catch (notificationError) {
            console.error('⚠️ Failed to send assignment notification:', notificationError);
            // Don't block the UI - notification failure is not critical
          }
        }
      } else {
        console.error('❌ Failed to save task - no response from saveMaintenanceTask');
        setNewTaskDialog(false);
      }
      
      // Rensa formulär (dialog stängs redan för återkommande)
      setNewTask({});
      
      // 💡 Informera användaren om året ändrades
      if (taskYear !== selectedYear && newTask.due_date) {
        alert(`📅 Uppgiften sparades under ${taskYear} baserat på förfallodatumet. Växla till år ${taskYear} för att se den!`);
      }
      
    } catch (error) {
      console.error('❌ Error adding maintenance task:', error);
    }
  };

  // Hjälpfunktioner för återkommande uppgifter
  const getRecurrenceLabel = (pattern: string | undefined): string => {
    switch (pattern) {
      case 'monthly': return 'Månadsvis';
      case 'quarterly': return 'Kvartalsvis';
      case 'semi_annually': return 'Halvårsvis';
      case 'annually': return 'Årligen';
      default: return 'Återkommande';
    }
  };

  // 🗓️ ROBUST hjälpfunktion för att beräkna nästa förfallodatum (timezone-säker)
  const calculateNextDueDate = (currentDueDate: string | undefined, pattern: string | undefined): string | undefined => {
    if (!currentDueDate || !pattern) return undefined;
    
    // 🛡️ Parse datum på timezone-säkert sätt
    const [currentYear, currentMonth, currentDay] = currentDueDate.split('-').map(Number);
    
    // 🔍 DEBUG: Logga beräkning för alla mönster
    console.log(`🗓️ Calculating next due date from: ${currentDueDate} (pattern: ${pattern})`);
    
    let year = currentYear;
    let month = currentMonth - 1;  // Konvertera till 0-based (0 = Jan)  
    let day = currentDay;
    
    switch (pattern) {
      case 'monthly':
        month += 1;
        if (month >= 12) {
          year += 1;
          month = 0;
        }
        break;
      case 'quarterly':
        month += 3;
        while (month >= 12) {
          year += 1;
          month -= 12;
        }
        break;
      case 'semi_annually':
        month += 6;
        while (month >= 12) {
          year += 1;
          month -= 12;
        }
        break;
      case 'annually':
        year += 1;
        // Special handling för Feb 29 på skottår
        if (month === 1 && day === 29) {
          const isNextYearLeap = ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0));
          if (!isNextYearLeap) {
            day = 28;
            console.log(`⚠️ Leap year adjustment: Feb 29 -> Feb 28 (${year} is not a leap year)`);
          }
        }
        break;
      default:
        console.warn(`❌ Unknown recurrence pattern: ${pattern}`);
        return undefined;
    }
    
    // 🗓️ Hantera månadsslut på timezone-säkert sätt
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    
    if (day > lastDayOfMonth) {
      // Om ursprungsdagen inte finns i målmånaden, använd sista dagen
      day = lastDayOfMonth;
      console.log(`⚠️ Month-end adjustment: ${currentDay} -> ${day} (${year}-${month + 1})`);
    }
    
    // 🛡️ Formatera datum på timezone-säkert sätt
    const nextMonth = String(month + 1).padStart(2, '0');  // Konvertera tillbaka till 1-based
    const nextDay = String(day).padStart(2, '0');
    const result = `${year}-${nextMonth}-${nextDay}`;
    
    console.log(`✅ Next due date calculated: ${result}`);
    
    return result;
  };



  // 🧪 TEST-FUNKTION för att validera alla periodiciteter
  const testRecurrencePatterns = () => {
    console.log('\n🧪 TESTING ALL RECURRENCE PATTERNS:');
    
    const testCases = [
      // Monthly tests
      { date: '2025-01-31', pattern: 'monthly', expected: '2025-02-28' }, // Månadsslut
      { date: '2025-01-15', pattern: 'monthly', expected: '2025-02-15' }, // Mitten av månaden
      { date: '2025-12-15', pattern: 'monthly', expected: '2026-01-15' }, // Årsskifte
      
      // Quarterly tests  
      { date: '2025-01-31', pattern: 'quarterly', expected: '2025-04-30' }, // Q1->Q2
      { date: '2025-03-15', pattern: 'quarterly', expected: '2025-06-15' }, // Normal kvartal
      { date: '2025-11-30', pattern: 'quarterly', expected: '2026-02-28' }, // Årsskifte
      
      // Semi-annually tests
      { date: '2025-01-31', pattern: 'semi_annually', expected: '2025-07-31' }, // Halvår
      { date: '2025-08-31', pattern: 'semi_annually', expected: '2026-02-28' }, // Årsskifte + månadsslut
      
      // Annually tests
      { date: '2024-02-29', pattern: 'annually', expected: '2025-02-28' }, // Skottår
      { date: '2025-01-15', pattern: 'annually', expected: '2026-01-15' }, // Normal årlig
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    testCases.forEach((test, index) => {
      const result = calculateNextDueDate(test.date, test.pattern);
      const passed = result === test.expected;
      
      console.log(`Test ${index + 1}: ${test.date} + ${test.pattern}`);
      console.log(`  Expected: ${test.expected}`);
      console.log(`  Got:      ${result}`);
      console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
      
      if (passed) passedTests++;
    });
    
    console.log(`🏁 RESULTS: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      alert('🎉 Alla återkommande mönster fungerar korrekt!');
    } else {
      alert(`⚠️ ${totalTests - passedTests} tester misslyckades. Se konsolen för detaljer.`);
    }
  };

  // 🔢 HJÄLPFUNKTION: Beräkna förväntade instanser per år
  const getExpectedInstancesPerYear = (pattern: string): number => {
    switch (pattern) {
      case 'monthly': return 12;
      case 'quarterly': return 4; 
      case 'semi_annually': return 2;
      case 'annually': return 1;
      default: return 1;
    }
  };

  // 🔍 HJÄLPFUNKTION: Hitta första saknade datum för ett specifikt år
  const findFirstMissingDateForYear = (template: MaintenanceTask, existingInstances: MaintenanceTask[], targetYear: number): string | undefined => {
    if (!template.due_date) return undefined;
    
    // Om det är samma år som template, börja från template datum
    if (template.year === targetYear) {
      return template.due_date;
    }
    
    // Annars, räkna framåt till målåret
    const templateYear = template.year;
    const yearDifference = targetYear - templateYear;
    
    if (yearDifference <= 0) return undefined;
    
    // Beräkna första datum för målåret
    let currentDate = template.due_date;
    
    // Räkna framåt år för år tills vi når målåret
    for (let year = templateYear; year < targetYear; year++) {
      // För det här året, räkna framåt tills vi når nästa år
      while (currentDate && new Date(currentDate).getFullYear() === year) {
        currentDate = calculateNextDueDate(currentDate, template.recurrence_pattern);
      }
    }
    
    // Nu ska vi vara i målåret - hitta första datum som inte redan finns
    while (currentDate && new Date(currentDate).getFullYear() === targetYear) {
      const dateExists = existingInstances.some(instance => instance.due_date === currentDate);
      
      if (!dateExists) {
        return currentDate; // Detta är första saknade datum
      }
      
      currentDate = calculateNextDueDate(currentDate, template.recurrence_pattern);
    }
    
    return undefined; // Alla datum för året finns redan eller vi gick förbi året
  };

  // 🔄 SKAPA ALLA ÅTERKOMMANDE INSTANSER direkt vid skapande
  const createAllRecurringInstances = async (template: MaintenanceTask): Promise<MaintenanceTask[]> => {
    const instances: MaintenanceTask[] = [];
    
    if (!template.is_recurring || !template.due_date || !template.recurrence_pattern) {
      console.warn('❌ Invalid recurring task template:', template);
      return instances;
    }
    
    console.log(`🔄 Creating all instances for: ${template.name} (${template.recurrence_pattern})`);
    
    // 🎯 PROGRESS UI: Initiera progress tracking
    const startTime = Date.now();
    setRecurringProgress({
      isVisible: true,
      currentStep: 1,
      totalSteps: 4,
      stepDescription: 'Beräknar tidshorisonter...',
      percentage: 0,
      instancesCreated: 0,
      estimatedTimeRemaining: 'Beräknar...'
    });
    
    // 📅 Bestäm slutdatum - antingen från användaren eller standard tidshorisonter
    let endDate: Date;
    
    if (template.end_date) {
      // Användaren har satt ett slutdatum
      endDate = new Date(template.end_date);
      console.log(`📅 Using user-specified end date: ${template.end_date}`);
    } else {
      // Använd standard tidshorisonter från industry best practices
      const getDefaultTimeHorizon = (pattern: string): { months: number, description: string } => {
        switch (pattern) {
          case 'monthly': 
            return { months: 18, description: '18 månader framåt' }; // 1.5 år
          case 'quarterly': 
            return { months: 24, description: '2 år framåt' }; // 2 år
          case 'semi_annually': 
            return { months: 24, description: '2 år framåt' }; // 2 år
          case 'annually': 
            return { months: 36, description: '3 år framåt' }; // 3 år
          default: 
            return { months: 12, description: '1 år framåt' };
        }
      };
      
      const horizon = getDefaultTimeHorizon(template.recurrence_pattern);
      endDate = new Date(template.due_date);
      endDate.setMonth(endDate.getMonth() + horizon.months);
      
      console.log(`📅 Using default time horizon: ${horizon.description} (until ${endDate.toISOString().split('T')[0]})`);
    }
    
    // 🎯 PROGRESS UI: Steg 2 - Räkna ut totalt antal instanser
    setRecurringProgress(prev => ({
      ...prev,
      currentStep: 2,
      stepDescription: 'Räknar ut antal instanser...',
      percentage: 25
    }));
    
    // Pre-calculate total instances for accurate progress
    let totalInstancesEstimate = 0;
    let tempDate = template.due_date;
    while (tempDate && new Date(tempDate) <= endDate && totalInstancesEstimate < 100) {
      totalInstancesEstimate++;
      tempDate = calculateNextDueDate(tempDate, template.recurrence_pattern);
    }
    
    // 🔄 Generera instanser fram till slutdatum
    let currentDate = template.due_date;
    let instanceCount = 0;
    const maxSafetyInstances = 100; // Säkerhetsgräns för att undvika oändliga loopar
    
    // 🛡️ DEDUPLICATION: Hämta alla befintliga uppgifter för alla relevanta år
    const yearsToCheck = Array.from(new Set(
      Array.from({length: totalInstancesEstimate}, (_, i) => {
        let tempDate = template.due_date;
        for (let j = 0; j < i; j++) {
          tempDate = calculateNextDueDate(tempDate, template.recurrence_pattern);
        }
        return tempDate ? new Date(tempDate).getFullYear() : null;
      }).filter(Boolean)
    ));
    
    console.log(`🛡️ Checking for existing tasks in years: ${yearsToCheck.join(', ')}`);
    const allExistingTasks: MaintenanceTask[] = [];
    for (const year of yearsToCheck) {
      const yearTasks = await getMaintenanceTasksByYear(year);
      allExistingTasks.push(...yearTasks);
    }
    
    // 🎯 PROGRESS UI: Steg 3 - Börja skapa instanser
    setRecurringProgress(prev => ({
      ...prev,
      currentStep: 3,
      stepDescription: `Skapar ${totalInstancesEstimate} instanser...`,
      percentage: 50,
      estimatedTimeRemaining: `~${Math.ceil(totalInstancesEstimate * 0.1)} sekunder`
    }));
    
    while (currentDate && new Date(currentDate) <= endDate && instanceCount < maxSafetyInstances) {
      const instanceYear = new Date(currentDate).getFullYear();
      
      // Skapa instans för detta datum
      const instance: Partial<MaintenanceTask> = {
        id: `task_${Date.now()}_${instanceCount}_recurring`,
        name: template.name,
        description: template.description,

        year: instanceYear,
        due_date: currentDate,
        completed: false,
        is_recurring: true,
        recurrence_pattern: template.recurrence_pattern,
        is_template: false,
        parent_template_id: template.id, // Referera till ursprunglig template
        next_due_date: calculateNextDueDate(currentDate, template.recurrence_pattern),
        end_date: template.end_date, // Behåll samma slutdatum för alla instanser
      };
      
      console.log(`📅 Creating instance ${instanceCount + 1}: ${instance.name} for ${currentDate}`);
      
      // 🛡️ DEDUPLICATION: Kolla om instansen redan finns (använd cache)
      const existingDuplicate = allExistingTasks.find(task => 
        task.name === instance.name && 
        task.due_date === instance.due_date && 
        (task.parent_template_id === template.id || task.id === template.id)
      );
      
      if (existingDuplicate) {
        console.log(`⚠️ Skipping duplicate instance: ${instance.name} for ${currentDate} (already exists with ID: ${existingDuplicate.id})`);
        instances.push(existingDuplicate); // Använd befintlig instans
        instanceCount++;
      } else {
        // Spara till databas
        const savedInstance = await saveMaintenanceTask(instance);
        if (savedInstance) {
          instances.push(savedInstance);
          allExistingTasks.push(savedInstance); // Lägg till i cache för nästa iteration
          instanceCount++;
          console.log(`✅ Created new instance: ${savedInstance.id} for ${currentDate}`);
        }
      }
      
      // 🎯 PROGRESS UI: Uppdatera progress under skapande
      const progressPercentage = 50 + (instanceCount / totalInstancesEstimate) * 40; // 50-90%
      const elapsedTime = (Date.now() - startTime) / 1000;
      const estimatedTotal = (elapsedTime / instanceCount) * totalInstancesEstimate;
      const remainingTime = Math.max(0, estimatedTotal - elapsedTime);
      
      const actionText = existingDuplicate ? 'Hittade befintlig' : 'Skapade ny';
      setRecurringProgress(prev => ({
        ...prev,
        stepDescription: `${actionText} instans ${instanceCount} av ${totalInstancesEstimate}...`,
        percentage: Math.round(progressPercentage),
        instancesCreated: instanceCount,
        estimatedTimeRemaining: remainingTime > 1 ? `~${Math.ceil(remainingTime)}s kvar` : 'Nästan klar...'
      }));
      
      // Beräkna nästa datum
      currentDate = calculateNextDueDate(currentDate, template.recurrence_pattern);
      
      // Liten fördröjning för att undvika samma timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // 🎯 PROGRESS UI: Steg 4 - Slutför
    setRecurringProgress(prev => ({
      ...prev,
      currentStep: 4,
      stepDescription: `✅ Skapade ${instances.length} instanser!`,
      percentage: 100,
      estimatedTimeRemaining: 'Klar!'
    }));
    
    // Dölj progress efter 2 sekunder
    setTimeout(() => {
      setRecurringProgress(prev => ({ ...prev, isVisible: false }));
    }, 2000);
    
    console.log(`✅ Created ${instances.length} recurring instances successfully`);
    return instances;
  };

  // 🧹 RENSA DUBBLETTER AV ÅTERKOMMANDE UPPGIFTER
  const cleanupDuplicateRecurringTasks = async (showAlert: boolean = true) => {
    try {
      console.log('🧹 Checking for duplicate recurring tasks...');
      
      const allTasks = await getMaintenanceTasksByYear(selectedYear);
      const recurringTasks = allTasks.filter(task => task.is_recurring && !task.is_template);
      
      // Gruppera efter namn + datum + parent_template_id
      const taskGroups = recurringTasks.reduce((groups, task) => {
        const key = `${task.name}_${task.due_date}_${task.parent_template_id || task.id}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
        return groups;
      }, {} as Record<string, MaintenanceTask[]>);
      
      // Hitta grupper med dubbletter
      let deletedCount = 0;
      for (const [key, duplicates] of Object.entries(taskGroups)) {
        if (duplicates.length > 1) {
          console.log(`🔍 Found ${duplicates.length} duplicates for: ${key}`);
          
          // Behåll den första, radera resten
          const [keepTask, ...deleteThese] = duplicates.sort((a, b) => 
            new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
          );
          
          console.log(`✅ Keeping task: ${keepTask.id} (created: ${keepTask.created_at})`);
          
          for (const taskToDelete of deleteThese) {
            console.log(`🗑️ Deleting duplicate: ${taskToDelete.id} (created: ${taskToDelete.created_at})`);
            await deleteMaintenanceTask(taskToDelete.id);
            deletedCount++;
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} duplicate tasks`);
        // Uppdatera local state genom att ladda om data
        await loadMaintenanceData();
        
        // Visa användarvänligt meddelande (bara för manuell körning)
        if (showAlert) {
          alert(`🧹 Rensade ${deletedCount} dubbletter!\n\nUppdaterar listan...`);
        }
        return true; // Indikerar att dubbletter togs bort
      } else {
        console.log('✅ No duplicates found');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error cleaning up duplicates:', error);
      return false;
    }
  };

  // 🔄 GENERERA SAKNADE ÅTERKOMMANDE INSTANSER för valt år
  const generateMissingRecurringInstances = async () => {
    // 🛡️ Förhindra parallella körningar
    if (isGeneratingRecurring) {
      console.log('🔄 Generation already running, skipping...');
      return;
    }
    setIsGeneratingRecurring(true);
    try {
      console.log(`🔄 Checking for missing recurring instances for year ${selectedYear}...`);
      
      // 0️⃣ Rensa dubbletter bara första gången per session för detta år
      const cleanupKey = `cleanup_done_${selectedYear}`;
      if (!sessionStorage.getItem(cleanupKey)) {
        console.log('🧹 First time loading this year - checking for duplicates...');
        const hadDuplicates = await cleanupDuplicateRecurringTasks(false); // Tyst automatisk cleanup
        if (hadDuplicates) {
          console.log('🔄 Duplicates cleaned up, recalculating...');
        }
        sessionStorage.setItem(cleanupKey, 'done');
      }
      
      // 1️⃣ Hitta alla återkommande templates från flera år (kolla bakåt och framåt)
      const currentYear = new Date().getFullYear();
      const yearsToCheck = [currentYear - 2, currentYear - 1, currentYear, selectedYear, selectedYear + 1, selectedYear + 2];
      const allTasks: MaintenanceTask[] = [];
      
      for (const year of yearsToCheck) {
        const yearTasks = await getMaintenanceTasksByYear(year);
        allTasks.push(...yearTasks);
      }
      const recurringTemplates = allTasks.filter(task => 
        task.is_recurring && 
        (task.is_template || !task.parent_template_id) // Templates eller ursprungsuppgifter
      );
      
      console.log(`📋 Found ${recurringTemplates.length} recurring templates:`, recurringTemplates.map(t => t.name));
      
      // 2️⃣ För varje template, generera alla saknade instanser för selectedYear
      for (const template of recurringTemplates) {
        const existingInstancesThisYear = allTasks.filter(task => 
          task.year === selectedYear && 
          (task.parent_template_id === template.id || task.id === template.id)
        );
        
        console.log(`🔍 Template "${template.name}" (${template.recurrence_pattern}): ${existingInstancesThisYear.length} existing instances in ${selectedYear}`);
        
        // 3️⃣ Bestäm hur många instanser som behövs per år baserat på frekvens
        const expectedInstancesPerYear = getExpectedInstancesPerYear(template.recurrence_pattern);
        const missingInstancesCount = expectedInstancesPerYear - existingInstancesThisYear.length;
        
        console.log(`📊 Expected: ${expectedInstancesPerYear}, Existing: ${existingInstancesThisYear.length}, Missing: ${missingInstancesCount}`);
        
        if (missingInstancesCount > 0) {
          console.log(`🔄 Generating ${missingInstancesCount} missing instances for "${template.name}"`);
          
          // 4️⃣ Hitta första saknade datum för detta år
          let currentDate = findFirstMissingDateForYear(template, existingInstancesThisYear, selectedYear);
          
          // 5️⃣ Generera saknade instanser
          for (let i = 0; i < missingInstancesCount && currentDate; i++) {
            if (new Date(currentDate).getFullYear() === selectedYear) {
              // 🔍 STRÄNGARE DEDUPLICERING - kontrollera unik kombination
              const existingTasksNow = await getMaintenanceTasksByYear(selectedYear);
              const uniqueKey = `${template.name}_${currentDate}_${template.id}`;
              const alreadyExists = existingTasksNow.some(task => {
                const taskKey = `${task.name}_${task.due_date}_${task.parent_template_id || task.id}`;
                return taskKey === uniqueKey;
              });
              
              if (alreadyExists) {
                console.log(`⏭️ Instance already exists: ${template.name} for ${currentDate}, skipping`);
              } else {
                console.log(`📅 Creating missing instance: ${template.name} for ${currentDate}`);
                
                const newInstance: Partial<MaintenanceTask> = {
                  id: `task_${Date.now()}_${i}_auto_generated`,
                  name: template.name,
                  description: template.description,
          
                  year: selectedYear,
                  due_date: currentDate,
                  completed: false,
                  is_recurring: true,
                  recurrence_pattern: template.recurrence_pattern,
                  is_template: false,
                  next_due_date: calculateNextDueDate(currentDate, template.recurrence_pattern),
                  parent_template_id: template.id,
                };
                
                const savedInstance = await saveMaintenanceTask(newInstance);
                if (savedInstance) {
                  console.log(`✅ Auto-generated recurring instance: ${savedInstance.name} for ${currentDate}`);
                  setTasks(prevTasks => [...prevTasks, savedInstance]);
                }
                
                // Små fördröjningar för att undvika samma timestamp
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }
            
            // Beräkna nästa datum
            currentDate = calculateNextDueDate(currentDate, template.recurrence_pattern);
          }
          
          // Visa diskret notifikation (bara första gången per session)
          if (!sessionStorage.getItem(`recurring_notification_${selectedYear}`)) {
            setTimeout(() => {
              console.log(`🔄 Automatiskt genererat ${missingInstancesCount} återkommande instanser för ${selectedYear}`);
            }, 1000);
            sessionStorage.setItem(`recurring_notification_${selectedYear}`, 'shown');
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error generating missing recurring instances:', error);
    } finally {
      // 🔓 Släpp låset
      setIsGeneratingRecurring(false);
    }
  };

  // 🔄 SKAPA NÄSTA ÅTERKOMMANDE INSTANS
  const createNextRecurringInstance = async (completedTask: MaintenanceTask) => {
    if (!completedTask.is_recurring) {
      console.log('❌ Task is not recurring, skipping');
      return;
    }
    
    if (!completedTask.next_due_date) {
      console.log('❌ No next_due_date available, skipping');
      return;
    }
    
    try {
      console.log(`🔄 Creating next recurring instance for: ${completedTask.name}`);
      console.log('📊 Completed task data:', {
        name: completedTask.name,
        due_date: completedTask.due_date,
        next_due_date: completedTask.next_due_date,
        recurrence_pattern: completedTask.recurrence_pattern,
        is_recurring: completedTask.is_recurring
      });
      
      // Beräkna nästa förfallodatum från det som redan finns
      const nextDueDate = completedTask.next_due_date;
      const followingDueDate = calculateNextDueDate(nextDueDate, completedTask.recurrence_pattern);
      const nextYear = new Date(nextDueDate).getFullYear();
      
      const nextTask: Partial<MaintenanceTask> = {
        id: `task_${Date.now()}_recurring`,
        name: completedTask.name,
        description: completedTask.description,

        year: nextYear, // ✅ Rätt år från nästa förfallodatum
        due_date: nextDueDate,
        completed: false,
        is_recurring: true,
        recurrence_pattern: completedTask.recurrence_pattern,
        is_template: false,
        next_due_date: followingDueDate,
        // Behåll referens till ursprunglig template
        parent_template_id: completedTask.parent_template_id || completedTask.id,
      };
      
      console.log(`📅 Next task scheduled for: ${nextDueDate} (year: ${nextYear})`);
      console.log(`📅 Following occurrence: ${followingDueDate}`);
      console.log('💾 Next task data to save:', nextTask);
      
      // Spara nästa instans till Supabase
      const savedNextTask = await saveMaintenanceTask(nextTask);
      
      if (savedNextTask) {
        console.log(`✅ Next recurring instance created successfully:`, savedNextTask);
        
        // Om nästa instans är för det aktuella året, lägg till i listan
        if (savedNextTask.year === selectedYear) {
          console.log(`➕ Adding to current year (${selectedYear}) task list`);
          setTasks(prevTasks => [...prevTasks, savedNextTask]);
        } else {
          console.log(`📅 Next task is for year ${savedNextTask.year}, not adding to current view (${selectedYear})`);
        }
        
        // Visa meddelande till användaren
        alert(`🔄 Nästa instans av "${completedTask.name}" skapades automatiskt för ${nextDueDate}!\n\n${savedNextTask.year !== selectedYear ? `Växla till år ${savedNextTask.year} för att se den.` : 'Den syns i nuvarande års-vy.'}`);
      } else {
        console.error('❌ Failed to save next recurring instance');
        alert('❌ Misslyckades med att skapa nästa återkommande instans');
      }
      
    } catch (error) {
      console.error('❌ Error creating next recurring instance:', error);
      alert('❌ Ett fel uppstod vid skapande av nästa återkommande instans. Se konsolen för detaljer.');
    }
  };

  const handleEditTask = (task: MaintenanceTask) => {
    setEditTask(task);
    setEditTaskDialog(true);
  };

  const handleUpdateTask = async () => {
    if (!editTask.name || !editTask.id) return;
    
    try {
      // 🎯 FIX: Uppdatera året baserat på förfallodatum
      const taskYear = editTask.due_date ? new Date(editTask.due_date).getFullYear() : selectedYear;
      const originalTask = tasks.find(t => t.id === editTask.id);
      
      // Uppdatera next_due_date om återkommande inställningar ändrats
      const taskToUpdate = {
        ...editTask,
        year: taskYear, // ✅ Uppdaterat år
        next_due_date: editTask.is_recurring ? 
          calculateNextDueDate(editTask.due_date, editTask.recurrence_pattern) : 
          undefined
      };
      
      console.log('🔍 Updating task with recurring data:', taskToUpdate);
      console.log(`📅 Task year updated: ${taskYear} (from due_date: ${editTask.due_date})`);
      
      // Spara till Supabase
      const savedTask = await saveMaintenanceTask(taskToUpdate);
      if (savedTask) {
        // Om uppgiften bytte år, ta bort från nuvarande lista
        if (originalTask?.year !== savedTask.year && savedTask.year !== selectedYear) {
          setTasks(tasks.filter(task => task.id !== savedTask.id));
          alert(`📅 Uppgiften flyttades till ${savedTask.year} baserat på det nya förfallodatumet. Växla till år ${savedTask.year} för att se den!`);
        } else {
          // Uppdatera i nuvarande lista
          setTasks(tasks.map(task => 
            task.id === savedTask.id ? savedTask : task
          ));
        }
        
        if (savedTask.is_recurring) {
          console.log(`🔄 Updated recurring task: ${savedTask.name} (${savedTask.recurrence_pattern})`);
          console.log(`📅 Next due: ${savedTask.next_due_date}`);
        }

        // 📧 Skicka notifiering om tilldelning ändrats
        const wasAssigned = originalTask?.assignee_id !== savedTask.assignee_id;
        if (wasAssigned && savedTask.assignee_id) {
          try {
            await sendTaskNotification({
              type: 'TASK_ASSIGNED',
              taskId: savedTask.id,
              assigneeId: savedTask.assignee_id,
              assignedBy: 'current-user-id', // TODO: Get actual current user ID
              taskName: savedTask.name,
              dueDate: savedTask.due_date,
              description: savedTask.description
            });
            console.log('✅ Assignment change notification sent successfully');
          } catch (notificationError) {
            console.error('⚠️ Failed to send assignment change notification:', notificationError);
          }
        }
      }
      
      setEditTaskDialog(false);
      setEditTask({});
      
    } catch (error) {
      console.error('❌ Error updating maintenance task:', error);
    }
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
        default:
          comparison = a.name.localeCompare(b.name, 'sv');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
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



  const handleCloseDocumentsMenu = () => {
    setDocumentsMenuAnchor(null);
    setSelectedProjectDocuments([]);
  };

  const handleEditProject = async (project: MajorProject) => {
    console.log('🔧 Opening project editor for:', project.name, 'ID:', project.id);
    setEditProject(project);
    setEditProjectDialog(true);
    
    // Reset documents first
    setProjectDocuments([]);
    console.log('🔄 Reset projectDocuments to empty array');
    
    // Ladda projektdokument
    try {
      const docs = await getProjectDocuments(project.id);
      console.log('📁 Loaded project documents:', docs.length, 'files');
      console.log('📁 Document details:', docs);
      setProjectDocuments(docs);
      console.log('📋 Set projectDocuments state to:', docs.length, 'documents');
    } catch (error) {
      console.error('❌ Error loading project documents:', error);
      setProjectDocuments([]);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editProject.id) return;

    try {
      setUploadingDoc(true);
      console.log('📤 Starting document upload:', file.name, 'for project:', editProject.id);
      
      const uploadedDoc = await uploadProjectDocument(editProject.id, file);
      console.log('✅ Document uploaded successfully:', uploadedDoc);
      
      // Uppdatera dokumentlistan
      const updatedDocs = [...projectDocuments, uploadedDoc];
      console.log('📋 Before update - projectDocuments.length:', projectDocuments.length);
      console.log('📋 New document to add:', uploadedDoc);
      setProjectDocuments(updatedDocs);
      console.log('📋 After update - updatedDocs.length:', updatedDocs.length);
      
      // Uppdatera även allProjectDocuments för huvudlistan
      setAllProjectDocuments(prev => ({
        ...prev,
        [editProject.id!]: updatedDocs
      }));
      console.log('📋 Updated allProjectDocuments for project:', editProject.id);
      
      // Rensa input
      e.target.value = '';
      
      // Force re-render genom att uppdatera project state också
      setEditProject({...editProject});
      console.log('🔄 Forced project state update to trigger re-render');
      
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      alert('Kunde inte ladda upp dokumentet. Försök igen.');
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

  // 🧹 RENSA ALL DATA - för att starta från början
  const handleClearAllData = async () => {
    if (!window.confirm('🚨 Är du säker på att du vill radera ALLA uppgifter och projekt för detta år? Detta kan inte ångras!')) {
      return;
    }

    if (!window.confirm('⚠️ SISTA VARNINGEN: Detta kommer radera ALL underhållsdata för ' + selectedYear + '. Fortsätta?')) {
      return;
    }

    try {
      setClearingData(true);
      console.log('🧹 Clearing all data for year:', selectedYear);

      // Radera alla uppgifter för året
      for (const task of tasks) {
        await deleteMaintenanceTask(task.id);
      }

      // Radera alla projekt (oavsett år - användaren får välja vad de vill behålla)
      for (const project of majorProjects) {
        await deleteMajorProject(project.id);
      }

      // Uppdatera lokalt state
      setTasks([]);
      setMajorProjects([]);

      alert('✅ All data har raderats framgångsrikt!');

    } catch (error) {
      console.error('❌ Error clearing data:', error);
      alert('❌ Ett fel uppstod vid rensning av data. Se konsolen för detaljer.');
    } finally {
      setClearingData(false);
    }
  };

  const renderTaskItem = (task: MaintenanceTask) => (
    <ListItem 
      key={task.id} 
      sx={{ 
        pl: 0, 
        pr: isMobile ? 1 : 10, 
        flexDirection: 'column', 
        alignItems: 'stretch',
        py: isMobile ? 1.5 : 1
      }}
    >
      <Box display="flex" alignItems="flex-start" width="100%">
        <ListItemIcon sx={{ minWidth: isMobile ? '36px' : '42px', mt: '9px' }}>
          <Checkbox
            checked={task.completed}
            onChange={() => handleTaskToggle(task.id)}
            color="primary"
            size={isMobile ? 'medium' : 'medium'}
          />
        </ListItemIcon>
        <ListItemText
          sx={{ flex: 1 }}
          disableTypography
          primary={
            <Box display="flex" alignItems="center" gap={isMobile ? 0.5 : 1} flexWrap="wrap">
              <Typography 
                sx={{ 
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? 'text.secondary' : 'text.primary'
                }}
              >
                {task.name}
              </Typography>
              
              {task.assignee_id && (
                <Chip 
                  label={`👤 ${users.find(u => u.id === task.assignee_id)?.full_name || 'Tilldelad'}`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ 
                    height: isMobile ? '24px' : '20px',
                    fontSize: isMobile ? '0.75rem' : '0.7rem',
                    mr: isMobile ? 0.5 : 0
                  }}
                />
              )}

              {task.is_recurring && !isMobile && (
                <Chip 
                  label={`🔄 ${getRecurrenceLabel(task.recurrence_pattern)}`}
                  size="small" 
                  color="info"
                  variant="outlined"
                  title={`Återkommande uppgift\n• Nästa: ${task.next_due_date || 'Saknas!'}\n• Mönster: ${task.recurrence_pattern}\n• Klicka för debug`}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🔍 Recurring task debug data:', {
                      name: task.name,
                      is_recurring: task.is_recurring,
                      recurrence_pattern: task.recurrence_pattern,
                      due_date: task.due_date,
                      next_due_date: task.next_due_date,
                      parent_template_id: task.parent_template_id,
                      completed: task.completed,
                      year: task.year
                    });
                    alert(`🔍 Debug info för "${task.name}":\n\n` +
                          `• Återkommande: ${task.is_recurring}\n` +
                          `• Mönster: ${task.recurrence_pattern}\n` +
                          `• Förfallodatum: ${task.due_date}\n` +
                          `• Nästa förfallodatum: ${task.next_due_date || '❌ SAKNAS!'}\n` +
                          `• År: ${task.year}\n` +
                          `• Slutförd: ${task.completed}\n\n` +
                          `Se konsolen för fullständig data.`);
                  }}
                  sx={{ 
                    height: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'info.light' }
                  }}
                />
              )}
            </Box>
          }
          secondary={
            <Box component="span" sx={{ display: 'block' }}>
              {task.description && (
                <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                  {task.description}
                </Typography>
              )}
              {task.due_date && (
                <Typography 
                  variant="caption" 
                  component="span"
                  color={
                    task.completed 
                      ? 'text.secondary' 
                      : new Date(task.due_date) < new Date() 
                        ? 'error.main' 
                        : 'text.secondary'
                  }
                  sx={{ 
                    mt: task.description ? 0.5 : 0,
                    display: 'block'
                  }}
                >
                  Förfaller: {task.due_date}
                </Typography>
              )}
              {task.completed && task.completed_date && (
                <Typography 
                  variant="caption" 
                  component="span"
                  color="success.main" 
                  sx={{ 
                    mt: 0.5,
                    display: 'block'
                  }}
                >
                  Slutfört: {task.completed_date}
                </Typography>
              )}
            </Box>
          }
        />
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          ml: isMobile ? 0.5 : 1,
          gap: isMobile ? 0.25 : 0.5
        }}>
          <IconButton
            size={isMobile ? "medium" : "small"}
            onClick={() => handleEditTask(task)}
            sx={{ 
              minWidth: isMobile ? 44 : 'auto',
              minHeight: isMobile ? 44 : 'auto'
            }}
          >
            <EditIcon fontSize={isMobile ? "medium" : "small"} />
          </IconButton>
          <IconButton
            size={isMobile ? "medium" : "small"}
            onClick={() => handleDeleteTask(task.id)}
            color="error"
            sx={{ 
              minWidth: isMobile ? 44 : 'auto',
              minHeight: isMobile ? 44 : 'auto'
            }}
          >
            <DeleteIcon fontSize={isMobile ? "medium" : "small"} />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ 
        ml: isMobile ? '36px' : '42px', 
        mr: isMobile ? '10px' : '88px', 
        mt: 1 
      }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Anteckningar..."
          value={task.notes || ''}
          onChange={(e) => handleTaskNoteChange(task.id, e.target.value)}
          multiline
          rows={1}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: isMobile ? '0.875rem' : '0.875rem'
            }
          }}
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
  
  // 📅 Utökad års-range för återkommande uppgifter (nu när vi skapar 3+ år framåt)
  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - 3 + i);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress size={40} />
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
      <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexDirection={isMobile ? "column" : "row"} gap={2}>
          <Box sx={{ mb: isMobile ? 2 : 0 }}>
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
              Underhållsplan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isMobile ? "Översikt av underhåll och projekt" : "Enkel översikt över årets underhållsarbeten och större projekt"}
            </Typography>
          </Box>
          
          {/* Desktop Controls */}
          {!isMobile && (
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              {/* Keep all the existing buttons for desktop */}
            {/* 🧹 RENSA ALL DATA KNAPP */}
            <Button 
              size="small" 
              color="error" 
              variant="outlined"
              onClick={handleClearAllData}
              disabled={clearingData || (tasks.length === 0 && majorProjects.length === 0)}
              sx={{ 
                minWidth: 140,
                opacity: (tasks.length === 0 && majorProjects.length === 0) ? 0.5 : 1
              }}
            >
              {clearingData ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Rensar...
                </>
              ) : (
                '🧹 Rensa alla'
              )}
            </Button>

            {/* 🧪 TEST ÅTERKOMMANDE MÖNSTER KNAPP */}
            <Button 
              size="small" 
              color="info" 
              variant="outlined"
              onClick={testRecurrencePatterns}
              sx={{ 
                minWidth: 120,
                display: process.env.NODE_ENV === 'development' ? 'block' : 'none' // Bara i dev-miljö
              }}
            >
              🧪 Testa återkommande
            </Button>

            {/* 🔄 GENERERA SAKNADE INSTANSER KNAPP */}
            <Button 
              size="small" 
              color="success" 
              variant="outlined"
              onClick={generateMissingRecurringInstances}
              sx={{ 
                minWidth: 150,
                ml: 1,
                display: process.env.NODE_ENV === 'development' ? 'block' : 'none' // Bara i dev-miljö
              }}
            >
              🔄 Generera saknade
            </Button>

            {/* 🧹 RENSA DUBBLETTER KNAPP */}
            <Button 
              size="small" 
              color="error" 
              variant="outlined"
              onClick={() => cleanupDuplicateRecurringTasks(true)}
              sx={{ 
                minWidth: 120,
                ml: 1,
                display: process.env.NODE_ENV === 'development' ? 'block' : 'none' // Bara i dev-miljö
              }}
            >
              🧹 Rensa dubbletter
            </Button>



            {/* 🎯 MODERN ÅR-VÄLJARE MED PILAR */}
            <Tooltip title="Använd pilar eller tangentbord (←/→) för att navigera mellan år">
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                px: 1.5,
                py: 0.5,
                backgroundColor: 'background.paper',
                cursor: 'pointer'
              }}>
              <IconButton 
                size="small" 
                onClick={() => setSelectedYear(selectedYear - 1)}
                disabled={selectedYear <= currentYear - 3}
                sx={{ 
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:disabled': { opacity: 0.3 }
                }}
              >
                <ChevronLeft />
              </IconButton>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  minWidth: 60, 
                  textAlign: 'center',
                  fontWeight: selectedYear === currentYear ? 'bold' : 'normal',
                  color: selectedYear === currentYear ? 'primary.main' : 'text.primary'
                }}
              >
                {selectedYear}
                {selectedYear === currentYear && ' 📅'}
              </Typography>
              
              <IconButton 
                size="small" 
                onClick={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= currentYear + 6}
                sx={{ 
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:disabled': { opacity: 0.3 }
                }}
              >
                <ChevronRight />
              </IconButton>
              </Box>
            </Tooltip>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Visa som</InputLabel>
                                      <Select value={sortBy} label="Visa som" onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                          <MenuItem value="due_date">🗓️ Sorterat efter förfallodatum</MenuItem>
                          <MenuItem value="status">✅ Sorterat efter status</MenuItem>
                          <MenuItem value="name">📝 Sorterat efter namn</MenuItem>
                          <MenuItem value="created_at">📅 Sorterat efter skapad</MenuItem>
                        </Select>
            </FormControl>
            
<FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Ordning</InputLabel>
              <Select value={sortOrder} label="Ordning" onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
                <MenuItem value="asc">Stigande</MenuItem>
                <MenuItem value="desc">Fallande</MenuItem>
              </Select>
            </FormControl>
            </Box>
          )}
          
          {/* Mobile Controls */}
          {isMobile && (
            <Box sx={{ width: '100%' }}>
              {/* Essential mobile controls */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                {/* Year Selector - Simplified for mobile */}
                <Tooltip title="Navigera mellan år">
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    backgroundColor: 'background.paper'
                  }}>
                    <IconButton 
                      size="small" 
                      onClick={() => setSelectedYear(selectedYear - 1)}
                      disabled={selectedYear <= currentYear - 3}
                    >
                      <ChevronLeft />
                    </IconButton>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        minWidth: 50, 
                        textAlign: 'center',
                        fontWeight: selectedYear === currentYear ? 'bold' : 'normal',
                        color: selectedYear === currentYear ? 'primary.main' : 'text.primary'
                      }}
                    >
                      {selectedYear}
                    </Typography>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => setSelectedYear(selectedYear + 1)}
                      disabled={selectedYear >= currentYear + 6}
                    >
                      <ChevronRight />
                    </IconButton>
                  </Box>
                </Tooltip>
                
                {/* Filters Toggle */}
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                  sx={{ minWidth: 100 }}
                >
                  {mobileFiltersOpen ? 'Dölj filter' : 'Visa filter'}
                </Button>
              </Box>
              
              {/* Collapsible Mobile Filters */}
              <Collapse in={mobileFiltersOpen}>
                <Box sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  backgroundColor: 'grey.50'
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Visa som</InputLabel>
                        <Select value={sortBy} label="Visa som" onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                          <MenuItem value="due_date">🗓️ Efter datum</MenuItem>
                          <MenuItem value="status">✅ Efter status</MenuItem>
                          <MenuItem value="name">📝 Efter namn</MenuItem>
                          <MenuItem value="created_at">📅 Efter skapad</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Ordning</InputLabel>
                        <Select value={sortOrder} label="Ordning" onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
                          <MenuItem value="asc">Stigande</MenuItem>
                          <MenuItem value="desc">Fallande</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Essential actions for mobile */}
                    <Grid item xs={6}>
                      <Button 
                        fullWidth
                        size="small" 
                        color="error" 
                        variant="outlined"
                        onClick={handleClearAllData}
                        disabled={clearingData || (tasks.length === 0 && majorProjects.length === 0)}
                      >
                        {clearingData ? 'Rensar...' : '🧹 Rensa'}
                      </Button>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Button 
                        fullWidth
                        size="small" 
                        variant="outlined"
                        onClick={() => setNewTaskDialog(true)}
                      >
                        + Uppgift
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Box>
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
              
{tasks.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h4" sx={{ mb: 2 }}>📋</Typography>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Välkommen till Underhållsplanen!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                    Skapa och hantera underhållsuppgifter för {selectedYear}. 
                    Håll koll på vad som behöver göras och när.
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => setNewTaskDialog(true)}
                    sx={{ mb: 2 }}
                  >
                    Skapa första uppgiften
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    💡 Tips: Börja med återkommande uppgifter som rengöring eller kontroller
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Progress indicator */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="medium">
                        Framsteg {selectedYear}
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {stats.completed} av {stats.total} slutförda
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1, height: 8 }}>
                      <Box
                        sx={{
                          width: `${stats.percentage}%`,
                          bgcolor: stats.percentage === 100 ? 'success.main' : 'primary.main',
                          height: 8,
                          borderRadius: 1,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {stats.percentage}% slutfört
                    </Typography>
                  </Box>
                  
                  {/* Alla uppgifter i en sorterad lista */}
                  <List dense>
                    {getAllTasksSorted().map(task => renderTaskItem(task))}
                  </List>
                </>
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
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>🏗️</Typography>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Inga projekt planerade
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Planera framtida renoveringar och större underhållsarbeten
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => setNewProjectDialog(true)}
                  >
                    Skapa första projektet
                  </Button>
                </Box>
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
                          disableTypography
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
                                                            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="caption">
                                  Status: {getProjectStatusLabel(project.status)}
                                </Typography>
                                {allProjectDocuments[project.id] && allProjectDocuments[project.id].length > 0 && (
                                  <Chip
                                    label={`📎 ${allProjectDocuments[project.id].length} dokument`}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProjectDocuments(allProjectDocuments[project.id]);
                                      setDocumentsMenuAnchor(e.currentTarget);
                                    }}
                                    sx={{ 
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: 'primary.light', color: 'white' }
                                    }}
                                  />
                                )}
                              </Box>
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
      <Dialog 
        open={newProjectDialog} 
        onClose={() => setNewProjectDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Lägg till större projekt</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* GRUNDLÄGGANDE INFORMATION */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              📋 Grundläggande information
            </Typography>
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
              sx={{ mb: 3 }}
            />

            {/* PLANERING & BUDGET */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              💰 Planering & Budget
            </Typography>
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
              sx={{ mb: 3 }}
            />

            {/* KLASSIFICERING */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              🏷️ Klassificering
            </Typography>
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
            {/* LEVERANTÖR & GODKÄNNANDE */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              👥 Leverantör & Godkännande
            </Typography>
            <TextField
              fullWidth
              label="Entreprenör/Leverantör"
              value={newProject.contractor || ''}
              onChange={(e) => setNewProject({...newProject, contractor: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              💡 Tips: Använd ✏️ redigera-ikonen efter att projektet skapats för att ladda upp dokument som kontrakt och tillstånd.
            </Typography>
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
      <Dialog 
        open={newTaskDialog} 
        onClose={() => setNewTaskDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Lägg till underhållsuppgift</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* GRUNDLÄGGANDE INFORMATION */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              📋 Grundläggande information
            </Typography>
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
              sx={{ mb: 3 }}
            />

            {/* TIDPLANERING */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              📅 Tidplanering
            </Typography>

            {!newTask.is_recurring && (
              <TextField
                fullWidth
                label="Förfallodatum"
                type="date"
                value={newTask.due_date || ''}
                onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 3 }}
              />
            )}

            {/* TILLDELNING */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              👤 Tilldelning
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tilldela till användare</InputLabel>
              <Select
                value={newTask.assignee_id || ''}
                onChange={(e) => setNewTask({...newTask, assignee_id: e.target.value})}
                label="Tilldela till användare"
              >
                <MenuItem value="">
                  <em>Ingen tilldelning</em>
                </MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ÅTERKOMMANDE FUNKTIONALITET */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              🔄 Återkommande underhåll
            </Typography>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Skapa uppgifter som automatiskt planeras för framtiden enligt ett schema.
              </Typography>
                
                <FormControlLabel
                  sx={{ mb: 2 }}
                  control={
                    <Checkbox
                      checked={newTask.is_recurring || false}
                      onChange={(e) => setNewTask({
                        ...newTask, 
                        is_recurring: e.target.checked,
                        recurrence_pattern: e.target.checked ? 'annually' : undefined
                      })}
                      color="primary"
                    />
                  }
                  label="Detta underhåll återkommer regelbundet"
                />

                {newTask.is_recurring && (
                  <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, backgroundColor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      ⚙️ Återkommande schema
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Frekvens</InputLabel>
                      <Select
                        value={newTask.recurrence_pattern || 'annually'}
                        onChange={(e) => setNewTask({...newTask, recurrence_pattern: e.target.value as MaintenanceTask['recurrence_pattern']})}
                        label="Frekvens"
                      >
                        <MenuItem value="monthly">🗓️ Varje månad</MenuItem>
                        <MenuItem value="quarterly">📅 Varje kvartal (3 månader)</MenuItem>
                        <MenuItem value="semi_annually">📆 Två gånger per år</MenuItem>
                        <MenuItem value="annually">🗓️ En gång per år</MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <TextField
                        label="Startdatum"
                        type="date"
                        value={newTask.due_date || ''}
                        onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        helperText="Första uppgiften"
                        sx={{ flex: 1 }}
                      />
                      
                      <TextField
                        label="Slutdatum (valfritt)"
                        type="date"
                        value={newTask.end_date || ''}
                        onChange={(e) => setNewTask({...newTask, end_date: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        helperText="Sista uppgiften"
                        sx={{ flex: 1 }}
                      />
                    </Box>

                    {/* Smart Preview */}
                    {newTask.due_date && newTask.recurrence_pattern && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          📅 <strong>Förhandsgranskning:</strong> {' '}
                          {newTask.recurrence_pattern === 'monthly' && 'Månadsvis från'} 
                          {newTask.recurrence_pattern === 'quarterly' && 'Kvartalsvis från'} 
                          {newTask.recurrence_pattern === 'semi_annually' && 'Halvårsvis från'} 
                          {newTask.recurrence_pattern === 'annually' && 'Årsvis från'} 
                          {' '}{newTask.due_date}
                          {newTask.end_date ? ` till ${newTask.end_date}` : ' (pågående)'}
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                )}

                {newTask.is_recurring && (
                  <Typography variant="caption" color="text.secondary">
                    💡 <strong>Tips:</strong> Återkommande uppgifter skapar automatiskt nya instanser enligt schemat. 
                    Perfekt för BRF-underhåll som stuprännor, ventilation, etc.
                  </Typography>
                )}
              </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTaskDialog(false)}>Avbryt</Button>
          <Button onClick={handleAddMaintenanceTask} variant="contained">
            Lägg till
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎯 PROGRESS UI MODAL för återkommande uppgifter */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: 9999, // Mycket hög z-index för att hamna över allt
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        open={recurringProgress.isVisible}
      >
        <Card sx={{ 
          p: 4, 
          minWidth: 400, 
          maxWidth: 500,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 10000, // Ännu högre z-index för kortet
          position: 'relative'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildIcon color="primary" />
              Skapar återkommande uppgifter
            </Typography>
            
            {/* Progress Steps */}
            <Stepper activeStep={recurringProgress.currentStep - 1} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Planerar</StepLabel>
              </Step>
              <Step>
                <StepLabel>Beräknar</StepLabel>
              </Step>
              <Step>
                <StepLabel>Skapar</StepLabel>
              </Step>
              <Step>
                <StepLabel>Slutför</StepLabel>
              </Step>
            </Stepper>
            
            {/* Current Step Description */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {recurringProgress.stepDescription}
            </Typography>
            
            {/* Progress Bar */}
            <LinearProgress 
              variant="determinate" 
              value={recurringProgress.percentage} 
              sx={{ 
                mb: 2, 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  transition: 'transform 0.4s ease-in-out'
                }
              }}
            />
            
            {/* Progress Details */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {recurringProgress.instancesCreated > 0 && (
                  `${recurringProgress.instancesCreated} instanser skapade`
                )}
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight="medium">
                {recurringProgress.percentage}% • {recurringProgress.estimatedTimeRemaining}
              </Typography>
            </Box>
            
            {/* Success Animation & OK Button */}
            {recurringProgress.percentage === 100 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                  <CheckIcon sx={{ fontSize: 48, color: 'success.main' }} />
                </Box>
                
                {/* Summary Information */}
                <Box sx={{ mb: 2, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.dark" textAlign="center">
                    ✅ <strong>Klart!</strong> {recurringProgress.instancesCreated} återkommande instanser skapade
                  </Typography>
                </Box>
                
                {/* OK Button */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => {
                      setRecurringProgress({ 
                        isVisible: false, 
                        currentStep: 1, 
                        totalSteps: 4,
                        percentage: 0, 
                        stepDescription: '',
                        instancesCreated: 0,
                        estimatedTimeRemaining: ''
                      });
                    }}
                    sx={{ minWidth: 120 }}
                  >
                    OK
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Backdrop>

      {/* Dialog för redigering av underhållsuppgift */}
      <Dialog 
        open={editTaskDialog} 
        onClose={() => setEditTaskDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
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

            {/* TILLDELNING */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tilldela till användare</InputLabel>
              <Select
                value={editTask.assignee_id || ''}
                onChange={(e) => setEditTask({...editTask, assignee_id: e.target.value})}
                label="Tilldela till användare"
              >
                <MenuItem value="">
                  <em>Ingen tilldelning</em>
                </MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ÅTERKOMMANDE FUNKTIONALITET FÖR REDIGERING */}
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                🔄 Återkommande underhåll
              </Typography>
              
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <Checkbox
                  checked={editTask.is_recurring || false}
                  onChange={(e) => setEditTask({
                    ...editTask, 
                    is_recurring: e.target.checked,
                    recurrence_pattern: e.target.checked ? editTask.recurrence_pattern || 'annually' : undefined
                  })}
                />
                <Typography component="span" sx={{ ml: 1 }}>
                  Detta underhåll återkommer regelbundet
                </Typography>
              </FormControl>

              {editTask.is_recurring && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Återkommer</InputLabel>
                  <Select
                    value={editTask.recurrence_pattern || 'annually'}
                    onChange={(e) => setEditTask({...editTask, recurrence_pattern: e.target.value as MaintenanceTask['recurrence_pattern']})}
                    label="Återkommer"
                  >
                    <MenuItem value="monthly">🗓️ Varje månad</MenuItem>
                    <MenuItem value="quarterly">📅 Varje kvartal (3 månader)</MenuItem>
                    <MenuItem value="semi_annually">📆 Två gånger per år</MenuItem>
                    <MenuItem value="annually">🗓️ En gång per år</MenuItem>
                  </Select>
                </FormControl>
              )}

              {editTask.is_recurring && editTask.next_due_date && (
                <Typography variant="caption" color="text.secondary">
                  🗓️ <strong>Nästa planerade:</strong> {new Date(editTask.next_due_date).toLocaleDateString('sv-SE')}
                </Typography>
              )}
            </Box>
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
      <Dialog 
        open={editProjectDialog} 
        onClose={() => setEditProjectDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
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
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
              📄 Projektdokument
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ladda upp kontrakt, tillstånd, foton och andra dokument relaterade till projektet.
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

      {/* Documents Menu */}
      <Menu
        anchorEl={documentsMenuAnchor}
        open={Boolean(documentsMenuAnchor)}
        onClose={handleCloseDocumentsMenu}
        PaperProps={{
          sx: { maxWidth: 400, minWidth: 300 }
        }}
      >
        {selectedProjectDocuments.map((doc) => (
          <MenuItem
            key={doc.id}
            onClick={() => {
              window.open(doc.url, '_blank');
              handleCloseDocumentsMenu();
            }}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {doc.mimetype?.includes('pdf') ? (
                <PictureAsPdfIcon color="error" />
              ) : doc.mimetype?.includes('image') ? (
                <PhotoIcon color="primary" />
              ) : (
                <AttachFileIcon />
              )}
            </ListItemIcon>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {doc.originalName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString('sv-SE')}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Mobile Floating Action Button */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Snabbåtgärder"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            '& .MuiSpeedDial-fab': {
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }
          }}
          icon={<AddIcon />}
          direction="up"
        >
          <SpeedDialAction
            icon={<CheckIcon />}
            tooltipTitle="Lägg till uppgift"
            onClick={() => setNewTaskDialog(true)}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                backgroundColor: 'success.main',
                color: 'white'
              }
            }}
          />
          <SpeedDialAction
            icon={<BuildIcon />}
            tooltipTitle="Lägg till projekt"
            onClick={() => setNewProjectDialog(true)}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                backgroundColor: 'warning.main',
                color: 'white'
              }
            }}
          />
        </SpeedDial>
      )}
    </Container>
  );
};

export default SimpleMaintenancePlan;