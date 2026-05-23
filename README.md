# Русская Ясна

Открытое сообщество исследователей русского языка, истории и культуры.

**Демо:** https://avvacumrechevoi.github.io/yasna3/

## Структура

```
.
├── index.html              ← редирект на 1/index.html (для GitHub Pages)
├── .nojekyll               ← отключить Jekyll-обработку
├── 1/                      ← актуальная версия сайта
│   ├── index.html          ← главная
│   ├── pages/neglinka.html ← страница направления «Неглинка»
│   ├── src/                ← стили + JSX-компоненты
│   └── scraps/, uploads/   ← растровые материалы
└── yasna3 design/          ← старая версия (архив)
```

## Локальный запуск

Откройте `1/index.html` через любой статический сервер — `file://`
не подходит, потому что `image-slot.js` использует `fetch`.

```bash
cd 1 && python3 -m http.server 8000
# затем http://localhost:8000
```

## Что починено в этом аудите

- Удалены недействительные SRI-хеши на React/ReactDOM/Babel — из-за них
  браузер блокировал все интерактивные React-компоненты (созвездие Лебедя,
  Quiz, диаграмма «Четыре опоры»).
- Перешли с `*.development.js` на `*.production.min.js` для React.
- `pages/neglinka.html` подтянут к новой типографике (Spectral + IBM Plex)
  и подключает `refresh.css`.
- Битые якоря `#manifest`, `#graph` в nav заменены на реальные `#event`,
  `#method`, `#directions`.
- В корень добавлен `index.html` с редиректом и `.nojekyll` —
  чтобы GitHub Pages корректно отдал сайт.
