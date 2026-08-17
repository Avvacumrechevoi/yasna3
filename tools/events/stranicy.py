# -*- coding: utf-8 -*-
"""content/events.json → страница афиши и блок на главной.

Вторая половина конвейера. Первая (tools/events/sobrat.py) превращает таблицу
руководителей в json, эта — json в HTML.

Почему генерация, а не рисование скриптом в браузере: на этом сайте уже
обжигались — сборка содержимого скриптом скрыла от поисковых роботов треть
главной. Событие, которого робот не увидел, не приносит бесплатного перехода,
ради которого афиша и заводится. Поэтому всё уезжает в готовый HTML.

Блок на главной вставляется между метками АФИША:НАЧАЛО и АФИША:КОНЕЦ —
чтобы генератор не трогал ничего, что написано руками.

    python3 tools/events/stranicy.py [--segodnya 17.08.2026]
"""
import argparse
import html
import json
import re
from datetime import date, datetime
from pathlib import Path

KOREN = Path(__file__).resolve().parents[2]
DANNYE = KOREN / "content" / "events.json"
AFISHA = KOREN / "sobytiya" / "index.html"
GLAVNAYA = KOREN / "index.html"
SITEMAP = KOREN / "sitemap.xml"

MES_R = ["января", "февраля", "марта", "апреля", "мая", "июня",
         "июля", "августа", "сентября", "октября", "ноября", "декабря"]
MES_I = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
         "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
MES_K = ["янв", "фев", "мар", "апр", "мая", "июн",
         "июл", "авг", "сен", "окт", "ноя", "дек"]
DNI = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]

NA_SAYT = {"опубликовано", "мест нет", "отменено"}


def e(s):
    return html.escape(str(s or ""), quote=True)


def d(s):
    return datetime.strptime(s, "%Y-%m-%d").date()


def metki(ev):
    """Короткие подписи под названием: тип, город, время, цена.
    Пустые поля молча пропускаем — прочерк в афише читается как неряшливость."""
    out = [ev["tip"]]
    if ev.get("gorod"):
        out.append(ev["gorod"])
    elif ev["tip"] == "онлайн-встреча":
        out.append("онлайн")
    if ev.get("vremya"):
        out.append(ev["vremya"])
    if ev.get("stoimost"):
        out.append(ev["stoimost"])
    return out


def opisanie_stroki(ev, kontakt):
    """Строка под названием. Если места и времени нет — говорим об этом прямо
    и даём телефон. Молчание читатель истолкует как «непонятно, наверное не для
    меня», а прямая фраза превращает пробел в понятное действие."""
    chasti = []
    if ev.get("opisanie"):
        chasti.append(e(ev["opisanie"]))
    if ev.get("tochka"):
        chasti.append("Сбор: " + e(ev["tochka"]) + ".")
    elif ev["tip"] != "онлайн-встреча":
        chasti.append("Время и место уточняйте по телефону.")
    else:
        chasti.append("Ссылку на встречу высылаем записавшимся.")
    return " ".join(chasti)


def stroka(ev, kontakt, proshlo=False):
    dt = d(ev["data"])
    konec = d(ev["data_konca"]) if ev.get("data_konca") else None
    if konec:
        den = f'{dt.day}<span class="tire">–</span>{konec.day}'
        mes = f"{MES_K[dt.month - 1]}–{MES_K[konec.month - 1]}" if konec.month != dt.month else MES_K[dt.month - 1]
    else:
        den = str(dt.day)
        mes = f"{MES_K[dt.month - 1]} · {DNI[dt.weekday()]}"

    if ev.get("stranica"):
        dey = f'<a class="btn btn-primary" href="{e(ev["stranica"])}">Подробнее <span class="arr">→</span></a>'
    elif ev["sostoyanie"] == "отменено":
        dey = '<span class="ept">отменено</span>'
    elif ev["sostoyanie"] == "мест нет":
        dey = '<span class="ept">мест нет</span>'
    elif proshlo:
        dey = '<span class="ept">прошло</span>'
    else:
        dey = (f'<a class="btn btn-ghost" href="tel:{e(kontakt["tel_href"])}">'
               f'Записаться</a>')

    tegi = "".join(f'<span class="tag">{e(m)}</span>' for m in metki(ev))
    return f"""        <div class="ev{' past' if proshlo else ''}">
          <div class="date"><span class="d">{den}</span><span class="m">{mes}</span></div>
          <div class="body">
            <h4>{e(ev["nazvanie"])}</h4>
            <p>{opisanie_stroki(ev, kontakt)}</p>
            <div class="tags">{tegi}</div>
          </div>
          <div class="act">{dey}</div>
        </div>
"""


