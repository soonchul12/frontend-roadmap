// 분석 페이지 전용 JavaScript
class AnalysisPage {
    constructor() {
        this.transactions = this.loadTransactions();
        this.init();
    }

    init() {
        this.loadAnalysis();
    }

    // 로컬 스토리지에서 거래 데이터 로드
    loadTransactions() {
        const saved = localStorage.getItem('moneyTracker_transactions');
        return saved ? JSON.parse(saved) : [];
    }

    // 분석 데이터 로드
    loadAnalysis() {
        this.drawMonthlyTrendChart();
        this.loadCategoryAnalysis();
        this.drawSpendingPatterns();
        this.loadBudgetAnalysis();
        this.loadIncomeExpenseAnalysis();
        this.loadGoalTracking();
        this.loadInsights();
    }

    // 월별 지출 트렌드 차트
    drawMonthlyTrendChart() {
        const canvas = document.getElementById('monthlyTrendCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const monthlyData = this.getMonthlyData();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (monthlyData.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('데이터가 없습니다', canvas.width / 2, canvas.height / 2);
            return;
        }

        // 간단한 막대 차트 그리기
        const maxAmount = Math.max(...monthlyData.map(d => d.amount));
        const barWidth = Math.max(20, canvas.width / monthlyData.length - 10);
        
        // 월별 색상 배열
        const colors = [
            '#4CAF50', // 녹색
            '#2196F3', // 파란색
            '#FF9800', // 주황색
            '#9C27B0', // 보라색
            '#F44336', // 빨간색
            '#00BCD4', // 청록색
            '#FFC107', // 노란색
            '#795548', // 갈색
            '#607D8B', // 청회색
            '#E91E63', // 분홍색
            '#3F51B5', // 인디고
            '#8BC34A'  // 연두색
        ];
        
        monthlyData.forEach((data, index) => {
            const barHeight = (data.amount / maxAmount) * (canvas.height - 60);
            const x = index * (barWidth + 10) + 5;
            const y = canvas.height - barHeight - 40;
            
            // 막대 그리기 (월별로 다른 색상)
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 금액 표시 (막대 위에)
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            const amountText = `${(data.amount / 10000).toFixed(0)}만원`;
            ctx.fillText(amountText, x + barWidth/2, y - 5);
            
            // 월 라벨 (막대 아래에)
            ctx.fillStyle = '#666';
            ctx.font = '11px Arial';
            ctx.fillText(data.month, x + barWidth/2, canvas.height - 20);
        });
    }

