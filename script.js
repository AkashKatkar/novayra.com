// Novayra E-commerce JavaScript
// API Configuration - works with both separate servers and unified server
const API_BASE_URL = window.location.port === '3000' ? '/api' : 'http://localhost:3000/api';

// Global state
let currentUser = null;
let cartItems = [];
let products = [];

// DOM Elements
const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');
const userMenuBtn = document.getElementById('user-menu-btn');
const cartModal = document.getElementById('cart-modal');
const sampleModal = document.getElementById('sample-modal');
const authModal = document.getElementById('auth-modal');
const checkoutModal = document.getElementById('checkout-modal');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadProductsFromDatabase();
    checkAuthStatus();
    setupCustomDropdowns();
});

// Initialize application
async function initializeApp() {
    // Load user from localStorage first
    const savedUser = localStorage.getItem('novayraUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUserInterface();
            
            // If user is logged in, load cart from database
            if (currentUser) {
                await loadUserCart();
            }
        } catch (error) {
            console.error('Error loading user from localStorage:', error);
            localStorage.removeItem('novayraUser');
            currentUser = null;
        }
    }
    
    // If no user is logged in, load cart from localStorage (guest cart)
    if (!currentUser) {
        const savedCart = localStorage.getItem('novayraCart');
        if (savedCart) {
            try {
                cartItems = JSON.parse(savedCart);
                updateCartCount();
            } catch (error) {
                console.error('Error parsing guest cart from localStorage:', error);
                cartItems = [];
                localStorage.removeItem('novayraCart');
            }
        } else {
            cartItems = [];
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    try {
        // Navigation
        setupNavigation();
        
        // Cart functionality
        setupCartEvents();
        
        // Product actions
        setupProductEvents();
        
        // Modal events
        setupModalEvents();
        
        // Form submissions
        setupFormSubmissions();
        
        // Additional button events
        setupAdditionalEvents();
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Navigation setup
function setupNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

// Smooth scrolling for navigation links
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
}

// Cart events setup
function setupCartEvents() {
    // Cart icon click
    cartIcon.addEventListener('click', () => {
        if (currentUser) {
            openCartModal();
        } else {
            openAuthModal('login');
        }
    });

    // User menu click
    userMenuBtn.addEventListener('click', () => {
        if (currentUser) {
            showUserMenu();
        } else {
            openAuthModal('login');
        }
    });
    
    // Event delegation for cart buttons (works with dynamically created elements)
    document.addEventListener('click', (e) => {
        // Handle quantity decrease buttons (including when clicking on any part of the button)
        if (e.target.classList.contains('quantity-decrease') || e.target.closest('.quantity-decrease')) {
            e.preventDefault();
            const button = e.target.classList.contains('quantity-decrease') ? e.target : e.target.closest('.quantity-decrease');
            const itemId = parseInt(button.getAttribute('data-item-id'));
            const newQuantity = parseInt(button.getAttribute('data-quantity'));
            updateCartItemQuantity(itemId, newQuantity).catch(error => {
                console.error('Error updating cart item quantity:', error);
            });
        }
        
        // Handle quantity increase buttons (including when clicking on any part of the button)
        if (e.target.classList.contains('quantity-increase') || e.target.closest('.quantity-increase')) {
            e.preventDefault();
            const button = e.target.classList.contains('quantity-increase') ? e.target : e.target.closest('.quantity-increase');
            const itemId = parseInt(button.getAttribute('data-item-id'));
            const newQuantity = parseInt(button.getAttribute('data-quantity'));
            updateCartItemQuantity(itemId, newQuantity).catch(error => {
                console.error('Error updating cart item quantity:', error);
            });
        }
        
        // Handle remove buttons (including when clicking on the icon inside)
        if (e.target.classList.contains('remove-btn-modern') || e.target.closest('.remove-btn-modern')) {
            e.preventDefault();
            const button = e.target.classList.contains('remove-btn-modern') ? e.target : e.target.closest('.remove-btn-modern');
            const itemId = parseInt(button.getAttribute('data-item-id'));
            removeFromCart(itemId).catch(error => {
                console.error('Error removing item from cart:', error);
            });
        }
    });
}

// Product events setup
function setupProductEvents() {
    // Add to cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(e.target.dataset.productId);
            addToCart(productId);
        }
        
        if (e.target.classList.contains('request-sample-btn')) {
            const productId = parseInt(e.target.dataset.productId);
            openSampleModal(productId);
        }
    });
}

// Modal events setup
function setupModalEvents() {
    // Close modals when clicking outside (except cart modal)
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') && !e.target.classList.contains('cart-overlay')) {
            closeAllModals();
        }
    });

    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        if (btn.id === 'cart-close') {
            btn.addEventListener('click', closeCartModal);
        } else {
            btn.addEventListener('click', closeAllModals);
        }
    });

    // Cart overlay click to close
    const cartOverlay = document.querySelector('.cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartModal);
    }

    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchAuthTab(tabName);
        });
    });
    
    // Floating checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleFloatingCheckout);
    }
    
    // Checkout modal buttons
    setupCheckoutModalEvents();
}

