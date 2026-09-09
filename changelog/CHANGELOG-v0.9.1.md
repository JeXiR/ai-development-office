# AI Development Office v0.9.1

Author: JeXiR (Halil Cinkilinc)

## Critical animation fix
- Fixed invisible agents caused by using URL textures before Pixi Assets finished loading.
- Added global `Assets.load()` preload for all original Office sprite frames.
- Sprite workers render only after preload completes.
- Added procedural worker fallback while assets are loading or if preload fails.

## Office visual density
- Enlarged office canvas vertically.
- Added rugs, chairs, bookshelves, whiteboards, server racks, terminal panels, wall clock, lounge sofa and kitchen equipment.
- Added active terminal / rack indicators based on real room state.
- Increased sprite scale and label readability.
- Refined room lighting / active-room accents.

## Animation
- Faster directional walking frames.
- Larger visible character sprites.
- Task bubbles remain temporary and readable.
- Waypoint routing remains in place.
