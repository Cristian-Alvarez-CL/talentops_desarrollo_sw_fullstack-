// Estado de la aplicación
const estado = {
  tareas: JSON.parse(localStorage.getItem('tareas')) || [],
  categorias: JSON.parse(localStorage.getItem('categorias')) || [
    { id: 1, nombre: 'Personal', color: '#3498db' },
    { id: 2, nombre: 'Trabajo', color: '#e74c3c' },
    { id: 3, nombre: 'Estudio', color: '#2ecc71' }
  ],
  etiquetas: JSON.parse(localStorage.getItem('etiquetas')) || [
    { id: 1, nombre: 'Urgente', color: '#e74c3c' },
    { id: 2, nombre: 'Importante', color: '#f39c12' },
    { id: 3, nombre: 'Pendiente', color: '#3498db' }
  ],
  filtroActual: 'todas',
  categoriaFiltro: 'todas',
  busqueda: '',
  modoOscuro: localStorage.getItem('modoOscuro') === 'true',
  tareaArrastrando: null
};

// Elementos del DOM
const elementos = {
  // Formulario
  formAgregar: document.getElementById('form-agregar-tarea'),
  inputTarea: document.getElementById('input-tarea'),
  btnAgregar: document.getElementById('btn-agregar'),
  
  // Búsqueda y categorías
  inputBusqueda: document.getElementById('input-busqueda'),
  selectCategoria: document.getElementById('select-categoria'),
  selectCategoriaTarea: document.getElementById('select-categoria-tarea'),
  btnNuevaCategoria: document.getElementById('btn-nueva-categoria'),
  
  // Lista
  listaTareas: document.getElementById('lista-tareas'),
  emptyState: document.querySelector('.empty-state'),
  
  // Filtros
  filtroBtns: document.querySelectorAll('.filtro-btn'),
  
  // Estadísticas
  stats: {
    total: document.getElementById('total-tareas'),
    completadas: document.getElementById('tareas-completadas'),
    pendientes: document.getElementById('tareas-pendientes'),
    categorias: document.getElementById('total-categorias')
  },
  
  // Botones de acción
  btnLimpiar: document.getElementById('btn-limpiar-completadas'),
  toggleMode: document.getElementById('toggle-mode'),
  
  // Exportación/Importación
  exportMenuBtn: document.getElementById('export-menu-btn'),
  exportMenu: document.getElementById('export-menu'),
  exportJson: document.getElementById('export-json'),
  exportCsv: document.getElementById('export-csv'),
  importFile: document.getElementById('import-file'),
  closeExportMenu: document.getElementById('close-export-menu'),
  
  // Modal categoría
  modalCategoria: document.getElementById('modal-categoria'),
  inputNuevaCategoria: document.getElementById('input-nueva-categoria'),
  colorNuevaCategoria: document.getElementById('color-nueva-categoria'),
  btnGuardarCategoria: document.getElementById('btn-guardar-categoria'),
  btnCancelarCategoria: document.getElementById('btn-cancelar-categoria'),
  closeModalBtns: document.querySelectorAll('.close-modal'),
  
  // Etiquetas
  etiquetasDisponibles: document.getElementById('etiquetas-disponibles'),
  etiquetasSeleccionadas: document.getElementById('etiquetas-seleccionadas')
};

// Variables para seguimiento
let etiquetasSeleccionadas = new Set();
let tareaEditandoId = null;

// Inicialización
function inicializar() {
  // Aplicar modo oscuro/claro
  aplicarModo();
  
  // Cargar categorías en los selectores
  cargarCategoriasSelectores();
  
  // Cargar etiquetas disponibles
  cargarEtiquetasDisponibles();
  
  // Configurar eventos
  configurarEventos();
  
  // Renderizar vista inicial
  actualizarEstadisticas();
  renderizarTareas();
}

