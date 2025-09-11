const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const filterButtons = document.getElementById('filterButtons');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');

let todos = [];

let currentFilter = 'all';

// 페이지 로드 시 저장된 데이터 불러오기
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    renderTodos();
    updateStats();
});

// 할 일 추가 함수
function addTodo(text) {
    const todo = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
    updateStats();
}

// 할 일 삭제 함수
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
}

// 할 일 완료 상태 토글 함수
function toggleTodo(id) {
    const todo = todo.find(todo => todo.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateStats();
    }
}

// 할 일 수정 함수
function editTodo(id, newText) {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
        todo.text = newText.trim();
        saveTodos();
        renderTodos();
    }
}

// 할 일 목록 화면에 표시 함수
function renderTodos(){
    const filteredTodos = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });

    // 할 일 목록 HTML 생성
    todoList.innerHTML = filteredTodos.map(todo => `<div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
        <input type="checkbox"
        class="todo-checkbox"
        ${todo.completed ? 'checked' : ''}
        onchange="toggleTodo(${todo.id})">
        <span class="todo-text">${todo.text}</span>
        <div class="todo-actions">
            <button class="edit-btn" onclick="editTodo(${todo.id})">수정</button>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">삭제</button>
            </div>
            </div>
    `).join('');
}

// 할 일 수정 프롬포트 함수
function editTodoPrompt(id) {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
        const newText = prompt('할 일을 수정하세요:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            editTodo(id, newText);
        }
    }
}

// 통계 업데이트 함수
function updateStats(){
    const total = todos.length;
    const active = todos.filter(todo => !todo.completed).length;
    const completed = todos.filter(todo => todo.completed).length;

    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
}

// 로컬 스트리지에 할 일 저장
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 로컬 스토리지에서 할 일 불러오기
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (saveTodos) {
        todos = JSON.parse(saveTodos);
    }
}

// 필터 변경 함수
function setFilter(filter) {
    currentFilter = filter;

    filterButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    const activeButton = document.querySelector(`[data-filter="${filter}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    renderTodos();
}

// 할 일 추가 폼 제출 이벤트
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = todoInput.value.trim();
    if (text !== '') {
        addTodo(text);
        todoInput.value = '';
        todoInput.focus();
    }
});

// 필터 버튼 클릭 이벤트
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');
        setFilter(filter);
    });
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter: 할 일 추가
    if (e.ctrlKey && e.key === 'Enter') {
        const text = todoInput.value.trim();
        if (text !== '') {
            addTodo(text);
            todoInput.value = '';
        }
    }
    
    // Escape: 입력 필드 비우기
    if (e.key === 'Escape') {
        todoInput.value = '';
        todoInput.blur();
    }
});

// 할 일 목록이 비어있을 때 메시지 표시
function showEmptyMessage() {
    if (todos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-message">
                <p>할 일이 없습니다. 새로운 할 일을 추가해보세요! ��</p>
            </div>
        `;
    }
}

// 할 일 목록이 비어있을 때 메시지 표시하도록 수정
function renderTodos() {
    if (todos.length === 0) {
        showEmptyMessage();
        return;
    }
    
    // 기존 코드...
    const filteredTodos = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-message">
                <p>${currentFilter === 'active' ? '미완료된 할 일이 없습니다.' : 
                    currentFilter === 'completed' ? '완료된 할 일이 없습니다.' : 
                    '할 일이 없습니다.'}</p>
            </div>
        `;
        return;
    }
    
    todoList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <input type="checkbox" 
                   class="todo-checkbox" 
                   ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${todo.id})">
            <span class="todo-text">${todo.text}</span>
            <div class="todo-actions">
                <button class="edit-btn" onclick="editTodoPrompt(${todo.id})">수정</button>
                <button class="delete-btn" onclick="deleteTodo(${todo.id})">삭제</button>
            </div>
        </div>
    `).join('');
}