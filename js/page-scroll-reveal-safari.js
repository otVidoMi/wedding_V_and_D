// page-scroll-reveal-safari.js - специальная версия для Safari/iPhone
(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const svgElement = document.querySelector('.bg-floral-ornament');
        if (!svgElement) return;

        const svgPath = svgElement.querySelector('path');
        if (!svgPath) return;

        const svgNS = "http://www.w3.org/2000/svg";

        const originalStroke = svgPath.getAttribute('stroke') || '#cb0609';
        const originalWidth = svgPath.getAttribute('stroke-width') || '3';

        const dAttribute = svgPath.getAttribute('d');

        // Разбиваем path на сегменты
        const segments = [];
        let currentSegment = '';

        for (let i = 0; i < dAttribute.length; i++) {
            const char = dAttribute[i];
            if (char === 'M' && currentSegment.length > 0) {
                segments.push(currentSegment.trim());
                currentSegment = char;
            } else {
                currentSegment += char;
            }
        }

        if (currentSegment.trim()) {
            segments.push(currentSegment.trim());
        }

        // Создаем отдельные path элементы
        const paths = [];
        segments.forEach((segmentData) => {
            const newPath = document.createElementNS(svgNS, 'path');
            newPath.setAttribute('d', segmentData);
            newPath.setAttribute('stroke', originalStroke);
            newPath.setAttribute('stroke-width', originalWidth);
            newPath.setAttribute('fill', 'none');
            newPath.setAttribute('stroke-linecap', 'round');
            newPath.setAttribute('stroke-linejoin', 'round');
            paths.push(newPath);
        });

        svgPath.remove();
        paths.forEach(path => svgElement.appendChild(path));

        // Добавляем CSS для плавности на Safari
        const style = document.createElement('style');
        style.textContent = `
            .bg-floral-ornament path {
                transition: stroke-dashoffset 0.05s linear;
                will-change: stroke-dashoffset;
            }
        `;
        document.head.appendChild(style);

        // Рассчитываем длины
        const segmentsInfo = [];
        let totalLength = 0;

        paths.forEach((path, idx) => {
            try {
                const length = path.getTotalLength();
                segmentsInfo.push({
                    path: path,
                    length: length,
                    start: totalLength,
                    end: totalLength + length,
                    index: idx
                });
                totalLength += length;
                
                // Ключевое отличие для Safari: ТОЛЬКО положительные значения
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length; // Начинаем со скрытого состояния
                path.style.strokeOpacity = '1';
            } catch (e) {
                console.error('Ошибка:', e);
                segmentsInfo.push({
                    path: path,
                    length: 0,
                    start: totalLength,
                    end: totalLength,
                    index: idx
                });
            }
        });

        // Функция прогресса (оставляем как в оригинале)
        function getScrollProgressForSegment(segmentIndex) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const svgRect = svgElement.getBoundingClientRect();
            const svgTop = svgRect.top + scrollTop;
            const svgBottom = svgTop + svgRect.height;

            let endPointMultiplier = 0.8;
            let startPointMultiplier = 0.3;
            if (segmentIndex === 0) {
                startPointMultiplier = -0.4;
                endPointMultiplier = 1;
            }

            const startPoint = svgTop - windowHeight * startPointMultiplier;
            const endPoint = svgBottom - windowHeight * endPointMultiplier;

            let progress = 0;
            if (scrollTop <= startPoint) {
                progress = 0;
            } else if (scrollTop >= endPoint) {
                progress = 1;
            } else {
                progress = (scrollTop - startPoint) / (endPoint - startPoint);
            }

            return Math.min(1, Math.max(0, progress));
        }

        // Исправленная функция обновления для Safari
        function updateProgress() {
            segmentsInfo.forEach((segment, idx) => {
                if (segment.length === 0) return;
                
                const progress = getScrollProgressForSegment(idx);
                
                // Для Safari используем только положительные значения
                // БЕЗ отрицательных чисел!
                let offset;
                
                if (idx === 0) {
                    // Первый сегмент - появляется при скролле
                    offset = segment.length * (1 - progress);
                } else if (idx === 1) {
                    // Второй сегмент - тоже появляется, но может быть другое направление
                    // Если нужно обратное направление, раскомментируйте вторую строку
                    offset = segment.length * (1 - progress);
                    // offset = segment.length * progress; // для обратного направления
                } else {
                    offset = segment.length * (1 - progress);
                }
                
                // Защита от отрицательных значений (хотя их уже нет)
                offset = Math.max(0, Math.min(segment.length, offset));
                segment.path.style.strokeDashoffset = offset;
            });
        }

        // Оптимизация для Safari
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
                updateProgress();
                ticking = false;
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        
        updateProgress();

        window.addEventListener('beforeunload', () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });

        console.log('Safari-версия скрипта загружена и работает');
    }
})();