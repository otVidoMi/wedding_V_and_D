/**
 * Музыкальный плеер с визуализацией
 * Бабочка двигается вверх-вниз в такт музыке
 * Пульсация кнопки и круги в такт музыке
 */

(function() {
  console.log('=== МУЗЫКАЛЬНЫЙ ВИЗУАЛИЗАТОР ЗАГРУЖЕН ===');
  
  // DOM элементы
  let audio = null;
  let toggleBtn = null;
  let butterfly = null;
  
  // Web Audio API переменные
  let audioContext = null;
  let sourceNode = null;
  let analyserNode = null;
  let animationFrameId = null;
  let isAudioContextInitialized = false;
  
  // Флаг воспроизведения
  let isPlaying = false;
  
  // Для пульсации
  let decayPulse = 0;
  
  // Для движения бабочки в такт
  let butterflyYOffset = 0;
  let butterflyTargetY = 0;
  
  /**
   * Обновление ссылок на DOM элементы
   */
  function updateDOMElements() {
    console.log('Поиск DOM элементов...');
    audio = document.getElementById('bgMusic');
    toggleBtn = document.getElementById('musicToggleBtn');
    console.log('audio найден:', !!audio);
    console.log('toggleBtn найден:', !!toggleBtn);
    
    if (toggleBtn) {
      butterfly = toggleBtn.querySelector('.butterfly');
      console.log('butterfly найден:', !!butterfly);
    }
  }
  
  /**
   * Инициализация Web Audio API
   */
  async function initAudioContext() {
    if (audioContext) return;
    if (!audio) {
      console.warn('Аудио элемент не найден');
      return;
    }
    
    try {
      console.log('Инициализация Web Audio API...');
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      sourceNode = audioContext.createMediaElementSource(audio);
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.3;
      
      sourceNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
      
      isAudioContextInitialized = true;
      console.log('Web Audio API инициализирован');
      
      startVisualization();
      
    } catch (error) {
      console.error('Ошибка инициализации Web Audio API:', error);
      startFallbackVisualization();
    }
  }
  
  /**
   * Детектор музыкального бита
   */
  function detectBeat(currentAmplitude, lastAmplitudes) {
    if (lastAmplitudes.length < 8) return 0;
    
    let sum = 0;
    for (let i = 0; i < lastAmplitudes.length; i++) {
      sum += lastAmplitudes[i];
    }
    const average = sum / lastAmplitudes.length;
    const threshold = average * 1.1;
    
    if (currentAmplitude > threshold && currentAmplitude > 0.08) {
      let beatStrength = Math.min(0.8, (currentAmplitude - average) / average);
      return Math.max(0.2, beatStrength);
    }
    
    return 0;
  }
  
  /**
   * Обновление движения бабочки и пульсации
   */
  function startVisualization() {
    if (!analyserNode) {
      console.warn('Анализатор не инициализирован');
      return;
    }
    
    console.log('Запуск визуализации...');
    
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    let lastAmplitudes = [];
    
    function updateAnimation() {
      if (!isPlaying || !analyserNode) {
        // Плавное затухание
        decayPulse = decayPulse * 0.95;
        if (decayPulse < 0.01) decayPulse = 0;
        
        // Бабочка возвращается в исходное положение
        butterflyTargetY = butterflyTargetY * 0.9;
        butterflyYOffset = butterflyYOffset * 0.9;
        
        applyEffects(decayPulse, butterflyYOffset);
        animationFrameId = requestAnimationFrame(updateAnimation);
        return;
      }
      
      // Получаем данные частот
      analyserNode.getByteFrequencyData(dataArray);
      
      // Вычисляем среднюю амплитуду
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      let avgAmplitude = sum / dataArray.length;
      
      // Нормализуем
      let normalized = Math.min(1, Math.max(0, (avgAmplitude - 5) / 180));
      
      // Сохраняем историю
      lastAmplitudes.push(normalized);
      if (lastAmplitudes.length > 12) {
        lastAmplitudes.shift();
      }
      
      // Детектируем бит
      const beatStrength = detectBeat(normalized, lastAmplitudes);
      
      // Пульсация кнопки
      if (beatStrength > 0) {
        decayPulse = Math.max(0.3, beatStrength * 1.2);
        // Бабочка прыгает вверх в такт музыке
        butterflyTargetY = 8 + beatStrength * 6;
      } else {
        decayPulse = decayPulse * 0.92;
        butterflyTargetY = butterflyTargetY * 0.85;
      }
      
      // Плавное движение бабочки
      butterflyYOffset = butterflyYOffset * 0.7 + butterflyTargetY * 0.3;
      
      // Небольшое вращение и масштаб в такт
      const rotation = beatStrength > 0 ? beatStrength * 5 : 0;
      const scale = beatStrength > 0 ? 1 + beatStrength * 0.08 : 1;
      
      // Применяем эффекты
      applyEffects(decayPulse, butterflyYOffset, rotation, scale);
      
      animationFrameId = requestAnimationFrame(updateAnimation);
    }
    
    updateAnimation();
  }
  
  /**
   * Применение всех эффектов
   */
  function applyEffects(pulse, yOffset, rotation = 0, scale = 1) {
    if (!toggleBtn) return;
    
    // Движение бабочки вверх-вниз
    if (butterfly) {
      // Отрицательный Y = вверх, положительный = вниз
      const finalY = -yOffset;
      const finalRot = rotation * Math.sin(Date.now() / 100);
      butterfly.style.transform = `translateY(${finalY}px) scale(${scale}) rotate(${finalRot}deg)`;
    }
    
    // Пульсация кнопки
    if (pulse > 0.02) {
      const btnScale = 1 + pulse * 0.07;
      toggleBtn.style.transform = `scale(${btnScale})`;
      
      const glowIntensity = 8 + pulse * 35;
      toggleBtn.style.boxShadow = `0 0 ${glowIntensity}px rgba(203, 6, 9, 0.8), 0 0 ${glowIntensity * 0.6}px rgba(255, 215, 0, 0.4)`;
      
      // Пульсирующие круги
      if (pulse > 0.08) {
        toggleBtn.classList.add('pulsing');
        setTimeout(() => {
          if (toggleBtn) toggleBtn.classList.remove('pulsing');
        }, 200);
      }
    } else {
      toggleBtn.style.transform = 'scale(1)';
      toggleBtn.style.boxShadow = '0 4px 15px rgba(203, 6, 9, 0.4)';
    }
  }
  
  /**
   * Fallback визуализация (без Web Audio API)
   */
  function startFallbackVisualization() {
    console.log('Запуск fallback визуализации...');
    let phase = 0;
    let lastBeat = false;
    let targetY = 0;
    let currentY = 0;
    
    function fallbackUpdate() {
      if (!isPlaying) {
        decayPulse = decayPulse * 0.95;
        if (decayPulse < 0.01) decayPulse = 0;
        currentY = currentY * 0.9;
        
        if (butterfly) {
          butterfly.style.transform = `translateY(${-currentY}px) scale(1) rotate(0deg)`;
        }
        applyEffects(decayPulse, currentY);
        animationFrameId = requestAnimationFrame(fallbackUpdate);
        return;
      }
      
      // Имитация бита
      phase += 0.022;
      const sinVal = Math.sin(phase);
      const isBeat = sinVal > 0.8 && !lastBeat;
      lastBeat = sinVal > 0.8;
      
      if (isBeat) {
        decayPulse = 0.6;
        targetY = 10; // Бабочка прыгает вверх
        if (toggleBtn) {
          toggleBtn.classList.add('pulsing');
          setTimeout(() => {
            if (toggleBtn) toggleBtn.classList.remove('pulsing');
          }, 200);
        }
      } else {
        decayPulse = decayPulse * 0.92;
        targetY = targetY * 0.85;
      }
      
      // Плавное движение бабочки
      currentY = currentY * 0.6 + targetY * 0.4;
      
      if (butterfly) {
        const rotation = isBeat ? 3 : 0;
        const scale = isBeat ? 1.05 : 1;
        butterfly.style.transform = `translateY(${-currentY}px) scale(${scale}) rotate(${rotation}deg)`;
      }
      
      applyEffects(decayPulse, currentY);
      animationFrameId = requestAnimationFrame(fallbackUpdate);
    }
    
    fallbackUpdate();
  }
  
  /**
   * Воспроизведение музыки
   */
  async function playMusic() {
    console.log('playMusic вызван');
    if (!audio) {
      console.error('Аудио элемент не найден');
      return;
    }
    
    try {
      if (!isAudioContextInitialized) {
        await initAudioContext();
      }
      
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      await audio.play();
      isPlaying = true;
      if (toggleBtn) toggleBtn.classList.add('playing');
      console.log('Музыка играет, бабочка танцует в такт!');
      
    } catch (error) {
      console.error('Ошибка воспроизведения:', error);
      audio.play().catch(e => console.error('Не удалось воспроизвести:', e));
      isPlaying = true;
      if (toggleBtn) toggleBtn.classList.add('playing');
      if (!isAudioContextInitialized) {
        startFallbackVisualization();
      }
    }
  }
  
  /**
   * Пауза музыки
   */
  function pauseMusic() {
    console.log('pauseMusic вызван');
    if (!audio) return;
    
    audio.pause();
    isPlaying = false;
    if (toggleBtn) toggleBtn.classList.remove('playing');
    
    if (toggleBtn) {
      toggleBtn.style.transform = '';
      toggleBtn.style.boxShadow = '';
      toggleBtn.classList.remove('pulsing');
    }
    
    if (butterfly) {
      butterfly.style.transform = 'translateY(0px) scale(1) rotate(0deg)';
    }
    
    if (audioContext && audioContext.state === 'running') {
      audioContext.suspend();
    }
  }
  
  /**
   * Переключение воспроизведения
   */
  async function toggleMusic() {
    console.log('toggleMusic вызван, isPlaying:', isPlaying);
    if (isPlaying) {
      pauseMusic();
    } else {
      await playMusic();
    }
  }
  
  /**
   * Обработчик клика
   */
  function onToggleClick(e) {
    console.log('Клик по кнопке!');
    e.preventDefault();
    toggleMusic();
  }
  
  /**
   * Инициализация
   */
  function init() {
    console.log('init вызван');
    updateDOMElements();
    
    if (!toggleBtn) {
      console.log('Кнопка не найдена, повторяем попытку через 500ms...');
      setTimeout(() => {
        updateDOMElements();
        if (toggleBtn) {
          console.log('Кнопка найдена со второй попытки!');
          setupEventListeners();
        } else {
          console.error('Кнопка так и не найдена! Проверьте id="musicToggleBtn"');
        }
      }, 500);
      return;
    }
    
    setupEventListeners();
  }
  
  function setupEventListeners() {
    console.log('setupEventListeners вызван');
    
    if (!audio) {
      audio = document.getElementById('bgMusic');
      console.log('audio после поиска:', !!audio);
    }
    
    if (audio) {
      audio.loop = true;
      audio.volume = 0.7;
      audio.load();
    } else {
      console.warn('Аудио элемент не найден, проверьте id="bgMusic"');
    }
    
    toggleBtn.addEventListener('click', onToggleClick);
    console.log('Обработчик клика добавлен');
    
    // Инициализируем AudioContext при первом клике
    const enableAutoplay = () => {
      console.log('Пользователь взаимодействовал со страницей');
      document.removeEventListener('click', enableAutoplay);
      document.removeEventListener('touchstart', enableAutoplay);
      if (!isAudioContextInitialized && audio) {
        initAudioContext().catch(console.warn);
      }
    };
    
    document.addEventListener('click', enableAutoplay);
    document.addEventListener('touchstart', enableAutoplay);
    
    console.log('Музыкальный визуализатор инициализирован');
  }
  
  // Запуск после полной загрузки DOM
  if (document.readyState === 'loading') {
    console.log('DOM еще загружается, ждем DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log('DOM уже загружен, запускаем init');
    init();
  }
})();