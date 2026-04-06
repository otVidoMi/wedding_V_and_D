// glowing-line-safari.js - С РЕГУЛИРУЕМОЙ СКОРОСТЬЮ
(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ===== НАСТРОЙКИ СКОРОСТИ =====
    const CONFIG = {
        // Режим прогресса: 'full' (вся страница), 'fast' (ускоренный), 'half' (первая половина)
        mode: 'fast',
        
        // Для режима 'fast' - множитель скорости (1 = нормально, 2 = в 2 раза быстрее, 3 = в 3 раза)
        speedMultiplier: 2,
        
        // Для режима 'custom' - начало и конец анимации (от 0 до 1)
        startAt: 0.1,  // Начинаем рисовать после 10% скролла
        endAt: 0.5     // Заканчиваем рисовать на 50% скролла
    };

    function init() {
        const svgElement = document.querySelector('.bg-floral-ornament');
        if (!svgElement) {
            console.log('SVG элемент .bg-floral-ornament не найден');
            return;
        }

        const svgPaths = svgElement.querySelectorAll('path');
        if (!svgPaths.length) {
            console.log('Path элементы не найдены в SVG');
            return;
        }

        console.log(`Найдено ${svgPaths.length} path элементов`);

        const svgNS = "http://www.w3.org/2000/svg";
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('Браузер Safari:', isSafari);

        const pathsData = [];

        svgPaths.forEach((originalPath, index) => {
            const originalStroke = originalPath.getAttribute('stroke') || '#cb0609';
            const originalWidth = originalPath.getAttribute('stroke-width') || '3';
            const dAttribute = originalPath.getAttribute('d');
            
            if (!dAttribute) return;

            const newPath = document.createElementNS(svgNS, 'path');
            newPath.setAttribute('d', dAttribute);
            newPath.setAttribute('stroke', originalStroke);
            newPath.setAttribute('stroke-width', originalWidth);
            newPath.setAttribute('fill', 'none');
            newPath.setAttribute('stroke-linecap', 'round');
            newPath.setAttribute('stroke-linejoin', 'round');

            originalPath.remove();
            svgElement.appendChild(newPath);

            let pathLength = 0;
            try {
                pathLength = newPath.getTotalLength();
            } catch (e) {
                console.error(`Ошибка получения длины пути ${index}:`, e);
                return;
            }

            newPath.style.strokeDasharray = pathLength;
            newPath.style.strokeDashoffset = pathLength; // Начинаем со скрытой линии
            newPath.style.strokeOpacity = '1';

            pathsData.push({
                path: newPath,
                length: pathLength
            });
        });

        if (pathsData.length === 0) {
            console.log('Не удалось создать ни одного path элемента');
            return;
        }

        /**
         * ВЫЧИСЛЕНИЕ ПРОГРЕССА СКРОЛЛА С УСКОРЕНИЕМ
         */
        function getScrollProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;
            const maxScroll = documentHeight - windowHeight;
            
            let progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
            
            switch (CONFIG.mode) {
                case 'fast':
                    // Ускоренное появление
                    progress = Math.min(1, progress * CONFIG.speedMultiplier);
                    break;
                    
                case 'half':
                    // Линия полностью рисуется на первой половине страницы
                    progress = maxScroll > 0 ? scrollTop / (maxScroll * 0.5) : 0;
                    progress = Math.min(1, progress);
                    break;
                    
                case 'custom':
                    // Кастомный диапазон
                    if (progress <= CONFIG.startAt) {
                        progress = 0;
                    } else if (progress >= CONFIG.endAt) {
                        progress = 1;
                    } else {
                        progress = (progress - CONFIG.startAt) / (CONFIG.endAt - CONFIG.startAt);
                    }
                    break;
                    
                default:
                    // Обычный режим (вся страница)
                    break;
            }
            
            return Math.min(1, Math.max(0, progress));
        }

        function updateProgress() {
            const scrollProgress = getScrollProgress();
            
            pathsData.forEach(data => {
                // Линия рисуется от длины до 0
                const offset = data.length * (1 - scrollProgress);
                data.path.style.strokeDashoffset = offset;
            });
        }

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
                pathsData.forEach(data => {
                    try {
                        const newLength = data.path.getTotalLength();
                        data.length = newLength;
                        data.path.style.strokeDasharray = newLength;
                    } catch (e) {
                        console.error('Ошибка при ресайзе:', e);
                    }
                });
                updateProgress();
                ticking = false;
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        updateProgress();

        console.log(`Скрипт инициализирован. Режим: ${CONFIG.mode}, ускорение: ${CONFIG.speedMultiplier}x`);
    }
})();
