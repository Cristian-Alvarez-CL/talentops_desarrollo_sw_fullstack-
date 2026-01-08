const API_URL = '/api';
let productosCache = [];
let categoriasCache = [];
let proveedoresCache = [];


function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).style.display = 'block';
    if(event && event.target) event.target.classList.add('active');

    if (tabId === 'dashboard') loadDashboard();
    if (tabId === 'productos') cargarProductos();
    if (tabId === 'ordenes') cargarOrdenes();
}


async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard`);
        const data = await res.json();
        
        document.getElementById('stat-activos').textContent = data.estadisticas.productos_activos || 0;
        document.getElementById('stat-bajo').textContent = data.estadisticas.productos_stock_bajo || 0;
        document.getElementById('stat-ordenes').textContent = data.estadisticas.ordenes_pendientes || 0;

        const tbody = document.querySelector('#tabla-movimientos tbody');
        if(data.movimientos_recientes.length > 0) {
            tbody.innerHTML = data.movimientos_recientes.map(m => `
                <tr>
                    <td>${new Date(m.fecha_movimiento).toLocaleDateString()}</td>
                    <td>${m.nombre}</td>
                    <td>${m.tipo}</td>
                    <td style="color:${m.cantidad < 0 ? 'red' : 'green'}">${m.cantidad}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4">No hay movimientos recientes</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos?limite=50`);
        const data = await res.json();
        
        productosCache = data.productos;

        const tbody = document.querySelector('#tabla-productos tbody');
        tbody.innerHTML = data.productos.map(p => {
            const estadoClass = p.stock_actual <= p.stock_minimo ? 'bajo' : 'normal';
            const estadoText = p.stock_actual <= p.stock_minimo ? '⚠️ Bajo Stock' : 'OK';
            
            return `
            <tr>
                <td>${p.codigo}</td>
                <td>${p.nombre}</td>
                <td>${p.stock_actual}</td>
                <td><span class="badge ${estadoClass}">${estadoText}</span></td>
                <td>
                    <button onclick="verBarcode(${p.id})">🏷️ Etiqueta</button>
                </td>
            </tr>
        `}).join('');
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function verBarcode(id) {
    const img = document.getElementById('barcode-img');
    img.src = `${API_URL}/productos/${id}/etiqueta`;
    document.getElementById('modal-barcode').style.display = 'flex';
}

async function mostrarCrearProducto() {
    if (categoriasCache.length === 0) {
        const res = await fetch(`${API_URL}/categorias`);
        const data = await res.json();
        categoriasCache = data.categorias;
    }
    if (proveedoresCache.length === 0) {
        const res = await fetch(`${API_URL}/proveedores`);
        const data = await res.json();
        proveedoresCache = data.proveedores;
    }

    let formContainer = document.getElementById('form-producto-container');
    
    if (!formContainer) {
        const seccionProductos = document.getElementById('productos');
        formContainer = document.createElement('div');
        formContainer.id = 'form-producto-container';
        formContainer.style.background = '#f8fafc';
        formContainer.style.padding = '20px';
        formContainer.style.marginBottom = '20px';
        formContainer.style.border = '1px solid #e2e8f0';
        formContainer.style.borderRadius = '8px';
        
        const toolbar = seccionProductos.querySelector('.toolbar');
        toolbar.insertAdjacentElement('afterend', formContainer);
    }

    formContainer.innerHTML = `
        <h3>Nuevo Producto</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <label>Código (SKU):</label>
                <input type="text" id="prod-codigo" style="width: 100%; padding: 8px;" placeholder="EJ: PROD-001">
            </div>
            <div>
                <label>Nombre:</label>
                <input type="text" id="prod-nombre" style="width: 100%; padding: 8px;" placeholder="Nombre del producto">
            </div>
            <div>
                <label>Precio Compra:</label>
                <input type="number" id="prod-compra" style="width: 100%; padding: 8px;" step="0.01">
            </div>
            <div>
                <label>Precio Venta:</label>
                <input type="number" id="prod-venta" style="width: 100%; padding: 8px;" step="0.01">
            </div>
            <div>
                <label>Stock Inicial:</label>
                <input type="number" id="prod-stock" style="width: 100%; padding: 8px;" value="0">
            </div>
            <div>
                <label>Stock Mínimo (Alerta):</label>
                <input type="number" id="prod-min" style="width: 100%; padding: 8px;" value="5">
            </div>
            <div>
                <label>Categoría:</label>
                <select id="prod-cat" style="width: 100%; padding: 8px;">
                    ${categoriasCache.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
                </select>
            </div>
            <div>
                <label>Proveedor:</label>
                <select id="prod-prov" style="width: 100%; padding: 8px;">
                    ${proveedoresCache.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
                </select>
            </div>
            <div style="grid-column: span 2;">
                <label>Descripción:</label>
                <textarea id="prod-desc" style="width: 100%; padding: 8px;" rows="2"></textarea>
            </div>
        </div>
        <div style="margin-top: 15px;">
            <button class="primary" onclick="guardarProducto()">Guardar Producto</button>
            <button onclick="document.getElementById('form-producto-container').style.display='none'">Cancelar</button>
        </div>
    `;
    
    formContainer.style.display = 'block';
}

