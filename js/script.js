// Variables globales
let savedCalculations = JSON.parse(localStorage.getItem('feedflowCalculations')) || [];
let currentCalculation = null;

// Factores de conversión por especie
const speciesFactors = {
    tilapia: { fcr: 1.6, tempOptimal: 28, proteinReq: 0.35 },
    trucha: { fcr: 1.2, tempOptimal: 16, proteinReq: 0.42 },
    carpa: { fcr: 1.8, tempOptimal: 25, proteinReq: 0.30 },
    bagre: { fcr: 1.5, tempOptimal: 26, proteinReq: 0.32 },
    salmon: { fcr: 1.1, tempOptimal: 14, proteinReq: 0.45 }
};

// Factores climáticos
const weatherFactors = {
    sunny: 1.0,
    cloudy: 0.9,
    rainy: 0.8
};

// Factores por edad (semanas)
function getAgeFactor(age) {
    if (age <= 4) return 0.08; // Alevines
    if (age <= 12) return 0.06; // Juveniles
    if (age <= 24) return 0.04; // Pre-adultos
    return 0.03; // Adultos
}

// Factores por temperatura
function getTemperatureFactor(temp, optimalTemp) {
    const diff = Math.abs(temp - optimalTemp);
    if (diff <= 2) return 1.0;
    if (diff <= 5) return 0.9;
    if (diff <= 8) return 0.8;
    return 0.7;
}

// Navegación entre secciones
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(sectionId).classList.add('active');
    
    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Actualizar cálculo en tiempo real
function updateCalculation() {
    const species = document.getElementById('species').value;
    const age = parseFloat(document.getElementById('age').value);
    const biomass = parseFloat(document.getElementById('biomass').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const weather = document.getElementById('weather').value;
    const feedType = document.getElementById('feedType').value;
    const feedPrice = parseFloat(document.getElementById('feedPrice').value);

    if (species && age && biomass && temperature && weather && feedType && feedPrice) {
        calculateFeeding();
    }
}

// Función principal de cálculo
function calculateFeeding() {
    const species = document.getElementById('species').value;
    const age = parseFloat(document.getElementById('age').value);
    const biomass = parseFloat(document.getElementById('biomass').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const weather = document.getElementById('weather').value;
    const feedType = document.getElementById('feedType').value;
    const feedPrice = parseFloat(document.getElementById('feedPrice').value);

    // Validar datos
    if (!species || !age || !biomass || !temperature || !weather || !feedType || !feedPrice) {
        showAlert('Por favor, complete todos los campos para realizar el cálculo.', 'warning');
        return;
    }
    
    // Mostrar loading en los resultados
    const resultElements = ['dailyAmount', 'frequency', 'dailyCost', 'monthlyCost'];
    resultElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
    });
    
    // Simular cálculo con delay para mostrar loading
    setTimeout(() => {

    // Obtener factores
    const speciesFactor = speciesFactors[species];
    const ageFactor = getAgeFactor(age);
    const tempFactor = getTemperatureFactor(temperature, speciesFactor.tempOptimal);
    const weatherFactor = weatherFactors[weather];

    // Calcular cantidad diaria de alimento
    let dailyFeedRate = biomass * ageFactor * tempFactor * weatherFactor;
    
    // Ajustar por tipo de alimento
    const feedTypeFactors = {
        starter: 1.2,
        growth: 1.0,
        finishing: 0.8
    };
    dailyFeedRate *= feedTypeFactors[feedType];

    // Calcular frecuencia de alimentación
    let frequency;
    if (age <= 4) frequency = 6; // Alevines
    else if (age <= 12) frequency = 4; // Juveniles
    else if (age <= 24) frequency = 3; // Pre-adultos
    else frequency = 2; // Adultos

    // Calcular costos
    const dailyCost = dailyFeedRate * feedPrice;
    const monthlyCost = dailyCost * 30;

        // Mostrar resultados con animación
        const dailyAmountEl = document.getElementById('dailyAmount');
        const frequencyEl = document.getElementById('frequency');
        const dailyCostEl = document.getElementById('dailyCost');
        const monthlyCostEl = document.getElementById('monthlyCost');
        
        if (dailyAmountEl) dailyAmountEl.textContent = dailyFeedRate.toFixed(2) + ' kg';
        if (frequencyEl) frequencyEl.textContent = frequency + ' veces/día';
        if (dailyCostEl) dailyCostEl.textContent = '$' + dailyCost.toFixed(2);
        if (monthlyCostEl) monthlyCostEl.textContent = '$' + monthlyCost.toFixed(2);
        
        // Animar los números
        if (dailyAmountEl) animateNumber(dailyAmountEl, 0, dailyFeedRate);
        if (dailyCostEl) animateNumber(dailyCostEl, 0, dailyCost);
        if (monthlyCostEl) animateNumber(monthlyCostEl, 0, monthlyCost);

    // Guardar cálculo actual
    currentCalculation = {
        date: new Date().toISOString(),
        species,
        age,
        biomass,
        temperature,
        weather,
        feedType,
        feedPrice,
        dailyAmount: dailyFeedRate,
        frequency,
        dailyCost,
        monthlyCost
    };

        // Mostrar sección de resultados con animación
        const resultsSection = document.getElementById('results');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.classList.add('fade-in', 'visible');
        }
        
        showAlert('¡Cálculo completado exitosamente!', 'success');
    }, 1500);
}

