METRIKA = r"""<!-- Яндекс.Метрика. Без счётчика реклама идёт вслепую: нет ни целей,
     ни ретаргетинга, ни ответа на вопрос «сколько людей пришло». Стоит
     в самом начале страницы, чтобы засчитать и тех, кто закрыл страницу
     через секунду. Стоит на всех живых страницах, кроме заглушек-
     перенаправлений: там просмотр был бы засчитан и тут же брошен. -->
<script type="text/javascript">
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=111443194', 'ym');
ym(111443194, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});

/* Цели. Один слушатель на весь документ: кнопки на страницах меняются,
   а правила остаются, и не надо помечать каждую ссылку руками.
   Форма живёт на forms.yandex.ru, поэтому саму отправку засчитать
   нельзя — считаем переход к ней. */
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest && e.target.closest('a');
  if (!a || !window.ym) return;
  var h = a.getAttribute('href') || '';
  var goal = h.indexOf('tel:') === 0 ? 'zvonok'
           : h.indexOf('mailto:') === 0 ? 'pochta'
           : h.indexOf('.ics') > -1 ? 'calendar'
           : (h.indexOf('forms.yandex.ru') > -1 || h.indexOf('site.yasna-shkola.ru') > -1) ? 'zapasnaya'
           : h.indexOf('/zayavka/') === 0 ? 'zapis'
           : h.indexOf('/bolshoy-list/') === 0 ? 'sbor' : '';
  if (goal) ym(111443194, 'reachGoal', goal);
}, true);
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/111443194" style="position:absolute; left:-9999px;" alt=""/></div></noscript>
<!-- /Яндекс.Метрика -->"""

NAV = r"""<!-- NAV -->
<header class="nav">
  <div class="wrap nav-row">
    <a class="brand" href="/">
      <img class="mark" src="/1/src/img/yasna-mark.jpg" alt="Золотой Ясень" width="160" height="160"/>
      <span class="brand-text">
        <span class="brand-name">Золотой Ясень</span>
        <span class="brand-sub">Интеграционный центр</span>
      </span>
    </a>
    <details class="nav-menu">
      <summary class="nav-burger"><span class="bars" aria-hidden="true"></span><span class="cap">Разделы</span></summary>
    </details>
    <nav class="nav-links">
      <!-- «Обращение» уводило на главную с посадочной, куда идёт реклама.
           Первым пунктом теперь блок этой же страницы: он отвечает на
           вопрос, ради которого человек и открыл ссылку. -->
      <a href="#zachem">Зачем идти</a>
      <a href="#programma">Программа</a>
      <a href="/#directions">Управления</a>
      <a href="#voprosy">Вопросы</a>
      <a class="nav-cta" href="/zayavka/?goal=day">Записаться</a>
    </nav>
  </div>
</header>"""

