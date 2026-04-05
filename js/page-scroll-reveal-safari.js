// page-scroll-reveal.js (исправленная версия с CSS-трансформацией для Safari)
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

        // Определяем браузер Safari
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('Браузер Safari:', isSafari);

        // ДЛЯ SAFARI: Добавляем CSS для инверсии анимации
        if (isSafari) {
            const style = document.createElement('style');
            style.textContent = `
                /* Инверсия направления анимации для Safari */
                .bg-floral-ornament path {
                    animation: safari-reverse-draw linear forwards;
                    animation-timeline: scroll();
                }
                
                @keyframes safari-reverse-draw {
                    from {
                        stroke-dashoffset: 0;
                    }
                    to {
                        stroke-dashoffset: var(--total-length);
                    }
                }
            `;
            document.head.appendChild(style);
            console.log('Добавлен CSS-фикс для Safari');
        }

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

                // Устанавливаем начальное состояние
                if (isSafari) {
                    // Для Safari используем CSS переменную
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = '0';
                    path.style.setProperty('--length', length);
                    path.style.setProperty('--total-length', totalLength);
                } else {
                    // Для других браузеров стандартное поведение
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = length;
                }
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

        // Устанавливаем глобальную CSS переменную для Safari
        if (isSafari && svgElement) {
            svgElement.style.setProperty('--total-length', totalLength);
        }

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
            // Для Safari используем CSS-анимацию, не нужно обновлять через JS
            if (isSafari) {
                return;
            }

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
                // Оригинальная логика для других браузеров
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

        // Оптимизация производительности с requestAnimationFrame
        let ticking = false;
        let rafId = null;

        function onScroll() {
            // Для Safari не нужен обработчик scroll
            if (isSafari) return;
            
            if (!ticking) {
                rafId = requestAnimationFrame(() => {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }

        function onResize() {
            if (isSafari) {
                // Для Safari просто обновляем CSS переменную
                if (svgElement) {
                    svgElement.style.setProperty('--total-length', totalLength);
                }
                return;
            }
            
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
                updateProgress();
                ticking = false;
            });
        }

        // Добавляем слушатели событий (только для не-Safari)
        if (!isSafari) {
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onResize);
        } else {
            // Для Safari только resize для обновления переменной
            window.addEventListener('resize', onResize);
        }

        // Запускаем начальную отрисовку
        updateProgress();

        // Очистка при выгрузке страницы
        window.addEventListener('beforeunload', () => {
            if (!isSafari) {
                window.removeEventListener('scroll', onScroll);
            }
            window.removeEventListener('resize', onResize);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });

        console.log('Скрипт инициализирован - для Safari используется CSS-трансформация');
    }
})();
