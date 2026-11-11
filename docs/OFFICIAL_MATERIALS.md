# Official materials integration

Reviewed 11 November 2026. This register records what was inspected and how it is represented in the site. Source files from Downloads and `hackathon-materials/source_documents/` remain outside the public build and were not copied into Git.

## Customer materials located

| Material | Source and use | Publication status / limitation |
| --- | --- | --- |
| `ТЗ_ГосАрхивВКО.docx` | Main specification; compared with the existing route map and content. SHA-256: `9413390d3400960c0b75c23856ac296448f0d0cd7e0ceccbfe7cf94876fde46c`. | Customer supplied. It defines the site as informational; no on-site applications, orders, or payments. |
| `ТЗ_дополнения_ГосАрхив ВКО.docx` | Supplemental requirements for public service information, price list, legal acts, compliance, reading room, useful links, language/status disclosures, and publication rights. | Customer supplied. The supplemental content does not authorize processing service requests or payments on this site. |
| `Структура.docx` | Department names shown on `/about`. | Source has no effective date. Personal staff contacts are withheld pending confirmation of currentness and public publication. Director name is cross-checked against an official procurement record dated 21 August 2026; the page states that date rather than implying live verification. |
| `Адреса и контакты филиалов.xls` | Existing `data/branches.json` and `/branches`; no coordinates or missing values were inferred. | Entries remain explicitly marked as customer-source listings needing currentness/publication review. No timetable is inferred. |
| `Комплаенс служба.7z` | Archive inventory reviewed; only the two general information DOCX files were read. A short summary is shown on `/official-documents`. | Internal analysis reports, position lists, named contact details, and full attachments are not published. The supplied notice says documents were once posted on an archive information site, but current public availability and republication permission were not independently confirmed. |
| `Календарь памятных дат.7z` / `календарь 2026 год каз рус.docx` | The existing `data/calendar-2026.json` and `/history` calendar preserve 42 RU and 42 KK entries from the 2026 source. | Source contains cross-language factual discrepancies flagged in the data. No automatic English translation is presented; EN shows the original-language entry with a notice. |

The named Russian and Kazakh price-list PDFs and a local reading-room regulation were not found in the scoped Downloads search. No replacement PDF was generated or represented as an original. The official text of Resolution No. 289 is linked in both languages through Adilet.

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

Official pages can change. The page labels translations as navigation aids and directs readers to the original act for authoritative wording. The client-supplied material does not document copyright or republication permissions for the original PDF and compliance attachments; those files are therefore not hosted here.

## Site locations

- `/about`: source-listed organization departments and dated director cross-check; no unsupported staff contacts.
- `/branches`: supplied branch directory with source/currentness caveats and no fabricated map coordinates.
- `/history`: existing 2026 Russian/Kazakh calendar, including identified conflicts and source-language fallback.
- `/official-documents`: public service information, price decree, legal references, compliance notice, reading-room information, and official links. No forms, orders, payment flow, or fabricated document downloads.

## Owner follow-up

Before treating these materials as current production information, the archive owner should confirm the effective organizational chart, department and branch names, branch contact publication permissions, the current compliance contact and public compliance attachments, local reading-room rules/hours, and the current price schedule. The archive should provide or approve original Russian and Kazakh PDF files if downloadable copies are required.
