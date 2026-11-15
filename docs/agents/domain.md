# Domain docs

This repository uses a single domain context.

## Before exploring

- Read root `GLOSSARY.md`, if present, for domain terminology.
- Read relevant decisions under `docs/adr/`, if present.
- If these do not exist, proceed silently. Do not create placeholders: `domain-modeling`, used by `grill-with-docs` and `wayfinder`, creates them only when terminology or decisions are resolved.

## Layout

- `GLOSSARY.md`: shared domain vocabulary, without implementation details.
- `docs/adr/NNNN-descriptive-title.md`: architectural decisions, following the installed domain-modeling skill's ADR format.

## Consumer rules

Use glossary terms consistently in code discussions, issue titles, proposals, and tests; avoid synonyms the glossary rules out. If a necessary concept is missing, flag the gap for domain modeling rather than inventing competing terminology.

Surface conflicts with existing ADRs explicitly instead of silently overriding them. Cite the conflicting decision and explain why it might need reopening.