// Form submissions setup
function setupFormSubmissions() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Sample request form
    const sampleForm = document.getElementById('sample-form');
    if (sampleForm) {
        sampleForm.addEventListener('submit', handleSampleRequest);
    }
    
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
}

    // Additional button events setup
    function setupAdditionalEvents() {
        // Scroll to top button
        const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', scrollToTop);
        }
        
        // Hero scroll arrow
        const scrollArrow = document.querySelector('.scroll-arrow');
        if (scrollArrow) {
            scrollArrow.addEventListener('click', () => {
                const collectionSection = document.getElementById('collection');
                if (collectionSection) {
                    collectionSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        }
        
        // Explore fragrances button (in empty cart)
        const exploreFragrancesBtn = document.getElementById('explore-fragrances-btn');
        if (exploreFragrancesBtn) {
            exploreFragrancesBtn.addEventListener('click', () => {
                closeCartModal();
                // Scroll to collection section
                const collectionSection = document.getElementById('collection');
                if (collectionSection) {
                    collectionSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        }
        
        // Continue shopping button
        const continueShoppingBtn = document.getElementById('continue-shopping-btn');
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', closeCartModal);
        }
    }

// Checkout modal events setup
function setupCheckoutModalEvents() {
    // Event delegation for checkout modal buttons
    document.addEventListener('click', (e) => {
        // Next step buttons
        if (e.target.classList.contains('btn-next') || e.target.closest('.btn-next')) {
            const button = e.target.classList.contains('btn-next') ? e.target : e.target.closest('.btn-next');
            const step = parseInt(button.getAttribute('data-step'));
            if (step) {
                nextStep(step);
            }
        }
        
        // Previous step buttons
        if (e.target.classList.contains('btn-prev') || e.target.closest('.btn-prev')) {
            const button = e.target.classList.contains('btn-prev') ? e.target : e.target.closest('.btn-prev');
            const step = parseInt(button.getAttribute('data-step'));
            if (step) {
                prevStep(step);
            }
        }
        
        // WhatsApp send button
        if (e.target.classList.contains('btn-whatsapp') || e.target.closest('.btn-whatsapp')) {
            const button = e.target.classList.contains('btn-whatsapp') ? e.target : e.target.closest('.btn-whatsapp');
            if (button.getAttribute('data-action') === 'send-whatsapp') {
                sendOrderToWhatsApp();
            }
        }
    });
    
    // Checkout close button
    const checkoutCloseBtn = document.getElementById('checkout-close');
    if (checkoutCloseBtn) {
        checkoutCloseBtn.addEventListener('click', closeCheckoutModal);
    }
}

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Add auth token if user is logged in
    if (currentUser && currentUser.token) {
        config.headers.Authorization = `Bearer ${currentUser.token}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401 || response.status === 403) {
                console.log('Authentication error detected, logging out user');
                await handleAuthError();
            }
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Don't show error notification for auth errors (handled by handleAuthError)
        if (!error.message.includes('Invalid or expired token') && 
            !error.message.includes('Access token required') &&
            !error.message.includes('Unauthorized access')) {
            showNotification(error.message, 'error');
        }
        
        throw error;
    }
}

async function handleAuthError() {
    // Clear user data
    currentUser = null;
    cartItems = [];
    
    // Clear localStorage
    localStorage.removeItem('novayraUser');
    localStorage.removeItem('novayraToken');
    localStorage.removeItem('novayraCart');
    
    // Update UI
    updateUserInterface();
    updateCartCount();
    
    // Close any open modals
    closeAllModals();
    
    // Remove any existing user menu
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Show notification to user
    showNotification('Your session has expired. Please login again.', 'warning');
    
    // Open login modal after a short delay
    setTimeout(() => {
        openAuthModal('login');
    }, 1000);
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        currentUser = response.data.user;
        currentUser.token = response.data.token;
        
        localStorage.setItem('novayraUser', JSON.stringify(currentUser));
        localStorage.setItem('novayraToken', response.data.token);
        
        updateUserInterface();
        closeAllModals();
        showNotification('Login successful!', 'success');
        
        // Load user's cart from server
        await loadUserCart();
        
    } catch (error) {
        showNotification('Login failed. Please check your credentials.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone')
    };

    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        currentUser = response.data.user;
        currentUser.token = response.data.token;
        
        localStorage.setItem('novayraUser', JSON.stringify(currentUser));
        localStorage.setItem('novayraToken', response.data.token);
        
        updateUserInterface();
        closeAllModals();
        showNotification('Registration successful!', 'success');
        
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'error');
    }
}

function logout() {
    console.log('logout function called'); // Debug log
    
    // Clear user data
    currentUser = null;
    cartItems = [];
    
    // Clear localStorage
    localStorage.removeItem('novayraUser');
    localStorage.removeItem('novayraToken');
    localStorage.removeItem('novayraCart');
    
    // Update UI
    updateUserInterface();
    updateCartCount();
    
    // Close any open modals
    closeAllModals();
    
    // Remove any existing user menu
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Show success notification
    showNotification('Logged out successfully', 'success');
    
    // Reset user button
    if (userMenuBtn) {
        userMenuBtn.innerHTML = `<i class="fas fa-user"></i>`;
        userMenuBtn.title = 'Login/Register';
    }
    

}

async function checkAuthStatus() {
    const token = localStorage.getItem('novayraToken');
    if (token) {
        try {
            const response = await apiRequest('/auth/profile');
            currentUser = response.data.user;
            currentUser.token = token;
            localStorage.setItem('novayraUser', JSON.stringify(currentUser));
            updateUserInterface();
            await loadUserCart();
        } catch (error) {
            // Token is invalid, clear user data
            logout();
        }
    }
}

// Cart Functions
async function addToCart(productId) {
    if (!currentUser) {
        openAuthModal('login');
        return;
    }

    try {
        const response = await apiRequest('/cart/add', {
            method: 'POST',
            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        });

        await loadUserCart();
        showNotification('Product added to cart!', 'success');
        
    } catch (error) {
        showNotification('Failed to add product to cart', 'error');
    }
}

async function loadUserCart() {
    if (!currentUser) return;

    try {
        const response = await apiRequest('/cart');
        cartItems = response.data.items;

        updateCartCount();
        updateCartDisplay();
    } catch (error) {
        console.error('Failed to load cart:', error);
        // Don't show error notification for auth errors (handled by handleAuthError)
    }
}

async function updateCartItemQuantity(itemId, quantity) {
    
    if (!currentUser) {
        showNotification('Please login to update cart', 'error');
        return;
    }
    
    try {
        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            await removeFromCart(itemId);
            return;
        }
        
        // Update quantity in database
        const response = await apiRequest(`/cart/update/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({
                quantity: quantity
            })
        });
        
        // Reload cart from database
        await loadUserCart();
        showNotification('Cart updated successfully!', 'success');
        
    } catch (error) {
        console.error('Failed to update cart item:', error);
        showNotification('Failed to update cart item', 'error');
    }
}

async function removeFromCart(itemId) {
    
    if (!currentUser) {
        showNotification('Please login to remove items from cart', 'error');
        return;
    }
    
    try {
        // Find the item to get its name for notification
        const item = cartItems.find(item => item.id === itemId);
        const itemName = item ? item.name : 'Item';
        
        // Remove item from database
        const response = await apiRequest(`/cart/remove/${itemId}`, {
            method: 'DELETE'
        });
        
        // Reload cart from database
        await loadUserCart();
        showNotification(`${itemName} removed from cart`, 'success');
        
    } catch (error) {
        console.error('Failed to remove item from cart:', error);
        showNotification('Failed to remove item from cart', 'error');
    }
}

function updateCartCount() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'block' : 'none';
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartItemCount = document.getElementById('cart-item-count');
    const cartEmptyState = document.getElementById('cart-empty-state');
    const cartSummaryFloating = document.getElementById('cart-summary-floating');
    const checkoutFloatingBtn = document.getElementById('checkout-floating-btn');
    const checkoutTotalDisplay = document.getElementById('checkout-total-display');
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '';
        cartEmptyState.style.display = 'flex';
        cartSummaryFloating.style.display = 'none';
        checkoutFloatingBtn.style.display = 'none';
        cartTotal.textContent = '₹0';
        cartSubtotal.textContent = '₹0';
        cartItemCount.textContent = '0';
        checkoutTotalDisplay.textContent = '₹0';
        return;
    }

    cartEmptyState.style.display = 'none';
    cartSummaryFloating.style.display = 'block';
    checkoutFloatingBtn.style.display = 'block';
    
    let total = 0;
    const itemsHTML = cartItems.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        

        
        return `
            <div class="cart-item-modern" data-item-id="${item.id}" style="animation-delay: ${index * 0.1}s;">
                <div class="cart-item-content-modern">
                    <img src="${item.image_url}" alt="${item.name}" class="cart-item-image-modern">
                    <div class="cart-item-details-modern">
                        <div class="cart-item-name-modern">${item.name}</div>
                        <div class="cart-item-price-modern">₹${item.price}</div>
                        <div class="cart-item-actions-modern">
                            <div class="quantity-controls-modern">
                                <button class="quantity-btn-modern quantity-decrease" data-item-id="${item.id}" data-quantity="${item.quantity - 1}" style="position: relative; z-index: 10;">-</button>
                                <span class="quantity-display-modern">${item.quantity}</span>
                                <button class="quantity-btn-modern quantity-increase" data-item-id="${item.id}" data-quantity="${item.quantity + 1}" style="position: relative; z-index: 10;">+</button>
                            </div>
                            <button class="remove-btn-modern" data-item-id="${item.id}" style="position: relative; z-index: 10;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    cartItemsContainer.innerHTML = itemsHTML;
    cartTotal.textContent = `₹${total.toFixed(2)}`;
    cartSubtotal.textContent = `₹${total.toFixed(2)}`;
    cartItemCount.textContent = cartItems.length;
    checkoutTotalDisplay.textContent = `₹${total.toFixed(2)}`;
    
    // Update progress bar based on cart value
    updateCartProgress(total);
    
    // Debug: Check if buttons are properly generated

}

function updateCartProgress(total) {
    const progressFill = document.querySelector('.progress-fill');
    const maxProgress = 5000; // ₹5000 for full progress
    const progressPercentage = Math.min((total / maxProgress) * 100, 100);
    progressFill.style.width = `${progressPercentage}%`;
}

// Enhanced cart modal functions
function openCartModal() {
    updateCartDisplay();
    cartModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add entrance animation
    setTimeout(() => {
        const cartSidePanel = document.querySelector('.cart-side-panel');
        cartSidePanel.style.transform = 'translateX(0)';
    }, 10);
}

function closeCartModal() {
    const cartSidePanel = document.querySelector('.cart-side-panel');
    cartSidePanel.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
        cartModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 100);
}

// Product Functions
async function loadProductsFromDatabase() {
    try {
        const response = await apiRequest('/products');
        
        if (response && response.success) {
            products = response.data.products;
            displayProducts(products);
        } else {
            console.error('Failed to load products:', response?.message);
            showNotification('Failed to load products', 'error');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    }
}

function displayProducts(products) {
    const fragranceGrid = document.getElementById('fragrance-grid');
    
    if (!fragranceGrid) {
        console.error('Fragrance grid element not found');
        return;
    }
    
    if (!products || products.length === 0) {
        fragranceGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>No Products Available</h3>
                <p>Our luxury fragrance collection is currently being updated.</p>
            </div>
        `;
        return;
    }
    
    const productsHTML = products.map((product, index) => {
        // Extract fragrance notes for overlay
        const fragranceNotes = product.fragrance_notes || 'Luxury fragrance notes';
        const shortNotes = fragranceNotes.split('|')[0] || fragranceNotes;
        
        // Create fragrance identifier from name
        const fragranceId = product.name.toLowerCase().replace(/\s+/g, '-');
        
        return `
            <div class="fragrance-card fade-in-on-scroll" data-fragrance="${fragranceId}" style="animation-delay: ${index * 0.1}s;">
                <div class="card-image">
                    <img src="${product.image_url}" alt="Novayra ${product.name} luxury perfume bottle" class="perfume-bottle-img" loading="lazy">
                    <div class="image-overlay">
                        <div class="fragrance-details">
                            <h3>${product.name}</h3>
                            <p>${shortNotes}</p>
                            <span class="price">₹${product.price.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${product.name} - ${product.category || 'Luxury Perfume'}</h3>
                    <p>${product.description}</p>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                        <button class="btn btn-outline request-sample-btn" data-product-id="${product.id}">Request Sample</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    fragranceGrid.innerHTML = productsHTML;
    
    // Force all product cards to be visible (fix fade-in-on-scroll)
    setTimeout(() => {
        document.querySelectorAll('.fragrance-card.fade-in-on-scroll').forEach(card => {
            card.classList.add('visible');
        });
    }, 10);
    
    // Re-attach event listeners for the new product buttons
    setupProductEvents();
}

// Sample Request Functions
async function handleSampleRequest(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sampleData = {
        product_id: parseInt(e.target.dataset.productId),
        customer_name: formData.get('customer-name'),
        customer_email: formData.get('customer-email'),
        customer_phone: formData.get('customer-phone'),
        sample_size: formData.get('sample-size'),
        shipping_address: formData.get('shipping-address'),
        shipping_city: formData.get('shipping-city'),
        shipping_state: formData.get('shipping-state'),
        shipping_postal_code: formData.get('shipping-postal')
    };

    try {
        await apiRequest('/samples/request', {
            method: 'POST',
            body: JSON.stringify(sampleData)
        });

        closeAllModals();
        showNotification('Sample request submitted successfully!', 'success');
        e.target.reset();
        
    } catch (error) {
        showNotification('Failed to submit sample request', 'error');
    }
}

// Checkout Functions
async function handleCheckout(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const checkoutData = {
        shipping_address: formData.get('shipping_address'),
        shipping_city: formData.get('shipping_city'),
        shipping_state: formData.get('shipping_state'),
        shipping_postal_code: formData.get('shipping_postal_code'),
        payment_method: formData.get('payment_method')
    };

    try {
        const response = await apiRequest('/orders/place', {
            method: 'POST',
            body: JSON.stringify(checkoutData)
        });

        closeAllModals();
        showNotification('Order placed successfully!', 'success');
        
        // Clear cart items
        await clearCartItems();
        
    } catch (error) {
        showNotification('Failed to place order', 'error');
    }
}

// Contact Form Functions
async function handleContactForm(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-block';
    
    try {
        const formData = new FormData(form);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
    
        
        const response = await apiRequest('/contact/submit', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
        
        // Reset form
        form.reset();
        
        // Show success message
        showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        
        // Scroll to top to show notification
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Contact form submission error:', error);
        showNotification('Failed to send message. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
    }
}

function openSampleModal(productId) {
    const form = document.getElementById('sample-form');
    form.dataset.productId = productId;
    sampleModal.style.display = 'block';
}

function openAuthModal(tab = 'login') {
    switchAuthTab(tab);
    authModal.style.display = 'block';
}

function openCheckoutModal() {
    updateCheckoutDisplay();
    checkoutModal.style.display = 'block';
}

function handleFloatingCheckout() {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    if (!currentUser) {
        closeCartModal();
        openAuthModal('login');
        showNotification('Please login to proceed with checkout', 'info');
        return;
    }
    
    // Proceed to checkout
    openCheckoutModal();
    closeCartModal();
}

// Helper function to clear cart consistently across the application
async function clearCartItems() {
    if (!currentUser) {
        // Clear guest cart from localStorage
        cartItems = [];
        updateCartCount();
        updateCartDisplay();
        localStorage.removeItem('novayraCart');
        return;
    }
    
    try {
        // Clear cart from database
        await apiRequest('/cart/clear', {
            method: 'DELETE'
        });
        
        // Clear cart items from memory
        cartItems = [];
        updateCartCount();
        updateCartDisplay();
        
    } catch (error) {
        console.error('Failed to clear cart from database:', error);
        // Still clear from memory even if database clear fails
        cartItems = [];
        updateCartCount();
        updateCartDisplay();
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        if (modal.id === 'cart-modal') {
            closeCartModal();
        } else {
            modal.style.display = 'none';
        }
    });
}

function switchAuthTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${tabName}-form`).classList.add('active');

    // Update title
    document.getElementById('auth-title').textContent = tabName === 'login' ? 'Login' : 'Register';
}

