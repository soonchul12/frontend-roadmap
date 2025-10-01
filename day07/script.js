// 가계부 앱 데이터 관리
class MoneyTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.settings = this.loadSettings();
        this.categories = this.getDefaultCategories();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.applyTheme();
        this.setupServiceWorker();
    }

    // 기본 카테고리 설정
    getDefaultCategories() {
        return {
            income: ['급여', '부업', '투자수익', '기타수입'],
            expense: ['식비', '교통비', '쇼핑', '의료비', '교육비', '통신비', '주거비', '기타지출'],
            transfer: ['현금', '은행', '카드']
        };
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 빠른 액션 버튼
        document.getElementById('addIncomeBtn').addEventListener('click', () => this.openTransactionModal('income'));
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.openTransactionModal('expense'));
        document.getElementById('addTransferBtn').addEventListener('click', () => this.openTransactionModal('transfer'));

        // 모달 관련
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.handleTransactionSubmit(e));

        // 거래 유형 변경
        document.getElementById('transactionType').addEventListener('change', (e) => this.handleTransactionTypeChange(e.target.value));

        // 설정 관련
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettingsModal());
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('darkModeToggle').addEventListener('change', (e) => this.toggleDarkMode(e.target.checked));

        // 네비게이션
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e.target.closest('.nav-item')));
        });

        // 데이터 내보내기/가져오기
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => this.importData());

        // 모달 외부 클릭으로 닫기
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closeSettingsModal();
            }
        });
    }

    // 거래 추가/수정 모달 열기
    openTransactionModal(type = 'income', transaction = null) {
        const modal = document.getElementById('transactionModal');
        const modalTitle = document.getElementById('modalTitle');
        const transactionType = document.getElementById('transactionType');
        const form = document.getElementById('transactionForm');
        
        // 수정 모드인지 확인
        const isEditMode = transaction !== null;
        
        if (isEditMode) {
            modalTitle.textContent = `${this.getTypeLabel(type)} 수정`;
            // 기존 값으로 폼 채우기
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('description').value = transaction.description || '';
            document.getElementById('date').value = transaction.date;
            document.getElementById('account').value = transaction.account || 'cash';
            
            // 수정 모드 표시를 위한 데이터 속성 추가
            form.dataset.editId = transaction.id;
        } else {
            modalTitle.textContent = `${this.getTypeLabel(type)} 추가`;
            // 폼 초기화
            form.reset();
            form.removeAttribute('data-edit-id');
            // 오늘 날짜로 설정
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
        }
        
        transactionType.value = type;
        this.updateCategoryOptions(type);
        
        // 수정 모드일 때 카테고리 설정
        if (isEditMode) {
            setTimeout(() => {
                document.getElementById('category').value = transaction.category;
            }, 100);
        }
        
        modal.classList.add('show');
        document.getElementById('amount').focus();
    }

    // 거래 유형 변경 처리
    handleTransactionTypeChange(type) {
        this.updateCategoryOptions(type);
        const accountGroup = document.getElementById('accountGroup');
        accountGroup.style.display = type === 'transfer' ? 'block' : 'none';
    }

    // 카테고리 옵션 업데이트
    updateCategoryOptions(type) {
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '';
        
        this.categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    // 거래 제출 처리
    handleTransactionSubmit(e) {
        e.preventDefault();
        
        // 직접 값 가져오기 (더 안전한 방법)
        const type = document.getElementById('transactionType').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;
        const account = document.getElementById('account').value;
        const form = e.target;

        console.log('입력값 확인:', { type, amount, category, description, date, account });

        const transaction = {
            type: type,
            amount: parseFloat(amount),
            category: category,
            description: description,
            date: date,
            account: account || 'cash',
            createdAt: new Date().toISOString()
        };

        console.log('생성된 거래:', transaction);

        // 유효성 검사
        if (!transaction.amount || transaction.amount <= 0) {
            this.showToast('올바른 금액을 입력해주세요.');
            return;
        }

        if (!transaction.category) {
            this.showToast('카테고리를 선택해주세요.');
            return;
        }

        // 수정 모드인지 확인
        const editId = form.dataset.editId;
        if (editId) {
            // 수정 모드
            this.updateTransaction(parseInt(editId), transaction);
            this.showToast(`${this.getTypeLabel(transaction.type)}이 수정되었습니다!`);
        } else {
            // 추가 모드
            transaction.id = Date.now();
            this.addTransaction(transaction);
            this.showToast(`${this.getTypeLabel(transaction.type)}이 추가되었습니다!`);
        }

        this.closeModal();
    }

    // 거래 추가
    addTransaction(transaction) {
        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.updateDashboard();
    }

    // 거래 삭제
    deleteTransaction(id) {
        if (confirm('정말로 이 거래를 삭제하시겠습니까?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.updateDashboard();
            this.showToast('거래가 삭제되었습니다.');
        }
    }

    // 거래 수정
    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.openTransactionModal(transaction.type, transaction);
    }

    // 거래 업데이트
    updateTransaction(id, updatedTransaction) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.transactions[index] = { ...updatedTransaction, id: id };
            this.saveTransactions();
            this.updateDashboard();
            this.showToast('거래가 수정되었습니다.');
        }
    }

    // 대시보드 업데이트
    updateDashboard() {
        this.updateBalanceCard();
        this.updateRecentTransactions();
        this.updateMonthlyStats();
        this.updateCategoryChart();
    }

    // 잔액 카드 업데이트
    updateBalanceCard() {
        const totalIncome = this.getTotalAmount('income');
        const totalExpense = this.getTotalAmount('expense');
        const totalBalance = totalIncome - totalExpense;

        document.getElementById('totalBalance').textContent = this.formatCurrency(totalBalance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpense').textContent = this.formatCurrency(totalExpense);

        // 차트 업데이트
        this.updateBalanceChart(totalIncome, totalExpense);
    }

    // 최근 거래 내역 업데이트
    updateRecentTransactions() {
        const container = document.getElementById('transactionsList');
        const recentTransactions = this.transactions.slice(0, 5);

        if (recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h3>거래 내역이 없습니다</h3>
                    <p>첫 번째 거래를 추가해보세요!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    ${this.getTransactionIcon(transaction.type)}
                </div>
                <div class="transaction-details">
                    <div class="transaction-category">${transaction.category}</div>
                    <div class="transaction-description">${transaction.description || '설명 없음'}</div>
                    <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'expense' ? '-' : '+'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="edit-btn" onclick="moneyTracker.editTransaction(${transaction.id})" title="수정">
                        ✏️
                    </button>
                    <button class="delete-btn" onclick="moneyTracker.deleteTransaction(${transaction.id})" title="삭제">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 월별 통계 업데이트
    updateMonthlyStats() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });

        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyNet = monthlyIncome - monthlyExpense;

        document.getElementById('monthlyIncome').textContent = this.formatCurrency(monthlyIncome);
        document.getElementById('monthlyExpense').textContent = this.formatCurrency(monthlyExpense);
        document.getElementById('monthlyNet').textContent = this.formatCurrency(monthlyNet);
        document.getElementById('transactionCount').textContent = monthlyTransactions.length;
    }

    // 카테고리별 차트 업데이트
    updateCategoryChart() {
        const expenseTransactions = this.transactions.filter(t => t.type === 'expense');
        const categoryTotals = {};

        expenseTransactions.forEach(transaction => {
            const category = transaction.category;
            categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
        });

        // 차트 그리기 (간단한 구현)
        this.drawCategoryChart(categoryTotals);
    }

    // 잔액 차트 업데이트
    updateBalanceChart(income, expense) {
        const canvas = document.getElementById('balanceCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 30;

        // 캔버스 크기 설정
        canvas.width = 80;
        canvas.height = 80;

        // 배경 원
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();

        // 수입 부분
        if (income > 0) {
            const incomeAngle = (income / (income + expense)) * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, incomeAngle);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.stroke();
        }
    }

    // 카테고리 차트 그리기
    drawCategoryChart(categoryTotals) {
        const canvas = document.getElementById('categoryCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        if (total === 0) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        let currentAngle = 0;
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

        Object.entries(categoryTotals).forEach(([category, amount], index) => {
            const sliceAngle = (amount / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();

            currentAngle += sliceAngle;
        });
    }

    // 유틸리티 함수들
    getTotalAmount(type) {
        return this.transactions
            .filter(t => t.type === type)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getTypeLabel(type) {
        const labels = {
            income: '수입',
            expense: '지출',
            transfer: '이체'
        };
        return labels[type] || type;
    }

    getTransactionIcon(type) {
        const icons = {
            income: '📈',
            expense: '📉',
            transfer: '🔄'
        };
        return icons[type] || '💰';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });
    }

    // 모달 관리
    closeModal() {
        document.getElementById('transactionModal').classList.remove('show');
        document.getElementById('transactionForm').reset();
    }

    openSettingsModal() {
        document.getElementById('settingsModal').classList.add('show');
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    // 테마 관리
    toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        this.settings.darkMode = !isDark;
        this.saveSettings();
        
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.textContent = isDark ? '🌙' : '☀️';
    }

    toggleDarkMode(enabled) {
        document.body.setAttribute('data-theme', enabled ? 'dark' : 'light');
        this.settings.darkMode = enabled;
        this.saveSettings();
    }

    applyTheme() {
        if (this.settings.darkMode) {
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('themeToggle').textContent = '☀️';
            document.getElementById('darkModeToggle').checked = true;
        }
    }

    // 네비게이션 처리
    handleNavigation(navItem) {
        // 활성 탭 업데이트
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        navItem.classList.add('active');

        // 탭별 콘텐츠 표시 (간단한 구현)
        const tab = navItem.dataset.tab;
        console.log(`탭 변경: ${tab}`);
        // 여기에 각 탭의 콘텐츠를 표시하는 로직 추가
    }

    // 데이터 관리
    saveTransactions() {
        localStorage.setItem('moneyTracker_transactions', JSON.stringify(this.transactions));
    }

    loadTransactions() {
        const saved = localStorage.getItem('moneyTracker_transactions');
        return saved ? JSON.parse(saved) : [];
    }

    saveSettings() {
        localStorage.setItem('moneyTracker_settings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('moneyTracker_settings');
        return saved ? JSON.parse(saved) : { darkMode: false, currency: 'KRW' };
    }

    // 데이터 내보내기/가져오기
    exportData() {
        const data = {
            transactions: this.transactions,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `money-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('데이터가 내보내기되었습니다!');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.transactions && Array.isArray(data.transactions)) {
                            this.transactions = data.transactions;
                            this.saveTransactions();
                            this.updateDashboard();
                            this.showToast('데이터가 성공적으로 가져와졌습니다!');
                        } else {
                            throw new Error('잘못된 데이터 형식입니다.');
                        }
                    } catch (error) {
                        this.showToast('데이터 가져오기에 실패했습니다.');
                        console.error('Import error:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // 토스트 알림
    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 로딩 표시
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    // Service Worker 설정
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker 등록 성공:', registration);
                })
                .catch(error => {
                    console.log('Service Worker 등록 실패:', error);
                });
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.moneyTracker = new MoneyTracker();
});

// PWA 설치 프롬프트
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // 설치 버튼 표시 (선택사항)
    const installBtn = document.createElement('button');
    installBtn.textContent = '앱 설치';
    installBtn.className = 'btn-primary';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '80px';
    installBtn.style.right = '20px';
    installBtn.style.zIndex = '1000';
    
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`사용자 선택: ${outcome}`);
            deferredPrompt = null;
            installBtn.remove();
        }
    });
    
    document.body.appendChild(installBtn);
});