// Aplicar modo oscuro/claro
function aplicarModo() {
  if (estado.modoOscuro) {
    document.documentElement.setAttribute('data-theme', 'dark');
    elementos.toggleMode.innerHTML = '<i class="fas fa-sun"></i>';
    elementos.toggleMode.title = 'Cambiar a modo claro';
  } else {
    document.documentElement.removeAttribute('data-theme');
    elementos.toggleMode.innerHTML = '<i class="fas fa-moon"></i>';
    elementos.toggleMode.title = 'Cambiar a modo oscuro';
  }
}

// Cargar categorías en los selectores
function cargarCategoriasSelectores() {
  elementos.selectCategoria.innerHTML = '<option value="todas">Todas las categorías</option>';
  elementos.selectCategoriaTarea.innerHTML = '<option value="">Sin categoría</option>';
  
  estado.categorias.forEach(categoria => {
    const option1 = document.createElement('option');
    option1.value = categoria.id;
    option1.textContent = categoria.nombre;
    elementos.selectCategoria.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = categoria.id;
    option2.textContent = categoria.nombre;
    elementos.selectCategoriaTarea.appendChild(option2);
  });
}

// Cargar etiquetas disponibles
function cargarEtiquetasDisponibles() {
  elementos.etiquetasDisponibles.innerHTML = '';
  
  estado.etiquetas.forEach(etiqueta => {
    const span = document.createElement('span');
    span.className = 'etiqueta';
    span.textContent = etiqueta.nombre;
    span.style.backgroundColor = etiqueta.color;
    span.dataset.id = etiqueta.id;
    
    span.addEventListener('click', () => {
      if (etiquetasSeleccionadas.has(etiqueta.id)) {
        etiquetasSeleccionadas.delete(etiqueta.id);
        span.classList.remove('seleccionada');
      } else {
        etiquetasSeleccionadas.add(etiqueta.id);
        span.classList.add('seleccionada');
      }
      actualizarEtiquetasSeleccionadas();
    });
    
    elementos.etiquetasDisponibles.appendChild(span);
  });
}

// Actualizar etiquetas seleccionadas
function actualizarEtiquetasSeleccionadas() {
  elementos.etiquetasSeleccionadas.innerHTML = '';
  
  etiquetasSeleccionadas.forEach(id => {
    const etiqueta = estado.etiquetas.find(e => e.id === id);
    if (!etiqueta) return;
    
    const span = document.createElement('span');
    span.className = 'etiqueta seleccionada';
    span.textContent = etiqueta.nombre;
    span.style.backgroundColor = etiqueta.color;
    span.dataset.id = etiqueta.id;
    
    const eliminar = document.createElement('span');
    eliminar.className = 'eliminar-etiqueta';
    eliminar.innerHTML = ' <i class="fas fa-times"></i>';
    eliminar.addEventListener('click', (e) => {
      e.stopPropagation();
      etiquetasSeleccionadas.delete(etiqueta.id);
      actualizarEtiquetasSeleccionadas();
      
      // Actualizar etiqueta en el panel disponible
      const etiquetaDisponible = elementos.etiquetasDisponibles.querySelector(`[data-id="${etiqueta.id}"]`);
      if (etiquetaDisponible) {
        etiquetaDisponible.classList.remove('seleccionada');
      }
    });
    
    span.appendChild(eliminar);
    elementos.etiquetasSeleccionadas.appendChild(span);
  });
}

