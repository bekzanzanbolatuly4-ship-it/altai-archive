# Передача портала к защите

> **Актуальный аудит 11.11.2026:** см. [сценарий демонстрации](DEMO_SCRIPT.md) и [матрицу готовности](READINESS_MATRIX.md). Все восемь публичных страниц вернули HTTP 200; Production `GET /api/documents` вернул 500, три AI-запроса вернули no-match без источников. Первая строка ниже — исторический handoff на 10.11.2026; более поздняя публичная проверка описывает состояние, которое реально доступно сейчас. Версия Vercel и провайдер публично не определяются.

Дата работы: 10.11.2026. Реализация выполнена в существующем проекте с сохранением незакоммиченного состояния из `docs/AI_IMPLEMENTATION_HANDOFF.md`. Коммитов, push, deployment, миграций Supabase и реальных запросов к OpenRouter/Redis не было. `.env.local` и реальные `.data` не открывались и не изменялись.

## Результат по заданию

- **AI и server-side безопасность:** существующий OpenRouter assistant сохранён; добавлен общий Upstash REST limiter с атомарным Lua счётчиком — 5 запросов/минуту на IP и 20/минуту суммарно, плюс прежние process/concurrency лимиты. В production AI закрывается до обращения к модели, если нет Redis credentials, Vercel IP header или доступного Redis. IP в ключе хранилища хэшируется, TTL короткий. Реальный Redis/OpenRouter не тестировался.
- **Read-only demo:** `DEMO_READ_ONLY=true` блокирует API изменения архивных записей, аккаунтов и экспорт/backup; UI админки показывает read-only статус и скрывает controls. Публичные информационные страницы, поиск и AI остаются доступны при корректной серверной настройке AI.
- **Contacts:** импортированы 13 строк из `Адреса и контакты филиалов(1).xls` в отдельные записи с источником, `needsReview: true`, замечаниями и без имён руководителей. На `/branches` доступны поиск по городу/названию, адаптивные карточки, источник, пометка проверки и ссылка маршрута, сформированная из исходного адреса через URL encoding. Координаты, расписание и отсутствующий телефон не добавлялись.
- **Проверка таблицы:** заголовок находится в строке 5, перед ним четыре пустые строки. Объединён только заголовочный диапазон `G1:K1`, вне таблицы; в диапазоне таблицы `A5:F18` объединённых ячеек нет. Формул нет. У шестой записи телефон отсутствует; он сохранён пустым. У одной строки исходный email содержит `qov.kz` и помечен для проверки.
- **Calendar:** извлечены 42 записи RU и 42 KK. Сохранены исходные формулировки и даты, `sourceDocument`, календарный `year`, месяц/день при наличии, язык и заметки. На `/history` есть фильтры по году, месяцу, тематике и языку. EN показывает исходный язык и сообщает, что перевода нет. Документальных ссылок не добавлено, так как связанные реальные опубликованные записи не найдены.
- **Расхождения календаря:** явно отмечены годы жизни Ефима Пермитина (RU 1896–1971, KK 1896–1917), юбилей телефонной станции 1946 года (70/80), школа 1886 года (130/140) и исследование Рудного Алтая 1771 года (245/255). Исходные числа не исправлялись.
- **Compliance archive:** инвентаризированы 13 файлов (8 PDF, 4 DOCX, 1 TXT) с реальными именами, размерами, типами, языком по имени и риском. Бинарники не добавлялись в приложение. Потенциально персональный TXT и внутренние аналитические документы отмечены; публикация файлов и списка метаданных запрещена до редакторской проверки.
- **Vercel:** добавлены checklist, server-only env-переменные в `.env.example`, строгая проверка `APP_ORIGIN` (origin-only, HTTPS в production) и валидация `NEXT_PUBLIC_SITE_URL`. Checklist прямо указывает, что JSON store/uploads не персистентны в serverless Vercel; read-only режим не превращает админку в постоянное хранилище.

Дополнительный файл «Дополнения к ТЗ» в поставке не найден. Раздел 8 основного ТЗ рассмотрен как необязательный; существующие демонстрационные карта/выставки сохранены, неподтверждённые координаты не вводились.

## Файлы этой работы

