// glowing-line-safari.js - ИСПРАВЛЕННАЯ ЛОГИКА (линия ПОЯВЛЯЕТСЯ при скролле)
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
        
        // Определяем Safari
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('🦊 Браузер Safari:', isSafari);
        
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
        let length = 0;
        try {
            length = newPath.getTotalLength();
            console.log(`📏 Длина пути: ${length}px`);
        } catch(e) {
            console.error('❌ Ошибка:', e);
            return;
        }
        
        // Настраиваем dash-анимацию
        newPath.style.strokeDasharray = length;
        
        // *** ГЛАВНОЕ ИСПРАВЛЕНИЕ: правильная начальная точка ***
        // Линия должна быть НЕВИДИМА в начале (offset = length)
        newPath.style.strokeDashoffset = length;
        
        function updateLine() {
            const scrollTop = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const maxScroll = documentHeight - windowHeight;
            
            // Прогресс скролла от 0 до 1
            let progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
            progress = Math.min(1, Math.max(0, progress));
            
            // *** КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ***
            // При progress = 0 → offset = length (линия не видна)
            // При progress = 1 → offset = 0 (линия видна полностью)
            const offset = length * (1 - progress);
            
            newPath.style.strokeDashoffset = offset;
            
            // Для Safari: принудительная перерисовка
            if (isSafari) {
                // Трюк для принудительной перерисовки
                void newPath.offsetHeight;
            }
            
            // Логируем для проверки
            if (Math.random() < 0.02) {
                console.log(`Прогресс: ${(progress*100).toFixed(1)}%, offset: ${offset.toFixed(0)}`);
            }
        }
        
        // Оптимизация производительности
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
        
        console.log('✅ Скрипт запущен! Линия будет ПОЯВЛЯТЬСЯ при скролле вниз');
        console.log(`Начальный offset: ${newPath.style.strokeDashoffset}`);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
