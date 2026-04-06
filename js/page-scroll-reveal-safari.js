// glowing-line-safari.js - РАБОЧАЯ ВЕРСИЯ ДЛЯ SAFARI
(function() {
    function init() {
        const svg = document.querySelector('.bg-floral-ornament');
        if (!svg) {
            console.error('❌ SVG не найден');
            return;
        }
        
        const originalPath = svg.querySelector('path');
        if (!originalPath) {
            console.error('❌ Path не найден');
            return;
        }
        
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('🦊 Safari режим:', isSafari);
        
        // Сохраняем атрибуты
        const d = originalPath.getAttribute('d');
        const stroke = originalPath.getAttribute('stroke');
        const strokeWidth = originalPath.getAttribute('stroke-width');
        
        // Создаём новый path
        const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        newPath.setAttribute('d', d);
        newPath.setAttribute('stroke', stroke);
        newPath.setAttribute('stroke-width', strokeWidth);
        newPath.setAttribute('fill', 'none');
        newPath.setAttribute('stroke-linecap', 'round');
        newPath.setAttribute('stroke-linejoin', 'round');
        
        // Заменяем
        originalPath.remove();
        svg.appendChild(newPath);
        
        // Получаем длину
        let fullLength = 0;
        try {
            fullLength = newPath.getTotalLength();
            console.log(`📏 Полная длина пути: ${fullLength}px`);
        } catch(e) {
            console.error('❌ Ошибка:', e);
            return;
        }
        
        // *** НОВЫЙ ПОДХОД ДЛЯ SAFARI ***
        // Вместо stroke-dashoffset используем stroke-dasharray с прогрессивным увеличением
        // Начальное состояние: [0, fullLength] - ничего не видно
        // Конечное состояние: [fullLength, 0] - всё видно
        
        function updateLine() {
            const scrollTop = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const maxScroll = documentHeight - windowHeight;
            
            // Прогресс от 0 до 1
            let progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
            progress = Math.min(1, Math.max(0, progress));
            
            // Вычисляем, сколько пикселей должно быть видно
            const visibleLength = fullLength * progress;
            
            // Устанавливаем dasharray: [видимая_часть, невидимая_часть]
            // Это работает во всех браузерах, включая Safari
            newPath.style.strokeDasharray = `${visibleLength} ${fullLength}`;
            
            // Для Safari дополнительно сбрасываем offset в 0
            newPath.style.strokeDashoffset = '0';
            
            // Логируем для отладки
            if (Math.random() < 0.02) {
                console.log(`Прогресс: ${(progress*100).toFixed(1)}%, видимо: ${visibleLength.toFixed(0)}px`);
            }
        }
        
        // Оптимизация
        let ticking = false;
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateLine();
                    ticking = false;
                });
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => setTimeout(updateLine, 100));
        
        // Запускаем
        updateLine();
        
        console.log('✅ Скрипт запущен! Используется метод stroke-dasharray');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
