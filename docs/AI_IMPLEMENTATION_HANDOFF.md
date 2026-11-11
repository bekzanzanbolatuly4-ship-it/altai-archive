# ALTAI AI — сохранённое состояние работы

**Исторический снимок от 2026-11-10.** Работа была приостановлена по просьбе пользователя; актуальный статус и конфигурация вынесены в [AI_HANDOFF.md](../AI_HANDOFF.md). Коммит и deployment тогда не выполнялись.

## Задача и ограничения

Реализовать production-minded AI-помощника ALTAI ARCHIVE через OpenRouter, модель из OPENROUTER_MODEL (запрошена Gemma 4 31B Free), с публичным поиском, серверными источниками, RU/KK/EN, безопасным UI и тестами.

Не выводить секреты; не менять .env.local, реальные .data и архивные материалы; не менять авторизацию; не подключать Supabase и не делать миграции; не удалять чужие изменения; не делать коммиты, платные переключения или реальные AI-запросы без отдельного разрешения. Во время работы реальных запросов к OpenRouter не было.

Это ограничение относилось к исходной работе 10.11.2026 и не является текущим указанием: пользователь отдельно разрешил один локальный коммит после финального аудита. Актуальные провайдеры и проверенное состояние указаны в [AI_HANDOFF.md](../AI_HANDOFF.md).

В рабочем дереве уже было много чужих незакоммиченных изменений. Не откатывать всё дерево и не считать полный git diff результатом этой задачи. В частности, admin/auth/store, многие страницы, стили и документация были изменены до начала задачи.

## Реализовано

- POST /api/assistant, same-origin проверка существующим request-security, ограниченное чтение тела, безопасные ошибки, no-store и Retry-After.
- lib/ai/: agent.ts, context.ts, errors.ts, instructions.ts, limits.ts, openrouter.ts, validation.ts.
- Общая политика lib/public-access.ts: published/public, исключение hidden/deleted/deletedAt. Подключена к публичным list/detail/file API, sitemap, metadata документа и поиску AI.
- Поиск по title/description публичных записей JSON-хранилища, максимум пять сокращённых результатов; модель получает временные S1…S5, без реальных ID, путей, PDF, сотрудников и служебных записей.
- OpenRouter из серверного окружения, только :free, нулевой max_price, без fallback и повторов, data_collection deny, AbortController, лимиты ввода/вывода/контекста/времени.
- Валидация JSON, идентификаторов и точных выдержек, повторная проверка доступности и изменения метаданных. Ссылки формирует сервер.
- components/ai-assistant.tsx подключён через components/portal.tsx; старый локальный демо сохранён отдельно. История в памяти страницы, Enter/Shift+Enter, загрузка, retry, источники, RU/KK/EN. Текст отображается React без HTML/Markdown выполнения.
- Версионируемые правила 1.0.0 в lib/ai/instructions.ts и docs/AI_AGENT_RULES.md.
- Обновлены docs/AI_INTEGRATION.md, README.md, .env.example; добавлены локализованные строки и стили.
- package.json: test:e2e:ai; tsconfig.json: allowImportingTsExtensions для тестирования TS модулей встроенным Node strip-types.

## Файлы этой задачи

Новые:
- app/api/assistant/route.ts
- lib/public-access.ts
- lib/ai/{agent,context,errors,instructions,limits,openrouter,validation}.ts
- components/ai-assistant.tsx
- docs/AI_AGENT_RULES.md
- tests/ai-agent.test.mjs
- tests/ai-route.test.mjs
- tests/e2e/assistant.mjs
- tests/fixtures/ai-provider.mjs
- этот файл состояния

Точечно обновлены (в ряде файлов уже были чужие изменения):
- app/api/documents/route.ts
- app/api/documents/[id]/route.ts
- app/api/documents/[id]/file/route.ts
- app/document/[id]/layout.tsx
- app/sitemap.ts
- components/portal.tsx
- app/globals.css
- locales/messages.ts
- package.json, tsconfig.json
- README.md, .env.example, docs/AI_INTEGRATION.md

## Результаты проверок

