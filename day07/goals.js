class GoalsPage {
    constructor() {
        this.savingsGoals = this.loadSavingsGoals();
        this.budgets = this.loadBudgets();
        this.habitGoals = this.loadHabitGoals();
        this.transactions = this.loadTransactions();
        this.init();
    }

    init() {
        this.renderSavingsGoals();
        this.renderBudgets();
        this.renderHabitGoals();
        this.renderRecommendations();
    }

    // 데이터 로드
    loadSavingsGoals() {
        const saved = localStorage.getItem('moneyTracker_savingsGoals');
        return saved ? JSON.parse(saved) : [];
    }

    loadBudgets() {
        const saved = localStorage.getItem('moneyTracker_budgets');
        return saved ? JSON.parse(saved) : [];
    }

    loadHabitGoals() {
        const saved = localStorage.getItem('moneyTracker_habitGoals');
        return saved ? JSON.parse(saved) : [];
    }

    loadTransactions() {
        const saved = localStorage.getItem('moneyTracker_transactions');
        return saved ? JSON.parse(saved) : [];
    }

    // 데이터 저장
    saveSavingsGoals() {
        localStorage.setItem('moneyTracker_savingsGoals', JSON.stringify(this.savingsGoals));
    }

    saveBudgets() {
        localStorage.setItem('moneyTracker_budgets', JSON.stringify(this.budgets));
    }

    saveHabitGoals() {
        localStorage.setItem('moneyTracker_habitGoals', JSON.stringify(this.habitGoals));
    }

    // 저축 목표 렌더링
    renderSavingsGoals() {
        const container = document.getElementById('savingsGoalsList');
        if (!container) return;

        if (this.savingsGoals.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">저축 목표가 없습니다.</p>';
            return;
        }

        container.innerHTML = this.savingsGoals.map((goal, index) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const remainingAmount = goal.targetAmount - goal.currentAmount;
            const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="goal-item">
                    <div class="goal-header">
                        <span class="goal-name">${goal.name}</span>
                        <span class="goal-amount">${this.formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>${this.formatCurrency(goal.currentAmount)}</span>
                            <span>${progress.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="goal-details">
                        <span>남은 금액: ${this.formatCurrency(remainingAmount)}</span>
                        <span>목표일: ${goal.targetDate}</span>
                    </div>
                    <button class="goal-delete" onclick="goalsPage.deleteSavingsGoal(${index})">삭제</button>
                </div>
            `;
        }).join('');
    }

    // 월별 예산 렌더링
    renderBudgets() {
        const container = document.getElementById('budgetList');
        if (!container) return;

        if (this.budgets.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">설정된 예산이 없습니다.</p>';
            return;
        }

        container.innerHTML = this.budgets.map((budget, index) => {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const currentSpending = this.getCurrentMonthSpending(budget.category);
            const progress = (currentSpending / budget.amount) * 100;
            const remaining = budget.amount - currentSpending;
            const status = progress > 100 ? '초과' : progress > 80 ? '주의' : '양호';

            return `
                <div class="budget-item">
                    <div class="budget-header">
                        <span class="budget-category">${budget.category}</span>
                        <span class="budget-amount">${this.formatCurrency(budget.amount)}</span>
                    </div>
                    <div class="budget-status">
                        <span>현재 지출: ${this.formatCurrency(currentSpending)}</span>
                        <span class="${status === '초과' ? 'text-danger' : status === '주의' ? 'text-warning' : 'text-success'}">${status}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                    </div>
                    <div class="budget-details">
                        <span>남은 예산: ${this.formatCurrency(remaining)}</span>
                        <span>달성률: ${progress.toFixed(1)}%</span>
                    </div>
                    <button class="budget-delete" onclick="goalsPage.deleteBudget(${index})">삭제</button>
                </div>
            `;
        }).join('');
    }

    // 습관 목표 렌더링
    renderHabitGoals() {
        const container = document.getElementById('habitGoalsList');
        if (!container) return;

        if (this.habitGoals.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">습관 목표가 없습니다.</p>';
            return;
        }

        container.innerHTML = this.habitGoals.map((habit, index) => {
            const today = new Date().toDateString();
            const completedToday = habit.completedDates.includes(today);
            const weekProgress = this.getWeekProgress(habit);
            const monthProgress = this.getMonthProgress(habit);

            return `
                <div class="habit-item">
                    <div class="habit-header">
                        <span class="habit-name">${habit.name}</span>
                        <span class="habit-period">${habit.period === 'daily' ? '일일' : habit.period === 'weekly' ? '주간' : '월간'}</span>
                    </div>
                    <div class="habit-progress">
                        <span>목표: ${habit.target}회</span>
                        <div class="habit-checkboxes">
                            ${this.generateHabitCheckboxes(habit, index)}
                        </div>
                    </div>
                    <div class="habit-details">
                        <span>이번 주: ${weekProgress}/${habit.target}</span>
                        <span>이번 달: ${monthProgress}/${habit.target}</span>
                    </div>
                    <button class="habit-delete" onclick="goalsPage.deleteHabitGoal(${index})">삭제</button>
                </div>
            `;
        }).join('');
    }

    // 목표 추천 렌더링
    renderRecommendations() {
        const container = document.getElementById('goalRecommendations');
        if (!container) return;

        const recommendations = this.generateRecommendations();
        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-title">${rec.title}</div>
                <div class="recommendation-desc">${rec.description}</div>
                <button class="recommendation-action" onclick="goalsPage.applyRecommendation('${rec.type}')">적용하기</button>
            </div>
        `).join('');
    }

    // 저축 목표 추가
    addSavingsGoal() {
        const name = document.getElementById('goalName').value;
        const targetAmount = parseInt(document.getElementById('goalAmount').value);
        const currentAmount = parseInt(document.getElementById('currentAmount').value) || 0;
        const targetDate = document.getElementById('targetDate').value;

        if (!name || !targetAmount || !targetDate) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        const goal = {
            id: Date.now(),
            name,
            targetAmount,
            currentAmount,
            targetDate,
            createdAt: new Date().toISOString()
        };

        this.savingsGoals.push(goal);
        this.saveSavingsGoals();
        this.renderSavingsGoals();
        this.closeModal('addGoalModal');
        this.clearGoalForm();
    }

    // 월별 예산 추가
    addBudget() {
        const category = document.getElementById('budgetCategory').value;
        const amount = parseInt(document.getElementById('budgetAmount').value);

        if (!category || !amount) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        // 중복 카테고리 체크
        if (this.budgets.some(b => b.category === category)) {
            alert('이미 설정된 카테고리입니다.');
            return;
        }

        const budget = {
            id: Date.now(),
            category,
            amount,
            createdAt: new Date().toISOString()
        };

        this.budgets.push(budget);
        this.saveBudgets();
        this.renderBudgets();
        this.closeModal('addBudgetModal');
        this.clearBudgetForm();
    }

    // 습관 목표 추가
    addHabitGoal() {
        const name = document.getElementById('habitName').value;
        const period = document.getElementById('habitPeriod').value;
        const target = parseInt(document.getElementById('habitTarget').value);

        if (!name || !target) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        const habit = {
            id: Date.now(),
            name,
            period,
            target,
            completedDates: [],
            createdAt: new Date().toISOString()
        };

        this.habitGoals.push(habit);
        this.saveHabitGoals();
        this.renderHabitGoals();
        this.closeModal('addHabitModal');
        this.clearHabitForm();
    }

    // 습관 체크박스 토글
    toggleHabitCheckbox(habitIndex, checkboxIndex) {
        const habit = this.habitGoals[habitIndex];
        const today = new Date().toDateString();
        
        if (checkboxIndex === 0) {
            // 첫 번째 체크박스 (오늘)
            if (habit.completedDates.includes(today)) {
                habit.completedDates = habit.completedDates.filter(date => date !== today);
            } else {
                habit.completedDates.push(today);
            }
        }
        
        this.saveHabitGoals();
        this.renderHabitGoals();
    }

    // 삭제 함수들
    deleteSavingsGoal(index) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.savingsGoals.splice(index, 1);
            this.saveSavingsGoals();
            this.renderSavingsGoals();
        }
    }

    deleteBudget(index) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.budgets.splice(index, 1);
            this.saveBudgets();
            this.renderBudgets();
        }
    }

    deleteHabitGoal(index) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.habitGoals.splice(index, 1);
            this.saveHabitGoals();
            this.renderHabitGoals();
        }
    }

    // 유틸리티 함수들
    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    }

    getCurrentMonthSpending(category) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return this.transactions
            .filter(t => t.type === 'expense' && 
                        t.category === category && 
                        t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getWeekProgress(habit) {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        
        return habit.completedDates.filter(date => {
            const dateObj = new Date(date);
            return dateObj >= weekStart && dateObj <= weekEnd;
        }).length;
    }

    getMonthProgress(habit) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return habit.completedDates.filter(date => date.startsWith(currentMonth)).length;
    }

    generateHabitCheckboxes(habit, habitIndex) {
        const today = new Date().toDateString();
        const completedToday = habit.completedDates.includes(today);
        
        let checkboxes = '';
        for (let i = 0; i < habit.target; i++) {
            const isChecked = i === 0 && completedToday;
            checkboxes += `
                <div class="habit-checkbox ${isChecked ? 'checked' : ''}" 
                     onclick="goalsPage.toggleHabitCheckbox(${habitIndex}, ${i})">
                </div>
            `;
        }
        return checkboxes;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // 수입 대비 저축률 추천
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        if (totalIncome > 0) {
            recommendations.push({
                type: 'savings_rate',
                title: '💰 적정 저축률 설정',
                description: `수입 ${this.formatCurrency(totalIncome)}의 20%인 ${this.formatCurrency(totalIncome * 0.2)}를 월 저축 목표로 설정해보세요.`
            });
        }

        // 카테고리별 예산 추천
        const categorySpending = {};
        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
            });

        Object.entries(categorySpending).forEach(([category, amount]) => {
            if (!this.budgets.some(b => b.category === category)) {
                recommendations.push({
                    type: 'budget',
                    title: `📊 ${category} 예산 설정`,
                    description: `최근 ${category} 지출이 ${this.formatCurrency(amount)}입니다. 예산을 설정해보세요.`
                });
            }
        });

        return recommendations.slice(0, 3); // 최대 3개만 표시
    }

    applyRecommendation(type) {
        if (type === 'savings_rate') {
            this.showAddGoalModal();
        } else if (type === 'budget') {
            this.showAddBudgetModal();
        }
    }

    // 모달 함수들
    showAddGoalModal() {
        document.getElementById('addGoalModal').classList.add('show');
    }

    showAddBudgetModal() {
        document.getElementById('addBudgetModal').classList.add('show');
    }

    showAddHabitModal() {
        document.getElementById('addHabitModal').classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    // 폼 초기화
    clearGoalForm() {
        document.getElementById('goalName').value = '';
        document.getElementById('goalAmount').value = '';
        document.getElementById('currentAmount').value = '';
        document.getElementById('targetDate').value = '';
    }

    clearBudgetForm() {
        document.getElementById('budgetCategory').value = '식비';
        document.getElementById('budgetAmount').value = '';
    }

    clearHabitForm() {
        document.getElementById('habitName').value = '';
        document.getElementById('habitPeriod').value = 'daily';
        document.getElementById('habitTarget').value = '';
    }
}

// 전역 변수로 goalsPage 인스턴스 생성
let goalsPage;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    goalsPage = new GoalsPage();
});

// 전역 함수들 - HTML에서 호출할 수 있도록 window 객체에 추가
window.showAddGoalModal = () => goalsPage.showAddGoalModal();
window.showAddBudgetModal = () => goalsPage.showAddBudgetModal();
window.showAddHabitModal = () => goalsPage.showAddHabitModal();
window.closeModal = (modalId) => goalsPage.closeModal(modalId);
window.addSavingsGoal = () => goalsPage.addSavingsGoal();
window.addBudget = () => goalsPage.addBudget();
window.addHabitGoal = () => goalsPage.addHabitGoal();

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
});
