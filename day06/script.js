// 상품 데이터
const products = [
    {
        id: 1,
        name: "iPhone 15 Pro",
        category: "electronics",
        price: 1350000,
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
        description: "최신 A17 Pro 칩셋과 티타늄 디자인",
        rating: 4.8,
        reviews: 1250
    },
    {
        id: 2,
        name: "나이키 에어맥스 270",
        category: "clothing",
        price: 159000,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        description: "편안한 착용감의 러닝화",
        rating: 4.5,
        reviews: 890
    },
    {
        id: 3,
        name: "해리포터 완전판",
        category: "books",
        price: 45000,
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
        description: "J.K. 롤링의 판타지 소설 시리즈",
        rating: 4.9,
        reviews: 2100
    },
    {
        id: 4,
        name: "무지 후드티",
        category: "clothing",
        price: 35000,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
        description: "편안한 착용감의 기본 후드티",
        rating: 4.3,
        reviews: 456
    },
    {
        id: 5,
        name: "MacBook Air M2",
        category: "electronics",
        price: 1490000,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
        description: "M2 칩셋의 초경량 노트북",
        rating: 4.7,
        reviews: 980
    },
    {
        id: 6,
        name: "요가 매트",
        category: "sports",
        price: 25000,
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
        description: "미끄럼 방지 기능의 프리미엄 요가 매트",
        rating: 4.4,
        reviews: 320
    },
    {
        id: 7,
        name: "블루투스 이어폰",
        category: "electronics",
        price: 89000,
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
        description: "노이즈 캔슬링 기능의 무선 이어폰",
        rating: 4.6,
        reviews: 750
    },
    {
        id: 8,
        name: "원목 식탁",
        category: "home",
        price: 320000,
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
        description: "4인용 원목 식탁 세트",
        rating: 4.5,
        reviews: 120
    },
    {
        id: 9,
        name: "자바스크립트 완벽 가이드",
        category: "books",
        price: 55000,
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
        description: "프론트엔드 개발자를 위한 필수 도서",
        rating: 4.8,
        reviews: 650
    },
    {
        id: 10,
        name: "덤벨 세트",
        category: "sports",
        price: 120000,
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        description: "가정용 덤벨 20kg 세트",
        rating: 4.2,
        reviews: 180
    },
    {
        id: 11,
        name: "LED 스탠드",
        category: "home",
        price: 45000,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        description: "조도 조절 가능한 LED 스탠드",
        rating: 4.4,
        reviews: 280
    },
    {
        id: 12,
        name: "반팔 티셔츠",
        category: "clothing",
        price: 15000,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        description: "시원한 여름용 반팔 티셔츠",
        rating: 4.1,
        reviews: 340
    }
];

// 장바구니 데이터
let cart = [];

// DOM 요소들
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const priceFilter = document.getElementById('priceFilter');
const sortFilter = document.getElementById('sortFilter');
const productsGrid = document.getElementById('productsGrid');
const productCount = document.getElementById('productCount');
const cartBtn = document.getElementById('cartBtn');
const cartDropdown = document.getElementById('cartDropdown');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');

// 현재 필터링된 상품들
let filteredProducts = [...products];

// 이벤트 리스너
searchBtn.addEventListener('click', filterProducts);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') filterProducts();
});
categoryFilter.addEventListener('change', filterProducts);
priceFilter.addEventListener('change', filterProducts);
sortFilter.addEventListener('change', filterProducts);
cartBtn.addEventListener('click', toggleCart);

// 상품 필터링
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const priceRange = priceFilter.value;
    const sortBy = sortFilter.value;

    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || product.category === category;
        const matchesPrice = !priceRange || checkPriceRange(product.price, priceRange);
        
        return matchesSearch && matchesCategory && matchesPrice;
    });

    // 정렬
    if (sortBy === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rating') {
        filteredProducts.sort((a, b) => b.rating - a.rating);
    }

    displayProducts();
}

// 가격 범위 확인
function checkPriceRange(price, range) {
    const [min, max] = range.split('-').map(Number);
    return price >= min && price <= max;
}

// 상품 표시
function displayProducts() {
    productCount.textContent = `총 ${filteredProducts.length}개의 상품`;
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.2rem; grid-column: 1 / -1;">검색 결과가 없습니다.</p>';
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-category">${getCategoryName(product.category)}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-rating">
                    <div class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</div>
                    <span class="rating-text">(${product.rating}) ${product.reviews}개 리뷰</span>
                </div>
                <div class="product-price">${product.price.toLocaleString()}원</div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    장바구니에 추가
                </button>
            </div>
        </div>
    `).join('');
}

// 카테고리 이름 변환
function getCategoryName(category) {
    const categoryNames = {
        electronics: '전자제품',
        clothing: '의류',
        books: '도서',
        home: '홈&리빙',
        sports: '스포츠'
    };
    return categoryNames[category] || category;
}

// 장바구니에 상품 추가
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    
    updateCartDisplay();
    showCartNotification();
}

// 장바구니 표시 업데이트
function updateCartDisplay() {
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">장바구니가 비어있습니다</p>';
        cartTotal.textContent = '0';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price.toLocaleString()}원</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">삭제</button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toLocaleString();
}

// 수량 업데이트
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartDisplay();
        }
    }
}

// 장바구니에서 상품 제거
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

// 장바구니 토글
function toggleCart() {
    cartDropdown.classList.toggle('show');
}

// 장바구니 알림
function showCartNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = '장바구니에 추가되었습니다!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 페이지 로드시 상품 표시
window.addEventListener('load', () => {
    displayProducts();
});

// 장바구니 외부 클릭시 닫기
document.addEventListener('click', (e) => {
    // 장바구니 버튼이나 드롭다운 내부를 클릭한 경우가 아닐 때만 닫기
    if (!cartBtn.contains(e.target) && !cartDropdown.contains(e.target)) {
        cartDropdown.classList.remove('show');
    }
});

// 장바구니 내부 버튼 클릭 시 이벤트 전파 방지
cartDropdown.addEventListener('click', (e) => {
    // 버튼 클릭 시 이벤트 전파를 막아서 외부 클릭으로 인식되지 않도록 함
    if (e.target.classList.contains('quantity-btn') || e.target.classList.contains('remove-btn')) {
        e.stopPropagation();
    }
});