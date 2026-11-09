# AI integration principles

AI features are proposed only. No provider, model, API, embedding index, OCR engine, or assistant integration is configured or authorized by the current project brief.

## Approval and data boundaries

- Classify each source and field before processing. Confirm rights, access restrictions, personal/sensitive content, residency, retention, and contractual terms.
- Do not send confidential archival material to an external AI service without explicit authorization from the archive and applicable data owner.
- Enforce authorization before retrieval and again before presenting results. A generated answer must not expose a record the requesting user cannot access.
- Minimize payloads; use approved redacted or public material where feasible. Do not include secrets or credentials in prompts, logs, or source control.
- Document provider retention/training settings, region, subprocessors, deletion, incident handling, and cost controls before any live use.

## Proposed quality and user experience controls

- Ground answers in accessible records and show citations at the passage or record level where technically supportable.
- Clearly label generated summaries, translations, OCR, and explanations; retain links to the source and disclose uncertainty.
- Never present generated interpretation as an archival fact or replace the original document/transcription.
- Support “no reliable answer found,” conflicting sources, and escalation to archive staff.
- Provide correction and feedback pathways with a defined review owner; do not treat feedback as permission to retrain a model.

## Evaluation before release

Use an archive-approved, rights-cleared evaluation set covering Kazakh and Russian, transliteration and spelling variation, historical terms, dates and places, access restrictions, OCR noise, ambiguous questions, and unsupported claims. Measure retrieval relevance, citation correctness, answer faithfulness, refusal/access enforcement, language quality, latency, and cost. Archive experts should review the rubric and results. Define release thresholds and monitoring before deployment.

## Rollout proposal

1. Establish baseline keyword search and metadata quality.
2. Prototype against synthetic or explicitly approved public sample material.
3. Evaluate retrieval separately from answer generation.
4. Conduct privacy, security, rights, and language review.
5. Run a limited, monitored pilot with staff oversight and a rollback path.
6. Expand only after measured quality and governance approval.

## Risks

Fabricated details, mistranslation, OCR errors, retrieval of restricted content, misleading citations, bias in coverage, prompt injection in source text, personal-data leakage, provider retention, and unpredictable operating cost. Mitigations need verification in the actual design; this document does not certify them as solved.
