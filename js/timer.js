// timer.js
(function () {
  const daysNum = document.getElementById('daysNum');
  const hoursNum = document.getElementById('hoursNum');
  const minutesNum = document.getElementById('minutesNum');
  const secondsNum = document.getElementById('secondsNum');

  if (!daysNum) return;

  const weddingDate = new Date('2026-08-01T14:30:00+07:00');

  function updateTimer() {
    const diff = weddingDate - new Date();
    if (diff <= 0) {
      daysNum.textContent = '000';
      hoursNum.textContent = '00';
      minutesNum.textContent = '00';
      secondsNum.textContent = '00';
      return;
    }
    daysNum.textContent = Math.floor(diff / 86400000).toString().padStart(3, '0');
    hoursNum.textContent = Math.floor((diff % 86400000) / 3600000).toString().padStart(2, '0');
    minutesNum.textContent = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    secondsNum.textContent = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
})();