FOOTER = r"""<!-- FOOTER -->
<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="brand" style="margin-bottom:14px">
          <img class="mark" src="/1/src/img/yasna-mark.jpg" alt="Золотой Ясень" width="160" height="160"/>
          <span class="brand-text">
            <span class="brand-name">Золотой Ясень</span>
            <span class="brand-sub">Интеграционный центр</span>
          </span>
        </div>
        <p class="dim" style="font-size:.92rem;line-height:1.5;max-width:38ch;margin:0">
          Открытое сообщество исследователей русского языка, истории и культуры.
        </p>
      </div>
      <div>
        <h4>Управления</h4>
        <ul>
          <li><a href="/upravleniya/yasna-shkola/">Ясна-Школа</a></li>
          <li><a href="/upravleniya/vospitanie/">Воспитание и Образование</a></li>
          <li><a href="/upravleniya/alexandria/">Александрия</a></li>
          <li><a href="/upravleniya/neglinka/">Неглинка</a></li>
          <li><a href="/upravleniya/granika/">Граника</a></li>
          <li><a href="/upravleniya/astronevod/">Астроневод</a></li>
          <li><a href="/upravleniya/marshruty/">Ясные маршруты</a></li>
          <li><a href="/#directions">ЛитПроСвет</a></li>
          <li><a href="/upravleniya/izvod/">Извод</a></li>
        </ul>
      </div>
      <div>
        <h4>Ещё</h4>
        <ul>
          <li><a href="/upravleniya/dzhiva/">Джива</a></li>
          <li><a href="/#directions">Парад Красоты</a></li>
          <li><a href="/upravleniya/geraldika/">Гербальдика</a></li>
        </ul>
        <!-- Ссылка на политику должна быть доступна с любой страницы:
             закон требует неограниченного доступа к ней. Согласие рядом,
             чтобы его можно было прочесть до того, как ставишь галочку. -->
        <h4 style="margin-top:22px">Документы</h4>
        <ul>
          <li><a href="/privacy/">Обработка персональных данных</a></li>
          <li><a href="/soglasie/">Согласие на обработку</a></li>
          <li><a href="/russkaya-yasna/">Русская Ясна</a></li>
        </ul>
      </div>
      <div>
        <h4>Контакты</h4>
        <ul>
          <li><a href="tel:+79082939363">+7&nbsp;908&nbsp;293-93-63</a></li>
          <li><a href="tel:+79152595250">+7&nbsp;915&nbsp;259-52-50</a></li>
          <li><a href="/privacy/">Обработка персональных данных</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 Интеграционный центр «Золотой Ясень» · ИП&nbsp;Архипов&nbsp;Сергей&nbsp;Юрьевич, ОГРНИП&nbsp;317774600605551, ИНН&nbsp;771409900020</span>
      <span><a href="/pravila/">Правила публикации</a> · <a href="/">На главную</a></span>
    </div>
  </div>
</footer>"""

COOKIE = r"""<!-- Уведомление о файлах cookie. В России нет прямого требования
     спрашивать разрешение, как в Европе, но информировать надо: Метрика
     ставит свои cookie, а Вебвизор пишет поведение. Полоса не перекрывает
     кнопки и гаснет навсегда после первого «Понятно» — иначе она била бы
     по конверсии рекламы, ради которой всё и делалось. -->
<style>
  .ck-bar{position:fixed;left:0;right:0;bottom:0;z-index:60;display:none;
    background:#211B14;color:#EFE9DE;padding:9px 16px;font-size:.8rem;line-height:1.35;
    box-shadow:0 -6px 24px rgba(0,0,0,.18)}
  .ck-bar.on{display:block}
  .ck-in{max-width:1100px;margin:0 auto;display:flex;gap:14px;align-items:center;
    justify-content:space-between;flex-wrap:wrap}
  .ck-bar a{color:#EFE9DE;text-decoration:underline;text-underline-offset:2px}
  .ck-bar button{flex:none;background:#EFE9DE;color:#211B14;border:0;border-radius:999px;
    padding:11px 20px;min-height:44px;font:inherit;font-weight:600;cursor:pointer}
  .ck-bar button:hover{background:#fff}
  @media (max-width:560px){.ck-in{gap:8px}.ck-bar{padding:8px 12px;font-size:.76rem}
    .ck-bar button{padding:10px 18px}}
</style>
<div class="ck-bar" id="ckBar" role="region" aria-label="Уведомление о файлах cookie">
  <div class="ck-in">
    <span>Сайт использует cookie и&nbsp;Метрику&nbsp;— <a href="/privacy/">подробнее</a>.</span>
    <button type="button" id="ckOk">Понятно</button>
  </div>
</div>
<script>
(function () {
  var K = 'yasna_cookie_notice', bar = document.getElementById('ckBar');
  if (!bar) return;
  var seen;
  try { seen = localStorage.getItem(K); } catch (e) { seen = '1'; }
  if (seen) return;
  bar.classList.add('on');
  document.getElementById('ckOk').addEventListener('click', function () {
    bar.classList.remove('on');
    try { localStorage.setItem(K, '1'); } catch (e) {}
  });
})();
</script>
"""