- `components/calendar-2026.tsx`, `data/calendar-2026.json`, `scripts/extract-calendar.py` — извлечение и интерактивный календарь.
- `data/branches.json`, `data/archive.ts`, `components/institution.tsx` — контакты и поиск филиалов.
- `components/portal.tsx`, `locales/messages.ts`, `app/globals.css` — маршруты, RU/KK/EN и визуальные стили.
- `lib/ai/shared-rate-limit.ts`, `app/api/assistant/route.ts`, `lib/demo-read-only.ts`, admin API и `components/admin-workspace.tsx` — общий лимитер и read-only режим.
- `lib/site-url.ts`, `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `.env.example` — URL конфигурация.
- `docs/COMPLIANCE_CONTENT_REVIEW.md`, `docs/VERCEL_DEPLOY_CHECKLIST.md`, `docs/AI_INTEGRATION.md`, `README.md` — контентный и hosting handoff.
- `tests/content-data.test.mjs`, `tests/request-security.test.mjs`, `tests/e2e/assistant.mjs` — проверки данных, origin, limiter, read-only и браузерные сценарии.

Часть перечисленных файлов уже содержала изменения из сохранённого handoff; существующие изменения не сбрасывались. В рабочем дереве остаются и другие незакоммиченные изменения, не относящиеся к этой части задания.

## Проверки

| Проверка | Статус | Результат |
|---|---|---|
| `npm test` | **PASS** | 8 test files, 0 failing files; включены локальные mock проверки Redis, origin, ветвей и календаря |
| `npm run typecheck` | **PASS** | `tsc --noEmit` |
| `npm run lint` | **PASS** | ESLint завершился без ошибок |
| `npm run build` | **PASS** | Next.js production build; для проверки заданы тестовые HTTPS origins `altai-archive-demo.example` |
| `git diff --check` | **PASS** | пробелов и конфликтных маркеров нет |
| Isolated browser E2E | **PASS** | синтетическая копия, mock provider; RU/KK/EN, desktop 1440 px, mobile 390 px, light/dark, AI errors/retry/demo, календарные фильтры, поиск/маршрут филиала, read-only UI/API |
| Browser screenshots | **PASS** | визуально осмотрены desktop history/branches и mobile dark history/branches; screenshots находятся в `output/playwright/` |
| Client bundle scan | **PASS** | идентификатор `OPENROUTER_API_KEY` не обнаружен в `.next/static` JavaScript; реальное значение ключа не читалось |
| OpenRouter live | **NOT VERIFIED IN CURRENT AUDIT** | Earlier handoff text recorded HTTP 200 / `mode: ai` for `Find photographs` and inferred OpenRouter. The latest audit returned `mode: no-match` with no sources; no provider call or provider identity was observable. Do not use the earlier inference as proof of current provider configuration. |
| Free model availability / latency / semantic grounding | **NOT TESTED** | No real provider invocation was verified in the current audit; latency, provider/model identity and semantic grounding remain unknown. |
| Redis live connectivity / provider spending cap | **NOT TESTED** | Redis credentials и spending cap не настраивались; limiter проверен mock тестами |
| Production Vercel persistence / deploy smoke | **NOT TESTED** | deployment не выполнялся; production storage не решён |

E2E использует только синтетические документы и перехваченный mock provider. Временные `.data` изолированы; оригинальный архив и реальное хранилище не участвовали.

## Перед показом жюри

1. Не называть демо production-ready и не демонстрировать постоянную работу админки на Vercel. Для статического/preview показа включить `DEMO_READ_ONLY=true` и использовать только синтетический каталог.
2. Не показывать реальные комплаенс-файлы и не утверждать, что список прошёл правовую или редакторскую проверку.
3. AI receives only matching published public metadata and does not read PDF files. In the latest Production audit, no provider invocation was verified. The updated local code searches its synthetic demonstration set in a separately labelled non-AI mode, then returns a deterministic no-match if that also has no match.
4. Перед публичным размещением отдельно проверить телефон/email/адреса филиалов и права публикации персонализированных рабочих контактов.
5. Указать, что календарь бережно сохраняет source wording, а четыре отмеченных несоответствия ждут редактора.
6. Перед production решить постоянное хранилище, backup/restore, distributed AI limiter credentials, provider quota/budget settings и организационные privacy approvals.

## Риски

- **Высокий — persistence:** локальный JSON/upload store не переживает надёжно serverless deployments и не синхронизируется между инстансами; production admin workflows должны оставаться отключены.
- **Высокий — публикация контактов:** значения перенесены из предоставленного XLS, но их текущая актуальность и разрешение на публикацию не утверждены.
- **Высокий — комплаенс:** внутренние файлы могут содержать персональные и служебные сведения; публикация запрещена до ручной проверки.
- **Средний — AI расходы/доступность:** код требует Upstash shared limiter в production и поддерживает только бесплатный ID/нулевую цену в provider request, однако операторский hard cap и фактическая доступность модели не настроены.
- **Средний — историческая точность:** календарь отражает исходный документ, но не прошёл независимую фактологическую редактуру; отмеченные расхождения не исправлены.
- **Средний — публичный поиск:** текущий retrieval по метаданным остаётся лексическим и не гарантирует смысловую корректность всех AI утверждений.

Источники по hosting header и Redis REST/EVAL: [Vercel request headers](https://vercel.com/docs/headers/request-headers), [Upstash Redis REST API](https://upstash.com/docs/redis/features/restapi), [Upstash EVAL](https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval).

## UX и provenance update · 10.11.2026

- Публичная навигация вынесена в основной список: главная, каталог, ИИ-помощник, история, филиалы и выставки. Новости, об архиве, обратная связь и сохранённый исторический атлас находятся во вторичном списке. Ссылка на админку появляется после проверки `/api/auth/me`; защита данных остаётся на серверных API.
- Причина незаметного AI: маршрут `app/assistant/page.tsx` и чат были, но `/assistant` отсутствовал в массивах навигации `components/shell.tsx`. Карточка на главной была, но не выделялась как основной путь. Ссылка теперь доступна также из каталога, документа и каждой даты хронологии. `/assistant` по-прежнему публичный и не требует входа.
- `/branches` использует список и синхронизированную панель карты; на экранах ≤800 px доступны вкладки «Список / Карта». Точных координат нет — карта не рисует маркеры. Для адреса есть внешний маршрут. Телефон показывается только в сравнении двух источников со статусом расхождения; непроверенные телефоны не представлены как действующие контакты.
- Provenance календаря различает текст исходного DOCX, внешний источник, дату проверки и неизвестную дату публикации. Внешний gov.kz подтверждает создание архива в 1940 году (исторический материал также относит сведения о шести филиалах к 2020 году): https://www.gov.kz/org/vko-cultura-arhiv/press/events/details/1292. Публикация gov.kz о 2026 годе подтверждает 130-летие областной библиотеки имени А. С. Пушкина: https://www.gov.kz/memleket/entities/vko-cultura-arhiv/press/news/details/1150609?lang=ru. Точная дата публикации этого материала не установлена.
- Список e-memory используется только как кандидат для сверки; он содержит конфликтующие контакты и записи с устаревшей административной принадлежностью: https://e-memory.kz/en/archive/vostochno-kazakhstanskaya-oblast/. Актуальную принадлежность Жарминского и Аягозского филиалов подтверждает раздел подведомственных учреждений управления области Абай: https://www.gov.kz/org/abay-cultura-arhiv/about/structure/10/1. Остальные контакты/адреса из XLS требуют редакторской проверки. Обычный OpenRouter не даёт веб-поиск: UI сообщает, что интернет-поиск AI не подключён; внешняя search-интеграция не подключалась.
- Безопасная ручная проверка live provider без изменения `.env.local` описана в `docs/AI_INTEGRATION.md`. В текущем аудите Production AI не дошёл до генерации, так как не нашёл опубликованных источников. Mock E2E не обращается к внешнему AI и использует синтетические данные.
- Новый isolated E2E: **PASS** на 390/768/1440 px, RU/KK/EN, карточка главной и мобильное меню → AI, Escape-закрытие меню, branch search/empty state/list-to-map/route, calendar source status, AI mock/errors/retry/demo и read-only admin API. Скриншоты — в `output/playwright/`.
- Итоговые `npm test`, `npm run typecheck`, `npm run lint`, `git diff --check` — **PASS**. Чистый `npm run build` в локальной конфигурации остановился на обязательном HTTPS `NEXT_PUBLIC_SITE_URL`; повторный production build с изолированными тестовыми HTTPS origins завершился **PASS**. `.env.local`, `.data`, GitHub и Vercel не менялись.
