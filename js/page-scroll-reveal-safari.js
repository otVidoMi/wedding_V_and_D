// glowing-line-safari.js (для первого SVG - bg-floral-ornament)
// ПЛАВНОЕ ПОЯВЛЕНИЕ БЕЗ УСКОРЕНИЯ

(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const svgElement = document.querySelector('.bg-floral-ornament');
        if (!svgElement) {
            console.log('❌ SVG элемент .bg-floral-ornament не найден');
            return;
        }

        const svgPaths = svgElement.querySelectorAll('path');
        if (!svgPaths.length) {
            console.log('❌ Path элементы не найдены');
            return;
        }

        console.log(`✅ Найдено ${svgPaths.length} path элементов`);

        const svgNS = "http://www.w3.org/2000/svg";
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('🦊 Браузер Safari:', isSafari);

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
                console.log(`📏 Длина пути ${index + 1}: ${pathLength}px`);
            } catch (e) {
                console.error(`Ошибка:`, e);
                return;
            }

            newPath.style.strokeDasharray = pathLength;
            newPath.style.strokeDashoffset = pathLength;
            newPath.style.strokeOpacity = '1';

            pathsData.push({
                path: newPath,
                length: pathLength
            });
        });

        if (pathsData.length === 0) {
            console.log('❌ Не удалось создать path элементы');
            return;
        }

        /**
         * ПЛАВНЫЙ ПРОГРЕСС - ПО ВСЕЙ СТРАНИЦЕ
         */
        function getScrollProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;
            const maxScroll = documentHeight - windowHeight;
            
            // Плавный прогресс от 0 до 1 по всей странице
            let progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
            
            return Math.min(1, Math.max(0, progress));
        }

        function updateProgress() {
            const scrollProgress = getScrollProgress();
            
            pathsData.forEach(data => {
                // Плавное появление линии
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
                    } catch (e) {}
                });
                updateProgress();
                ticking = false;
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        updateProgress();

        console.log(`✨ Скрипт для .bg-floral-ornament запущен! Плавное появление линии`);
    }
})();
