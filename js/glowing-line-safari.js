// glowing-line-safari.js - специальная версия для Safari
(function () {
    // Проверяем, Safari ли это
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!isSafari && !isiOS) {
        console.log('Не Safari, используем стандартную версию');
        return;
    }
    
    console.log('Safari detected, используем специальную версию glowing-line');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const svgElement = document.querySelector('.bg-floral-ornament');
        if (!svgElement) {
            console.warn('SVG .bg-floral-ornament not found');
            return;
        }

        // Для Safari используем простой CSS-подход вместо JS анимации
        // Добавляем класс для CSS анимации
        svgElement.classList.add('safari-animation');
        
        // Создаем стили для Safari
        const styleId = 'safari-glowing-line-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* Стили для Safari */
                .bg-floral-ornament.safari-animation path {
                    stroke-dasharray: 2000;
                    stroke-dashoffset: 2000;
                    animation: safariDrawLine 0.001s linear forwards;
                    animation-timeline: scroll();
                }
                
                @keyframes safariDrawLine {
                    from {
                        stroke-dashoffset: 2000;
                    }
                    to {
                        stroke-dashoffset: 0;
                    }
                }
                
                /* Альтернативный вариант через transition */
                .bg-floral-ornament.safari-animation.alternative path {
                    transition: stroke-dashoffset 0.1s linear;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Получаем все path элементы
        const paths = svgElement.querySelectorAll('path');
        
        // Функция для установки длины каждого path
        function setPathLengths() {
            paths.forEach((path, index) => {
                try {
                    // Получаем реальную длину path
                    const length = Math.ceil(path.getTotalLength());
                    if (length > 0 && !isNaN(length)) {
                        path.style.strokeDasharray = length;
                        path.style.strokeDashoffset = length;
                        // Сохраняем длину в атрибут для CSS
                        path.setAttribute('data-length', length);
                    } else {
                        // Fallback длина
                        const fallbackLength = 2000;
                        path.style.strokeDasharray = fallbackLength;
                        path.style.strokeDashoffset = fallbackLength;
                        path.setAttribute('data-length', fallbackLength);
                    }
                } catch (e) {
                    console.warn('Error getting path length:', e);
                    const fallbackLength = 2000;
                    path.style.strokeDasharray = fallbackLength;
                    path.style.strokeDashoffset = fallbackLength;
                    path.setAttribute('data-length', fallbackLength);
                }
            });
        }
        
        // Устанавливаем длины после загрузки
        if (document.readyState === 'complete') {
            setPathLengths();
        } else {
            window.addEventListener('load', setPathLengths);
        }
        
        // Плавная анимация при скролле через Intersection Observer
        const observerOptions = {
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const svg = entry.target;
                const rect = entry.boundingClientRect;
                const windowHeight = window.innerHeight;
                
                // Вычисляем прогресс появления SVG в viewport
                let progress = 0;
                const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
                
                if (visibleHeight > 0) {
                    progress = visibleHeight / rect.height;
                }
                
                // Ограничиваем прогресс
                progress = Math.min(1, Math.max(0, progress));
                
                // Обновляем offset для всех path
                const pathsList = svg.querySelectorAll('path');
                pathsList.forEach((path, idx) => {
                    const length = parseFloat(path.getAttribute('data-length')) || 2000;
                    let offset = length * (1 - progress);
                    
                    // Разные сегменты появляются с разной скоростью
                    if (idx === 0) {
                        offset = length * (1 - Math.min(1, progress * 1.2));
                    } else if (idx === pathsList.length - 1) {
                        offset = length * (1 - Math.max(0, progress * 0.8));
                    } else {
                        offset = length * (1 - progress);
                    }
                    
                    offset = Math.max(0, Math.min(length, offset));
                    path.style.strokeDashoffset = offset;
                });
            });
        }, observerOptions);
        
        observer.observe(svgElement);
        
        // Также слушаем скролл для более плавной анимации
        let ticking = false;
        
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const rect = svgElement.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    
                    let progress = 0;
                    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
                    
                    if (visibleHeight > 0) {
                        progress = visibleHeight / rect.height;
                    }
                    
                    progress = Math.min(1, Math.max(0, progress));
                    
                    paths.forEach((path, idx) => {
                        const length = parseFloat(path.getAttribute('data-length')) || 2000;
                        let offset = length * (1 - progress);
                        
                        if (idx === 0) {
                            offset = length * (1 - Math.min(1, progress * 1.2));
                        } else if (idx === paths.length - 1) {
                            offset = length * (1 - Math.max(0, progress * 0.8));
                        } else {
                            offset = length * (1 - progress);
                        }
                        
                        offset = Math.max(0, Math.min(length, offset));
                        path.style.strokeDashoffset = offset;
                    });
                    
                    ticking = false;
                });
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => {
            setTimeout(setPathLengths, 100);
        });
        
        console.log('Safari version glowing-line инициализирован');
    }
})();