Последние результаты:
- PASS npm test — 7 тестовых файлов. Отдельный запуск ai-agent.test.mjs: 13 сценариев PASS; ai-route.test.mjs: 1 интеграционный сценарий PASS.
- PASS npm run typecheck.
- PASS npm run lint, включая добавленные тесты.
- PASS npm run build, включая /api/assistant. Последний production build прошёл после изменений серверного кода; после него добавлялись только тесты/документация.
- PASS git diff --check.
- npm audit --offline --omit=dev: 0 известных уязвимостей; это не свежая онлайн-проверка advisory базы.
- NOT TESTED browser desktop/mobile и визуальная проверка: sandbox запрещает listen на localhost; прямой запуск изолированного Next.js завершился listen EPERM 127.0.0.1:3107. E2E-скрипт также не смог запустить сервер.
- NOT TESTED настоящий OpenRouter/Gemma, текущая доступность модели, реальные лимиты, качество и задержка. Реальных запросов не делали по ограничению пользователя.

Тест реального route handler выполняет его с подменённым in-memory хранилищем и mock fetch: origin, input, missing key, поиск, ответ, серверная ссылка, безопасный 429. Он не импортирует живой archive-store.

## Продолжение

1. Прочитать этот файл и docs/AI_INTEGRATION.md; проверить git status, сохраняя чужие изменения.
2. Для Next.js правок читать соответствующий guide в node_modules/next/dist/docs/. Навыки, уже использованные: archive-feature, archive-security-review, theme-localization-audit, playwright.
3. Запустить изолированный browser E2E в среде, разрешающей локальный сервер:
   PLAYWRIGHT_MODULE_PATH=/absolute/path/to/playwright/index.mjs npm run test:e2e:ai
   В этой среде найден Playwright: /home/archbekzhan/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs; путь при продолжении проверить.
4. E2E создаёт отдельную временную копию без .env*, .data, .git, .next, связывает node_modules, создаёт синтетические записи, подменяет OpenRouter и блокирует внешнюю сеть. Проверяет настоящий endpoint/UI, RU/KK/EN, desktop/light, mobile/dark, источники, ошибки, повтор, демо и клавиатуру. Скриншоты — output/playwright/. Просмотреть их и исправить выявленные проблемы. Настоящий архив для E2E не использовать.
5. Доработать по результатам проверки, повторить необходимые npm test/typecheck/lint/build и git diff --check.
6. Предоставить итоговый отчёт: возможности, файлы, проверки, безопасность, запуск, ограничения, PASS/FAIL/NOT TESTED. Не называть интеграцию production-ready до сквозной проверки интерфейса и согласованной оценки данных/качества.
7. Реальный smoke-test OpenRouter возможен только после отдельного разрешения пользователя; текущая просьба сохранить работу его не даёт.

## Известные ограничения / предмет следующего review

- Проверка точных цитат доказывает совпадение метаданных, не смысловую подтверждённость всего ответа модели. Prompt injection не устраняется системным текстом; реальные границы — отсутствие инструментов и закрытых данных в контексте.
- Редакция regex покрывает частые email/телефоны/12-значные номера/явные секреты, но не все персональные и конфиденциальные сведения. Перед живой передачей требуется редакторская проверка публичных метаданных.
- Rate limiter общий на процесс: 20 запросов/минуту, 2 одновременно; для нескольких инстансов нужен внешний общий лимитер/edge controls. Он не доверяет пользовательским IP-заголовкам.
- Поиск простой лексический, без морфологии, OCR, транслитерации и cross-language retrieval. Определение языка эвристическое.
- История отображается в UI, но каждый запрос обрабатывается независимо; это явно раскрыто в интерфейсе.
- Строгие JSON/quote/provider privacy требования могут приводить к отказам реальной free-модели; без live-теста совместимость не подтверждена.
- Демо — отдельный явно обозначенный пользовательский режим, не подставной ответ Gemma.
- В /tmp может остаться вручную созданная /tmp/altai-ai-e2e и /tmp/altai-ai-e2e-source.tar с синтетическими данными и без .env; это артефакты неудачного запуска. Сервер не запустился. Не путать с реальным проектом.

## Обновление 2026-11-11

Этот документ описывает сохранённый снимок от 2026-11-10; его `NOT TESTED` и запрет на live-вызов относятся к тому запуску. Позднее пользователь явно запросил production-проверку: один запрос к `/api/assistant` с `Find photographs` вернул HTTP 200 / `mode: ai`, но без citations. Production code на момент запроса использовал только OpenRouter; это указывает на доступность внешней интеграции в тот момент, не на устойчивость бесплатной квоты или доказанность качества ответа. Текущая конфигурация, Gemini-опция, no-match поведение и результаты проверок приведены в [AI_HANDOFF.md](../AI_HANDOFF.md).
