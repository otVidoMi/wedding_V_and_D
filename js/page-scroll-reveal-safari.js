// page-scroll-reveal.js (Safari финальная версия)
// Скрипт для анимированного прорисовывания SVG-линии при скролле страницы
// Особенность: корректно работает в Safari, где стандартная dash-анимация ведёт себя иначе

// Немедленно вызываемая функция (IIFE) - создаёт изолированную область видимости,
// чтобы не загрязнять глобальное пространство имён
(function () {
    // ===== УПРАВЛЕНИЕ ЗАГРУЗКОЙ ДОКУМЕНТА =====
    // Проверяем текущее состояние документа:
    // - 'loading' - документ ещё загружается, нужно дождаться события DOMContentLoaded
    // - 'interactive' или 'complete' - DOM уже готов, можно инициализировать сразу
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /**
     * Главная функция инициализации
     * Вызывается после полной загрузки DOM
     */
    function init() {
        // ===== ПОИСК ЭЛЕМЕНТОВ =====
        // Ищем родительский SVG элемент с классом .bg-floral-ornament_2
        const svgElement = document.querySelector('.bg-floral-ornament');
        if (!svgElement) return; // Если элемент не найден - выходим

        // Ищем внутри SVG элемент <path> (фактическая линия для рисования)
        const svgPath = svgElement.querySelector('path');
        if (!svgPath) return;

        // Пространство имён SVG - обязательно для создания корректных SVG-элементов
        const svgNS = "http://www.w3.org/2000/svg";

        // ===== СОХРАНЕНИЕ ОРИГИНАЛЬНЫХ СТИЛЕЙ =====
        // Запоминаем оригинальные атрибуты стиля из HTML/CSS
        // stroke - цвет линии (по умолчанию #cb0609 - бордово-красный)
        const originalStroke = svgPath.getAttribute('stroke') || '#cb0609';
        // stroke-width - толщина линии (по умолчанию 3 пикселя)
        const originalWidth = svgPath.getAttribute('stroke-width') || '3';

        // ===== ОПРЕДЕЛЕНИЕ SAFARI =====
        // Регулярное выражение проверяет User-Agent:
        // - Содержит 'safari' но НЕ содержит 'chrome' и 'android'
        // (Chrome на iOS тоже содержит 'safari', поэтому исключаем его)
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log('Браузер Safari:', isSafari);

        // ===== ИЗВЛЕЧЕНИЕ ДАННЫХ ПУТИ =====
        // d-атрибут содержит команды рисования SVG пути (например: "M10,10 L100,50...")
        const dAttribute = svgPath.getAttribute('d');

        // ===== СОЗДАНИЕ НОВОГО PATH ЭЛЕМЕНТА =====
        // Причина пересоздания: чтобы полностью контролировать поведение
        // и избежать конфликтов с существующими анимациями или стилями
        const newPath = document.createElementNS(svgNS, 'path');
        newPath.setAttribute('d', dAttribute);                // Передаём геометрию
        newPath.setAttribute('stroke', originalStroke);       // Восстанавливаем цвет
        newPath.setAttribute('stroke-width', originalWidth);  // Восстанавливаем толщину
        newPath.setAttribute('fill', 'none');                 // Без заливки - только контур
        newPath.setAttribute('stroke-linecap', 'round');      // Скруглённые окончания линий
        newPath.setAttribute('stroke-linejoin', 'round');     // Скруглённые углы

        // ===== ЗАМЕНА ЭЛЕМЕНТОВ =====
        // Удаляем старый path и вставляем новый (управляемый скриптом)
        svgPath.remove();
        svgElement.appendChild(newPath);

        // ===== ВЫЧИСЛЕНИЕ ДЛИНЫ ПУТИ =====
        let pathLength = 0;
        try {
            // getTotalLength() - нативное SVG-свойство, возвращает длину пути в пикселях
            // Критически важно для анимации dashoffset
            pathLength = newPath.getTotalLength();
        } catch (e) {
            console.error('Ошибка получения длины пути:', e);
            return; // Без длины пути анимация невозможна - выходим
        }

        console.log('Длина пути:', pathLength);

        // ===== НАСТРОЙКА DASH-АНИМАЦИИ =====
        // Принцип работы:
        // stroke-dasharray = length     - линия состоит из одного длинного штриха и одного длинного пробела
        // stroke-dashoffset - смещение начала штриха
        // 
        // В обычных браузерах (Chrome, Firefox):
        //   начальный offset = length (штрих полностью смещён → линия не видна)
        //   конечный offset = 0 (штрих на месте → линия полностью видна)
        //   При скролле offset уменьшается от length до 0 → линия "рисуется"
        //
        // В Safari (особенность рендеринга):
        //   начальный offset = 0 (линия сразу видна полностью)
        //   конечный offset = length (штрих полностью смещён → линия не видна)
        //   При скролле offset увеличивается от 0 до length → линия "стирается"?
        //   НО: Safari интерпретирует отрицательное смещение иначе, поэтому 
        //   меняем логику: рисуем линию, уменьшая видимую часть
        newPath.style.strokeDasharray = pathLength;

        if (isSafari) {
            // Safari: начинаем с полностью видимой линии (offset = 0)
            // По мере скролла увеличиваем offset, тем самым "обнажая" пробел
            // Визуально создаётся эффект рисования от начала к концу
            newPath.style.strokeDashoffset = '0';
            console.log('Safari режим: линия будет рисоваться от верхней точки к нижней');
        } else {
            // Обычные браузеры: начинаем со скрытой линии (offset = длина)
            newPath.style.strokeDashoffset = pathLength;
        }

        // Гарантируем, что линия видима (не полупрозрачная)
        newPath.style.strokeOpacity = '1';

        /**
         * ВЫЧИСЛЕНИЕ ПРОГРЕССА СКРОЛЛА
         * Определяет, насколько сильно линия должна быть нарисована (от 0 до 1)
         * 
         * Логика работы:
         * - Когда SVG элемент только появляется внизу экрана → прогресс = 0 (линия не нарисована)
         * - Когда SVG элемент полностью прошёл экран → прогресс = 1 (линия нарисована полностью)
         * - Между этими точками - линейная интерполяция
         * 
         * @returns {number} - число от 0 до 1 (0 - ничего не нарисовано, 1 - полностью нарисовано)
         */
        function getScrollProgress() {
            // Текущая позиция скролла от верха страницы (в пикселях)
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            // Высота видимой области окна (в пикселях)
            const windowHeight = window.innerHeight;

            // Координаты SVG элемента относительно документа (не окна!)
            const svgRect = svgElement.getBoundingClientRect();
            const svgTop = svgRect.top + scrollTop;      // Y-координата верха SVG в документе
            const svgBottom = svgTop + svgRect.height;    // Y-координата низа SVG в документе

            // Точки начала и конца анимации (в пикселях от верха документа)
            // startPoint: SVG начинает появляться (верха элемента коснулся нижней трети экрана)
            //   Формула: svgTop - (windowHeight * 0.3)
            //   Умножаем на 0.3 чтобы анимация начиналась чуть раньше, чем элемент полностью появится
            const startPoint = svgTop - windowHeight * 0.3;

            // endPoint: SVG почти полностью ушёл вверх (осталось 20% видимости)
            //   Формула: svgBottom - (windowHeight * 0.8)
            //   Умножаем на 0.8 чтобы анимация заканчивалась чуть позже, чем элемент начнёт исчезать
            const endPoint = svgBottom - windowHeight * 0.8;

            let progress = 1;

            // Расчёт прогресса с линейной интерполяцией
            if (scrollTop <= startPoint) {
                // Скролл выше начальной точки → линия не нарисована
                progress = 0;
            } else if (scrollTop >= endPoint) {
                // Скролл ниже конечной точки → линия нарисована полностью
                progress = 1;
            } else {
                // Скролл между точками → вычисляем пропорцию
                // Пример: scrollTop=500, startPoint=400, endPoint=800
                // (500-400)/(800-400) = 100/400 = 0.25 (25% прогресса)
                progress = (scrollTop - startPoint) / (endPoint - startPoint);
            }

            // Ограничиваем значение в пределах [0, 1] на случай ошибок округления
            return Math.min(1, Math.max(0, progress));
        }

        /**
         * ОБНОВЛЕНИЕ СОСТОЯНИЯ ОТРИСОВКИ ЛИНИИ
         * На основе текущего прогресса скролла вычисляет и устанавливает stroke-dashoffset
         * Эта функция вызывается при каждом скролле и при изменении размера окна
         */
        function updateProgress() {
            // Получаем текущий прогресс (от 0 до 1)
            const scrollProgress =  getScrollProgress();

            // Логирование для отладки (с вероятностью 2%, чтобы не заспамливать консоль)
            if (Math.random() < 0.02) {
                console.log('Progress:', scrollProgress.toFixed(3));
            }

            if (isSafari) {
                // ===== SAFARI РЕЖИМ =====
                // offset начинается с 0 (линия видна полностью)
                // по мере скролла offset увеличивается → видимая часть сокращается
                // Формула: offset = длина_пути * прогресс
                // При progress=0 → offset=0 (линия полностью видна? Это проблема!)
                // НЕТ: В Safari видимой считается область от offset до offset+длина
                // При offset=0 видна длина, при offset=длина видно 0
                // НО если offset=0, то виден полный штрих (длина)
                // Нам нужно обратное: чтобы при progress=0 линия была пустой
                // ПОЭТОМУ для Safari рисуем в обратную сторону:
                // При progress=0 → offset = длина (ничего не видно)
                // При progress=1 → offset = 0 (видно всё)
                // Исправленная логика:
                const offset = pathLength * (1 - scrollProgress);
                newPath.style.strokeDashoffset = 1-offset;
            } else {
                // ===== ОБЫЧНЫЕ БРАУЗЕРЫ =====
                // offset начинается с длины (линия не видна)
                // при скролле offset уменьшается → появляется видимая часть
                // Формула: offset = длина_пути * (1 - прогресс)
                // При progress=0 → offset=длина (не видно)
                // При progress=1 → offset=0 (видно полностью)
                const offset = pathLength * (1 - scrollProgress);
                newPath.style.strokeDashoffset = offset;
            }
        }

        // ===== ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ =====
        // Паттерн "ticking" (или "requestAnimationFrame throttling")
        // Гарантирует, что анимация обновляется не чаще, чем кадры монитора (обычно 60 FPS)
        // Предотвращает накопление множества вызовов при быстром скролле

        let ticking = false;      // Флаг: выполняется ли уже запрос анимации
        let rafId = null;         // ID текущего requestAnimationFrame для возможности отмены

        /**
         * Обработчик события scroll
         * Запрашивает новый кадр анимации только если предыдущий уже выполнен
         */
        function onScroll() {
            if (!ticking) {
                // Запрашиваем анимацию в следующем кадре
                rafId = requestAnimationFrame(() => {
                    updateProgress();  // Обновляем состояние линии
                    ticking = false;   // Снимаем флаг - можно запрашивать новый кадр
                });
                ticking = true;  // Устанавливаем флаг - кадр уже запрошен
            }
        }

        /**
         * Обработчик изменения размера окна (resize)
         * При изменении размера окна длина пути может измениться из-за масштабирования SVG
         * Поэтому нужно:
         * 1. Пересчитать длину пути
         * 2. Обновить stroke-dasharray
         * 3. Пересчитать прогресс и обновить отрисовку
         */
        function onResize() {
            // Отменяем текущий запрос анимации, если есть
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            // Запускаем новый кадр
            rafId = requestAnimationFrame(() => {
                try {
                    // Пересчитываем длину пути (важно для адаптивных SVG)
                    const newLength = newPath.getTotalLength();
                    pathLength = newLength;
                    // Обновляем dasharray с новой длиной
                    newPath.style.strokeDasharray = pathLength;
                    // Обновляем отрисовку с новыми параметрами
                    updateProgress();
                } catch (e) {
                    console.error('Ошибка при ресайзе:', e);
                }
                ticking = false;  // Сбрасываем флаг
            });
        }

        // ===== ПОДПИСКА НА СОБЫТИЯ =====
        // Добавляем слушатели с пассивным режимом (passive: true) для улучшения производительности скролла
        // Пассивный слушатель сообщает браузеру, что он не вызывает preventDefault()
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        // ===== ПЕРВОНАЧАЛЬНАЯ ОТРИСОВКА =====
        // Устанавливаем начальное состояние линии на основе текущей позиции скролла
        updateProgress();

        // ===== ОЧИСТКА РЕСУРСОВ =====
        // При выгрузке страницы удаляем все слушатели, чтобы избежать утечек памяти
        // (хорошая практика для долгоживущих SPA, но для обычных страниц не критично)
        window.addEventListener('beforeunload', () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });

        console.log('Скрипт инициализирован - Safari mode:', isSafari);
    }
})(); // Немедленный вызов функции