def po_mesyacam(sobytiya):
    grupp = []
    for ev in sobytiya:
        dt = d(ev["data"])
        klyuch = (dt.year, dt.month)
        if not grupp or grupp[-1][0] != klyuch:
            grupp.append((klyuch, []))
        grupp[-1][1].append(ev)
    return grupp


def razmetka(sobytiya, kontakt):
    """Разметка событий для поисковика: из неё Яндекс собирает карточку
    с датой прямо в выдаче."""
    spisok = []
    for ev in sobytiya:
        o = {
            "@context": "https://schema.org", "@type": "Event",
            "name": ev["nazvanie"],
            "startDate": ev["data"] + (f'T{ev["vremya"]}:00+03:00' if ev.get("vremya") else ""),
            "eventStatus": "https://schema.org/EventCancelled" if ev["sostoyanie"] == "отменено"
                           else "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode"
                                   if ev["tip"] == "онлайн-встреча"
                                   else "https://schema.org/OfflineEventAttendanceMode",
            "organizer": {"@type": "Organization", "name": "Золотой Ясень",
                          "url": "https://zolotoj-yasen.ru/"},
        }
        if ev.get("data_konca"):
            o["endDate"] = ev["data_konca"]
        if ev.get("opisanie"):
            o["description"] = ev["opisanie"]
        if ev["tip"] == "онлайн-встреча":
            o["location"] = {"@type": "VirtualLocation", "url": "https://zolotoj-yasen.ru/sobytiya/"}
        elif ev.get("gorod"):
            mesto = {"@type": "Place", "name": ev.get("tochka") or ev["gorod"],
                     "address": {"@type": "PostalAddress", "addressLocality": ev["gorod"],
                                 "addressCountry": "RU"}}
            o["location"] = mesto
        if ev.get("stranica"):
            o["url"] = "https://zolotoj-yasen.ru" + ev["stranica"]
        spisok.append(o)
    return spisok


# Метрика, подвал и полоса cookie взяты один в один со страницы сбора:
# счётчик и цели должны работать одинаково на всех страницах, а подвал
# с политикой обязан быть доступен с любой.
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from chasti import METRIKA, FOOTER, COOKIE   # noqa: E402

NAV = """<header class="nav">
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
      <a href="/">Главная</a>
      <a href="/bolshoy-list/">26 сентября</a>
      <a href="/#directions">Управления</a>
      <a class="nav-cta" href="tel:{tel}">Позвонить</a>
    </nav>
  </div>
</header>"""

