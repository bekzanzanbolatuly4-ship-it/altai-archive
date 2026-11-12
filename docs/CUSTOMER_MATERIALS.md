# Customer-supplied archive materials

Reviewed 12 November 2026. The originals are in the customer-provided `Telegram Desktop` folder and were not modified or copied into this repository. Compressed archives were inspected in a temporary directory. Counts include 11 top-level files and 21 files inside the four archives (32 files total): 15 DOCX, 11 PDF, one XLS, four 7z archives, and one TXT. No standalone image or presentation files were present. None of the inspected DOCX files contained embedded images.

## Materials integrated

| Source material | Integration | Notes |
| --- | --- | --- |
| `Календарь памятных дат.7z` — calendars for 2022, 2023, 2024, 2025, and 2026 | `/history`, in `data/calendar-2022-2025.json` and `data/calendar-2026.json` | 196 entries in Russian and 196 in Kazakh. Original event dates and wording are preserved. English is not invented; the interface explains that the original language is shown. Numeric differences between paired language versions are flagged and both versions remain available. |
| `История архива.docx` | `/history` timeline and `/exhibitions/archive-chronology` educational exhibition in `data/archive-history.json` | Ten dated excerpts are copied verbatim in Russian. The exhibition is clearly identified as educational portal content, not a previously approved official exhibition. Source preparation date is not specified. |
| `Постановление обл акимата 142.pdf` | `/branches` source of the branch roster and current Russian names | Six-page scanned act No. 142 dated 2 June 2026. Its appendices list nine established district branches and rename four existing branches. The scan is not hosted by this project. The act contains seals and signatures; the site displays only roster/name metadata from its appendices. |
| `Адреса и контакты филиалов.xls` | `/branches` address values | Addresses are attributed to this customer spreadsheet and remain marked as requiring currentness confirmation. Phone numbers, staff email addresses, and personal contacts are omitted. Coordinates were not supplied or inferred; there is no branch map or route link. |

The four catalogue records remain illustrative examples. The supplied material did not contain verifiable fonds, inventory, or case descriptions or digitized archive holdings that could replace them.

## Inventoried but not published

| Material | Reason |
| --- | --- |
| `Контакты.docx` | Contains staff contact details. Personal contacts are not reproduced without explicit publication approval. |
| `Структура.docx` | Organizational information has no effective date. Staff names and contacts are withheld; a director name shown elsewhere in the site is separately attributed to a public procurement record. |
| `Фонды.7z` / `Фонды.docx` | Contains headings and high-level fonds categories only, not a usable catalogue of fonds, inventories, or cases. No records were invented from it. |
| `Платные услуги.7z` / two Russian and Kazakh price-list PDFs | Copies concern Resolution No. 289 dated 15 December 2023. Current applicability was not established; current public legal references remain linked instead. |
| `Комплаенс служба.7z` | Contains 13 internal compliance documents, including risk analyses, position lists, plans, regulations, and a staff contact note. They are not included in the public build or this repository. |
| `ТЗ_ГосАрхивВКО.docx` and `ТЗ_дополнения_ГосАрхив ВКО.docx` | Used as project requirements, not public site content. |

## Restricted compliance archive inventory

`Комплаенс служба.7z` contains 13 files: eight PDF, four DOCX, and one TXT. Their titles identify internal risk-analysis reports, staff-position lists, action plans, regulations, general service information, and a compliance contact note. The files were inventoried but their contents, staff details, and attachments are not copied to the site or handoff repository.

See [data-source notes](DATA_SOURCES.md) for public-source references and site behavior.
