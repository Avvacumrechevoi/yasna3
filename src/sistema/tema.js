/* ТЕМА САЙТА · светлая / тёмная / по телефону
   ═══════════════════════════════════════════════════════════════════════
   Тот же уклад, что на платформе (docs/core/theme.js): выбор человека
   живёт в localStorage и ставится атрибутом на <html>, а без выбора
   страница слушает настройку телефона. Свой файл, а не копия платформенного:
   тому нужно зеркалить ключи старых продуктов (конструктор, игра), сайту —
   нет, и тащить сюда чужие обязанности незачем.

   ВАЖНО: раннюю часть (применение темы) страницы зовут ПЕРВОЙ строкой в
   <head>, до таблиц стилей. Иначе человек в тёмной теме увидит вспышку
   белой страницы — самую заметную поломку, какая бывает у тёмных тем.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var КЛЮЧ = 'yasna_tema';          /* light | dark | auto */

  function прочесть() {
    try { return localStorage.getItem(КЛЮЧ) || 'auto'; } catch (_) { return 'auto'; }
  }
  function применить(режим) {
    var э = document.documentElement;
    if (режим === 'auto') э.removeAttribute('data-theme');
    else э.setAttribute('data-theme', режим);
  }

  применить(прочесть());

  /* Кнопку ставим на место с меткой data-tema-mesto; нет метки — нет кнопки,
     и это не беда: тема всё равно идёт за настройкой телефона. */
  document.addEventListener('DOMContentLoaded', function () {
    var места = document.querySelectorAll('[data-tema-mesto]');
    if (!места.length) return;

    var ЛУНА = '<svg class="tema-luna" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      + 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    var СОЛНЦЕ = '<svg class="tema-solnce" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      + 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4'
      + 'M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

    места.forEach(function (место) {
      var к = document.createElement('button');
      к.type = 'button';
      к.className = 'tema-knop';
      к.innerHTML = ЛУНА + СОЛНЦЕ;
      обновитьПодпись(к);
      к.addEventListener('click', function () {
        /* Нажатие всегда даёт ПРОТИВОПОЛОЖНОЕ тому, что человек видит
           сейчас, — включая случай «по телефону»: гадать, чего он хотел,
           не нужно, нужно переключить то, что перед глазами. */
        var сейчасТёмная = document.documentElement.getAttribute('data-theme') === 'dark'
          || (!document.documentElement.hasAttribute('data-theme')
              && window.matchMedia('(prefers-color-scheme: dark)').matches);
        var новый = сейчасТёмная ? 'light' : 'dark';
        try { localStorage.setItem(КЛЮЧ, новый); } catch (_) {}
        применить(новый);
        обновитьПодпись(к);
      });
      место.appendChild(к);
    });

    function обновитьПодпись(к) {
      var тёмная = document.documentElement.getAttribute('data-theme') === 'dark'
        || (!document.documentElement.hasAttribute('data-theme')
            && window.matchMedia('(prefers-color-scheme: dark)').matches);
      к.setAttribute('aria-label', тёмная ? 'Включить светлую тему' : 'Включить тёмную тему');
      к.setAttribute('title', тёмная ? 'Светлая тема' : 'Тёмная тема');
    }
  });
})();
