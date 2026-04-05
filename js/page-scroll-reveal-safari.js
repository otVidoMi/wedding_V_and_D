// page-scroll-reveal.js (полностью переработанная версия для Safari)
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
        
        // Получаем d атрибут
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

        console.log('Найдено сегментов:', segments.length);
        console.log('Браузер Safari:', isSafari);

        // Очищаем SVG
        svgPath.remove();

        // Создаем и добавляем новые пути
        const paths = [];
        segments.forEach((segmentData, index) => {
            const newPath = document.createElementNS(svgNS, 'path');
            newPath.setAttribute('d', segmentData);
            newPath.setAttribute('stroke', originalStroke);
            newPath.setAttribute('stroke-width', originalWidth);
            newPath.setAttribute('fill', 'none');
            newPath.setAttribute('stroke-linecap', 'round');
            newPath.setAttribute('stroke-linejoin', 'round');
            newPath.setAttribute('data-segment-index', index);
            svgElement.appendChild(newPath);
            paths.push(newPath);
        });

        // Получаем длины всех путей
        const segmentsLengths = paths.map(path => {
            try {
                return path.getTotalLength();
            } catch(e) {
                console.error('Ошибка получения длины', e);
                return 0;
            }
        });

        console.log('Длины сегментов:', segmentsLengths);

        // Устанавливаем начальные стили для каждого пути
        paths.forEach((path, idx) => {
            const length = segmentsLengths[idx];
            if (length > 0) {
                path.style.strokeDasharray = length;
                
                if (isSafari) {
                    // Safari: начинаем с видимой линии
                    path.style.strokeDashoffset = '0';
                } else {
                    // Другие браузеры: начинаем со скрытой линии
                    path.style.strokeDashoffset = length;
                }
            }
        });

        // Функция расчета прогресса скролла
        function getScrollProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const svgRect = svgElement.getBoundingClientRect();
            
            // Начало анимации: когда SVG появляется в окне
            const startPoint = svgRect.top + scrollTop - windowHeight * 0.3;
            // Конец анимации: когда SVG покидает окно
            const endPoint = svgRect.bottom + scrollTop - windowHeight * 0.7;
            
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

        // Функция обновления - ПРОСТАЯ И ПОНЯТНАЯ
        function updateProgress() {
            const progress = getScrollProgress();
            
            // Для отладки
            if (Math.random() < 0.01) {
                console.log('Progress:', progress.toFixed(3));
            }
            
            // Для каждого сегмента
            paths.forEach((path, idx) => {
                const length = segmentsLengths[idx];
                if (length === 0) return;
                
                let offset;
                
                if (isSafari) {
                    // SAFARI: Линия ИСЧЕЗАЕТ при скролле вниз
                    // progress 0 → offset 0 (линия видна)
                    // progress 1 → offset length (линия скрыта)
                    offset = length * progress;
                } else {
                    // ДРУГИЕ БРАУЗЕРЫ: Линия ПОЯВЛЯЕТСЯ при скролле вниз
                    // progress 0 → offset length (линия скрыта)
                    // progress 1 → offset 0 (линия видна)
                    offset = length * (1 - progress);
                }
                
                path.style.strokeDashoffset = offset;
                
                // Отладка для первого сегмента
                if (idx === 0 && Math.random() < 0.02) {
                    console.log(`Segment ${idx}: progress=${progress.toFixed(3)}, offset=${offset.toFixed(0)}/${length.toFixed(0)}`);
                }
            });
        }

        // Обработчики событий с оптимизацией
        let ticking = false;
        
        function handleScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }
        
        function handleResize() {
            // Пересчитываем длины при ресайзе
            paths.forEach((path, idx) => {
                try {
                    const newLength = path.getTotalLength();
                    segmentsLengths[idx] = newLength;
                    path.style.strokeDasharray = newLength;
                    
                    // Сохраняем текущее состояние
                    const currentProgress = getScrollProgress();
                    if (isSafari) {
                        path.style.strokeDashoffset = newLength * currentProgress;
                    } else {
                        path.style.strokeDashoffset = newLength * (1 - currentProgress);
                    }
                } catch(e) {}
            });
            
            updateProgress();
        }
        
        // Подписываемся на события
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);
        
        // Запускаем анимацию
        updateProgress();
        
        console.log('Скрипт инициализирован. Режим:', isSafari ? 'SAFARI (линия исчезает)' : 'STANDARD (линия появляется)');
        
        // Функция очистки
        window.addEventListener('beforeunload', () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        });
    }
})();
