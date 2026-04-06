// page-scroll-reveal.js (исправленная версия для Safari с корректной работой всех сегментов)
(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const svgElement = document.querySelector('.bg-floral-ornament_2');
        if (!svgElement) return;

        const svgPath = svgElement.querySelector('path');
        if (!svgPath) return;

        const svgNS = "http://www.w3.org/2000/svg";

        // Сохраняем оригинальные стили
        const originalStroke = svgPath.getAttribute('stroke') || '#cb0609';
        const originalWidth = svgPath.getAttribute('stroke-width') || '3';

        // Определяем браузер Safari
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('Браузер Safari:', isSafari);

        // Получаем d атрибут и разбиваем на сегменты по командам M (move to)
        const dAttribute = svgPath.getAttribute('d');

        // Разбиваем path на отдельные сегменты (каждый начинается с M)
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

        console.log('Найдено сегментов:', segments.length);

        // Создаем отдельные path элементы для каждого сегмента
        const paths = [];
        segments.forEach((segmentData, index) => {
            const newPath = document.createElementNS(svgNS, 'path');
            newPath.setAttribute('d', segmentData);
            newPath.setAttribute('stroke', originalStroke);
            newPath.setAttribute('stroke-width', originalWidth);
            newPath.setAttribute('fill', 'none');
            newPath.setAttribute('stroke-linecap', 'round');
            newPath.setAttribute('stroke-linejoin', 'round');
            paths.push(newPath);
        });

        // Удаляем оригинальный path и добавляем новые
        svgPath.remove();
        paths.forEach(path => svgElement.appendChild(path));

        // Рассчитываем длины всех сегментов
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

                // Начальное состояние
                path.style.strokeDasharray = length;
                // Для Safari 0, а для других браузеров начинаем со скрытого length
                path.style.strokeDashoffset = 0;
                
                path.style.strokeOpacity = '1';
            } catch (e) {
                console.error('Ошибка при расчете длины сегмента', idx, e);
                segmentsInfo.push({
                    path: path,
                    length: 0,
                    start: totalLength,
                    end: totalLength,
                    index: idx
                });
            }
        });

        console.log('Общая длина всех сегментов:', totalLength);

        // Функция для получения прогресса скроллла
        function getScrollProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            
            const svgRect = svgElement.getBoundingClientRect();
            const svgTop = svgRect.top + scrollTop;
            const svgBottom = svgTop + svgRect.height;
            
            // Настройки для всей анимации
            const startPoint = svgTop - windowHeight * 0.3;
            const endPoint = svgBottom - windowHeight * 0.8;
            
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

        // Функция обновления отрисовки
        function updateProgress() {
            const scrollProgress = getScrollProgress();
            
            // Для отладки
            if (Math.random() < 0.02) {
                console.log('Scroll progress:', scrollProgress.toFixed(3));
            }
            
            segmentsInfo.forEach((segment, idx) => {
                if (segment.length === 0) return;
                
                let offset;
                
                if (isSafari) {
                    // Для Safari - простая инверсия для всех сегментов
                    // При scrollProgress = 0 → линия видна полностью (offset = 0)
                    // При scrollProgress = 1 → линия скрыта полностью (offset = segment.length)
                    offset = segment.length * scrollProgress;
                    
                    // Для отладки первого сегмента
                    if (idx === 0 && Math.random() < 0.02) {
                        console.log(`Segment ${idx}: progress=${scrollProgress.toFixed(3)}, offset=${offset.toFixed(0)}/${segment.length.toFixed(0)}`);
                    }
                } else {
                    // Оригинальная логика для других браузеров
                    const invertedProgress = 1 - scrollProgress;
                    const pixelsToShow = totalLength * invertedProgress;
                    
                    let segmentProgress = 0;
                    if (pixelsToShow > segment.start) {
                        if (pixelsToShow >= segment.end) {
                            segmentProgress = 1;
                        } else {
                            segmentProgress = (pixelsToShow - segment.start) / segment.length;
                        }
                    }
                    
                    // Разная логика для разных сегментов
                    if (idx === 2) {
                        offset = (segment.length * segmentProgress);
                    } else if (idx === 0) {
                        offset = -(segment.length * segmentProgress);
                    } else {
                        offset = -(segment.length * segmentProgress);
                    }
                }
                
                segment.path.style.strokeDashoffset = offset;
            });
        }

        // Оптимизация производительности
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
                // Пересчитываем длины при ресайзе
                let newTotalLength = 0;
                segmentsInfo.forEach((segment, idx) => {
                    try {
                        const newLength = segment.path.getTotalLength();
                        segment.length = newLength;
                        segment.end = segment.start + newLength;
                        newTotalLength += newLength;
                        segment.path.style.strokeDasharray = newLength;
                        
                        if (!isSafari && segment.path.style.strokeDashoffset) {
                            // Сохраняем текущий offset
                            const currentOffset = parseFloat(segment.path.style.strokeDashoffset);
                            if (!isNaN(currentOffset)) {
                                // Пересчитываем offset при ресайзе
                            }
                        }
                    } catch(e) {
                        console.error('Ошибка пересчета длины', e);
                    }
                });
                totalLength = newTotalLength;
                updateProgress();
                ticking = false;
            });
        }

        // Добавляем слушатели событий
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        // Запускаем начальную отрисовку
        updateProgress();

        // Очистка
        window.addEventListener('beforeunload', () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });

        console.log('Скрипт инициализирован - режим Safari:', isSafari ? 'включен (инверсия для всех сегментов)' : 'выключен');
    }
})();
