// page-scroll-reveal.js (исправленная версия с корректной инверсией для Safari)
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

        // Определяем браузер Safari (более точная проверка)
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && 
                        !/crios/i.test(navigator.userAgent) && 
                        !/fxios/i.test(navigator.userAgent);
        
        console.log('Браузер Safari:', isSafari);

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
            
            // Добавляем класс для Safari
            if (isSafari) {
                newPath.classList.add('safari-path');
            }
            
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
                    // Для Safari начинаем с видимого состояния
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = '0';
                    path.style.strokeOpacity = '1';
                } else {
                    // Для других браузеров начинаем со скрытого
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = length;
                    path.style.strokeOpacity = '1';
                }
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
                let progress = getScrollProgressForSegment(idx);

                let offset;
                
                if (isSafari) {
                    // Для Safari: линия ИСЧЕЗАЕТ при скролле (от 0 к length)
                    // progress = 0 (в начале) -> offset = 0 (линия видна)
                    // progress = 1 (в конце) -> offset = length (линия скрыта)
                    offset = segment.length * progress;
                    
                    // Для отладки
                    if (idx === 0 && Math.random() < 0.01) {
                        console.log(`Safari сегмент ${idx}: progress=${progress.toFixed(2)}, offset=${offset.toFixed(0)}/${segment.length.toFixed(0)}`);
                    }
                } else {
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

                    // Оригинальная логика для других браузеров
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

        // Оптимизация производительности с requestAnimationFrame
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
                // Пересчитываем длины сегментов при ресайзе
                let newTotalLength = 0;
                segmentsInfo.forEach((segment, idx) => {
                    try {
                        const newLength = segment.path.getTotalLength();
                        segment.length = newLength;
                        segment.end = segment.start + newLength;
                        newTotalLength += newLength;
                        
                        if (isSafari) {
                            segment.path.style.strokeDasharray = newLength;
                            const progress = getScrollProgressForSegment(idx);
                            segment.path.style.strokeDashoffset = newLength * progress;
                        } else {
                            segment.path.style.strokeDasharray = newLength;
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

        // Очистка при выгрузке страницы
        window.addEventListener('beforeunload', () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });

        console.log('Скрипт инициализирован - режим Safari:', isSafari ? 'включен (линия исчезает)' : 'выключен (линия появляется)');
    }
})();