// Configurar eventos usando event delegation
function configurarEventos() {
  // Evento para agregar tarea
  elementos.formAgregar.addEventListener('submit', (e) => {
    e.preventDefault();
    agregarTarea();
  });
  
  // Búsqueda en tiempo real
  elementos.inputBusqueda.addEventListener('input', (e) => {
    estado.busqueda = e.target.value.toLowerCase();
    renderizarTareas();
  });
  
  // Filtro por categoría
  elementos.selectCategoria.addEventListener('change', (e) => {
    estado.categoriaFiltro = e.target.value;
    renderizarTareas();
  });
  
  // Filtros (todas, pendientes, completadas)
  elementos.filtroBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elementos.filtroBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      estado.filtroActual = btn.dataset.filtro;
      renderizarTareas();
    });
  });
  
  // Limpiar tareas completadas
  elementos.btnLimpiar.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres eliminar todas las tareas completadas?')) {
      estado.tareas = estado.tareas.filter(t => !t.completada);
      guardarEstado();
      actualizarEstadisticas();
      renderizarTareas();
    }
  });
  
  // Toggle modo oscuro/claro
  elementos.toggleMode.addEventListener('click', () => {
    estado.modoOscuro = !estado.modoOscuro;
    localStorage.setItem('modoOscuro', estado.modoOscuro);
    aplicarModo();
  });
  
  // Exportación/Importación
  elementos.exportMenuBtn.addEventListener('click', () => {
    elementos.exportMenu.style.display = elementos.exportMenu.style.display === 'none' ? 'block' : 'none';
  });
  
  elementos.closeExportMenu.addEventListener('click', () => {
    elementos.exportMenu.style.display = 'none';
  });
  
  elementos.exportJson.addEventListener('click', exportarJSON);
  elementos.exportCsv.addEventListener('click', exportarCSV);
  elementos.importFile.addEventListener('change', importarArchivo);
  
  // Modal categoría
  elementos.btnNuevaCategoria.addEventListener('click', () => {
    elementos.modalCategoria.style.display = 'flex';
    elementos.inputNuevaCategoria.focus();
  });
  
  elementos.btnGuardarCategoria.addEventListener('click', guardarCategoria);
  elementos.btnCancelarCategoria.addEventListener('click', cerrarModal);
  
  elementos.closeModalBtns.forEach(btn => {
    btn.addEventListener('click', cerrarModal);
  });
  
  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === elementos.modalCategoria) {
      cerrarModal();
    }
  });
  
  // Event delegation para la lista de tareas
  elementos.listaTareas.addEventListener('click', manejarEventosLista);
  elementos.listaTareas.addEventListener('change', manejarEventosLista);
  
  // Drag and drop para reordenar tareas
  configurarDragAndDrop();
}

// Event delegation para manejar eventos en la lista de tareas
function manejarEventosLista(e) {
  const tareaElemento = e.target.closest('.tarea');
  if (!tareaElemento) return;
  
  const tareaId = parseInt(tareaElemento.dataset.id);
  const tarea = estado.tareas.find(t => t.id === tareaId);
  if (!tarea) return;
  
  // Checkbox para marcar como completada
  if (e.target.classList.contains('checkbox')) {
    tarea.completada = e.target.checked;
    tareaElemento.classList.toggle('completed', tarea.completada);
    guardarEstado();
    actualizarEstadisticas();
    renderizarTareas();
  }
  
  // Botón editar
  if (e.target.classList.contains('btn-editar')) {
    if (tareaEditandoId === tareaId) {
      // Guardar cambios
      const editor = tareaElemento.querySelector('.editor');
      const nuevoTexto = editor.value.trim();
      if (nuevoTexto) {
        tarea.texto = nuevoTexto;
        tareaElemento.querySelector('.texto-tarea').textContent = nuevoTexto;
        guardarEstado();
      }
      tareaElemento.classList.remove('editando');
      e.target.innerHTML = '<i class="fas fa-edit"></i> Editar';
      tareaEditandoId = null;
    } else {
      // Salir del modo edición de otra tarea si existe
      if (tareaEditandoId) {
        const tareaEditandoElemento = elementos.listaTareas.querySelector(`[data-id="${tareaEditandoId}"]`);
        if (tareaEditandoElemento) {
          tareaEditandoElemento.classList.remove('editando');
          tareaEditandoElemento.querySelector('.btn-editar').innerHTML = '<i class="fas fa-edit"></i> Editar';
        }
      }
      
      // Entrar en modo edición
      tareaElemento.classList.add('editando');
      const editor = tareaElemento.querySelector('.editor');
      editor.value = tarea.texto;
      editor.focus();
      editor.select();
      e.target.innerHTML = '<i class="fas fa-save"></i> Guardar';
      tareaEditandoId = tareaId;
    }
  }
  
  // Botón eliminar
  if (e.target.classList.contains('btn-eliminar')) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      tareaElemento.classList.add('removing');
      setTimeout(() => {
        estado.tareas = estado.tareas.filter(t => t.id !== tareaId);
        guardarEstado();
        actualizarEstadisticas();
        renderizarTareas();
      }, 300);
    }
  }
  
  // Guardar al presionar Enter en el editor
  if (e.target.classList.contains('editor') && e.key === 'Enter') {
    const btnEditar = tareaElemento.querySelector('.btn-editar');
    if (btnEditar) btnEditar.click();
  }
  
  // Cancelar edición con Escape
  if (e.target.classList.contains('editor') && e.key === 'Escape') {
    tareaElemento.classList.remove('editando');
    tareaElemento.querySelector('.btn-editar').innerHTML = '<i class="fas fa-edit"></i> Editar';
    tareaEditandoId = null;
  }
}

