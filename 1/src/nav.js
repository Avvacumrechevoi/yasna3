/* Раскрывающиеся разделы шапки на телефоне.

   Само раскрытие делает <details> — без скриптов. Этот файл добавляет
   только вежливость: закрыть список после перехода по ссылке, при касании
   мимо шапки и по клавише Esc. Без него шапка остаётся рабочей. */
(function () {
  var menu = document.querySelector('.nav-menu');
  if (!menu) return;
  var nav = menu.closest('.nav');
  if (!nav) return;

  nav.addEventListener('click', function (e) {
    if (menu.open && e.target.closest('.nav-links a')) menu.open = false;
  });
  document.addEventListener('click', function (e) {
    if (menu.open && !nav.contains(e.target)) menu.open = false;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      var b = nav.querySelector('.nav-burger');
      if (b) b.focus();
    }
  });
})();
