// Скрипт для анимации появления первого SVG фона при скролле (для Safari и других браузеров)
(function() {
    'use strict';
    
    // Находим первый SVG фон
    const bgOrnament = document.querySelector('.bg-floral-ornament');
    
    // Если элемент не найден, выходим
    if (!bgOrnament) return;
    
    // Устанавливаем начальное состояние (скрыт)
    bgOrnament.style.opacity = '0';
    bgOrnament.style.transform = 'scale(0.95)';
    bgOrnament.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    
    // Функция проверки видимости элемента
    function isElementInViewport(el, offset = 200) {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // Элемент считается видимым, если его верхняя часть находится в пределах окна + offset
        return rect.top <= windowHeight - offset && rect.bottom >= 0;
    }
    
    // Функция активации анимации
    function revealOnScroll() {
        if (isElementInViewport(bgOrnament, 250)) {
            bgOrnament.style.opacity = '1';
            bgOrnament.style.transform = 'scale(1)';
            // После активации удаляем обработчик для оптимизации
            window.removeEventListener('scroll', revealOnScroll);
            window.removeEventListener('resize', revealOnScroll);
            window.removeEventListener('orientationchange', revealOnScroll);
        }
    }
    
    // Небольшая задержка перед первой проверкой (ждем загрузки страницы)
    setTimeout(revealOnScroll, 100);
    
    // Добавляем обработчики событий
    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('resize', revealOnScroll);
    window.addEventListener('orientationchange', revealOnScroll);
    
    // Дополнительно: если элемент уже виден при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', revealOnScroll);
    } else {
        revealOnScroll();
    }
})();