STILI = """<style>
  /* Компонент .ev лежит в styles.css с самого начала и до сих пор не был
     использован ни на одной странице — афиша первая, кому он понадобился.
     Здесь только то, чего в нём не хватает. */
  .ev .act { display: flex; align-items: center; }
  .ev .date .d .tire { font-weight: 400; opacity: .5; padding: 0 1px; }
  /* На телефоне три колонки не помещаются: кнопка уезжала за край,
     а название ломалось по слогам. Дата остаётся слева, кнопка встаёт
     под текст. */
  @media (max-width: 620px) {
    .ev { grid-template-columns: 66px 1fr; gap: 12px; padding: 16px 18px; }
    .ev .act { grid-column: 2; margin-top: 10px; }
    .ev .date .d { font-size: 1.35rem; }
    /* «авг · сб» в 54px разрывалось на две строки. Колонке дано 66px,
       разрядка убавлена, перенос запрещён явно. */
    .ev .date .m { letter-spacing: .1em; white-space: nowrap; }
  }
  .month-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
  /* Телефон — единственный способ записаться на большинство событий,
     поэтому он крупный и повторяется вверху и внизу. */
  .zvonok { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; }
  .zvonok .num { font-family: var(--font-display); font-weight: 700;
    font-size: clamp(1.3rem, 1.1rem + 1vw, 1.8rem); letter-spacing: -.02em;
    white-space: nowrap; }
  .zvonok .kto { color: var(--ink-2); font-size: .95rem; }
  .afisha-note { color: var(--ink-2); font-size: .92rem; margin: 14px 0 0; }
</style>"""

STRANICA = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
{metrika}
<title>События «Золотого Ясеня» — занятия, прогулки и встречи</title>
<meta name="description" content="Афиша: {kratko}. Занятия, лесные уроки, онлайн-встречи и праздники. Запись и уточнения по телефону {tel}."/>
<link rel="icon" href="/favicon.ico" sizes="any"/>
<link rel="icon" type="image/jpeg" href="/1/src/img/yasna-mark.jpg"/>
<link rel="stylesheet" href="/src/fonts.css"/>
<link rel="canonical" href="https://zolotoj-yasen.ru/sobytiya/"/>
<meta property="og:type" content="website"/>
<meta property="og:locale" content="ru_RU"/>
<meta property="og:site_name" content="Золотой Ясень"/>
<meta property="og:title" content="События Ясны — афиша занятий, прогулок и встреч"/>
<meta property="og:description" content="{kratko}. Запись по телефону {tel}."/>
<meta property="og:url" content="https://zolotoj-yasen.ru/sobytiya/"/>
<meta property="og:image" content="https://zolotoj-yasen.ru/src/img/og-cover.jpg"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="stylesheet" href="/1/src/styles.css"/>
<link rel="stylesheet" href="/1/src/refresh.css"/>
<script type="application/ld+json">{razmetka}</script>
{stili}
</head>
<body data-palette="iney" data-fontpair="modern" data-density="regular" data-screen-label="События">

{nav}

<section class="dir-hero">
  <div class="wrap">
    <div class="hero-lead" style="max-width:760px">
      <h1 class="dir-title">События</h1>
      <div class="dir-kicker">Занятия, лесные уроки, встречи и праздники</div>
      <p class="dir-sub">
        <b>Управления «Золотого Ясеня» ведут занятия круглый год.</b><br/>
        Здесь всё, что запланировано на ближайшие месяцы. Приходить можно впервые.
      </p>
      <div class="zvonok" style="margin-top:22px">
        <a class="btn btn-primary" href="tel:{tel_href}">Позвонить и записаться <span class="arr">→</span></a>
        <span class="kto"><b class="num">{tel}</b><br/>{imya}</span>
      </div>
      <p class="afisha-note">По телефону записывают на любое событие из списка,
      подсказывают время и место сбора и отвечают на вопросы.</p>
    </div>
  </div>
</section>

<section style="padding-top:44px">
  <div class="wrap">
{mesyacy}
  </div>
</section>

<section id="join">
  <div class="wrap">
    <div class="cta-banner">
      <div>
        <div class="eyebrow">Запись и вопросы</div>
        <h2 style="margin-top:14px">Позвоните<br/>{imya_komu}</h2>
        <p style="margin-top:18px">Запишет на любое событие, подскажет время и место сбора,
        ответит на вопросы. Если сомневаетесь, подходит ли вам занятие, — это тоже к ней.</p>
      </div>
      <div class="acts">
        <a class="btn btn-primary" href="tel:{tel_href}">{tel}</a>
        <a class="btn btn-ghost" href="/bolshoy-list/">Про 26 сентября</a>
      </div>
    </div>
  </div>
