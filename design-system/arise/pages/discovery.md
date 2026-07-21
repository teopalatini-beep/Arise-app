# Discovery — overrides

Inherits MASTER. Differences:

## Job of the screen
Browse tools → open hero detail. Shared-element continuity between card and modal.

## Cards
- `GlassCard` / tool cards with domain accent wash
- Grid gap ≥ `SPACING.sm` (8); touch targets full card ≥ 44pt
- Skeleton while loading (`DiscoverySkeleton`)

## Modal
- Scrim `OPACITY.sheetScrim`
- Blur intensity `BLUR.card`–`BLUR.sheet`
- Escape route (close) always visible
- Spring `MOTION.spring`

## Motion
Shared transition via existing discovery transition helpers; interruptible; exit faster than enter.
