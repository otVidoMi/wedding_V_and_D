// glowing-line-safari.js (исправленная версия для первого SVG - bg-floral-ornament)
// Анимация только для основного орнамента, правильные точки начала/окончания

(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // ===== ПОИСК ЭЛЕМЕНТОВ =====
        const svgElement = document.querySelector('.bg-floral-ornament');
        if (!svgElement) {
            console.log('❌ SVG элемент .bg-floral-ornament не найден');
            return;
        }

        // Находим ТОЛЬКО path, который рисует основной орнамент
        // (первый path в SVG или тот, у которого stroke="#CB0609" и stroke-width="3")
        let mainPath = null;
        const allPaths = svgElement.querySelectorAll('path');
        
        for (let i = 0; i < allPaths.length; i++) {
            const path = allPaths[i];
            const stroke = path.getAttribute('stroke');
            const width = path.getAttribute('stroke-width');
            
            // Ищем path с красным цветом и толщиной 3 (основной орнамент)
            if (stroke === '#CB0609' && width === '3') {
                mainPath = path;
                console.log(`✅ Найден основной path (индекс ${i})`);
                break;
            }
        }
        
        // Если не нашли по цвету, берём первый path
        if (!mainPath && allPaths.length > 0) {
            mainPath = allPaths[0];
            console.log('⚠️ Основной path не найден по цвету, беру первый');
        }
        
        if (!mainPath) {
            console.log('❌ Path элементы не найдены');
            return;
        }

        const svgNS = "http://www.w3.org/2000/svg";
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('🦊 Браузер Safari (первый SVG):', isSafari);

        // Сохраняем оригинальные атрибуты
        const originalStroke = mainPath.getAttribute('stroke') || '#cb0609';
        const originalWidth = mainPath.getAttribute('stroke-width') || '3';
        const dAttribute = mainPath.getAttribute('d');

        // Создаём новый path
        const newPath = document.createElementNS(svgNS, 'path');
        newPath.setAttribute('d', dAttribute);
        newPath.setAttribute('stroke', originalStroke);
        newPath.setAttribute('stroke-width', originalWidth);
        newPath.setAttribute('fill', 'none');
        newPath.setAttribute('stroke-linecap', 'round');
        newPath.setAttribute('stroke-linejoin', 'round');

        // Заменяем старый path новым
        mainPath.remove();
        svgElement.appendChild(newPath);

        // Вычисляем длину пути
        let pathLength = 0;
        try {
            pathLength = newPath.getTotalLength();
            console.log(`📏 Длина основного пути: ${pathLength.toFixed(0)} пикселей`);
        } catch (e) {
            console.error('❌ Ошибка получения длины пути:', e);
            return;
        }

        // Настраиваем dash-анимацию
        newPath.style.strokeDasharray = pathLength;

        if (isSafari) {
            newPath.style.strokeDashoffset = pathLength; // Начинаем с полностью скрытой линии
            console.log('🎬 Safari режим: линия будет рисоваться от начала к концу');
        } else {
            newPath.style.strokeDashoffset = pathLength;
        }
        
        newPath.style.strokeOpacity = '1';

        /**
         * ВЫЧИСЛЕНИЕ ПРОГРЕССА СКРОЛЛА
         * Важно: SVG очень большой, поэтому анимация должна идти на протяжении всего скролла страницы
         */
        function getScrollProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            
            // Получаем общую высоту документа
            const documentHeight = document.documentElement.scrollHeight;
            const maxScroll = documentHeight - windowHeight;
            
            // Прогресс скролла по всей странице (от 0 до 1)
            let scrollProgress = maxScroll > 0 ? scrollTop / maxScroll : 0;
            
            // Ограничиваем от 0 до 1
            scrollProgress = Math.min(1, Math.max(0, scrollProgress));
            
            return scrollProgress;
        }

        /**
         * ОБНОВЛЕНИЕ ОТРИСОВКИ ЛИНИИ
         */
        function updateProgress() {
            const scrollProgress = getScrollProgress();
            
            // Для отладки (изредка)
            if (Math.random() < 0.02) {
                console.log(`📊 Прогресс скролла: ${(scrollProgress * 100).toFixed(1)}%`);
            }
            
            // Линия рисуется пропорционально скроллу
            // При scrollProgress = 0 → offset = длина (линия не видна)
            // При scrollProgress = 1 → offset = 0 (линия видна полностью)
            const offset = pathLength * (1 - scrollProgress);
            newPath.style.strokeDashoffset = offset;
        }

        // ===== ОПТИМИЗАЦИЯ =====
        let ticking = false;
        let rafId = null;

        function onScroll() {
            if (!ticking) {
                rafId = requestAnimationFrame(() => {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }

        function onResize() {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
                try {
                    const newLength = newPath.getTotalLength();
                    if (newLength > 0) {
                        pathLength = newLength;
                        newPath.style.strokeDasharray = pathLength;
                        updateProgress();
                        console.log(`🔄 Ресайз: новая длина пути ${pathLength.toFixed(0)}px`);
                    }
                } catch (e) {
                    console.error('Ошибка при ресайзе:', e);
                }
                ticking = false;
            });
        }

        // Подписываемся на события
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        // Первоначальная отрисовка
        updateProgress();

        console.log('✨ Скрипт для .bg-floral-ornament успешно инициализирован!');
    }
})();
