
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
        this.setupNavigation();
        
        // 기본적으로 대시보드 페이지 표시
        this.showPage('dashboard');
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

        // 전체 거래 내역 관련
        document.getElementById('viewAllBtn').addEventListener('click', () => this.openAllTransactionsModal());
        document.getElementById('closeAllTransactionsModal').addEventListener('click', () => this.closeAllTransactionsModal());
        document.getElementById('filterType').addEventListener('change', () => this.filterAllTransactions());
        document.getElementById('filterCategory').addEventListener('change', () => this.filterAllTransactions());
        document.getElementById('filterMonth').addEventListener('change', () => this.filterAllTransactions());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearAllFilters());

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
        
        // 컨테이너 크기에 맞게 캔버스 크기 설정
        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // 패딩을 고려한 실제 사용 가능한 크기
        const availableWidth = containerRect.width - 40; // 좌우 패딩 20px씩
        const availableHeight = containerRect.height - 40; // 상하 패딩 20px씩
        
        // 정사각형으로 만들기 (원형 차트를 위해)
        const size = Math.min(availableWidth, availableHeight);
        
        // 고해상도 디스플레이 지원
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        canvas.width = size * devicePixelRatio;
        canvas.height = size * devicePixelRatio;
        
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // CSS로 실제 표시 크기 설정
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';

        const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        if (total === 0) {
            // 빈 차트 메시지
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('지출 데이터가 없습니다', size / 2, size / 2);
            return;
        }

        // 전체 100% 기준으로 비율 재분배 (최소 7% 보장)
        const categories = Object.entries(categoryTotals);
        const adjustedCategories = {};
        
        const minRatio = 0.07; // 최소 7%
        
        // 1단계: 원래 비율 계산
        const originalRatios = {};
        categories.forEach(([category, amount]) => {
            originalRatios[category] = amount / total;
        });
        
        // 2단계: 최소 비율 미만인 카테고리들을 7%로 설정
        const smallCategories = [];
        const largeCategories = [];
        
        categories.forEach(([category, amount]) => {
            if (originalRatios[category] < minRatio) {
                adjustedCategories[category] = total * minRatio;
                smallCategories.push(category);
            } else {
                largeCategories.push(category);
            }
        });
        
        // 3단계: 큰 카테고리들이 차지할 수 있는 남은 비율 계산
        const remainingRatio = 1 - (smallCategories.length * minRatio);
        
        // 4단계: 큰 카테고리들의 원래 비율 합계 계산
        const largeCategoriesTotalRatio = largeCategories.reduce((sum, category) => {
            return sum + originalRatios[category];
        }, 0);
        
        // 5단계: 큰 카테고리들을 남은 비율에 맞게 재분배
        largeCategories.forEach(category => {
            const originalRatio = originalRatios[category];
            const adjustedRatio = (originalRatio / largeCategoriesTotalRatio) * remainingRatio;
            adjustedCategories[category] = total * adjustedRatio;
        });

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 20; // 여백 고려

        let currentAngle = 0;
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E74C3C', '#3498DB', '#F39C12', '#27AE60', '#9B59B6', '#E67E22', '#1ABC9C', '#34495E', '#E91E63', '#00BCD4', '#FF9800', '#8BC34A', '#673AB7', '#795548'];

        Object.entries(adjustedCategories).forEach(([category, amount], index) => {
            const sliceAngle = (amount / total) * 2 * Math.PI;
            const midAngle = currentAngle + sliceAngle / 2;
            
            // 파이 슬라이스 그리기
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();

            // 텍스트 위치 계산 (슬라이스가 충분히 클 때만 텍스트 표시)
            const sliceRatio = sliceAngle / (2 * Math.PI);
            if (sliceRatio > 0.05) { // 최소 5% 이상일 때 텍스트 표시
                // 텍스트 위치를 슬라이스 중앙에 배치
                const textRadius = radius * 0.6; // 차트 중심에서 60% 위치
                const textX = centerX + Math.cos(midAngle) * textRadius;
                const textY = centerY + Math.sin(midAngle) * textRadius;
                
                // 반응형 폰트 크기 계산
                const baseFontSize = Math.max(8, Math.min(12, size / 30));
                const smallFontSize = Math.max(6, Math.min(9, size / 40));

                // 텍스트 스타일 설정
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `bold ${baseFontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 텍스트 그림자 효과
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 2;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;

                // 카테고리명 표시
                const textSpacing = Math.max(3, size / 60);
                ctx.fillText(category, textX, textY - textSpacing);

                // 금액 표시 (실제 원래 금액 사용)
                ctx.font = `bold ${smallFontSize}px Arial`;
                const originalAmount = categoryTotals[category]; // 조정되지 않은 실제 금액
                const formattedAmount = this.formatCurrency(originalAmount);
                ctx.fillText(formattedAmount, textX, textY + textSpacing);

                // 그림자 효과 초기화
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            currentAngle += sliceAngle;
        });
    }


    // 유틸리티 함수들
    getTotalAmount(type) {
        return this.transactions
            .filter(t => t.type === type)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getCategoryTotals(type) {
        const totals = {};
        this.transactions
            .filter(t => t.type === type)
            .forEach(t => {
                if (totals[t.category]) {
                    totals[t.category] += t.amount;
                } else {
                    totals[t.category] = t.amount;
                }
            });
        return totals;
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

    formatFullDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
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

    // 전체 거래 내역 모달 관리
    openAllTransactionsModal() {
        this.setupAllTransactionsFilters();
        this.updateAllTransactionsList();
        this.updateAllTransactionsSummary();
        document.getElementById('allTransactionsModal').classList.add('show');
    }

    closeAllTransactionsModal() {
        document.getElementById('allTransactionsModal').classList.remove('show');
    }

    // 전체 거래 내역 필터 설정
    setupAllTransactionsFilters() {
        // 카테고리 필터 설정
        const categoryFilter = document.getElementById('filterCategory');
        const allCategories = [...new Set(this.transactions.map(t => t.category))];
        
        categoryFilter.innerHTML = '<option value="">전체 카테고리</option>';
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // 월별 필터 설정
        const monthFilter = document.getElementById('filterMonth');
        const months = [...new Set(this.transactions.map(t => {
            const date = new Date(t.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }))].sort().reverse();

        monthFilter.innerHTML = '<option value="">전체 기간</option>';
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            const [year, monthNum] = month.split('-');
            option.textContent = `${year}년 ${monthNum}월`;
            monthFilter.appendChild(option);
        });
    }

    // 전체 거래 내역 목록 업데이트
    updateAllTransactionsList() {
        const container = document.getElementById('allTransactionsList');
        const filteredTransactions = this.getFilteredTransactions();

        if (filteredTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <div class="empty-state-icon">📊</div>
                    <h3>거래 내역이 없습니다</h3>
                    <p>필터 조건에 맞는 거래가 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    ${this.getTransactionIcon(transaction.type)}
                </div>
                <div class="transaction-details">
                    <div class="transaction-category">${transaction.category}</div>
                    <div class="transaction-description">${transaction.description || '설명 없음'}</div>
                    <div class="transaction-date">${this.formatFullDate(transaction.date)}</div>
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

    // 필터링된 거래 목록 가져오기
    getFilteredTransactions() {
        const typeFilter = document.getElementById('filterType').value;
        const categoryFilter = document.getElementById('filterCategory').value;
        const monthFilter = document.getElementById('filterMonth').value;

        return this.transactions.filter(transaction => {
            const matchesType = !typeFilter || transaction.type === typeFilter;
            const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
            
            let matchesMonth = true;
            if (monthFilter) {
                const transactionDate = new Date(transaction.date);
                const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                matchesMonth = transactionMonth === monthFilter;
            }

            return matchesType && matchesCategory && matchesMonth;
        });
    }

    // 전체 거래 내역 필터링
    filterAllTransactions() {
        this.updateAllTransactionsList();
        this.updateAllTransactionsSummary();
    }

    // 필터 초기화
    clearAllFilters() {
        document.getElementById('filterType').value = '';
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterMonth').value = '';
        this.updateAllTransactionsList();
        this.updateAllTransactionsSummary();
    }

    // 전체 거래 내역 요약 업데이트
    updateAllTransactionsSummary() {
        const filteredTransactions = this.getFilteredTransactions();
        
        const totalCount = filteredTransactions.length;
        const totalIncome = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        document.getElementById('totalTransactionsCount').textContent = totalCount;
        document.getElementById('totalTransactionsIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalTransactionsExpense').textContent = this.formatCurrency(totalExpense);
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

    // 네비게이션 설정
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        console.log('네비게이션 아이템 개수:', navItems.length);
        
        navItems.forEach((item, index) => {
            console.log(`네비게이션 아이템 ${index}:`, item.getAttribute('data-tab'));
            item.addEventListener('click', () => {
                const tab = item.getAttribute('data-tab');
                console.log('클릭된 탭:', tab);
                this.showPage(tab);
            });
        });
    }

    // 페이지 표시 함수
    showPage(pageId) {
        console.log('showPage 호출됨:', pageId);
        
        // 모든 페이지 숨기기
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        // 네비게이션 활성화 상태 업데이트
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 선택된 네비게이션 아이템 활성화
        const activeNavItem = document.querySelector(`[data-tab="${pageId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
            console.log('네비게이션 아이템 활성화됨:', pageId);
        }
        
        // 페이지별 데이터 로드
        if (pageId === 'dashboard') {
            this.updateDashboard();
        } else if (pageId === 'transactions') {
            this.loadTransactions();
            } else if (pageId === 'analytics') {
                // 분석 페이지는 별도 파일로 이동됨
        } else if (pageId === 'goals') {
            this.loadGoals();
        }
        
        // 선택된 페이지 표시 (analytics는 analysisPage로 매핑)
        const pageIdMapping = {
            'dashboard': 'dashboardPage',
            'transactions': 'transactionsPage', 
            'analytics': 'analysisPage',
            'goals': 'goalsPage'
        };
        const targetPageId = pageIdMapping[pageId] || pageId + 'Page';
        const targetPage = document.getElementById(targetPageId);
        console.log('대상 페이지:', targetPageId, targetPage);
        
        if (targetPage) {
            // 강제로 페이지 표시
            targetPage.style.display = 'block';
            targetPage.style.visibility = 'visible';
            targetPage.style.opacity = '1';
            console.log('페이지 표시됨:', pageId);
            console.log('페이지 스타일:', targetPage.style.display);
        } else {
            console.error('페이지를 찾을 수 없음:', targetPageId);
        }
    }




    // 지출 패턴 분석 (요일별, 시간대별)
    drawSpendingPatterns() {
        this.drawWeeklyPattern();
        this.drawHourlyPattern();
    }

    // 요일별 지출 패턴
    drawWeeklyPattern() {
        const canvas = document.getElementById('weeklyPatternCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayExpenses = [0, 0, 0, 0, 0, 0, 0];

        this.transactions.filter(t => t.type === 'expense').forEach(t => {
            const day = new Date(t.date).getDay();
            dayExpenses[day] += t.amount;
        });

        const maxExpense = Math.max(...dayExpenses, 100000);

        ctx.clearRect(0, 0, width, height);
        
        const barWidth = width / 7 - 10;
        const maxBarHeight = height - 40;

        dayExpenses.forEach((expense, index) => {
            const barHeight = (expense / maxExpense) * maxBarHeight;
            const x = index * (width / 7) + 5;
            const y = height - barHeight - 20;

            // 바 그리기
            ctx.fillStyle = '#667eea';
            ctx.fillRect(x, y, barWidth, barHeight);

            // 요일 라벨
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(days[index], x + barWidth / 2, height - 5);
        });
    }

    // 시간대별 지출 패턴
    drawHourlyPattern() {
        const canvas = document.getElementById('hourlyPatternCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const hourlyExpenses = new Array(24).fill(0);

        this.transactions.filter(t => t.type === 'expense').forEach(t => {
            const hour = new Date(t.date).getHours();
            hourlyExpenses[hour] += t.amount;
        });

        const maxExpense = Math.max(...hourlyExpenses, 100000);

        ctx.clearRect(0, 0, width, height);
        
        const barWidth = width / 24 - 2;
        const maxBarHeight = height - 40;

        hourlyExpenses.forEach((expense, index) => {
            const barHeight = (expense / maxExpense) * maxBarHeight;
            const x = index * (width / 24) + 1;
            const y = height - barHeight - 20;

            // 바 그리기
            ctx.fillStyle = '#4BC0C0';
            ctx.fillRect(x, y, barWidth, barHeight);

            // 시간 라벨 (4시간마다)
            if (index % 4 === 0) {
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${index}시`, x + barWidth / 2, height - 5);
            }
        });
    }

    // 예산 대비 분석
    loadBudgetAnalysis() {
        const container = document.getElementById('budgetAnalysis');
        if (!container) return;

        // 기본 예산 설정 (실제로는 사용자가 설정할 수 있도록 해야 함)
        const budgets = {
            '식비': 500000,
            '교통비': 100000,
            '쇼핑': 200000,
            '주거비': 800000,
            '교육비': 100000,
            '기타지출': 50000
        };

        const categoryTotals = this.getCategoryTotals('expense');
        container.innerHTML = '';

        Object.entries(budgets).forEach(([category, budget]) => {
            const spent = categoryTotals[category] || 0;
            const percentage = (spent / budget) * 100;
            const remaining = budget - spent;

            const item = document.createElement('div');
            item.className = 'budget-item';
            item.innerHTML = `
                <h4>${category}</h4>
                <div class="budget-progress">
                    <div class="budget-progress-bar" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="analysis-metric">
                    <span class="label">예산</span>
                    <span class="value">${this.formatCurrency(budget)}</span>
                </div>
                <div class="analysis-metric">
                    <span class="label">지출</span>
                    <span class="value">${this.formatCurrency(spent)}</span>
                </div>
                <div class="analysis-metric">
                    <span class="label">잔여</span>
                    <span class="value ${remaining >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(remaining)}
                    </span>
                </div>
                <div class="analysis-metric">
                    <span class="label">사용률</span>
                    <span class="value ${percentage <= 80 ? 'positive' : percentage <= 100 ? 'value' : 'negative'}">
                        ${percentage.toFixed(1)}%
                    </span>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // 수입 대비 지출 분석
    loadIncomeExpenseAnalysis() {
        const container = document.getElementById('incomeExpenseAnalysis');
        if (!container) return;

        const totalIncome = this.getTotalAmount('income');
        const totalExpense = this.getTotalAmount('expense');
        const netIncome = totalIncome - totalExpense;
        const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

        container.innerHTML = `
            <div class="income-expense-item">
                <h4>수입 대비 지출 비율</h4>
                <div class="budget-progress">
                    <div class="budget-progress-bar" style="width: ${Math.min(expenseRatio, 100)}%"></div>
                </div>
                <div class="analysis-metric">
                    <span class="label">지출 비율</span>
                    <span class="value ${expenseRatio <= 70 ? 'positive' : expenseRatio <= 90 ? 'value' : 'negative'}">
                        ${expenseRatio.toFixed(1)}%
                    </span>
                </div>
            </div>
            <div class="income-expense-item">
                <h4>저축률</h4>
                <div class="analysis-metric">
                    <span class="label">저축률</span>
                    <span class="value ${netIncome >= 0 ? 'positive' : 'negative'}">
                        ${totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}%
                    </span>
                </div>
            </div>
            <div class="income-expense-item">
                <h4>월간 순이익</h4>
                <div class="analysis-metric">
                    <span class="label">순이익</span>
                    <span class="value ${netIncome >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(netIncome)}
                    </span>
                </div>
            </div>
        `;
    }

    // 목표 달성 현황
    loadGoalTracking() {
        const container = document.getElementById('goalTracking');
        if (!container) return;

        // 기본 목표 설정 (실제로는 사용자가 설정할 수 있도록 해야 함)
        const goals = [
            { title: '월 저축 목표', target: 500000, current: this.getTotalAmount('income') - this.getTotalAmount('expense') },
            { title: '여행 자금', target: 2000000, current: 500000 },
            { title: '비상금', target: 1000000, current: 300000 }
        ];

        container.innerHTML = '';

        goals.forEach(goal => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100);
            const remaining = goal.target - goal.current;

            const item = document.createElement('div');
            item.className = 'goal-item';
            item.innerHTML = `
                <h4>${goal.title}</h4>
                <div class="goal-progress">
                    <div class="goal-progress-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="analysis-metric">
                    <span class="label">목표</span>
                    <span class="value">${this.formatCurrency(goal.target)}</span>
                </div>
                <div class="analysis-metric">
                    <span class="label">현재</span>
                    <span class="value">${this.formatCurrency(goal.current)}</span>
                </div>
                <div class="analysis-metric">
                    <span class="label">잔여</span>
                    <span class="value ${remaining >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(remaining)}
                    </span>
                </div>
                <div class="analysis-metric">
                    <span class="label">달성률</span>
                    <span class="value ${percentage >= 80 ? 'positive' : percentage >= 50 ? 'value' : 'negative'}">
                        ${percentage.toFixed(1)}%
                    </span>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // 지출 인사이트
    loadInsights() {
        const container = document.getElementById('insightsContainer');
        if (!container) return;

        const insights = this.generateInsights();
        container.innerHTML = '';

        insights.forEach(insight => {
            const card = document.createElement('div');
            card.className = 'insight-card';
            card.innerHTML = `
                <h4>${insight.title}</h4>
                <p>${insight.description}</p>
            `;
            container.appendChild(card);
        });
    }

    // 인사이트 생성
    generateInsights() {
        const insights = [];
        const categoryTotals = this.getCategoryTotals('expense');
        const totalExpense = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

        // 가장 큰 지출 카테고리
        const maxCategory = Object.entries(categoryTotals).reduce((max, [category, amount]) => 
            amount > max.amount ? { category, amount } : max, { category: '', amount: 0 });

        if (maxCategory.amount > 0) {
            const percentage = (maxCategory.amount / totalExpense) * 100;
            insights.push({
                title: '💡 주요 지출 카테고리',
                description: `${maxCategory.category}이(가) 전체 지출의 ${percentage.toFixed(1)}%를 차지합니다. 이 카테고리의 지출을 검토해보세요.`
            });
        }

        // 지출 증가 추세
        const currentMonthExpense = this.getCurrentMonthExpense();
        const lastMonthExpense = this.getLastMonthExpense();
        
        if (lastMonthExpense > 0) {
            const changePercent = ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
            if (changePercent > 10) {
                insights.push({
                    title: '📈 지출 증가 경고',
                    description: `이번 달 지출이 지난달 대비 ${changePercent.toFixed(1)}% 증가했습니다. 지출을 줄일 수 있는 방법을 찾아보세요.`
                });
            } else if (changePercent < -10) {
                insights.push({
                    title: '📉 지출 절약 성과',
                    description: `이번 달 지출이 지난달 대비 ${Math.abs(changePercent).toFixed(1)}% 절약되었습니다. 좋은 성과입니다!`
                });
            }
        }

        // 저축률 분석
        const totalIncome = this.getTotalAmount('income');
        const netIncome = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

        if (savingsRate < 10) {
            insights.push({
                title: '💰 저축률 개선 필요',
                description: `현재 저축률이 ${savingsRate.toFixed(1)}%입니다. 목표 저축률 20% 달성을 위해 지출을 줄여보세요.`
            });
        } else if (savingsRate >= 20) {
            insights.push({
                title: '🎉 우수한 저축률',
                description: `현재 저축률이 ${savingsRate.toFixed(1)}%입니다. 훌륭한 재정 관리입니다!`
            });
        }

        return insights;
    }

    // 유틸리티 함수들
    getLastMonthCategoryAmount(category) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        return this.transactions
            .filter(t => t.type === 'expense' && 
                t.category === category &&
                new Date(t.date).getMonth() === lastMonth.getMonth() &&
                new Date(t.date).getFullYear() === lastMonth.getFullYear())
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getCurrentMonthExpense() {
        const currentDate = new Date();
        return this.transactions
            .filter(t => t.type === 'expense' &&
                new Date(t.date).getMonth() === currentDate.getMonth() &&
                new Date(t.date).getFullYear() === currentDate.getFullYear())
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getLastMonthExpense() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        return this.transactions
            .filter(t => t.type === 'expense' &&
                new Date(t.date).getMonth() === lastMonth.getMonth() &&
                new Date(t.date).getFullYear() === lastMonth.getFullYear())
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 목표 페이지 로드
    loadGoals() {
        // 목표 관련 기능은 나중에 구현
        console.log('목표 페이지 로드');
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
