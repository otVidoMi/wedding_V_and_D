// glowing-line-safari.js - С ПРИНУДИТЕЛЬНОЙ ПЕРЕРИСОВКОЙ ДЛЯ SAFARI
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
        
        // Сохраняем оригинальные атрибуты
        const d = originalPath.getAttribute('d');
        const stroke = originalPath.getAttribute('stroke');
        const strokeWidth = originalPath.getAttribute('stroke-width');
        
        // Создаём НОВЫЙ path
        const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        newPath.setAttribute('d', d);
        newPath.setAttribute('stroke', stroke);
        newPath.setAttribute('stroke-width', strokeWidth);
        newPath.setAttribute('fill', 'none');
        newPath.setAttribute('stroke-linecap', 'round');
        newPath.setAttribute('stroke-linejoin', 'round');
        
        // Заменяем старый path новым
        originalPath.remove();
        svg.appendChild(newPath);
        
        // Получаем длину пути
        let length = 0;
        try {
            length = newPath.getTotalLength();
            console.log(`📏 Длина пути: ${length}px`);
        } catch(e) {
            console.error('❌ Ошибка получения длины:', e);
            return;
        }
        
        // Настраиваем dash-анимацию
        newPath.style.strokeDasharray = length;
        newPath.style.strokeDashoffset = length;
        
        // *** ВАЖНО ДЛЯ SAFARI: принудительно применяем стили ***
        // Без этого Safari может проигнорировать изменения
        newPath.getBoundingClientRect();
        
        // Функция обновления с принудительной перерисовкой для Safari
        function updateLine() {
            const scrollTop = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const maxScroll = documentHeight - windowHeight;
            
            let progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
            progress = Math.min(1, Math.max(0, progress));
            
            const offset = length * (1 - progress);
            newPath.style.strokeDashoffset = offset;
            
            // *** КЛЮЧЕВОЕ РЕШЕНИЕ ДЛЯ SAFARI ***
            // Принудительно вызываем перерисовку, читая свойство
            if (isSafari) {
                // Этот трюк заставляет Safari перерисовать элемент
                void newPath.offsetHeight;
                // Или принудительно обновляем атрибут
                newPath.setAttribute('stroke-dashoffset', offset);
            }
            
            // Логируем для отладки (редко)
            if (Math.random() < 0.02) {
                console.log(`📊 Прогресс: ${(progress*100).toFixed(1)}%, offset: ${offset.toFixed(0)}`);
            }
        }
        
        // Запускаем при скролле с оптимизацией
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
        
        // Также обновляем при ресайзе
        window.addEventListener('resize', () => {
            setTimeout(updateLine, 100);
        });
        
        // Запускаем один раз
        updateLine();
        
        console.log('✅ Скрипт для первого SVG запущен');
        
        // Дополнительная проверка для Safari: запускаем анимацию через 1 секунду
        if (isSafari) {
            setTimeout(() => {
                updateLine();
                console.log('🔄 Принудительное обновление для Safari');
            }, 100);
        }
    }
    
    // Запускаем после полной загрузки
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
