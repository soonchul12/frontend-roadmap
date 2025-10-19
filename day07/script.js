
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
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

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
