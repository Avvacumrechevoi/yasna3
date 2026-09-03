#!/usr/bin/env python3
"""Собирает картинки-приглашения на сбор из макетов рядом.

    python3 tools/priglashenie/sobrat.py

Кладёт PNG сюда же. Макеты правятся как обычные HTML: дата, время и текст
лежат прямо в разметке. Шрифты и эмблемы берутся из сайта, поэтому рендер
идёт через локальный сервер — так же, как страницу смотрит браузер.

Почему Chrome, а не библиотека: макет уже написан на тех же шрифтах
и токенах, что сайт. Любой другой рендер пришлось бы учить им заново.
"""
import http.server, pathlib, socketserver, subprocess, sys, threading, functools

KORENЬ = pathlib.Path(__file__).resolve().parents[2]
PORT = 8816
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
MAKETY = [
    ("maket.html",          "priglashenie-vertikal.png", 1080, 1350),
    ("maket-gorizont.html", "priglashenie-gorizont.png", 1200, 630),
]


def podnyat_server():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(KORENЬ))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main():
    if not pathlib.Path(CHROME).exists():
        sys.exit(f"нет Chrome по пути {CHROME} — он нужен для рендера")
    srv = podnyat_server()
    try:
        for maket, imya, shirina, vysota in MAKETY:
            out = pathlib.Path(__file__).parent / imya
            adres = f"http://127.0.0.1:{PORT}/tools/priglashenie/{maket}"
            subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                            "--force-device-scale-factor=1",
                            f"--window-size={shirina},{vysota}",
                            f"--screenshot={out}", adres],
                           check=True, capture_output=True)
            print(f"  {imya}  {shirina}×{vysota}  {out.stat().st_size // 1024} КБ")
    finally:
        srv.shutdown()
    print("готово")


if __name__ == "__main__":
    main()