// Guardar cálculo
function saveCalculation() {
    if (!currentCalculation) {
        showAlert('No hay cálculo para guardar. Realice un cálculo primero.', 'warning');
        return;
    }

    savedCalculations.push(currentCalculation);
    localStorage.setItem('feedflowCalculations', JSON.stringify(savedCalculations));
    
    showAlert('¡Cálculo guardado exitosamente! Puede verlo en la sección de Dashboard.', 'success');
    createConfetti();
}

// Generar estadísticas
function generateStats() {
    const period = document.getElementById('statsPeriod').value;
    
    if (savedCalculations.length === 0) {
        // Generar datos de ejemplo para demostración
        generateSampleData();
    }

    let filteredData = filterDataByPeriod(savedCalculations, period);
    
    if (filteredData.length === 0) {
        alert('No hay datos suficientes para el período seleccionado.');
        return;
    }

    // Calcular estadísticas
    const totalFeed = filteredData.reduce((sum, calc) => sum + calc.dailyAmount, 0);
    const totalCost = filteredData.reduce((sum, calc) => sum + calc.dailyCost, 0);
    const avgBiomass = filteredData.reduce((sum, calc) => sum + calc.biomass, 0) / filteredData.length;
    const efficiency = (totalFeed / avgBiomass).toFixed(1);

    // Actualizar interfaz
    document.getElementById('totalFeed').textContent = totalFeed.toFixed(1) + ' kg';
    document.getElementById('biomassGrowth').textContent = (avgBiomass * 0.15).toFixed(1) + ' kg';
    document.getElementById('totalCost').textContent = '$' + totalCost.toFixed(2);
    document.getElementById('efficiency').textContent = efficiency + ':1';

    // Generar gráfico simple
    drawSimpleChart(filteredData);
}

// Filtrar datos por período
function filterDataByPeriod(data, period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'biweekly':
            startDate = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
            break;
        case 'monthly':
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            break;
        case 'yearly':
            startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
            break;
        default:
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }

    return data.filter(calc => new Date(calc.date) >= startDate);
}

// Generar datos de ejemplo
function generateSampleData() {
    const sampleData = [];
    const species = ['tilapia', 'trucha', 'carpa'];
    const feedTypes = ['starter', 'growth', 'finishing'];
    
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        sampleData.push({
            date: date.toISOString(),
            species: species[Math.floor(Math.random() * species.length)],
            age: Math.floor(Math.random() * 50) + 1,
            biomass: Math.floor(Math.random() * 500) + 100,
            temperature: Math.floor(Math.random() * 15) + 20,
            weather: 'sunny',
            feedType: feedTypes[Math.floor(Math.random() * feedTypes.length)],
            feedPrice: Math.random() * 2 + 1,
            dailyAmount: Math.random() * 20 + 5,
            frequency: Math.floor(Math.random() * 4) + 2,
            dailyCost: Math.random() * 50 + 10,
            monthlyCost: Math.random() * 1500 + 300
        });
    }
    
    savedCalculations = sampleData;
    localStorage.setItem('feedflowCalculations', JSON.stringify(savedCalculations));
}

