# AI Development Office v1.1.0 — Pixel Theme Engine & Readability Release

Author: JeXiR (Halil Cinkilinc)

## Theme Engine

Settings now provides seven persistent Office themes:

1. Classic Pixel Office — 2dPig reference
2. Pixel Office 32 — Masalimov Ilnur reference
3. Luxury Office — LennoxStudio reference
4. Modern Corporate — LennoxStudio reference
5. Call Center — LennoxStudio reference
6. Top-Down Corporate — LennoxStudio reference
7. Office Hell — Masalimov Ilnur reference

The built-in release uses original code/CSS-rendered adaptations. Paid third-party sprite archives are not redistributed in this package. Each theme has a prepared asset slot under `public/assets/themes/<theme-id>/` so licensed assets can later replace the native renderer without changing Office orchestration.

## Character Scale

- Live pixel characters now render at a true 2× visual scale.
- Base 30×45 code character becomes approximately 60×90 on the mission floor.
- Scale is applied through a dedicated wrapper so walking/typing/meeting/error animations keep their own transforms.
- Agent labels were widened to match the larger characters.

## Typography Contract

- All declared CSS font sizes below 12 px were normalized to 12 px.
- Agent name: 13 px.
- Agent role/status/task: 12 px.
- Room title: 16 px.
- Room subtitle: 12 px.
- Existing larger headings/KPIs remain larger.

## Persistence

Selected theme is stored in Office persistent settings and is restored after restart.

## Freeze

This release is an explicit user-requested visual/readability exception to the v1.0 freeze. Feature freeze is active again after v1.1.0.
