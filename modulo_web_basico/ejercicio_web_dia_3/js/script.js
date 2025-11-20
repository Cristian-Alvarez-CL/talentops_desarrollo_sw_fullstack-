// dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.querySelector('.theme-icon');
    const body = document.body;
    const statCards = document.querySelectorAll('.stat-card');
    const navItems = document.querySelectorAll('.nav-item');
    
    // Estado del sidebar
    let sidebarCollapsed = false;
    
    // Alternar menú hamburguesa
    menuToggle.addEventListener('click', function() {
        sidebarCollapsed = !sidebarCollapsed;
        
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            // Animación de las líneas del menú hamburguesa
            menuToggle.children[0].style.transform = 'rotate(45deg)';
            menuToggle.children[1].style.opacity = '0';
            menuToggle.children[2].style.transform = 'rotate(-45deg)';
        } else {
            sidebar.classList.remove('collapsed');
            // Revertir animación
            menuToggle.children[0].style.transform = 'rotate(0)';
            menuToggle.children[1].style.opacity = '1';
            menuToggle.children[2].style.transform = 'rotate(0)';
        }
    });
    
    // Alternar tema claro/oscuro
    themeToggle.addEventListener('click', function() {
        if (body.classList.contains('light-theme')) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
    }
    
    // Efectos hover para las tarjetas de estadísticas
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Navegación del sidebar
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover clase active de todos los elementos
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Agregar clase active al elemento clickeado
            this.classList.add('active');
            
            // Cerrar sidebar en dispositivos móviles
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
                sidebarCollapsed = false;
                menuToggle.children[0].style.transform = 'rotate(0)';
                menuToggle.children[1].style.opacity = '1';
                menuToggle.children[2].style.transform = 'rotate(0)';
            }
        });
    });
    
    // Simular estado de carga
    function simulateLoading() {
        const chartCards = document.querySelectorAll('.chart-card');
        
        chartCards.forEach(card => {
            card.classList.add('loading');
            
            setTimeout(() => {
                card.classList.remove('loading');
            }, 1500);
        });
    }
    
    // Inicializar estado de carga al cargar la página
    setTimeout(simulateLoading, 500);
    
    // Manejo responsive del sidebar
    function handleResize() {
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('collapsed');
            sidebarCollapsed = false;
            menuToggle.children[0].style.transform = 'rotate(0)';
            menuToggle.children[1].style.opacity = '1';
            menuToggle.children[2].style.transform = 'rotate(0)';
        }
    }
    
    window.addEventListener('resize', handleResize);
    
    // Efectos de animación para las barras del gráfico
    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => {
        bar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        bar.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});