// Configurar drag and drop para reordenar tareas
function configurarDragAndDrop() {
  elementos.listaTareas.addEventListener('dragstart', (e) => {
    if (!e.target.classList.contains('tarea')) return;
    
    e.target.classList.add('dragging');
    estado.tareaArrastrando = e.target;
    e.dataTransfer.effectAllowed = 'move';
  });
  
  elementos.listaTareas.addEventListener('dragover', (e) => {
    e.preventDefault();
    const tarea = e.target.closest('.tarea');
    const dragging = document.querySelector('.dragging');
    
    if (!tarea || tarea === dragging) return;
    
    const rect = tarea.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    
    if (offset < rect.height / 2) {
      tarea.classList.add('drag-over');
      tarea.parentNode.insertBefore(dragging, tarea);
    } else {
      tarea.classList.remove('drag-over');
      tarea.parentNode.insertBefore(dragging, tarea.nextSibling);
    }
  });
  
  elementos.listaTareas.addEventListener('dragleave', (e) => {
    const tarea = e.target.closest('.tarea');
    if (tarea) tarea.classList.remove('drag-over');
  });
  
  elementos.listaTareas.addEventListener('dragend', (e) => {
    const dragging = document.querySelector('.dragging');
    if (dragging) {
      dragging.classList.remove('dragging');
      
      // Actualizar orden en el estado
      const nuevasTareas = [];
      const elementosTareas = elementos.listaTareas.querySelectorAll('.tarea:not(.empty-state)');
      
      elementosTareas.forEach(elemento => {
        const tareaId = parseInt(elemento.dataset.id);
        const tarea = estado.tareas.find(t => t.id === tareaId);
        if (tarea) nuevasTareas.push(tarea);
      });
      
      estado.tareas = nuevasTareas;
      guardarEstado();
    }
    
    // Remover clase drag-over de todas las tareas
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    estado.tareaArrastrando = null;
  });
  
  // Hacer las tareas arrastrables
  elementos.listaTareas.addEventListener('mouseover', (e) => {
    const tarea = e.target.closest('.tarea');
    if (tarea) {
      tarea.setAttribute('draggable', 'true');
    }
  });
}

// Agregar nueva tarea
function agregarTarea() {
  const texto = elementos.inputTarea.value.trim();
  if (!texto) return;
  
  const categoriaId = elementos.selectCategoriaTarea.value ? parseInt(elementos.selectCategoriaTarea.value) : null;
  const etiquetasIds = Array.from(etiquetasSeleccionadas);
  
  const nuevaTarea = {
    id: Date.now(),
    texto,
    completada: false,
    fechaCreacion: new Date().toISOString(),
    categoriaId,
    etiquetasIds,
    orden: estado.tareas.length
  };
  
  estado.tareas.push(nuevaTarea);
  elementos.inputTarea.value = '';
  etiquetasSeleccionadas.clear();
  actualizarEtiquetasSeleccionadas();
  
  guardarEstado();
  actualizarEstadisticas();
  renderizarTareas();
}

