// DOM 요소들 가져오기
const navLinks = document.querySelectorAll('.nav-link');
const yearElement = document.getElementById('year');

// 연도 자동 입력
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// 스무스 스크롤 네비게이션
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 80; // 네비게이션 높이만큼 빼기
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// 스크롤 시 네비게이션 하이라이트
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            // 모든 링크에서 active 클래스 제거
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            // 현재 섹션에 해당하는 링크에 active 클래스 추가
            const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    });
});

// 모바일 햄버거 메뉴 (추후 추가 예정)
// const hamburger = document.querySelector('.hamburger');
// const navMenu = document.querySelector('.nav-menu');

// if (hamburger && navMenu) {
//     hamburger.addEventListener('click', () => {
//         hamburger.classList.toggle('active');
//         navMenu.classList.toggle('active');
//     });
// }

// 프로젝트 카드 호버 효과 (추가 애니메이션)
const projectCards = document.querySelectorAll('.project-card');

projectCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// 스킬 아이템 호버 효과
const skillItems = document.querySelectorAll('.skill-item');

skillItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-5px) scale(1.05)';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0) scale(1)';
    });
});

// Intersection Observer로 스크롤 애니메이션
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const element = entry.target;
            
            if (element.classList.contains('hero-content')) {
                // 헤로 섹션 애니메이션
                element.style.transition = 'all 0.8s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
            
            if (element.classList.contains('project-card')) {
                // 프로젝트 카드 애니메이션
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
            
            if (element.classList.contains('skill-item')) {
                // 스킬 아이템 애니메이션
                element.style.transition = 'all 0.5s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        }
    });
}, observerOptions);

// 페이지 로드 시 초기 설정
window.addEventListener('load', () => {
    // 헤로 섹션 초기 설정
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        observer.observe(heroContent);
    }
    
    // 프로젝트 카드 초기 설정
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        observer.observe(card);
    });
    
    // 스킬 아이템 초기 설정
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        observer.observe(item);
    });
});
