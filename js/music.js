// Музыкальный плеер с бабочкой
(function() {
  const musicBtn = document.getElementById('musicToggleBtn');
  const audio = document.getElementById('bgMusic');
  
  let isPlaying = false;
  
  // Функция переключения музыки
  function toggleMusic() {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      musicBtn.classList.remove('playing');
    } else {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isPlaying = true;
          musicBtn.classList.add('playing');
        }).catch(error => {
          // Браузер блокирует автовоспроизведение - это нормально
          console.log('Для запуска музыки нужно нажать на кнопку');
          // Показываем подсказку пользователю анимацией
          if (musicBtn) {
            musicBtn.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
              if (musicBtn) musicBtn.style.animation = '';
            }, 500);
          }
        });
      }
    }
  }
  
  // Вешаем обработчик клика
  if (musicBtn) {
    musicBtn.addEventListener('click', toggleMusic);
  }
  
  // Загружаем аудио при загрузке страницы
  window.addEventListener('load', () => {
    if (audio) {
      audio.load();
    }
    
    // Небольшая задержка для привлечения внимания к кнопке
    setTimeout(() => {
      if (musicBtn) {
        musicBtn.style.animation = 'pulse 0.5s ease 2';
        setTimeout(() => {
          if (musicBtn) musicBtn.style.animation = '';
        }, 1000);
      }
    }, 500);
  });
})();