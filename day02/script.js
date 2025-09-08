const previousOperandElement = document.querySelector('.previous-operand');
const currentOperandElement = document.querySelector('.current-operand');
const numberButtons = document.querySelectorAll('.btn-number');
const operationButtons = document.querySelectorAll('.btn-operator');
const equalsButton = document.querySelector('.btn-equals');
const clearButton = document.querySelector('.btn-clear');
const deleteButton = document.querySelector('.btn-delete');

// 계산기 클래스
class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
    }

    //초기화
    clear() {
        this.currentOperand = '';
        this.previousOperand = '';
        this.operation = undefined;
    }

    //삭제 (마지막 숫자 제거)
    delete() {
        this.currentOperand = this.currentOperand.toString().slice(0,-1);
    }

    //숫자 추가
    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        this.currentOperand = this.currentOperand.toString() + number.toString();
    }

    //연산자 선택
    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    // 계산 실행
    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
                case '×':
                computation = prev * current;
                break;
            case '÷':
                computation = prev / current;
                break;
            default:
                return;
        }
        this.currentOperand = computation;
        this.operation = undefined;
        this.previousOperand = '';
    }

    //숫자 포멧팅 (천 단위 콤마)
    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0});
        }
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
        }

    // 화면 업데이트
    updateDisplay() {
        this.currentOperandElement.textContent = this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            this.previousOperandElement.textContent = `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.textContent = '';
        }
    }
    }

    //계산기 인스턴스 생성
    const calculator = new Calculator(previousOperandElement, currentOperandElement);

    // 이벤트 리스너 등록
    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            calculator.appendNumber(button.textContent);
            calculator.updateDisplay();
        });
    });

    operationButtons.forEach(button => {
        button.addEventListener('click', () => {
            calculator.chooseOperation(button.textContent);
            calculator.updateDisplay();
        });
    });

    equalsButton.addEventListener('click', () => {
        calculator.compute();
        calculator.updateDisplay();
    });

    clearButton.addEventListener('click', () => {
        calculator.clear();
        calculator.updateDisplay();
    });

    deleteButton.addEventListener('click', () => {
        calculator.delete();
        calculator.updateDisplay();
    });
