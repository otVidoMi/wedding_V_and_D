// glowing-line-safari.js (для первого SVG - bg-floral-ornament)
// Скрипт для анимированного прорисовывания SVG-линии при скролле страницы
// Адаптирован для первого SVG орнамента (bg-floral-ornament)

(function () {
    // ===== УПРАВЛЕНИЕ ЗАГРУЗКОЙ ДОКУМЕНТА =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /**
     * Главная функция инициализации
     */
    function init() {
        // ===== ПОИСК ЭЛЕМЕНТОВ =====
        // Ищем родительский SVG элемент с классом .bg-floral-ornament (первый SVG)
        const svgElement = document.querySelector('.bg-floral-ornament');
        if (!svgElement) {
            console.log('SVG элемент .bg-floral-ornament не найден');
            return;
        }

        // Ищем внутри SVG все элементы <path> (в первом SVG их несколько)
        const svgPaths = svgElement.querySelectorAll('path');
        if (!svgPaths.length) {
            console.log('Path элементы не найдены в SVG');
            return;
        }

        console.log(`Найдено ${svgPaths.length} path элементов в .bg-floral-ornament`);

        // Пространство имён SVG
        const svgNS = "http://www.w3.org/2000/svg";

        // ===== ОПРЕДЕЛЕНИЕ SAFARI =====
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('Браузер Safari (первый SVG):', isSafari);

        // ===== ОБРАБОТКА КАЖДОГО PATH ЭЛЕМЕНТА =====
        // Сохраняем все новые пути и их длины
        const pathsData = [];

        svgPaths.forEach((originalPath, index) => {
            // Сохраняем оригинальные атрибуты
            const originalStroke = originalPath.getAttribute('stroke') || '#cb0609';
            const originalWidth = originalPath.getAttribute('stroke-width') || '3';
            const dAttribute = originalPath.getAttribute('d');
            
            if (!dAttribute) return;

            // Создаём новый path элемент
            const newPath = document.createElementNS(svgNS, 'path');
            newPath.setAttribute('d', dAttribute);
            newPath.setAttribute('stroke', originalStroke);
            newPath.setAttribute('stroke-width', originalWidth);
            newPath.setAttribute('fill', 'none');
            newPath.setAttribute('stroke-linecap', 'round');
            newPath.setAttribute('stroke-linejoin', 'round');

            // Заменяем старый path новым
            originalPath.remove();
            svgElement.appendChild(newPath);

            // Вычисляем длину пути
            let pathLength = 0;
            try {
                pathLength = newPath.getTotalLength();
            } catch (e) {
                console.error(`Ошибка получения длины пути ${index}:`, e);
                return;
            }

            // Настраиваем dash-анимацию
            newPath.style.strokeDasharray = pathLength;

            if (isSafari) {
                // Safari: начинаем с полностью видимой линии
                newPath.style.strokeDashoffset = '0';
            } else {
                // Обычные браузеры: начинаем со скрытой линии
                newPath.style.strokeDashoffset = pathLength;
            }

            newPath.style.strokeOpacity = '1';

            // Сохраняем данные для анимации
            pathsData.push({
                path: newPath,
                length: pathLength,
                originalStroke: originalStroke,
                originalWidth: originalWidth
            });
        });

        if (pathsData.length === 0) {
            console.log('Не удалось создать ни одного path элемента');
            return;
        }

        /**
         * ВЫЧИСЛЕНИЕ ПРОГРЕССА СКРОЛЛА
         */
        function getScrollProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;

            const svgRect = svgElement.getBoundingClientRect();
            const svgTop = svgRect.top + scrollTop;
            const svgBottom = svgTop + svgRect.height;

            // Анимация начинается, когда SVG появляется в нижней трети экрана
            const startPoint = svgTop - windowHeight * 0.2;
            // Анимация заканчивается, когда SVG почти ушёл вверх
            const endPoint = svgBottom - windowHeight * 0.7;

            let progress = 1;

            if (scrollTop <= startPoint) {
                progress = 0;
            } else if (scrollTop >= endPoint) {
                progress = 1;
            } else {
                progress = (scrollTop - startPoint) / (endPoint - startPoint);
            }

            return Math.min(1, Math.max(0, progress));
        }

        /**
         * ОБНОВЛЕНИЕ СОСТОЯНИЯ ОТРИСОВКИ ВСЕХ ЛИНИЙ
         */
        function updateProgress() {
            const scrollProgress = getScrollProgress();
            
            // Для отладки (редко)
            if (Math.random() < 0.01) {
                console.log('Progress (первый SVG):', scrollProgress.toFixed(3));
            }

            pathsData.forEach(data => {
                if (isSafari) {
                    // Safari: при progress=0 offset = длина (ничего не видно)
                    // при progress=1 offset = 0 (видно всё)
                    const offset = data.length * (1 - scrollProgress);
                    data.path.style.strokeDashoffset = offset;
                } else {
                    // Обычные браузеры: offset уменьшается от длины до 0
                    const offset = data.length * (1 - scrollProgress);
                    data.path.style.strokeDashoffset = offset;
                }
            });
        }

        // ===== ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ =====
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
                // При ресайзе пересчитываем длины всех путей
                let allValid = true;
                pathsData.forEach(data => {
                    try {
                        const newLength = data.path.getTotalLength();
                        data.length = newLength;
                        data.path.style.strokeDasharray = newLength;
                    } catch (e) {
                        console.error('Ошибка при ресайзе:', e);
                        allValid = false;
                    }
                });
                if (allValid) {
                    updateProgress();
                }
                ticking = false;
            });
        }

        // ===== ПОДПИСКА НА СОБЫТИЯ =====
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        // ===== ПЕРВОНАЧАЛЬНАЯ ОТРИСОВКА =====
        updateProgress();

        // ===== ОЧИСТКА РЕСУРСОВ =====
        window.addEventListener('beforeunload', () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });

        console.log(`Скрипт для .bg-floral-ornament инициализирован. Обработано ${pathsData.length} path элементов. Safari mode: ${isSafari}`);
    }
})();
