# AI Development Office v0.13.3 — Multi-floor Render Hotfix

Author: JeXiR (Halil Cinkilinc)

## Fixed
- Restored Pixi `Container` registration in `PixelOffice`.
- The multi-floor rewrite still used `<pixiContainer>` for agent tokens, but v0.13 registered only `Graphics` and `Text`.
- The missing registry entry could break the Pixi child tree and leave the 1080x960 canvas visually empty even though the outer Office UI rendered.

## Render contract
`PixelOffice` now explicitly registers every Pixi primitive it directly uses:

```ts
extend({ Container, Graphics, Text });
```

This keeps room graphics, furniture and agent tokens in the same render tree.
