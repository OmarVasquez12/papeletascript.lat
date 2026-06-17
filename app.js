// Estado global
let cart = [];
let products = [];
let currentUser = null;

// Cargar productos desde JSON
async function loadProducts() {
    try {
        const response = await fetch('/products.json');
        products = await response.json();
        renderProducts(products);
        updateStats();
    } catch (error) {
        console.error('Error cargando productos:', error);
        showToast('Error al cargar productos', 'error');
    }
}

// Renderizar productos
function renderProducts(productsList) {
    const grid = document.getElementById('productsGrid');
    
    if (!grid) return;
    
    if (productsList.length === 0) {
        grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:var(--text-secondary);">No se encontraron productos</p>';
        return;
    }
    
    grid.innerHTML = productsList.map(product => `
        <div class="product-card" onclick="viewProduct('${product.id}')">
            <img src="${product.images[0]}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 80)}...</p>
                <div class="product-meta">
                    <div class="product-rating">
                        <i class="fa-solid fa-star"></i>
                        <span>${product.rating.toFixed(1)}</span>
                    </div>
                    <span><i class="fa-solid fa-download"></i> ${product.sales} ventas</span>
                    <span class="framework-badge">${product.framework}</span>
                </div>
                <div class="product-tags">
                    ${product.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="product-footer">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}', event)">
                        <i class="fa-solid fa-cart-plus"></i> Añadir
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Añadir al carrito
function addToCart(productId, event) {
    event.stopPropagation();
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        showToast('Este producto ya está en tu carrito', 'warning');
        return;
    }
    
    cart.push({...product, quantity: 1});
    updateCartUI();
    saveCart();
    showToast(`${product.name} añadido al carrito`, 'success');
}

// Actualizar UI del carrito
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartBody = document.getElementById('cartBody');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartCount || !cartBody || !cartTotal) return;
    
    cartCount.textContent = cart.length;
    
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-cart-shopping"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        cartTotal.textContent = '$0.00';
        return;
    }
    
    cartBody.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.images[0]}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.id}')">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Eliminar del carrito
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    saveCart();
    showToast('Producto eliminado del carrito', 'info');
}

// Guardar carrito en localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Cargar carrito desde localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

// Toggle carrito
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// Toggle búsqueda
function toggleSearch() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.toggle('active');
        
        if (modal.classList.contains('active')) {
            const input = document.getElementById('searchInput');
            if (input) input.focus();
        }
    }
}

// Buscar productos
function searchProducts() {
    const query = document.getElementById('searchInput')?.value.toLowerCase();
    const results = document.getElementById('searchResults');
    
    if (!query || query.length < 2) {
        if (results) results.innerHTML = '';
        return;
    }
    
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    if (results) {
        results.innerHTML = filtered.map(p => `
            <div class="search-result-item" onclick="viewProduct('${p.id}')">
                <img src="${p.images[0]}" alt="${p.name}">
                <div>
                    <h4>${p.name}</h4>
                    <p>$${p.price.toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    }
}

// Ver producto (redirigir a página de detalle)
function viewProduct(productId) {
    window.location.href = `/product/${productId}.html`;
}

// Login con Discord (simulado por ahora)
function loginWithDiscord() {
    // Por ahora simulamos el login
    currentUser = {
        id: '123456789',
        username: 'UsuarioDemo',
        avatar: 'https://via.placeholder.com/50'
    };
    
    localStorage.setItem('user', JSON.stringify(currentUser));
    updateUserUI();
    showToast('¡Bienvenido!', 'success');
}

// Logout
function logoutDiscord() {
    currentUser = null;
    localStorage.removeItem('user');
    updateUserUI();
    showToast('Sesión cerrada', 'info');
}

// Actualizar UI del usuario
function updateUserUI() {
    const user = localStorage.getItem('user');
    if (user) {
        currentUser = JSON.parse(user);
        // Aquí puedes actualizar la UI del usuario
    }
}

// Checkout (simulado)
async function checkout() {
    if (cart.length === 0) {
        showToast('Tu carrito está vacío', 'warning');
        return;
    }
    
    if (!currentUser) {
        showToast('Debes iniciar sesión para comprar', 'warning');
        loginWithDiscord();
        return;
    }
    
    // Simular proceso de pago
    showToast('Procesando pago...', 'info');
    
    setTimeout(() => {
        showToast('¡Compra realizada con éxito!', 'success');
        cart = [];
        updateCartUI();
        saveCart();
        toggleCart();
    }, 2000);
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <i class="fa-solid fa-${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Filtros
function applyFilters() {
    const category = document.getElementById('filterCategory')?.value;
    const framework = document.getElementById('filterFramework')?.value;
    const price = document.getElementById('filterPrice')?.value;
    const sort = document.getElementById('filterSort')?.value;
    
    let filtered = [...products];
    
    // Aplicar filtros
    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (framework && framework !== 'all') {
        filtered = filtered.filter(p => p.framework.toLowerCase() === framework);
    }
    
    if (price && price !== 'all') {
        switch(price) {
            case 'free':
                filtered = filtered.filter(p => p.price === 0);
                break;
            case '0-10':
                filtered = filtered.filter(p => p.price >= 0 && p.price <= 10);
                break;
            case '10-25':
                filtered = filtered.filter(p => p.price > 10 && p.price <= 25);
                break;
            case '25-50':
                filtered = filtered.filter(p => p.price > 25 && p.price <= 50);
                break;
            case '50+':
                filtered = filtered.filter(p => p.price > 50);
                break;
        }
    }
    
    // Ordenar
    if (sort) {
        switch(sort) {
            case 'popular':
                filtered.sort((a, b) => b.sales - a.sales);
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
        }
    }
    
    renderProducts(filtered);
    updateStats(filtered);
}

// Actualizar estadísticas
function updateStats(productsList = products) {
    const totalProducts = document.getElementById('totalProducts');
    const totalSales = document.getElementById('totalSales');
    const avgRating = document.getElementById('avgRating');
    
    if (totalProducts) {
        totalProducts.textContent = productsList.length;
    }
    
    if (totalSales) {
        const sales = productsList.reduce((sum, p) => sum + p.sales, 0);
        totalSales.textContent = sales.toLocaleString();
    }
    
    if (avgRating) {
        const rating = productsList.reduce((sum, p) => sum + p.rating, 0) / productsList.length;
        avgRating.textContent = rating.toFixed(1);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCart();
    updateUserUI();
    
    // Event listeners para filtros
    document.getElementById('filterCategory')?.addEventListener('change', applyFilters);
    document.getElementById('filterFramework')?.addEventListener('change', applyFilters);
    document.getElementById('filterPrice')?.addEventListener('change', applyFilters);
    document.getElementById('filterSort')?.addEventListener('change', applyFilters);
});
