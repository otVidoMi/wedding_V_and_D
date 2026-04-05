// page-scroll-reveal.js (исправленная версия с корректной отрисовкой первого сегмента)
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

        // Сохраняем оригинальные стили
        const originalStroke = svgPath.getAttribute('stroke') || '#cb0609';
        const originalWidth = svgPath.getAttribute('stroke-width') || '3';

        // Получаем d атрибут и разбиваем на сегменты по командам M (move to)
        const dAttribute = svgPath.getAttribute('d');

        // Разбиваем path на отдельные сегменты (каждый начинается с M)
        const segments = [];
        let currentSegment = '';

        for (let i = 0; i < dAttribute.length; i++) {
            const char = dAttribute[i];

            // Если встречаем M (заглавную) и это не начало строки
            if (char === 'M' && currentSegment.length > 0) {
                segments.push(currentSegment.trim());
                currentSegment = char;
            } else {
                currentSegment += char;
            }
        }

        // Добавляем последний сегмент
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

                // Устанавливаем начальное состояние (скрыто)
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length;
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

        // Функция для получения прогресса скролла для конкретного сегмента
        function getScrollProgressForSegment(segmentIndex) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;

            // Получаем позицию SVG относительно верха документа
            const svgRect = svgElement.getBoundingClientRect();
            const svgTop = svgRect.top + scrollTop;
            const svgBottom = svgTop + svgRect.height;

            // Для первого сегмента (idx === 0) используем множитель 1
            let endPointMultiplier = 0.8;
            let startPointMultiplier = 0.3;
            if (segmentIndex === 0) {
                startPointMultiplier = -0.4;
                endPointMultiplier = 1;
            }
            

            // Анимация начинается, когда верх SVG достигает верха окна
            // и заканчивается, когда низ SVG достигает верха окна
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

        // Функция обновления отрисовки
        function updateProgress() {
            // Обновляем каждый сегмент с его индивидуальным прогрессом
            segmentsInfo.forEach((segment, idx) => {
                if (segment.length === 0) return;

                // Получаем прогресс для конкретного сегмента
                const progress = getScrollProgressForSegment(idx);

                // ИНВЕРТИРУЕМ ПРОГРЕСС для отрисовки сверху вниз
                const invertedProgress = 1 - progress;
                const pixelsToShow = totalLength * invertedProgress;

                let segmentProgress = 0;

                if (pixelsToShow > segment.start) {
                    if (pixelsToShow >= segment.end) {
                        segmentProgress = 1;
                    } else {
                        segmentProgress = (pixelsToShow - segment.start) / segment.length;
                    }
                }

                let offset;
                // Для первого сегмента рисуем от начала к концу
                if (idx === 2) {
                    offset = (segment.length * segmentProgress);
                } else if (idx === 0) {
                    offset = -(segment.length * segmentProgress);
                } else {
                    offset = -(segment.length * segmentProgress);
                }

                segment.path.style.strokeDashoffset = offset;
            });
        }

        // Для отладки
        let lastProgress = -1;
        function debugProgress(progress, segmentIdx) {
            if (Math.abs(progress - lastProgress) > 0.05) {
                console.log(`Прогресс скролла для сегмента ${segmentIdx}:`, Math.round(progress * 100) + '%');
                lastProgress = progress;
            }
        }

        // Оптимизация производительности с requestAnimationFrame
        let ticking = false;
        let rafId = null;

        function onScroll() {
            if (!ticking) {
                rafId = requestAnimationFrame(() => {
                    segmentsInfo.forEach((segment, idx) => {
                        const progress = getScrollProgressForSegment(idx);
                        debugProgress(progress, idx);
                    });
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

        // Добавляем слушатели событий
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        // Запускаем начальную отрисовку
        updateProgress();

        // Очистка при выгрузке страницы
        window.addEventListener('beforeunload', () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });

        console.log('Скрипт инициализирован - для первого сегмента используется endPoint множитель 1');
    }
})();
