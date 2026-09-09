# Global Context Help — rc.15.2

AI Development Office now includes a global contextual-help layer.

Covered UI elements:
- Buttons
- Checkboxes
- Select controls
- H1/H2/H3 headings
- Explicit `data-help` / `data-status` elements

Interaction:
- Hover the small `i` icon (click also works).
- Keyboard users can Tab to the icon and focus it.

Each tooltip explains the tool — not the heading again:
1. What the control/section does.
2. How it works.
3. What it can affect.

The help registry contains detailed explanations for high-impact actions such as Git restore/rollback/cherry-pick, Safety approval checks, Memory v2, integrations, distributed workers, installer/update actions, governance evidence and Stable sign-off.

For generic controls not yet given a dedicated registry entry, the help system generates a safe type-aware explanation based on the visible label/control type.

This help layer is informational only; it never executes the associated action.
