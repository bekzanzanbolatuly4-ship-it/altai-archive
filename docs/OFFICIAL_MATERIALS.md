# Official materials integration

Reviewed 12 November 2026. This register records what was inspected and how it is represented in the site. The customer-supplied originals remain outside the public build and were not copied into Git. See [the customer material inventory](CUSTOMER_MATERIALS.md).

## Customer materials located

| Material | Source and use | Publication status / limitation |
| --- | --- | --- |
| `ТЗ_ГосАрхивВКО.docx` | Main specification; compared with the existing route map and content. SHA-256: `9413390d3400960c0b75c23856ac296448f0d0cd7e0ceccbfe7cf94876fde46c`. | Customer supplied. It defines the site as informational; no on-site applications, orders, or payments. |
| `ТЗ_дополнения_ГосАрхив ВКО.docx` | Supplemental requirements for public service information, price list, legal acts, compliance, reading room, useful links, language/status disclosures, and publication rights. | Customer supplied. The supplemental content does not authorize processing service requests or payments on this site. |
| `Структура.docx` | Department names shown on `/about`. | Source has no effective date. Personal staff contacts are withheld pending confirmation of currentness and public publication. Director name is cross-checked against an official procurement record dated 21 August 2026; the page states that date rather than implying live verification. |
| `Адреса и контакты филиалов.xls` | `/branches` address values. | The file was saved 10 November 2026 but gives no effective date. Staff phone numbers and personal email addresses are withheld; no coordinates are inferred. |
| `Постановление обл акимата 142.pdf` | `/branches` current branch list and Russian names. | The six-page scanned act dated 2 June 2026 lists nine district branches and renames four existing branches. It has no address, phone, or coordinate data and is not hosted publicly. |
| `История архива.docx` | Ten verbatim excerpts in the `/history` institutional timeline. | The source gives no preparation date. Text remains in Russian and is labeled as archive-supplied. |
| `Календарь памятных дат.7z` / calendars 2022–2026 | `data/calendar-2022-2025.json`, `data/calendar-2026.json`, and `/history`. | 196 RU and 196 KK entries are retained verbatim. Numeric discrepancies between language pairs are flagged; neither version is silently corrected. English translations are not invented. |
| `Контакты.docx`, `Структура.docx`, `Фонды.7z`, `Платные услуги.7z`, `Комплаенс служба.7z`, and both project specifications | Inventoried; only content needed for this portal was used. | Staff contacts and compliance records are withheld; the funds file has headings only; the two price-list copies date from 2023 and their current applicability is unverified. See `CUSTOMER_MATERIALS.md`. |

Russian and Kazakh copies of the 2023 price-list decree were supplied but not hosted because current applicability and republication approval were not established. The official text of Resolution No. 289 is linked in both languages through Adilet. No reading-room regulation was in the supplied folder.

## Public official sources linked

- Price decree, East Kazakhstan Region Akimat Resolution No. 289 of 15 December 2023: [Russian](https://adilet.zan.kz/rus/docs/G23V000289A) · [Kazakh](https://adilet.zan.kz/kaz/docs/G23V000289A).
- Archival certificate service information, including current listed fee and processing time: [gov.kz service page](https://www.gov.kz/services/3014?lang=ru) (Kazakh variant is linked from the interface).
- Rules for the archival public service: [Adilet](https://adilet.zan.kz/rus/docs/V2000020790).
- Rules for using National Archival Fund documents: [Adilet](https://adilet.zan.kz/rus/docs/V2300033290).
- Archive law: [Adilet](https://adilet.zan.kz/rus/docs/Z980000326_).
- Anti-corruption law: [Adilet](https://adilet.zan.kz/rus/docs/Z1500000410).
- Current official reporting instructions for corruption offences (KNB service, updated 19 October 2026): [gov.kz](https://www.gov.kz/situations/13/67).
- Archive history (formation in 1940, event page): [gov.kz, 2020 publication](https://www.gov.kz/org/vko-cultura-arhiv/press/events/details/1292).
- Supervising department structure: [gov.kz](https://www.gov.kz/org/vko-uca/about/structure).
- Director name cross-check: [official procurement announcement](https://procurement.gov.kz/ru/announce/index/17537922).
- Current legal name and archive contact record: [public procurement announcement 17562202-1](https://procurement.gov.kz/ru/announce/index/17562202), checked 12 November 2026. It identifies the archive as the communal state institution under the East Kazakhstan Department of Digitalization and Archives, gives the legal address at Golovkova 26/1, Oskemen, and lists `arhiv-ukg@yandex.kz`. It does not provide a direct telephone or visitor hours.
- eGov service directory page for archive authorities: [eGov Kazakhstan](https://egov.kz/cms/ru/articles/department_of_archives), page last updated 16 September 2025. It lists the supervising East Kazakhstan Department (59/1 Kazakhstan Street, +7 (7232) 71-33-13, uca@akimvko.gov.kz); these are authority contacts, not the archive’s direct contacts.
- Direct application for an archival certificate: [eGov online service K002](https://egov.kz/services/K002/) (the official information page’s “Order online” link; requires eGov sign-in) and [gov.kz service information](https://www.gov.kz/services/3014?lang=ru), checked 12 November 2026.
- Current official reporting and archive names: [East Kazakhstan Department of Digitalization and Archives](https://www.gov.kz/org/vko-uca?lang=ru), including 2025 service reports published in 2026.

Official pages can change. The page labels translations as navigation aids and directs readers to the original act for authoritative wording. The client-supplied material does not document copyright or republication permissions for the original PDF and compliance attachments; those files are therefore not hosted here.

## Site locations

- `/about`: source-listed organization departments and dated director cross-check; no unsupported staff contacts.
- `/branches`: 13-branch roster and Russian names per the 2 June 2026 act. Addresses come from the supplied spreadsheet and are marked for currentness review. No branch map or route is shown because current addresses and coordinates are unverified.
- `/history`: 2022–2026 calendars and a ten-event Russian-language history timeline. `/exhibitions/archive-chronology` presents that same timeline as educational portal content, not as a previously approved official exhibition. Original wording is retained; detected calendar discrepancies are flagged.
- `/official-documents`: public service information, price decree, legal references, compliance notice, reading-room information, and official links. No forms, orders, payment flow, or fabricated document downloads.

## Owner follow-up

Before treating the spreadsheet addresses as route-ready, the archive owner should confirm their currentness and provide verified coordinates if a map is desired. Confirm publication approval for signed document scans and the current price schedule before hosting PDFs. The legacy archive website timed out during this review, so the site title was retained as “Государственный архив Восточно-Казахстанской области”; no unofficial English legal name is asserted.