// Dibujar gráfico simple
function drawSimpleChart(data) {
    const canvas = document.getElementById('feedChart');
    const ctx = canvas.getContext('2d');
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configuración del gráfico
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    
    // Preparar datos
    const maxValue = Math.max(...data.map(d => d.dailyAmount));
    const minValue = Math.min(...data.map(d => d.dailyAmount));
    const range = maxValue - minValue;
    
    // Dibujar ejes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Dibujar línea de datos
    ctx.strokeStyle = '#2c5aa0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = canvas.height - padding - ((point.dailyAmount - minValue) / range) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Dibujar puntos
    ctx.fillStyle = '#28a745';
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = canvas.height - padding - ((point.dailyAmount - minValue) / range) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Etiquetas
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Consumo de Alimento por Día (kg)', canvas.width / 2, canvas.height - 10);
    
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Cantidad (kg)', 0, 0);
    ctx.restore();
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar página loader
    initPageLoader();
    
    // Inicializar animaciones de scroll
    initScrollAnimations();
    
    // Inicializar header sticky
    initStickyHeader();
    
    // Inicializar navegación móvil
    initMobileNavigation();
    
    // Inicializar partículas
    initParticles();
    
    // Mostrar sección calculadora por defecto si existe
    if (document.getElementById('calculator')) {
        showSection('calculator');
    }
    
    // Generar estadísticas iniciales si existe
    if (typeof generateStats === 'function') {
        generateStats();
    }
    
    // Agregar eventos a los botones de productos
    document.querySelectorAll('.product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            showAlert(`¡Gracias por su interés en ${productName}! Un representante se contactará con usted pronto para finalizar la compra.`, 'success');
        });
    });
    
    // Agregar smooth scroll a los enlaces
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Inicializar page loader
function initPageLoader() {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="loader"></div>';
    document.body.appendChild(loader);
    
    window.addEventListener('load', function() {
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }, 800);
    });
}

// Inicializar animaciones de scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Agregar clases de animación a elementos
    document.querySelectorAll('.feature-card').forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
    
    document.querySelectorAll('.quick-card').forEach((el, index) => {
        el.classList.add('slide-in-left');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
    
    document.querySelectorAll('.stat-card').forEach((el, index) => {
        el.classList.add('scale-in');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
}

// Inicializar header sticky
function initStickyHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
}

// Inicializar navegación móvil
function initMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!navToggle || !navMenu) return;
    
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        document.body.classList.toggle('nav-open');
    });
    
    // Cerrar menú al hacer click en un enlace
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.classList.remove('nav-open');
        });
    });
    
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.classList.remove('nav-open');
        }
    });
}

// Inicializar partículas flotantes
function initParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const particles = document.createElement('div');
    particles.className = 'particles';
    hero.appendChild(particles);
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        particles.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 20000);
    }
    
    // Crear partículas cada cierto tiempo
    setInterval(createParticle, 2000);
}

// Función para mostrar alertas personalizadas mejoradas
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    alertDiv.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        max-width: 400px;
        animation: slideInAlert 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    `;
    
    // Estilo para el botón de cerrar
    const closeBtn = alertDiv.querySelector('.alert-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.2rem;
        border-radius: 50%;
        transition: all 0.2s ease;
        margin-left: auto;
    `;
    
    closeBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255,255,255,0.2)';
    });
    
    closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'none';
    });
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.style.animation = 'slideOutAlert 0.3s ease';
            setTimeout(() => alertDiv.remove(), 300);
        }
    }, 5000);
}

// Agregar CSS para las animaciones de alerta
if (!document.getElementById('alert-animations')) {
    const style = document.createElement('style');
    style.id = 'alert-animations';
    style.textContent = `
        @keyframes slideInAlert {
            from { 
                transform: translateX(100%) scale(0.8); 
                opacity: 0; 
            }
            to { 
                transform: translateX(0) scale(1); 
                opacity: 1; 
            }
        }
        @keyframes slideOutAlert {
            from { 
                transform: translateX(0) scale(1); 
                opacity: 1; 
            }
            to { 
                transform: translateX(100%) scale(0.8); 
                opacity: 0; 
            }
        }
        .nav-open {
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
}

// Función para crear efectos de typing
function typeWriter(element, text, speed = 50) {
    if (!element) return;
    
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Función para animar números
function animateNumber(element, start, end, duration = 2000) {
    if (!element) return;
    
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (difference * easeOutQuart(progress));
        element.textContent = Math.floor(current).toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Easing function
function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

// Función para crear efecto de confeti
function createConfetti() {
    const colors = ['#2c5aa0', '#28a745', '#17a2b8', '#ffc107', '#dc3545'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -10px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: confettiFall ${Math.random() * 2 + 3}s linear forwards;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

// CSS para animación de confeti
if (!document.getElementById('confetti-animation')) {
    const style = document.createElement('style');
    style.id = 'confetti-animation';
    style.textContent = `
        @keyframes confettiFall {
            to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}