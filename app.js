// Estado global
let cart = [];
let products = [];

// Cargar productos desde la API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

// Renderizar productos
function renderProducts(productsList) {
    const grid = document.getElementById('productsGrid');
    
    if (productsList.length === 0) {
        grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;">No se encontraron productos</p>';
        return;
    }
    
    grid.innerHTML = productsList.map(product => `
        <div class="product-card" onclick="viewProduct('${product.id}')">
            <img src="${product.images[0]}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-meta">
                    <div class="product-rating">
                        <i class="fa-solid fa-star"></i>
                        <span>${product.rating.toFixed(1)}</span>
                    </div>
                    <span>${product.sales} ventas</span>
                    <span>${product.framework}</span>
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
    
    cart.push(product);
    updateCartUI();
    showToast(`${product.name} añadido al carrito`, 'success');
}

// Actualizar UI del carrito
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartBody = document.getElementById('cartBody');
    const cartTotal = document.getElementById('cartTotal');
    
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
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Eliminar del carrito
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    showToast('Producto eliminado del carrito', 'info');
}

// Toggle carrito
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    sidebar.classList.toggle('active');
}

// Toggle búsqueda
function toggleSearch() {
    const modal = document.getElementById('searchModal');
    modal.classList.toggle('active');
    
    if (modal.classList.contains('active')) {
        document.getElementById('searchInput').focus();
    }
}

// Buscar productos
async function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const results = document.getElementById('searchResults');
    
    if (query.length < 2) {
        results.innerHTML = '';
        return;
    }
    
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
    
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

// Login con Discord
function loginWithDiscord() {
    window.location.href = '/api/auth/discord';
}

// Checkout
async function checkout() {
    if (cart.length === 0) {
        showToast('Tu carrito está vacío', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart })
        });
        
        const { url } = await response.json();
        window.location.href = url; // Redirigir a Stripe/PayPal
    } catch (error) {
        showToast('Error al procesar el pago', 'error');
    }
}

// Ver producto
function viewProduct(productId) {
    window.location.href = `/product/${productId}`;
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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
document.getElementById('filterCategory').addEventListener('change', applyFilters);
document.getElementById('filterFramework').addEventListener('change', applyFilters);
document.getElementById('filterPrice').addEventListener('change', applyFilters);
document.getElementById('filterSort').addEventListener('change', applyFilters);

function applyFilters() {
    const category = document.getElementById('filterCategory').value;
    const framework = document.getElementById('filterFramework').value;
    const price = document.getElementById('filterPrice').value;
    const sort = document.getElementById('filterSort').value;
    
    let filtered = [...products];
    
    // Aplicar filtros
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (framework !== 'all') {
        filtered = filtered.filter(p => p.framework.toLowerCase() === framework);
    }
    
    if (price !== 'all') {
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
    
    renderProducts(filtered);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
});