function updateCheckoutDisplay() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    let total = 0;
    const itemsHTML = cartItems.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="checkout-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>₹${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');

    checkoutItems.innerHTML = itemsHTML;
    checkoutTotal.textContent = `₹${total.toFixed(2)}`;
}

// UI Functions
function updateUserInterface() {
    if (currentUser) {
        userMenuBtn.innerHTML = `<i class="fas fa-user"></i>`;
        userMenuBtn.title = `${currentUser.first_name} ${currentUser.last_name}`;
    } else {
        userMenuBtn.innerHTML = `<i class="fas fa-user"></i>`;
        userMenuBtn.title = 'Login/Register';
    }
}

function showUserMenu() {
    // Remove any existing menu
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-item welcome">
            <span>Welcome, ${currentUser.first_name}!</span>
        </div>
        <div class="user-menu-item">
            <button id="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </button>
        </div>
    `;
    
    // Append to nav-actions for proper positioning
    const navActions = document.querySelector('.nav-actions');
    navActions.appendChild(menu);
    
    // Add event listener to logout button
    const logoutBtn = menu.querySelector('#logout-btn');
    logoutBtn.addEventListener('click', handleLogout);
    
    // Show menu with animation
    setTimeout(() => {
        menu.classList.add('show');
    }, 10);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== userMenuBtn) {
                menu.classList.remove('show');
                setTimeout(() => {
                    if (menu.parentNode) {
                        menu.remove();
                    }
                }, 300);
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

function handleLogout() {

    
    // Remove menu first
    const menu = document.querySelector('.user-menu');
    if (menu) {
        menu.classList.remove('show');
        setTimeout(() => {
            if (menu.parentNode) {
                menu.remove();
            }
        }, 300);
    }
    
    // Call logout function
    logout();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 2rem';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontWeight = '600';
    notification.style.zIndex = '3000';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#10b981';
            break;
        case 'error':
            notification.style.background = '#ef4444';
            break;
        default:
            notification.style.background = '#3b82f6';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Checkout button event
document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    closeAllModals();
    openCheckoutModal();
});

// Existing carousel functionality (keep existing code)
let currentSlide = 0;
const slides = document.querySelectorAll('.testimonial-slide');
const dots = document.querySelectorAll('.dot');

function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[n].classList.add('active');
    dots[n].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

// Auto-advance slides
setInterval(nextSlide, 5000);

// Carousel controls
document.querySelector('.next-btn').addEventListener('click', nextSlide);
document.querySelector('.prev-btn').addEventListener('click', prevSlide);

// Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(250, 249, 246, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(250, 249, 246, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Smooth reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
document.querySelectorAll('.fragrance-card, .stat, .testimonial-content').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

// Custom Scrolling Functionality
function initializeCustomScrolling() {
    // Scroll progress indicator
    const scrollProgress = document.querySelector('.scroll-progress');
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    
    // Update scroll progress
    function updateScrollProgress() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        if (scrollProgress) {
            scrollProgress.style.width = scrollPercent + '%';
        }
        
        // Show/hide scroll to top button
        if (scrollToTopBtn) {
            if (scrollTop > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }
    }
    
    // Scroll to top function
    window.scrollToTop = function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    // Parallax effect
    function handleParallax() {
        const parallaxElements = document.querySelectorAll('.parallax-bg');
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe all elements with scroll animation classes
    const animatedElements = document.querySelectorAll('.fade-in-on-scroll, .slide-in-left, .slide-in-right, .scale-in');
    animatedElements.forEach(el => scrollObserver.observe(el));
    
    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
        });
        
    // Add scroll event listeners
        window.addEventListener('scroll', () => {
        updateScrollProgress();
        handleParallax();
    });
    
    // Initialize scroll progress on load
    updateScrollProgress();
    
    // Add section transition animations
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('section-transition');
    });
    
    // Trigger section animations on scroll
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.3 });
    
    sections.forEach(section => sectionObserver.observe(section));
}

// Initialize custom scrolling when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomScrolling();
});

// Custom Dropdown Styling
function setupCustomDropdowns() {
    const selects = document.querySelectorAll('select');
    
    selects.forEach(select => {
        // Add custom class for styling
        select.classList.add('custom-select');
        
        // Handle change events to update styling
        select.addEventListener('change', function() {
            updateSelectStyling(this);
        });
        
        // Handle focus events
        select.addEventListener('focus', function() {
            this.classList.add('focused');
        });
        
        select.addEventListener('blur', function() {
            this.classList.remove('focused');
        });
        
        // Initial styling
        updateSelectStyling(select);
    });
}

function updateSelectStyling(select) {
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption && selectedOption.value !== '') {
        select.style.color = '#1a5f4a'; // Dark green for selected text
        select.style.fontWeight = '600';
    } else {
        select.style.color = '#9ca3af'; // Gray for placeholder
        select.style.fontWeight = '400';
    }
}

// Checkout Modal Functions
let currentCheckoutStep = 1;

function nextStep(step) {
    if (step === 2) {
        // Validate step 1
        if (!validateStep1()) {
            return;
        }
        updateStep2();
    } else if (step === 3) {
        // Validate step 2
        if (!validateStep2()) {
            showModalNotification('Please review your order details', 'error');
            return;
        }
    }
    
    // Hide current step
    document.getElementById(`step-${currentCheckoutStep}`).classList.remove('active');
    
    // Show new step
    document.getElementById(`step-${step}`).classList.add('active');
    
    // Update progress
    updateProgress(step);
    
    currentCheckoutStep = step;
}

function prevStep(step) {
    // Hide current step
    document.getElementById(`step-${currentCheckoutStep}`).classList.remove('active');
    
    // Show previous step
    document.getElementById(`step-${step}`).classList.add('active');
    
    // Update progress
    updateProgress(step);
    
    currentCheckoutStep = step;
}

function updateProgress(step) {
    // Remove active and completed classes from all steps
    document.querySelectorAll('.progress-step').forEach((progressStep, index) => {
        progressStep.classList.remove('active', 'completed');
        
        const stepNumber = index + 1;
        if (stepNumber < step) {
            progressStep.classList.add('completed');
        } else if (stepNumber === step) {
            progressStep.classList.add('active');
        }
    });
}

function validateStep1() {
    const fieldMappings = {
        'checkout-customer-name': 'Full Name',
        'checkout-customer-phone': 'Phone Number',
        'checkout-shipping-address': 'Complete Address',
        'checkout-shipping-city': 'City',
        'checkout-shipping-state': 'State',
        'checkout-shipping-pincode': 'Pincode',
        'checkout-payment-method': 'Payment Method'
    };
    
    const requiredFields = Object.keys(fieldMappings);
    const missingFields = [];
    const validationErrors = [];
    
    // Clear previous error styling
    document.querySelectorAll('.error-field').forEach(field => {
        field.classList.remove('error-field');
    });
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        
        if (!field) {
            missingFields.push(fieldMappings[fieldId]);
            continue;
        }
        
        const rawValue = field.value;
        const trimmedValue = rawValue.trim();
        
        if (!trimmedValue) {
            missingFields.push(fieldMappings[fieldId]);
            field.classList.add('error-field');
        } else {
            // Additional validation
            if (fieldId === 'checkout-customer-name' && trimmedValue.length < 2) {
                validationErrors.push('Full Name must be at least 2 characters long');
                field.classList.add('error-field');
            } else if (fieldId === 'checkout-customer-phone' && !/^[6-9]\d{9}$/.test(trimmedValue)) {
                validationErrors.push('Please enter a valid 10-digit phone number');
                field.classList.add('error-field');
            } else if (fieldId === 'checkout-shipping-address' && trimmedValue.length < 10) {
                validationErrors.push('Complete Address must be at least 10 characters long');
                field.classList.add('error-field');
            } else if (fieldId === 'checkout-shipping-pincode' && !/^\d{6}$/.test(trimmedValue)) {
                validationErrors.push('Please enter a valid 6-digit pincode');
                field.classList.add('error-field');
            }
        }
    }
    
    if (missingFields.length > 0 || validationErrors.length > 0) {
        let errorMessage = '';
        
        if (missingFields.length > 0) {
            errorMessage += `Please fill in the following required fields:\n• ${missingFields.join('\n• ')}`;
        }
        
        if (validationErrors.length > 0) {
            if (errorMessage) errorMessage += '\n\n';
            errorMessage += `Please correct the following:\n• ${validationErrors.join('\n• ')}`;
        }
        
        showModalNotification(errorMessage, 'error');
        return false;
    }
    
    return true;
}

function validateStep2() {
    // Step 2 is just review, so always valid
    return true;
}

function updateStep2() {
    // Update order items
    const itemsList = document.getElementById('checkout-items-list');
    itemsList.innerHTML = '';
    
    cartItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <div class="item-details">
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">Qty: ${item.quantity}</span>
            </div>
            <span class="item-price">₹${(item.price * item.quantity).toLocaleString()}</span>
        `;
        itemsList.appendChild(itemElement);
    });
    
    // Update totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('review-subtotal').textContent = `₹${subtotal.toLocaleString()}`;
    document.getElementById('review-total').textContent = `₹${subtotal.toLocaleString()}`;
    
    // Update customer details
    const customerDetails = document.getElementById('customer-details-display');
    const customerName = document.getElementById('checkout-customer-name').value;
    const customerPhone = document.getElementById('checkout-customer-phone').value;
    const shippingAddress = document.getElementById('checkout-shipping-address').value;
    const shippingCity = document.getElementById('checkout-shipping-city').value;
    const shippingState = document.getElementById('checkout-shipping-state').value;
    const shippingPincode = document.getElementById('checkout-shipping-pincode').value;
    const paymentMethod = document.getElementById('checkout-payment-method').value;
    
    customerDetails.innerHTML = `
        <div class="detail-row">
            <strong>Name:</strong> ${customerName}
        </div>
        <div class="detail-row">
            <strong>Phone:</strong> ${customerPhone}
        </div>
        <div class="detail-row">
            <strong>Address:</strong> ${shippingAddress}, ${shippingCity}, ${shippingState} - ${shippingPincode}
        </div>
        <div class="detail-row">
            <strong>Payment:</strong> ${paymentMethod.toUpperCase()}
        </div>
    `;
}