    // 월별 데이터 생성
    getMonthlyData() {
        const monthlyTotals = {};
        
        this.transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                const date = new Date(transaction.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!monthlyTotals[monthKey]) {
                    monthlyTotals[monthKey] = 0;
                }
                monthlyTotals[monthKey] += transaction.amount;
            }
        });

        return Object.entries(monthlyTotals)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    // 카테고리별 분석
    loadCategoryAnalysis() {
        const container = document.getElementById('categoryAnalysisGrid');
        if (!container) return;

        const categoryTotals = this.getCategoryTotals('expense');
        container.innerHTML = '';
        
        Object.entries(categoryTotals).forEach(([category, amount]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';
            categoryDiv.innerHTML = `
                <div class="category-name">${category}</div>
                <div class="category-amount">${amount.toLocaleString()}원</div>
            `;
            container.appendChild(categoryDiv);
        });
    }

    // 카테고리별 총액 계산
    getCategoryTotals(type) {
        const totals = {};
        
        this.transactions.forEach(transaction => {
            if (transaction.type === type) {
                if (!totals[transaction.category]) {
                    totals[transaction.category] = 0;
                }
                totals[transaction.category] += transaction.amount;
            }
        });
        
        return totals;
    }

    // 지출 패턴 차트
    drawSpendingPatterns() {
        this.drawWeeklyPattern();
        this.drawHourlyPattern();
    }

    // 요일별 패턴
    drawWeeklyPattern() {
        const canvas = document.getElementById('weeklyPatternCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const weeklyData = this.getWeeklyData();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const maxAmount = Math.max(...weeklyData);
        
        weeklyData.forEach((amount, index) => {
            const barHeight = (amount / maxAmount) * (canvas.height - 40);
            const barWidth = canvas.width / 7 - 5;
            const x = index * (barWidth + 5);
            const y = canvas.height - barHeight - 20;
            
            ctx.fillStyle = '#2196F3';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 요일 라벨
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(days[index], x + barWidth/2, canvas.height - 5);
        });
    }

    // 시간대별 패턴
    drawHourlyPattern() {
        const canvas = document.getElementById('hourlyPatternCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const hourlyData = this.getHourlyData();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const maxAmount = Math.max(...hourlyData);
        
        hourlyData.forEach((amount, hour) => {
            const barHeight = (amount / maxAmount) * (canvas.height - 40);
            const barWidth = canvas.width / 24 - 2;
            const x = hour * (barWidth + 2);
            const y = canvas.height - barHeight - 20;
            
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(x, y, barWidth, barHeight);
        });
    }

    // 요일별 데이터
    getWeeklyData() {
        const weeklyTotals = new Array(7).fill(0);
        
        this.transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                const day = new Date(transaction.date).getDay();
                weeklyTotals[day] += transaction.amount;
            }
        });
        
        return weeklyTotals;
    }

    // 시간대별 데이터
    getHourlyData() {
        const hourlyTotals = new Array(24).fill(0);
        
        this.transactions.forEach(transaction => {
            if (transaction.type === 'expense' && transaction.time) {
                const hour = parseInt(transaction.time.split(':')[0]);
                hourlyTotals[hour] += transaction.amount;
            }
        });
        
        return hourlyTotals;
    }

    // 예산 분석
    loadBudgetAnalysis() {
        const container = document.getElementById('budgetAnalysis');
        if (!container) return;

        const totalExpense = this.getTotalAmount('expense');
        const totalIncome = this.getTotalAmount('income');
        
        container.innerHTML = `
            <div class="budget-summary">
                <div class="budget-item">
                    <span class="budget-label">총 지출</span>
                    <span class="budget-amount expense">${totalExpense.toLocaleString()}원</span>
                </div>
                <div class="budget-item">
                    <span class="budget-label">총 수입</span>
                    <span class="budget-amount income">${totalIncome.toLocaleString()}원</span>
                </div>
                <div class="budget-item">
                    <span class="budget-label">순이익</span>
                    <span class="budget-amount ${totalIncome - totalExpense >= 0 ? 'income' : 'expense'}">${(totalIncome - totalExpense).toLocaleString()}원</span>
                </div>
            </div>
        `;
    }

    // 수입 대비 지출 분석
    loadIncomeExpenseAnalysis() {
        const container = document.getElementById('incomeExpenseAnalysis');
        if (!container) return;

        const totalExpense = this.getTotalAmount('expense');
        const totalIncome = this.getTotalAmount('income');
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0;
        
        container.innerHTML = `
            <div class="income-expense-summary">
                <div class="ratio-item">
                    <span class="ratio-label">저축률</span>
                    <span class="ratio-value">${savingsRate}%</span>
                </div>
                <div class="ratio-item">
                    <span class="ratio-label">지출 비율</span>
                    <span class="ratio-value">${totalIncome > 0 ? (totalExpense / totalIncome * 100).toFixed(1) : 0}%</span>
                </div>
            </div>
        `;
    }

    // 목표 달성
    loadGoalTracking() {
        const container = document.getElementById('goalTracking');
        if (!container) return;

        container.innerHTML = `
            <div class="goal-summary">
                <p>목표 설정 기능은 메인 페이지에서 이용하실 수 있습니다.</p>
                <button onclick="window.location.href='./index.html'" class="btn-primary">목표 설정하러 가기</button>
            </div>
        `;
    }

    // 인사이트
    loadInsights() {
        const container = document.getElementById('insightsContainer');
        if (!container) return;

        const insights = this.generateInsights();
        
        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.description}</p>
                </div>
            </div>
        `).join('');
    }

    // 인사이트 생성
    generateInsights() {
        const totalExpense = this.getTotalAmount('expense');
        const totalIncome = this.getTotalAmount('income');
        const categoryTotals = this.getCategoryTotals('expense');
        
        const insights = [];
        
        if (totalExpense > totalIncome) {
            insights.push({
                icon: '⚠️',
                title: '지출 초과',
                description: '수입보다 지출이 많습니다. 지출을 줄이는 것을 고려해보세요.'
            });
        }
        
        const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
        if (topCategory) {
            insights.push({
                icon: '📊',
                title: '주요 지출',
                description: `${topCategory[0]}에 ${topCategory[1].toLocaleString()}원을 지출했습니다.`
            });
        }
        
        if (insights.length === 0) {
            insights.push({
                icon: '✅',
                title: '좋은 관리',
                description: '지출 관리가 잘 되고 있습니다. 계속 유지하세요!'
            });
        }
        
        return insights;
    }

    // 총액 계산
    getTotalAmount(type) {
        return this.transactions
            .filter(transaction => transaction.type === type)
            .reduce((sum, transaction) => sum + transaction.amount, 0);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.analysisPage = new AnalysisPage();
});