</section>

{footer}

<script src="/1/src/nav.js" defer></script>
{cookie}
</body>
</html>
"""

DNI_POLN = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"]

# Главная — самодостаточная страница: 43 КБ собственных стилей и ни одного
# внешнего файла, кроме шрифтов. Компонентов .panel и .ev, на которых собрана
# афиша, там нет вовсе — блок, свёрстанный на них, вышел бы голым текстом.
# Поэтому здесь берём .way из «Четырёх путей»: он на главной есть, а его
# крупная бледная цифра в углу как раз просит поставить туда число месяца.
BLOK_GLAVNAYA = """<!-- АФИША:НАЧАЛО — собрано tools/events/stranicy.py, руками не править -->
<section id="sobytiya">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow" data-reveal>Афиша</span>
      <h2 data-reveal>Ближайшие события</h2>
      <p data-reveal>Управления ведут занятия, прогулки и встречи круглый год. Приходить можно впервые.</p>
    </div>
{stili}
    <div class="ways-grid">
{kartochki}    </div>
    <div class="zovem">
      <a class="btn btn-pri" href="tel:{tel_href}">Записаться по телефону <span class="ar">→</span></a>
      <a class="btn btn-sec" href="/sobytiya/">Все события</a>
      <span class="kto"><b>{tel}</b> · {imya}</span>
    </div>
  </div>
</section>
<!-- АФИША:КОНЕЦ -->"""


# Держим отдельно от строки-шаблона: фигурные скобки CSS внутри .format()
# читаются как подстановки и роняют сборку.
BLOK_STILI = """    <style>
      #sobytiya .way .kogda { display: block; margin-bottom: 12px; }
      #sobytiya .way h3 { font-size: 21px; }
      #sobytiya .zovem { display: flex; flex-wrap: wrap; align-items: center;
        gap: 14px 20px; margin-top: 34px; }
      #sobytiya .zovem .kto { color: var(--ink-70); font-size: 15.5px; }
      #sobytiya .zovem .kto b { color: var(--ink); white-space: nowrap; }
    </style>"""


def kartochka(ev, kontakt):
    """Карточка для главной. Компонент .way, число месяца — в бледную цифру."""
    dt = d(ev["data"])
    kogda = f"{dt.day} {MES_R[dt.month - 1]} · {DNI_POLN[dt.weekday()]}"
    if ev.get("vremya"):
        kogda += f" · {ev['vremya']}"
    if ev.get("stranica"):
        deystvie = f'<a href="{e(ev["stranica"])}">Подробнее <span class="ar">→</span></a>'
    else:
        deystvie = (f'<a href="tel:{e(kontakt["tel_href"])}">Записаться '
                    f'<span class="ar">→</span></a>')
    return f"""      <div class="way" data-reveal>
        <span class="ghost">{dt.day}</span>
        <span class="eyebrow kogda">{e(kogda)}</span>
        <h3>{e(ev["nazvanie"])}</h3>
        <p>{opisanie_stroki(ev, kontakt)}</p>
        {deystvie}
      </div>
