# -*- coding: utf-8 -*-
"""Проверка доступности zolotoj-yasen.ru — снаружи и именно из России.

Зачем отдельная проверка из России: 17.08.2026 сайт лежал для московских
сетей почти сутки, и узнали об этом случайно, от клиента. Обычные сервисы
наблюдения ходят из Европы — в тот день у них всё было зелёное. Поэтому
здесь два независимых замера, и решающий — российский.

Порог подобран по наблюдениям: в норме отвечают 36–39 узлов из 40, отдельные
таймауты — обычное дело. Поэтому тревога поднимается, только когда молчит
ВСЯ Россия или больше половины узлов мира: иначе письма превратятся в шум
и их перестанут читать.

Ненулевой код возврата роняет сборку, а GitHub шлёт письмо владельцу
репозитория. Никаких ключей и внешних служб для уведомления не нужно.
"""
import json
import socket
import ssl
import sys
import time
import urllib.request
from datetime import datetime, timezone

САЙТ = "https://zolotoj-yasen.ru/"
ХОСТ = "zolotoj-yasen.ru"
CHECK = "https://check-host.net"
ДНЕЙ_ДО_ТРЕВОГИ = 14

беды = []
заметки = []


def сказать(s):
    print(s, flush=True)


# ── 1. прямая проверка: жив ли сайт вообще ───────────────────────────
def прямая():
    try:
        r = urllib.request.Request(САЙТ, headers={"User-Agent": "yasna-monitor/1.0"})
        t0 = time.time()
        with urllib.request.urlopen(r, timeout=25) as resp:
            тело = resp.read(4000).decode("utf-8", "replace")
            мс = int((time.time() - t0) * 1000)
            if resp.status != 200:
                беды.append(f"главная отвечает кодом {resp.status}")
            elif "Золотой Ясень" not in тело:
                беды.append("главная отвечает 200, но без ожидаемого содержимого")
            else:
                сказать(f"  прямая проверка      200, {мс} мс")
    except Exception as e:
        беды.append(f"главная не открылась: {type(e).__name__}: {e}")


# ── 2. проверка из России — та, ради которой всё затевалось ──────────
def из_россии():
    """Три попытки, и если ни одна не удалась — это тревога, а не пустяк.

    Монитор существует ради одного: заметить, что сайт не открывается
    из России. Если этот замер не сделан, монитор слеп — а слепой монитор
    хуже отсутствующего, потому что показывает зелёное и усыпляет.
    Разовые сбои службы проверки гасятся повторами, устойчивые становятся
    видны."""
    for попытка in range(1, 4):
        if _замер(попытка):
            return
        if попытка < 3:
            time.sleep(10)
    беды.append("не удалось замерить доступность из России — наблюдение слепо")


def _замер(попытка):
    try:
        req = urllib.request.Request(
            f"{CHECK}/check-http?host={САЙТ.replace(':', '%3A').replace('/', '%2F')}&max_nodes=30",
            headers={"Accept": "application/json", "User-Agent": "yasna-monitor/1.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            rid = json.load(resp).get("request_id")
        if not rid:
            return False
        time.sleep(30)
        # User-Agent обязателен и здесь: без него служба отвечает 403,
        # и замер из России молча пропускается — то есть тревога не сработает.
        req = urllib.request.Request(f"{CHECK}/check-result/{rid}",
                                     headers={"Accept": "application/json",
                                              "User-Agent": "yasna-monitor/1.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            d = json.load(resp)
    except Exception as e:
        заметки.append(f"попытка {попытка}: служба проверки недоступна ({type(e).__name__})")
        return False

    всего_ок = всего = 0
    ру_ок = ру_всего = 0
    ру_детали = []
    for узел, res in sorted(d.items()):
        if res is None:
            continue
        try:
            хорошо = bool(res[0] and res[0][0] == 1)
        except Exception:
            хорошо = False
        всего += 1
        всего_ок += хорошо
        if узел.startswith("ru"):
            ру_всего += 1
            ру_ок += хорошо
            ру_детали.append(f"{узел.split('.')[0]}={'ОК' if хорошо else 'нет'}")

    if всего == 0:
        заметки.append(f"попытка {попытка}: служба проверки не вернула результатов")
        return False
    сказать(f"  узлов мира           {всего_ок} из {всего}")
    сказать(f"  узлов России         {ру_ок} из {ру_всего}  ({', '.join(ру_детали) or '—'})")

    if ру_всего and ру_ок == 0:
        беды.append(f"САЙТ НЕ ОТКРЫВАЕТСЯ ИЗ РОССИИ: молчат все {ру_всего} узла")
    elif всего and всего_ок * 2 < всего:
        беды.append(f"сайт недоступен с большинства узлов: открылся лишь {всего_ок} из {всего}")
    elif ру_всего and ру_ок < ру_всего:
        заметки.append(f"часть российских узлов молчит ({ру_ок} из {ру_всего}) — само по себе бывает")
    return True


# ── 3. срок сертификата ──────────────────────────────────────────────
def сертификат():
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((ХОСТ, 443), timeout=20) as s:
            with ctx.wrap_socket(s, server_hostname=ХОСТ) as ss:
                до = ss.getpeercert()["notAfter"]
        истекает = datetime.strptime(до, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        осталось = (истекает - datetime.now(timezone.utc)).days
        сказать(f"  сертификат           ещё {осталось} дн. (до {истекает:%d.%m.%Y})")
        if осталось < ДНЕЙ_ДО_ТРЕВОГИ:
            беды.append(f"сертификат истекает через {осталось} дн. — продление не сработало")
    except Exception as e:
        беды.append(f"сертификат не проверился: {type(e).__name__}: {e}")


сказать(f"Проверка {ХОСТ} — {datetime.now(timezone.utc):%d.%m.%Y %H:%M} UTC")
прямая()
из_россии()
сертификат()

if заметки:
    сказать("\nЗамечания:")
    for z in заметки:
        сказать(f"  · {z}")

if беды:
    сказать("\n" + "=" * 60)
    for b in беды:
        сказать(f"  ТРЕВОГА: {b}")
    сказать("=" * 60)
    sys.exit(1)

сказать("\nвсё в порядке")
