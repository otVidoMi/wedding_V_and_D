// glowing-line2-safari.js - специальная версия для Safari (второй SVG)
(function () {
    // Проверяем, Safari ли это
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!isSafari && !isiOS) {
        console.log('Не Safari, используем стандартную версию');
        return;
    }
    
    console.log('Safari detected, используем специальную версию glowing-line2');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const svgElement = document.querySelector('.bg-floral-ornament_2');
        if (!svgElement) {
            console.warn('SVG .bg-floral-ornament_2 not found');
            return;
        }

        svgElement.classList.add('safari-animation-2');
        
        // Создаем стили для Safari
        const styleId = 'safari-glowing-line2-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .bg-floral-ornament_2.safari-animation-2 path {
                    transition: stroke-dashoffset 0.05s linear;
                }
            `;
            document.head.appendChild(style);
        }
        
        const paths = svgElement.querySelectorAll('path');
        
        function setPathLengths() {
            paths.forEach((path, index) => {
                try {
                    const length = Math.ceil(path.getTotalLength());
                    if (length > 0 && !isNaN(length)) {
                        path.style.strokeDasharray = length;
                        path.style.strokeDashoffset = length;
                        path.setAttribute('data-length', length);
                    } else {
                        const fallbackLength = 1500;
                        path.style.strokeDasharray = fallbackLength;
                        path.style.strokeDashoffset = fallbackLength;
                        path.setAttribute('data-length', fallbackLength);
                    }
                } catch (e) {
                    const fallbackLength = 1500;
                    path.style.strokeDasharray = fallbackLength;
                    path.style.strokeDashoffset = fallbackLength;
                    path.setAttribute('data-length', fallbackLength);
                }
            });
        }
        
        if (document.readyState === 'complete') {
            setPathLengths();
        } else {
            window.addEventListener('load', setPathLengths);
        }
        
        // Используем Intersection Observer для второго SVG
        const observerOptions = {
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const svg = entry.target;
                const rect = entry.boundingClientRect;
                const windowHeight = window.innerHeight;
                
                let progress = 0;
                const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
                
                if (visibleHeight > 0) {
                    progress = visibleHeight / rect.height;
                }
                
                progress = Math.min(1, Math.max(0, progress));
                
                // Для второго SVG используем разные множители
                const pathsList = svg.querySelectorAll('path');
                pathsList.forEach((path, idx) => {
                    const length = parseFloat(path.getAttribute('data-length')) || 1500;
                    let offset;
                    
                    // Первые сегменты появляются быстрее
                    if (idx < 3) {
                        offset = length * (1 - Math.min(1, progress * 1.3));
                    } 
                    // Последние сегменты появляются медленнее
                    else if (idx > pathsList.length - 4) {
                        offset = length * (1 - Math.max(0, progress * 0.7));
                    }
                    // Средние сегменты
                    else {
                        offset = length * (1 - progress);
                    }
                    
                    offset = Math.max(0, Math.min(length, offset));
                    path.style.strokeDashoffset = offset;
                });
            });
        }, observerOptions);
        
        observer.observe(svgElement);
        
        // Дополнительная анимация при скролле
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
                        const length = parseFloat(path.getAttribute('data-length')) || 1500;
                        let offset;
                        
                        if (idx < 3) {
                            offset = length * (1 - Math.min(1, progress * 1.3));
                        } else if (idx > paths.length - 4) {
                            offset = length * (1 - Math.max(0, progress * 0.7));
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
        
        console.log('Safari version glowing-line2 инициализирован');
    }
})();