// Guardar categoría nueva
function guardarCategoria() {
  const nombre = elementos.inputNuevaCategoria.value.trim();
  if (!nombre) {
    alert('Por favor ingresa un nombre para la categoría');
    return;
  }
  
  const nuevaCategoria = {
    id: Date.now(),
    nombre,
    color: elementos.colorNuevaCategoria.value
  };
  
  estado.categorias.push(nuevaCategoria);
  elementos.inputNuevaCategoria.value = '';
  
  cargarCategoriasSelectores();
  guardarEstado();
  actualizarEstadisticas();
  cerrarModal();
}

// Cerrar modal
function cerrarModal() {
  elementos.modalCategoria.style.display = 'none';
  elementos.inputNuevaCategoria.value = '';
}

// Guardar estado en localStorage
function guardarEstado() {
  localStorage.setItem('tareas', JSON.stringify(estado.tareas));
  localStorage.setItem('categorias', JSON.stringify(estado.categorias));
  localStorage.setItem('etiquetas', JSON.stringify(estado.etiquetas));
}

// Actualizar estadísticas
function actualizarEstadisticas() {
  const total = estado.tareas.length;
  const completadas = estado.tareas.filter(t => t.completada).length;
  const pendientes = total - completadas;
  
  elementos.stats.total.textContent = total;
  elementos.stats.completadas.textContent = completadas;
  elementos.stats.pendientes.textContent = pendientes;
  elementos.stats.categorias.textContent = estado.categorias.length;
  
  elementos.btnLimpiar.style.display = completadas > 0 ? 'block' : 'none';
}

// Renderizar tareas con filtros aplicados
function renderizarTareas() {
  let tareasFiltradas = estado.tareas;
  
  // Aplicar filtro de estado (todas, pendientes, completadas)
  if (estado.filtroActual === 'pendientes') {
    tareasFiltradas = tareasFiltradas.filter(t => !t.completada);
  } else if (estado.filtroActual === 'completadas') {
    tareasFiltradas = tareasFiltradas.filter(t => t.completada);
  }
  
  // Aplicar filtro de categoría
  if (estado.categoriaFiltro !== 'todas') {
    const categoriaId = parseInt(estado.categoriaFiltro);
    tareasFiltradas = tareasFiltradas.filter(t => t.categoriaId === categoriaId);
  }
  
  // Aplicar búsqueda
  if (estado.busqueda) {
    tareasFiltradas = tareasFiltradas.filter(t => 
      t.texto.toLowerCase().includes(estado.busqueda) ||
      (t.categoriaId && estado.categorias.find(c => c.id === t.categoriaId)?.nombre.toLowerCase().includes(estado.busqueda)) ||
      t.etiquetasIds.some(etiquetaId => 
        estado.etiquetas.find(e => e.id === etiquetaId)?.nombre.toLowerCase().includes(estado.busqueda)
      )
    );
  }
  
  // Limpiar lista
  elementos.listaTareas.innerHTML = '';
  
  // Mostrar empty state si no hay tareas
  if (tareasFiltradas.length === 0) {
    elementos.listaTareas.appendChild(elementos.emptyState);
    return;
  }
  
  // Crear elementos de tarea
  tareasFiltradas.forEach(tarea => {
    const elemento = crearElementoTarea(tarea);
    elementos.listaTareas.appendChild(elemento);
  });
}

