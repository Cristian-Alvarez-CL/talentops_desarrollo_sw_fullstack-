// script.js - VERSIÓN COMPLETA Y CORREGIDA

// Clases principales para la aplicación
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.handleTaskClick = this.handleTaskClick.bind(this);
    }

    init() {
        this.renderTaskList();
        this.setupEventListeners();
        this.updateStats();
        this.updateUpcomingTasks();
    }

    // Cargar tareas desde localStorage
    loadTasks() {
        const tasksJSON = localStorage.getItem('productivityDashboardTasks');
        if (tasksJSON) {
            try {
                return JSON.parse(tasksJSON);
            } catch (error) {
                console.error('Error al cargar tareas:', error);
                return [];
            }
        }
        return [];
    }

    // Guardar tareas en localStorage
    saveTasks() {
        try {
            localStorage.setItem('productivityDashboardTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error al guardar tareas:', error);
        }
    }

    // Agregar una nueva tarea
    addTask(title, priority = 'medium', deadline = '') {
        const newTask = {
            id: Date.now().toString(),
            title,
            priority,
            deadline,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        this.renderTaskList();
        this.updateStats();
        this.updateUpcomingTasks();
        
        // Mostrar notificación
        this.showNotification('¡Tarea agregada!', `"${title}" ha sido añadida a tu lista.`);
        
        return newTask;
    }

    // Eliminar una tarea
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const deletedTask = this.tasks[taskIndex];
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            this.renderTaskList();
            this.updateStats();
            this.updateUpcomingTasks();
            
            // Mostrar notificación
            this.showNotification('Tarea eliminada', `"${deletedTask.title}" ha sido eliminada.`);
        }
    }

    // Alternar estado de completado
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : undefined;
            this.saveTasks();
            this.renderTaskList();
            this.updateStats();
            this.updateUpcomingTasks();
            
            // Mostrar notificación
            const action = task.completed ? 'completada' : 'marcada como pendiente';
            this.showNotification('Tarea actualizada', `"${task.title}" ha sido ${action}.`);
        }
    }

    // Filtrar tareas
    filterTasks(filterType) {
        this.currentFilter = filterType;
        this.renderTaskList();
    }

    // Renderizar lista de tareas
    renderTaskList() {
        const taskListElement = document.getElementById('taskList');
        const emptyStateElement = document.getElementById('emptyTaskState');
        
        // Verificar que los elementos existen
        if (!taskListElement || !emptyStateElement) {
            console.warn('Elementos del DOM no encontrados - renderTaskList');
            return;
        }
        
        // Filtrar tareas según el filtro actual
        let filteredTasks = this.tasks;
        
        if (this.currentFilter === 'pending') {
            filteredTasks = this.tasks.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(task => task.completed);
        } else if (this.currentFilter === 'high') {
            filteredTasks = this.tasks.filter(task => task.priority === 'high');
        }
        
        // Si no hay tareas, mostrar estado vacío
        if (filteredTasks.length === 0) {
            emptyStateElement.style.display = 'flex';
            taskListElement.innerHTML = '';
            return;
        }
        
        // Ocultar estado vacío y mostrar tareas
        emptyStateElement.style.display = 'none';
        
        // Generar HTML de las tareas
        taskListElement.innerHTML = filteredTasks.map(task => {
            const priorityClass = `priority-${task.priority}`;
            const deadlineDate = task.deadline ? new Date(task.deadline) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue = deadlineDate && deadlineDate < today && !task.completed;
            
            // Formatear fecha
            let deadlineText = '';
            if (deadlineDate) {
                const deadlineDay = new Date(deadlineDate);
                deadlineDay.setHours(0, 0, 0, 0);
                
                const options = { weekday: 'short', month: 'short', day: 'numeric' };
                deadlineText = deadlineDay.toLocaleDateString('es-ES', options);
                
                // Verificar si es hoy
                if (deadlineDay.getTime() === today.getTime()) {
                    deadlineText = 'Hoy';
                }
                // Verificar si es mañana
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                if (deadlineDay.getTime() === tomorrow.getTime()) {
                    deadlineText = 'Mañana';
                }
            }
            
            return `
                <div class="task-item ${isOverdue ? 'overdue' : ''}" data-id="${task.id}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                           aria-label="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">
                    <div class="task-content">
                        <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                        <div class="task-meta">
                            <span class="priority-badge ${priorityClass}">${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}</span>
                            ${deadlineText ? `
                                <span class="task-deadline ${isOverdue ? 'overdue' : ''}">
                                    <i class="fas fa-calendar"></i>
                                    ${deadlineText}
                                    ${isOverdue ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn delete-task" aria-label="Eliminar tarea" data-id="${task.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Configurar event delegation para tareas
    setupTaskEventListeners() {
        const taskListElement = document.getElementById('taskList');
        if (!taskListElement) return;
        
        // Usar event delegation
        taskListElement.addEventListener('click', this.handleTaskClick);
    }
    
    // Manejador de clics para event delegation
    handleTaskClick(event) {
        const target = event.target;
        
        // Si se hace clic en un checkbox
        if (target.classList.contains('task-checkbox') || target.closest('.task-checkbox')) {
            const checkbox = target.classList.contains('task-checkbox') ? 
                target : target.closest('.task-checkbox');
            const taskItem = checkbox.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.id;
                this.toggleTaskCompletion(taskId);
            }
        }
        
        // Si se hace clic en el botón de eliminar
        if (target.classList.contains('delete-task') || 
            target.closest('.delete-task') ||
            target.classList.contains('fa-trash')) {
            
            const deleteBtn = target.classList.contains('delete-task') ? 
                target : (target.closest('.delete-task') || target.closest('.task-action-btn'));
            
            if (deleteBtn) {
                const taskId = deleteBtn.dataset.id;
                if (taskId) {
                    this.deleteTask(taskId);
                }
            }
        }
    }

    // Actualizar estadísticas
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const productivityRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Actualizar elementos del DOM
        const elements = {
            'totalTasks': totalTasks,
            'pendingTasks': pendingTasks,
            'completedStats': completedTasks,
            'completedTasks': completedTasks,
            'productivityRate': `${productivityRate}%`,
            'taskCounter': `${totalTasks} tareas gestionadas`
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }
        
        // Actualizar barra de progreso
        const dailyGoal = 5;
        const dailyProgress = Math.min(Math.round((completedTasks / dailyGoal) * 100), 100);
        const dailyProgressElement = document.getElementById('dailyProgress');
        const progressFillElement = document.getElementById('progressFill');
        
        if (dailyProgressElement) dailyProgressElement.textContent = `${dailyProgress}%`;
        if (progressFillElement) progressFillElement.style.width = `${dailyProgress}%`;
    }

    // Actualizar tareas próximas
    updateUpcomingTasks() {
        const upcomingListElement = document.getElementById('upcomingList');
        const emptyStateElement = document.getElementById('emptyUpcomingState');
        
        if (!upcomingListElement || !emptyStateElement) return;
        
        // Filtrar tareas pendientes con fecha límite
        const upcomingTasks = this.tasks
            .filter(task => !task.completed && task.deadline)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5);
        
        // Si no hay tareas próximas, mostrar estado vacío
        if (upcomingTasks.length === 0) {
            emptyStateElement.style.display = 'flex';
            upcomingListElement.innerHTML = '';
            return;
        }
        
        // Ocultar estado vacío y mostrar tareas
        emptyStateElement.style.display = 'none';
        
        // Generar HTML de las tareas próximas
        upcomingListElement.innerHTML = upcomingTasks.map(task => {
            const deadlineDate = new Date(task.deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isOverdue = deadlineDate < today;
            const daysDiff = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
            
            // Formatear fecha
            let deadlineText = '';
            if (daysDiff === 0) {
                deadlineText = 'Hoy';
            } else if (daysDiff === 1) {
                deadlineText = 'Mañana';
            } else if (daysDiff < 7) {
                const options = { weekday: 'long' };
                deadlineText = deadlineDate.toLocaleDateString('es-ES', options);
            } else {
                const options = { month: 'short', day: 'numeric' };
                deadlineText = deadlineDate.toLocaleDateString('es-ES', options);
            }
            
            return `
                <div class="upcoming-item">
                    <div class="upcoming-priority ${task.priority}"></div>
                    <div class="upcoming-content">
                        <div class="upcoming-title">${task.title}</div>
                        <div class="upcoming-deadline ${isOverdue ? 'overdue' : ''}">
                            <i class="fas fa-calendar"></i>
                            ${deadlineText}
                            ${isOverdue ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Configurar event listeners principales
    setupEventListeners() {
        // Formulario de nueva tarea
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const titleInput = document.getElementById('taskTitle');
                const prioritySelect = document.getElementById('taskPriority');
                const deadlineInput = document.getElementById('taskDeadline');
                
                if (!titleInput || !prioritySelect || !deadlineInput) return;
                
                const title = titleInput.value.trim();
                if (!title) {
                    this.showNotification('Error', 'Por favor, ingresa un título para la tarea.');
                    return;
                }
                
                this.addTask(title, prioritySelect.value, deadlineInput.value);
                
                // Resetear formulario
                titleInput.value = '';
                deadlineInput.value = '';
                prioritySelect.value = 'medium';
                titleInput.focus();
            });
        }
        
        // Filtros de tareas
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const filterType = e.target.dataset.filter;
                
                // Actualizar botones activos
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Aplicar filtro
                this.filterTasks(filterType);
            });
        });
        
        // Configurar event delegation para tareas
        this.setupTaskEventListeners();
    }

    // Mostrar notificación
    showNotification(title, message) {
        // Intentar usar el toast del App si existe
        if (window.app && window.app.showNotification) {
            window.app.showNotification(title, message);
            return;
        }
        
        // Fallback: mostrar en consola
        console.log(`Notificación: ${title} - ${message}`);
    }
}

class PomodoroTimer {
    constructor() {
        this.workDuration = 25;
        this.breakDuration = 5;
        this.isWorkMode = true;
        this.isRunning = false;
        this.timeLeft = this.workDuration * 60;
        this.timer = null;
        this.pomodoroCount = 0;
        this.totalFocusTime = 0;
    }

    init() {
        this.loadSettings();
        this.updateDisplay();
        this.setupEventListeners();
        this.updateStats();
    }

    // Cargar configuración desde localStorage
    loadSettings() {
        try {
            const settingsJSON = localStorage.getItem('pomodoroSettings');
            if (settingsJSON) {
                const settings = JSON.parse(settingsJSON);
                this.workDuration = settings.workDuration || 25;
                this.breakDuration = settings.breakDuration || 5;
                this.pomodoroCount = settings.pomodoroCount || 0;
                this.totalFocusTime = settings.totalFocusTime || 0;
            }
        } catch (error) {
            console.error('Error al cargar configuración Pomodoro:', error);
        }
        
        // Restaurar tiempo basado en el modo actual
        this.timeLeft = (this.isWorkMode ? this.workDuration : this.breakDuration) * 60;
    }

    // Guardar configuración en localStorage
    saveSettings() {
        try {
            const settings = {
                workDuration: this.workDuration,
                breakDuration: this.breakDuration,
                pomodoroCount: this.pomodoroCount,
                totalFocusTime: this.totalFocusTime
            };
            localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error al guardar configuración Pomodoro:', error);
        }
    }

    // Iniciar temporizador
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        const startBtn = document.getElementById('pomodoroStart');
        const pauseBtn = document.getElementById('pomodoroPause');
        
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
        
        // Mostrar notificación
        this.showNotification('Pomodoro iniciado', `Modo: ${this.isWorkMode ? 'Trabajo' : 'Descanso'}`);
    }

    // Pausar temporizador
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.timer);
        
        const startBtn = document.getElementById('pomodoroStart');
        const pauseBtn = document.getElementById('pomodoroPause');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        
        this.showNotification('Pomodoro pausado', 'El temporizador ha sido pausado.');
    }

    // Reiniciar temporizador
    reset() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        // Restaurar tiempo según el modo actual
        this.timeLeft = (this.isWorkMode ? this.workDuration : this.breakDuration) * 60;
        
        const startBtn = document.getElementById('pomodoroStart');
        const pauseBtn = document.getElementById('pomodoroPause');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        
        this.updateDisplay();
        this.showNotification('Pomodoro reiniciado', 'El temporizador ha sido reiniciado.');
    }

    // Completar sesión actual
    completeSession() {
        clearInterval(this.timer);
        this.isRunning = false;
        
        if (this.isWorkMode) {
            // Sesión de trabajo completada
            this.pomodoroCount++;
            this.totalFocusTime += this.workDuration;
            this.showNotification('¡Sesión completada!', '¡Buen trabajo! Tómate un descanso.');
            
            // Cambiar a modo descanso
            this.isWorkMode = false;
            this.timeLeft = this.breakDuration * 60;
        } else {
            // Descanso completado
            this.showNotification('Descanso terminado', '¡Volvamos al trabajo!');
            
            // Cambiar a modo trabajo
            this.isWorkMode = true;
            this.timeLeft = this.workDuration * 60;
        }
        
        this.saveSettings();
        this.updateDisplay();
        this.updateStats();
        
        const startBtn = document.getElementById('pomodoroStart');
        const pauseBtn = document.getElementById('pomodoroPause');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    }

    // Actualizar visualización
    updateDisplay() {
        const pomodoroTimeElement = document.getElementById('pomodoroTime');
        const pomodoroModeElement = document.getElementById('pomodoroMode');
        
        if (!pomodoroTimeElement || !pomodoroModeElement) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        pomodoroTimeElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        pomodoroModeElement.textContent = 
            `Modo: ${this.isWorkMode ? 'Trabajo' : 'Descanso'}`;
    }

    // Actualizar estadísticas
    updateStats() {
        const pomodoroCountElement = document.getElementById('pomodoroCount');
        const totalFocusTimeElement = document.getElementById('totalFocusTime');
        const focusTimeCounterElement = document.getElementById('focusTimeCounter');
        
        if (pomodoroCountElement) pomodoroCountElement.textContent = this.pomodoroCount;
        if (totalFocusTimeElement) totalFocusTimeElement.textContent = this.totalFocusTime;
        
        // Actualizar contador en el footer
        if (focusTimeCounterElement) {
            focusTimeCounterElement.textContent = `${this.totalFocusTime} minutos de enfoque`;
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botones de control
        const startBtn = document.getElementById('pomodoroStart');
        const pauseBtn = document.getElementById('pomodoroPause');
        const resetBtn = document.getElementById('pomodoroReset');
        
        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        
        // Configuración de duración
        const workDurationInput = document.getElementById('workDuration');
        const breakDurationInput = document.getElementById('breakDuration');
        
        if (workDurationInput) {
            workDurationInput.value = this.workDuration;
            workDurationInput.addEventListener('change', (e) => {
                const newValue = parseInt(e.target.value);
                if (newValue >= 1 && newValue <= 60) {
                    this.workDuration = newValue;
                    if (!this.isRunning && this.isWorkMode) {
                        this.timeLeft = this.workDuration * 60;
                        this.updateDisplay();
                    }
                    this.saveSettings();
                }
            });
        }
        
        if (breakDurationInput) {
            breakDurationInput.value = this.breakDuration;
            breakDurationInput.addEventListener('change', (e) => {
                const newValue = parseInt(e.target.value);
                if (newValue >= 1 && newValue <= 30) {
                    this.breakDuration = newValue;
                    if (!this.isRunning && !this.isWorkMode) {
                        this.timeLeft = this.breakDuration * 60;
                        this.updateDisplay();
                    }
                    this.saveSettings();
                }
            });
        }
    }

    // Mostrar notificación
    showNotification(title, message) {
        // Intentar usar el toast del App si existe
        if (window.app && window.app.showNotification) {
            window.app.showNotification(title, message);
            return;
        }
        
        // Fallback: mostrar en consola
        console.log(`Pomodoro: ${title} - ${message}`);
    }
}

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light-mode';
    }

    init() {
        this.applyTheme();
        this.setupEventListeners();
    }

    applyTheme() {
        document.body.className = this.currentTheme;
        localStorage.setItem('theme', this.currentTheme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        if (!icon) return;
        
        if (this.currentTheme === 'dark-mode') {
            icon.className = 'fas fa-sun';
            icon.setAttribute('aria-label', 'Cambiar a modo claro');
            themeToggle.setAttribute('aria-label', 'Cambiar a modo claro');
        } else {
            icon.className = 'fas fa-moon';
            icon.setAttribute('aria-label', 'Cambiar a modo oscuro');
            themeToggle.setAttribute('aria-label', 'Cambiar a modo oscuro');
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode';
        this.applyTheme();
        
        // Mostrar notificación
        this.showNotification('Tema cambiado', `Modo ${this.currentTheme === 'dark-mode' ? 'oscuro' : 'claro'} activado`);
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    // Mostrar notificación
    showNotification(title, message) {
        // Intentar usar el toast del App si existe
        if (window.app && window.app.showNotification) {
            window.app.showNotification(title, message);
            return;
        }
        
        // Fallback: mostrar en consola
        console.log(`Tema: ${title} - ${message}`);
    }
}

class App {
    constructor() {
        this.taskManager = null;
        this.pomodoroTimer = null;
        this.themeManager = null;
        
        // Asegurar que 'this' se refiera a la instancia de App
        this.init = this.init.bind(this);
        this.showNotification = this.showNotification.bind(this);
        
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('Inicializando aplicación...');
        
        try {
            // Inicializar componentes
            this.taskManager = new TaskManager();
            this.pomodoroTimer = new PomodoroTimer();
            this.themeManager = new ThemeManager();
            
            // Inicializar componentes
            if (this.taskManager) this.taskManager.init();
            if (this.pomodoroTimer) this.pomodoroTimer.init();
            if (this.themeManager) this.themeManager.init();
            
            // Configurar el resto de la aplicación
            this.setupGlobalEventListeners();
            this.updateCurrentDate();
            this.setupHelpModal();
            this.setupFooterButtons();
            this.setupKeyboardShortcuts();
            
            console.log('Aplicación inicializada correctamente');
            
            // Mostrar notificación de bienvenida
            setTimeout(() => {
                this.showNotification('¡Bienvenido!', 'Usa Ctrl+N para agregar una tarea rápidamente.');
            }, 500);
            
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            this.showNotification('Error', 'No se pudo inicializar la aplicación. Revisa la consola para más detalles.');
        }
    }

    updateCurrentDate() {
        const currentDateElement = document.getElementById('currentDate');
        const currentYearElement = document.getElementById('currentYear');
        
        if (!currentDateElement || !currentYearElement) return;
        
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = now.toLocaleDateString('es-ES', options);
        currentYearElement.textContent = now.getFullYear();
    }

    setupGlobalEventListeners() {
        // Limpiar todos los datos
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }
        
        // Exportar datos
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                const data = {
                    tasks: this.taskManager?.tasks || [],
                    pomodoroSettings: {
                        workDuration: this.pomodoroTimer?.workDuration || 25,
                        breakDuration: this.pomodoroTimer?.breakDuration || 5,
                        pomodoroCount: this.pomodoroTimer?.pomodoroCount || 0,
                        totalFocusTime: this.pomodoroTimer?.totalFocusTime || 0
                    },
                    theme: this.themeManager?.currentTheme || 'light-mode',
                    exportDate: new Date().toISOString()
                };
                
                try {
                    const dataStr = JSON.stringify(data, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    
                    const exportFileDefaultName = `productividad_dashboard_${new Date().toISOString().split('T')[0]}.json`;
                    
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                    
                    this.showNotification('Datos exportados', 'Los datos se han descargado correctamente.');
                } catch (error) {
                    console.error('Error al exportar datos:', error);
                    this.showNotification('Error', 'No se pudieron exportar los datos.');
                }
            });
        }
    }

    setupHelpModal() {
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeHelpModal = document.getElementById('closeHelpModal');
        
        if (!helpBtn || !helpModal || !closeHelpModal) return;
        
        helpBtn.addEventListener('click', () => {
            helpModal.classList.add('active');
        });
        
        closeHelpModal.addEventListener('click', () => {
            helpModal.classList.remove('active');
        });
        
        // Cerrar modal al hacer clic fuera
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('active');
            }
        });
        
        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && helpModal.classList.contains('active')) {
                helpModal.classList.remove('active');
            }
        });
    }

    setupFooterButtons() {
        // Los botones ya están configurados en setupGlobalEventListeners
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+N: Nueva tarea
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                const taskTitleInput = document.getElementById('taskTitle');
                if (taskTitleInput) {
                    taskTitleInput.focus();
                    this.showNotification('Nueva tarea', 'Escribe el título de tu nueva tarea.');
                }
            }
            
            // Ctrl+D: Alternar tema
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                if (this.themeManager) {
                    this.themeManager.toggleTheme();
                }
            }
            
            // Ctrl+P: Iniciar/pausar Pomodoro
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                if (this.pomodoroTimer) {
                    if (this.pomodoroTimer.isRunning) {
                        this.pomodoroTimer.pause();
                    } else {
                        this.pomodoroTimer.start();
                    }
                }
            }
            
            // Escape: Cerrar modales
            if (e.key === 'Escape') {
                const helpModal = document.getElementById('helpModal');
                if (helpModal && helpModal.classList.contains('active')) {
                    helpModal.classList.remove('active');
                }
            }
        });
    }

    showNotification(title, message) {
        const toast = document.getElementById('toast');
        if (!toast) {
            console.log(`App: ${title} - ${message}`);
            return;
        }
        
        toast.innerHTML = `
            <strong>${title}</strong>
            <p>${message}</p>
        `;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
let app = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado');
    
    // Remover cualquier clase de carga previa
    document.body.classList.remove('loading-app');
    
    // Agregar clase de carga inicial
    document.body.classList.add('loading-app');
    
    // Inicializar aplicación
    app = new App();
    
    // Hacer la aplicación globalmente accesible
    window.app = app;
    
    // Remover clase de carga
    setTimeout(() => {
        document.body.classList.remove('loading-app');
    }, 500);
});