async function guardarProducto() {
    const payload = {
        codigo: document.getElementById('prod-codigo').value,
        nombre: document.getElementById('prod-nombre').value,
        descripcion: document.getElementById('prod-desc').value,
        precio_compra: parseFloat(document.getElementById('prod-compra').value) || 0,
        precio_venta: parseFloat(document.getElementById('prod-venta').value),
        stock_actual: parseInt(document.getElementById('prod-stock').value) || 0,
        stock_minimo: parseInt(document.getElementById('prod-min').value) || 0,
        categoria_id: parseInt(document.getElementById('prod-cat').value),
        proveedor_id: parseInt(document.getElementById('prod-prov').value)
    };

    if (!payload.codigo || !payload.nombre || !payload.precio_venta) {
        return alert('Código, Nombre y Precio de Venta son obligatorios');
    }

    try {
        const res = await fetch(`${API_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Producto creado exitosamente');
            document.getElementById('form-producto-container').style.display = 'none';
            cargarProductos();
            loadDashboard();
        } else {
            const err = await res.json();
            alert('Error: ' + (err.error || 'No se pudo crear'));
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

// --- ÓRDENES DE COMPRA ---

async function cargarOrdenes() {
    try {
        const res = await fetch(`${API_URL}/ordenes`);
        const data = await res.json();

        const tbody = document.querySelector('#tabla-ordenes tbody');
        tbody.innerHTML = data.ordenes.map(o => `
            <tr>
                <td>${o.numero_orden}</td>
                <td>${o.proveedor_nombre}</td>
                <td>${o.estado}</td>
                <td>$${o.total || 0}</td>
                <td>
                    ${o.estado === 'pendiente' 
                      ? `<button class="primary" onclick="recibirOrden(${o.id})">📥 Recibir</button>` 
                      : '✅ Completada'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando ordenes:', error);
    }
}

async function mostrarCrearOrden() {
    document.getElementById('form-orden').style.display = 'block';
    
    const resProv = await fetch(`${API_URL}/proveedores`);
    const dataProv = await resProv.json();
    const selectProv = document.getElementById('select-proveedor');
    
    selectProv.innerHTML = '<option value="">Seleccione Proveedor...</option>' + 
        dataProv.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');

    if (productosCache.length === 0) {
        await cargarProductos();
    }
    
    document.getElementById('items-orden').innerHTML = '';
    agregarItemOrden();
}

function agregarItemOrden() {
    const container = document.getElementById('items-orden');
    
    const opcionesProductos = productosCache.map(p => 
        `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`
    ).join('');

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginBottom = '10px';
    row.innerHTML = `
        <select class="item-producto" style="flex:2">
            <option value="">Seleccionar Producto</option>
            ${opcionesProductos}
        </select>
        <input type="number" class="item-cantidad" placeholder="Cant." style="flex:1" min="1">
        <input type="number" class="item-precio" placeholder="Precio Unit." style="flex:1" step="0.01">
        <button type="button" onclick="this.parentElement.remove()" style="color:red">X</button>
    `;
    container.appendChild(row);
}

async function guardarOrden() {
    const proveedorId = document.getElementById('select-proveedor').value;
    const fechaEntrega = document.getElementById('fecha-entrega').value;
    
    if (!proveedorId) return alert('Seleccione un proveedor');

    const rows = document.querySelectorAll('#items-orden > div');
    const items = [];

    rows.forEach(row => {
        const prodId = row.querySelector('.item-producto').value;
        const cant = row.querySelector('.item-cantidad').value;
        const precio = row.querySelector('.item-precio').value;

        if (prodId && cant && precio) {
            items.push({
                producto_id: parseInt(prodId),
                cantidad: parseInt(cant),
                precio_unitario: parseFloat(precio)
            });
        }
    });

    if (items.length === 0) return alert('Agregue al menos un producto válido');

    const payload = {
        proveedor_id: parseInt(proveedorId),
        fecha_entrega_esperada: fechaEntrega || null,
        items: items
    };

    try {
        const res = await fetch(`${API_URL}/ordenes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Orden creada exitosamente');
            document.getElementById('form-orden').style.display = 'none';
            cargarOrdenes();
            loadDashboard();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

async function recibirOrden(id) {
    if(!confirm('¿Confirmar recepción de mercadería? Esto aumentará el stock.')) return;
    
    try {
        const res = await fetch(`${API_URL}/ordenes/${id}/recibir`, { method: 'POST' });
        const data = await res.json();
        if(res.ok) {
            alert('Orden recibida. Stock actualizado.');
            cargarOrdenes();
            loadDashboard(); 
        } else {
            alert('Error: ' + data.error);
        }
    } catch (e) {
        alert('Error de red');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    cargarProductos();
});