// Crear elemento HTML para una tarea
function crearElementoTarea(tarea) {
  const div = document.createElement('div');
  div.className = `tarea ${tarea.completada ? 'completed' : ''} ${tareaEditandoId === tarea.id ? 'editando' : ''}`;
  div.dataset.id = tarea.id;
  div.setAttribute('draggable', 'true');
  
  // Obtener categoría
  const categoria = tarea.categoriaId ? estado.categorias.find(c => c.id === tarea.categoriaId) : null;
  
  // Obtener etiquetas
  const etiquetas = tarea.etiquetasIds.map(id => estado.etiquetas.find(e => e.id === id)).filter(e => e);
  
  // Construir HTML
  div.innerHTML = `
    ${categoria ? `<div class="tarea-categoria" style="background-color: ${categoria.color}"></div>` : ''}
    <input type="checkbox" class="checkbox" ${tarea.completada ? 'checked' : ''}>
    <span class="texto-tarea">${tarea.texto}</span>
    <input type="text" class="editor" value="${tarea.texto}" maxlength="100">
    
    ${etiquetas.length > 0 ? `
      <div class="tarea-etiquetas">
        ${etiquetas.map(etiqueta => 
          `<span class="tarea-etiqueta" style="background-color: ${etiqueta.color}">${etiqueta.nombre}</span>`
        ).join('')}
      </div>
    ` : ''}
    
    <div class="acciones">
      <button class="btn btn-small btn-primary btn-editar">
        <i class="fas ${tareaEditandoId === tarea.id ? 'fa-save' : 'fa-edit'}"></i> ${tareaEditandoId === tarea.id ? 'Guardar' : 'Editar'}
      </button>
      <button class="btn btn-small btn-danger btn-eliminar">
        <i class="fas fa-trash"></i> Eliminar
      </button>
    </div>
  `;
  
  return div;
}

// Exportar a JSON
function exportarJSON() {
  const datos = {
    tareas: estado.tareas,
    categorias: estado.categorias,
    etiquetas: estado.etiquetas,
    exportado: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tareas_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  elementos.exportMenu.style.display = 'none';
}

// Exportar a CSV
function exportarCSV() {
  // Encabezados
  let csv = 'ID,Texto,Completada,FechaCreacion,Categoria,Etiquetas\n';
  
  // Filas
  estado.tareas.forEach(tarea => {
    const categoria = tarea.categoriaId ? estado.categorias.find(c => c.id === tarea.categoriaId)?.nombre : '';
    const etiquetas = tarea.etiquetasIds.map(id => estado.etiquetas.find(e => e.id === id)?.nombre).filter(e => e).join(';');
    
    csv += `"${tarea.id}","${tarea.texto.replace(/"/g, '""')}","${tarea.completada}","${tarea.fechaCreacion}","${categoria}","${etiquetas}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tareas_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  elementos.exportMenu.style.display = 'none';
}

// Importar archivo
function importarArchivo(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const contenido = event.target.result;
      
      if (file.name.endsWith('.json')) {
        const datos = JSON.parse(contenido);
        
        if (confirm('¿Deseas reemplazar los datos actuales o fusionarlos?')) {
          // Reemplazar
          estado.tareas = datos.tareas || [];
          estado.categorias = datos.categorias || [];
          estado.etiquetas = datos.etiquetas || [];
        } else {
          // Fusionar
          if (datos.tareas) estado.tareas.push(...datos.tareas);
          if (datos.categorias) estado.categorias.push(...datos.categorias);
          if (datos.etiquetas) estado.etiquetas.push(...datos.etiquetas);
        }
        
      } else if (file.name.endsWith('.csv')) {
        // Parsear CSV (implementación básica)
        const lineas = contenido.split('\n');
        const nuevasTareas = [];
        
        for (let i = 1; i < lineas.length; i++) {
          if (!lineas[i].trim()) continue;
          
          // Parseo simple de CSV
          const columnas = lineas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (columnas.length >= 4) {
            const tarea = {
              id: parseInt(columnas[0].replace(/"/g, '')) || Date.now() + i,
              texto: columnas[1].replace(/"/g, ''),
              completada: columnas[2].replace(/"/g, '') === 'true',
              fechaCreacion: columnas[3].replace(/"/g, ''),
              categoriaId: null,
              etiquetasIds: [],
              orden: nuevasTareas.length
            };
            
            nuevasTareas.push(tarea);
          }
        }
        
        estado.tareas.push(...nuevasTareas);
      }
      
      guardarEstado();
      actualizarEstadisticas();
      renderizarTareas();
      alert('Datos importados correctamente');
      
    } catch (error) {
      alert('Error al importar el archivo: ' + error.message);
    }
    
    // Limpiar input de archivo
    elementos.importFile.value = '';
  };
  
  reader.readAsText(file);
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializar);