const createTaskManager = (initialTasks = []) => {
  // Estado privado usando closure
  let tasks = [...initialTasks];
  let nextId = tasks.length > 0 ? Math.max(...tasks.map(task => task.id)) + 1 : 1;

  // Generador de IDs únicos
  const generateId = () => nextId++;

  // Validaciones
  const validateTaskData = ({ title, description = '', priority = 'medium', dueDate = null } = {}) => {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('El título de la tarea es requerido y debe ser un string válido');
    }
    
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      throw new Error('La prioridad debe ser: low, medium o high');
    }

    if (dueDate && !(dueDate instanceof Date) && isNaN(new Date(dueDate).getTime())) {
      throw new Error('La fecha de vencimiento debe ser una fecha válida');
    }

    return {
      title: title.trim(),
      description: description?.toString().trim() || '',
      priority,
      dueDate: dueDate ? new Date(dueDate) : null
    };
  };

  // Métodos públicos
  return {
    // Agregar tarea
    addTask: (taskData) => {
      const validatedData = validateTaskData(taskData);
      
      const newTask = {
        id: generateId(),
        ...validatedData,
        completed: false,
        createdAt: new Date(),
        completedAt: null
      };

      tasks.push(newTask);
      return newTask;
    },

    // Marcar como completada
    markAsCompleted: (taskId) => {
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error(`Tarea con ID ${taskId} no encontrada`);
      }

      tasks[taskIndex] = {
        ...tasks[taskIndex],
        completed: true,
        completedAt: new Date()
      };

      return tasks[taskIndex];
    },

    // Marcar como pendiente
    markAsPending: (taskId) => {
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error(`Tarea con ID ${taskId} no encontrada`);
      }

      tasks[taskIndex] = {
        ...tasks[taskIndex],
        completed: false,
        completedAt: null
      };

      return tasks[taskIndex];
    },

    // Eliminar tarea
    deleteTask: (taskId) => {
      const initialLength = tasks.length;
      tasks = tasks.filter(task => task.id !== taskId);
      
      if (tasks.length === initialLength) {
        throw new Error(`Tarea con ID ${taskId} no encontrada`);
      }

      return true;
    },

    // Filtrar tareas con parámetros avanzados
    filterTasks: ({ 
      completed = null, 
      priority = null, 
      searchTerm = '',
      dueBefore = null,
      dueAfter = null 
    } = {}) => {
      return tasks.filter(task => {
        // Filtro por estado completado
        if (completed !== null && task.completed !== completed) {
          return false;
        }

        // Filtro por prioridad
        if (priority && task.priority !== priority) {
          return false;
        }

        // Filtro por término de búsqueda
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(term);
          const matchesDescription = task.description.toLowerCase().includes(term);
          
          if (!matchesTitle && !matchesDescription) {
            return false;
          }
        }

        // Filtro por fecha de vencimiento
        if (dueBefore && task.dueDate) {
          const dueBeforeDate = new Date(dueBefore);
          if (task.dueDate > dueBeforeDate) {
            return false;
          }
        }

        if (dueAfter && task.dueDate) {
          const dueAfterDate = new Date(dueAfter);
          if (task.dueDate < dueAfterDate) {
            return false;
          }
        }

        return true;
      });
    },

    // Obtener tarea por ID
    getTask: (taskId) => {
      const task = tasks.find(task => task.id === taskId);
      
      if (!task) {
        throw new Error(`Tarea con ID ${taskId} no encontrada`);
      }

      return { ...task };
    },

    // Actualizar tarea
    updateTask: (taskId, updates) => {
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error(`Tarea con ID ${taskId} no encontrada`);
      }

      const { completed, completedAt, createdAt, id, ...allowedUpdates } = updates;
      const validatedUpdates = validateTaskData(allowedUpdates);

      tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...validatedUpdates
      };

      return tasks[taskIndex];
    },

    // Obtener todas las tareas
    getAllTasks: () => [...tasks],

    // Estadísticas
    getStatistics: () => {
      const total = tasks.length;
      const completed = tasks.filter(task => task.completed).length;
      const pending = total - completed;
      
      const priorityStats = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {});

      const overdue = tasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < new Date()
      ).length;

      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        pending,
        overdue,
        completionRate: Math.round(completionRate * 100) / 100,
        byPriority: priorityStats
      };
    },

    // Métodos de utilidad
    getTasksDueToday: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return tasks.filter(task => 
        task.dueDate && 
        task.dueDate >= today && 
        task.dueDate < tomorrow
      );
    },

    // Limpiar tareas completadas
    clearCompleted: () => {
      const completedCount = tasks.filter(task => task.completed).length;
      tasks = tasks.filter(task => !task.completed);
      return completedCount;
    },

    // Restablecer el sistema
    reset: (newTasks = []) => {
      tasks = [...newTasks];
      nextId = tasks.length > 0 ? Math.max(...tasks.map(task => task.id)) + 1 : 1;
      return tasks.length;
    }
  };
};

// Ejemplo de uso
const taskManager = createTaskManager();

// Agregar tareas
taskManager.addTask({
  title: 'Aprender JavaScript avanzado',
  description: 'Estudiar closures y arrow functions',
  priority: 'high',
  dueDate: '2024-12-31'
});

taskManager.addTask({
  title: 'Hacer ejercicio',
  description: 'Ir al gimnasio',
  priority: 'medium'
});

taskManager.addTask({
  title: 'Comprar víveres',
  priority: 'low',
  dueDate: '2024-01-15'
});

// Marcar como completada
taskManager.markAsCompleted(1);

// Filtrar tareas
const pendingTasks = taskManager.filterTasks({ completed: false });
const highPriorityTasks = taskManager.filterTasks({ priority: 'high' });
const searchResults = taskManager.filterTasks({ searchTerm: 'ejercicio' });

// Obtener estadísticas
const stats = taskManager.getStatistics();

console.log('Todas las tareas:', taskManager.getAllTasks());
console.log('Tareas pendientes:', pendingTasks);
console.log('Estadísticas:', stats);

// Ejemplo de uso más avanzado
console.log('--- Uso Avanzado ---');

// Filtrar con múltiples parámetros
const complexFilter = taskManager.filterTasks({
  completed: false,
  priority: 'medium',
  searchTerm: 'ejercicio'
});

console.log('Filtro complejo:', complexFilter);

// Tareas vencidas hoy
const dueToday = taskManager.getTasksDueToday();
console.log('Tareas para hoy:', dueToday);

// Actualizar tarea
taskManager.updateTask(2, {
  title: 'Hacer ejercicio - URGENTE',
  priority: 'high'
});

console.log('Tarea actualizada:', taskManager.getTask(2));
console.log('Estadísticas actualizadas:', taskManager.getStatistics());