async function sendOrderToWhatsApp() {
    // Collect all order data
    const orderData = {
        customer: {
            name: document.getElementById('checkout-customer-name').value,
            phone: document.getElementById('checkout-customer-phone').value,
            address: document.getElementById('checkout-shipping-address').value,
            city: document.getElementById('checkout-shipping-city').value,
            state: document.getElementById('checkout-shipping-state').value,
            pincode: document.getElementById('checkout-shipping-pincode').value,
            paymentMethod: document.getElementById('checkout-payment-method').value
        },
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    try {
        // Save checkout data to user profile if logged in
        if (currentUser) {
            await saveCheckoutDataToProfile();
        }
        
        // Create order in database if user is logged in
        let orderCreated = false;
        if (currentUser) {
            try {
        
                const orderResponse = await apiRequest('/orders/place', {
                    method: 'POST',
                    body: JSON.stringify({
                        shipping_address: orderData.customer.address,
                        shipping_city: orderData.customer.city,
                        shipping_state: orderData.customer.state,
                        shipping_postal_code: orderData.customer.pincode,
                        payment_method: orderData.customer.paymentMethod,
                        notes: 'Order placed via WhatsApp'
                    })
                });
                
                if (orderResponse && orderResponse.success) {
                    orderCreated = true;
    
                }
            } catch (orderError) {
                console.error('Failed to create order in database:', orderError);
                // Continue with WhatsApp order even if database order fails
                // This ensures the user can still place their order via WhatsApp
            }
        }
        
        // Format message for WhatsApp
        const message = formatWhatsAppMessage(orderData);
        
        // Encode message for WhatsApp URL
        const encodedMessage = encodeURIComponent(message);
        
        // WhatsApp business number
        const whatsappNumber = '917385183328';
        
        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Clear cart items
        await clearCartItems();
        
        // Show success notification
        const successMessage = orderCreated 
            ? 'Order sent to WhatsApp and saved to database! We\'ll contact you soon.'
            : 'Order sent to WhatsApp! We\'ll contact you soon.';
        showNotification(successMessage, 'success');
        
        // Close modal after a delay
        setTimeout(() => {
            closeCheckoutModal();
        }, 2000);
        
    } catch (error) {
        console.error('Error in sendOrderToWhatsApp:', error);
        showNotification('Failed to process order. Please try again.', 'error');
    }
}

function formatWhatsAppMessage(orderData) {
    let message = `🛒 *NOVAYRA PERFUME ORDER*\n\n`;
    
    // Customer details
    message += `👤 *Customer Details:*\n`;
    message += `Name: ${orderData.customer.name}\n`;
    message += `Phone: ${orderData.customer.phone}\n`;
    message += `Address: ${orderData.customer.address}\n`;
    message += `City: ${orderData.customer.city}\n`;
    message += `State: ${orderData.customer.state}\n`;
    message += `Pincode: ${orderData.customer.pincode}\n`;
    message += `Payment: ${orderData.customer.paymentMethod.toUpperCase()}\n\n`;
    
    // Order items
    message += `📦 *Order Items:*\n`;
    orderData.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toLocaleString()}\n`;
    });
    
    // Total
    message += `\n💰 *Total: ₹${orderData.total.toLocaleString()}*\n\n`;
    
    // Additional info
    message += `📱 *Order placed via Novayra Website*\n`;
    message += `⏰ *Order Time:* ${new Date().toLocaleString('en-IN')}\n\n`;
    
    message += `Please confirm this order and provide payment details if required. Thank you! 🙏`;
    
    return message;
}

async function openCheckoutModal() {
    // Reset to step 1
    currentCheckoutStep = 1;
    updateProgress(1);
    
    // Show step 1, hide others
    document.getElementById('step-1').classList.add('active');
    document.getElementById('step-2').classList.remove('active');
    document.getElementById('step-3').classList.remove('active');
    
    // Load user profile data if logged in
    if (currentUser) {
        await loadUserProfileData();
    } else {
        // Hide profile save option for non-logged in users
        const profileSaveOption = document.getElementById('profile-save-option');
        if (profileSaveOption) {
            profileSaveOption.style.display = 'none';
        }
    }
    
    // Show modal
    document.getElementById('checkout-modal').style.display = 'block';
    
    // Add body scroll lock
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset form
    document.getElementById('checkout-form').reset();
    
    // Remove error styling
    document.querySelectorAll('.error-field').forEach(field => {
        field.classList.remove('error-field');
    });
}

async function loadUserProfileData() {
    // Only try to load profile if user is logged in
    if (!currentUser) {
        return;
    }
    
    try {
        const response = await apiRequest('/profile/profile', {
            method: 'GET'
        });
        
        if (response && response.fullName) {
            // Pre-fill the checkout form with user data
            document.getElementById('checkout-customer-name').value = response.fullName;
            document.getElementById('checkout-customer-phone').value = response.phone;
            document.getElementById('checkout-shipping-address').value = response.address;
            document.getElementById('checkout-shipping-city').value = response.city;
            document.getElementById('checkout-shipping-state').value = response.state;
            document.getElementById('checkout-shipping-pincode').value = response.pincode;
            
            // Show success notification
            showModalNotification('Your saved details have been loaded!', 'success');
        }
        
        // Show profile save option for logged-in users
        const profileSaveOption = document.getElementById('profile-save-option');
        if (profileSaveOption) {
            profileSaveOption.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Failed to load profile data:', error);
        
        // Don't show error notification for auth errors (handled by handleAuthError)
        if (!error.message.includes('Invalid or expired token') && 
            !error.message.includes('Access token required') &&
            !error.message.includes('Unauthorized access')) {
            // Show profile save option for logged-in users (they can save new data)
            const profileSaveOption = document.getElementById('profile-save-option');
            if (profileSaveOption) {
                profileSaveOption.style.display = 'block';
            }
        }
    }
}

async function saveCheckoutDataToProfile() {
    // Only save if user is logged in
    if (!currentUser) {
        return;
    }
    
    // Check if user wants to save the data
    const saveCheckbox = document.getElementById('save-to-profile');
    if (!saveCheckbox || !saveCheckbox.checked) {
        return; // Don't save if checkbox is unchecked
    }
    
    try {
        const formData = {
            fullName: document.getElementById('checkout-customer-name').value.trim(),
            phone: document.getElementById('checkout-customer-phone').value.trim(),
            address: document.getElementById('checkout-shipping-address').value.trim(),
            city: document.getElementById('checkout-shipping-city').value.trim(),
            state: document.getElementById('checkout-shipping-state').value.trim(),
            pincode: document.getElementById('checkout-shipping-pincode').value.trim(),
            country: 'India'
        };
        
        const response = await apiRequest('/profile/save-checkout-data', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response && response.saved) {
            showModalNotification('Your details have been saved for future orders!', 'success');
        }
    } catch (error) {
        console.error('Failed to save checkout data:', error);
        
        // Don't show error notification for auth errors (handled by handleAuthError)
        // The user will be automatically logged out and redirected to login
    }
}

function showModalNotification(message, type = 'info') {
    // Remove any existing modal notifications
    const existingNotification = document.querySelector('.modal-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `modal-notification ${type}`;
    
    // Convert newlines to HTML
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <div class="notification-text">${formattedMessage}</div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to checkout modal
    const checkoutModal = document.getElementById('checkout-modal');
    checkoutModal.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// Add event listeners for checkout modal
document.addEventListener('DOMContentLoaded', function() {
    // Close button
    document.getElementById('checkout-close').addEventListener('click', closeCheckoutModal);
    
    // Close on outside click
    document.getElementById('checkout-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCheckoutModal();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('checkout-modal').style.display === 'block') {
            closeCheckoutModal();
        }
    });
    
    // Handle checkout step navigation using event delegation
    document.getElementById('checkout-modal').addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        // Handle next step buttons
        if (target.classList.contains('btn-next') && target.hasAttribute('data-step')) {
            const step = parseInt(target.getAttribute('data-step'));
            nextStep(step);
        }
        
        // Handle previous step buttons
        if (target.classList.contains('btn-prev') && target.hasAttribute('data-step')) {
            const step = parseInt(target.getAttribute('data-step'));
            prevStep(step);
        }
        
        // Handle WhatsApp send button
        if (target.hasAttribute('data-action') && target.getAttribute('data-action') === 'send-whatsapp') {
            sendOrderToWhatsApp();
        }
    });
});