"""


def sobrat_stranicu(sobytiya, kontakt, segodnya):
    budushchie = [s for s in sobytiya if d(s["data"]) >= segodnya]
    proshedshie = [s for s in sobytiya if d(s["data"]) < segodnya]

    kuski = []
    for (god, mes), gruppa in po_mesyacam(budushchie):
        rows = "".join(stroka(ev, kontakt) for ev in gruppa)
        kuski.append(f"""    <article class="panel" style="margin-bottom:24px">
      <div class="panel-head month-head">
        <h3>{MES_I[mes - 1]} {god}</h3>
        <span class="sub">{len(gruppa)} {'событие' if len(gruppa) == 1 else 'события' if len(gruppa) < 5 else 'событий'}</span>
      </div>
{rows}    </article>""")

    if proshedshie:
        rows = "".join(stroka(ev, kontakt, proshlo=True) for ev in reversed(proshedshie))
        kuski.append(f"""    <article class="panel" style="margin-bottom:24px">
      <div class="panel-head month-head">
        <h3>Уже прошли</h3>
        <span class="sub">Занятия идут постоянно</span>
      </div>
{rows}    </article>""")

    imya = kontakt["imya"]
    kratko = f"{len(budushchie)} событий впереди" if budushchie else "занятия, прогулки и встречи"
    return STRANICA.format(
        metrika=METRIKA, nav=NAV.format(tel=kontakt["tel_href"]), stili=STILI,
        footer=FOOTER, cookie=COOKIE,
        razmetka=json.dumps(razmetka(budushchie, kontakt), ensure_ascii=False),
        mesyacy="\n".join(kuski), kratko=kratko,
        tel=kontakt["telefon"], tel_href=kontakt["tel_href"],
        imya=imya, imya_komu=kontakt["imya_komu"],
    )


def vstavit_v_glavnuyu(sobytiya, kontakt, segodnya, skolko=4):
    budushchie = [s for s in sobytiya if d(s["data"]) >= segodnya][:skolko]
    blok = BLOK_GLAVNAYA.format(
        stili=BLOK_STILI,
        kartochki="".join(kartochka(ev, kontakt) for ev in budushchie),
        tel=kontakt["telefon"], tel_href=kontakt["tel_href"], imya=kontakt["imya"])
    s = GLAVNAYA.read_text(encoding="utf-8")
    novyy, n = re.subn(r"<!-- АФИША:НАЧАЛО.*?<!-- АФИША:КОНЕЦ -->", lambda _: blok, s, flags=re.S)
    if not n:
        raise SystemExit("на главной нет меток АФИША:НАЧАЛО/АФИША:КОНЕЦ — вставлять некуда")
    GLAVNAYA.write_text(novyy, encoding="utf-8")
    return len(budushchie)


def v_sitemap(segodnya):
    s = SITEMAP.read_text(encoding="utf-8")
    if "/sobytiya/" in s:
        return False
    zapis = (f"<url><loc>https://zolotoj-yasen.ru/sobytiya/</loc>"
             f"<lastmod>{segodnya.isoformat()}</lastmod>"
             f"<changefreq>weekly</changefreq><priority>0.9</priority></url>")
    SITEMAP.write_text(s.replace("</urlset>", zapis + "\n</urlset>"), encoding="utf-8")
    return True


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--segodnya")
    a = p.parse_args()
    segodnya = datetime.strptime(a.segodnya, "%d.%m.%Y").date() if a.segodnya else date.today()

    dannye = json.loads(DANNYE.read_text(encoding="utf-8"))
    kontakt = dannye["kontakt"]
    sobytiya = sorted((s for s in dannye["sobytiya"] if s["sostoyanie"] in NA_SAYT),
                      key=lambda s: (s["data"], s.get("vremya") or "99:99"))

    AFISHA.parent.mkdir(exist_ok=True)
    AFISHA.write_text(sobrat_stranicu(sobytiya, kontakt, segodnya), encoding="utf-8")
    n_glav = vstavit_v_glavnuyu(sobytiya, kontakt, segodnya)
    dobavleno = v_sitemap(segodnya)

    vperedi = [s for s in sobytiya if d(s["data"]) >= segodnya]
    print(f"событий всего: {len(sobytiya)}   впереди: {len(vperedi)}   прошло: {len(sobytiya) - len(vperedi)}")
    print(f"собрано: /sobytiya/ и блок на главной ({n_glav} строки)")
    print(f"карта сайта: {'добавлен адрес' if dobavleno else 'адрес уже был'}")
    nepolnye = [s["nazvanie"] for s in vperedi if not s.get("vremya")]
    if nepolnye:
        print(f"\nбез времени ({len(nepolnye)}): показаны с пометкой «уточняйте по телефону»")
        for n in nepolnye:
            print("  •", n)


if __name__ == "__main__":
    main()
