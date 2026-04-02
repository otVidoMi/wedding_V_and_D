// form.js
(function () {
    const form = document.getElementById('weddingForm');
    const submitBtn = document.getElementById('submitBtn');
    const noAlcoholCheck = document.querySelector('.form__checkbox input[value="no_alcohol"]');
    const drinkCheckboxes = document.querySelectorAll('.form__checkbox input[value="champagne"], .form__checkbox input[value="white_wine"], .form__checkbox input[value="red_wine"], .form__checkbox input[value="liqueur"], .form__checkbox input[value="vodka"]');

    // Логика взаимного исключения алкоголь/не пью
    if (noAlcoholCheck) {
        noAlcoholCheck.addEventListener('change', function () {
            if (this.checked) drinkCheckboxes.forEach(cb => cb.checked = false);
        });
    }
    drinkCheckboxes.forEach(cb => {
        cb.addEventListener('change', function () {
            if (this.checked && noAlcoholCheck?.checked) noAlcoholCheck.checked = false;
        });
    });

    // Функция показа сообщения
    function showMessage(msg, isError = false) {
        const div = document.createElement('div');
        div.textContent = msg;
        div.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${isError ? '#f44336' : '#4caf50'};
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        font-family: inherit;
        z-index: 10000;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
        document.body.appendChild(div);
        setTimeout(() => { div.remove(); }, 5000);
    }

    // Обработчик отправки формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Валидация
        const attendance = document.querySelector('input[name="attendance"]:checked');
        if (!attendance) {
            return showMessage('Пожалуйста, укажите, планируете ли вы присутствовать.', true);
        }

        const guestName = document.querySelector('input[name="guest_name"]')?.value.trim();
        if (!guestName) {
            return showMessage('Пожалуйста, введите ваше имя и фамилию.', true);
        }

        // Собираем данные
        const drinks = [...document.querySelectorAll('input[name="drinks"]:checked')].map(cb => cb.value);
        const allergies = document.querySelector('textarea[name="allergies"]')?.value.trim() || 'Не указано';

        // Формируем данные для отправки (в формате, который понимает Google Apps Script)
        const formData = new URLSearchParams();
        formData.append('guest_name', guestName);
        formData.append('attendance', attendance.value);
        formData.append('allergies', allergies);
        formData.append('drinks', drinks.join(', ') || 'Не выбрано');
        formData.append('timestamp', new Date().toLocaleString('ru-RU'));

        // Сохраняем исходный текст кнопки
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;

        try {
            // ВАЖНО: Замените этот URL на актуальный URL вашего Google Apps Script
            const scriptURL = 'https://script.google.com/macros/s/AKfycbxMKuqZmpn1bDfpboQIIQNEVnXG7IVGxVTkjVhnRN5hjMAR4y2qzuAsSIVNW4HZQ9Kr/exec';

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.text();
                console.log('Ответ сервера:', result);
                showMessage(`Спасибо, ${guestName}! Ваш ответ сохранён.`);
                form.reset();

                // Дополнительно очищаем чекбоксы
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Ошибка отправки:', error);
            showMessage('Произошла ошибка. Пожалуйста, попробуйте позже или свяжитесь с организатором.', true);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
})();