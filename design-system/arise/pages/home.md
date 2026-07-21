# Home (Misiones) — overrides

Inherits `design-system/arise/MASTER.md`. Differences:

## Job of the screen
One composition: today + primary mission CTA. Not a dashboard of widgets.

## Hierarchy
1. Hero / day status (`HeroZone` + `DISPLAY.hero`)
2. One primary CTA (complete / continue mission)
3. Secondary list of today’s missions (stagger 30–50ms)

## Density
Slightly airy above the fold (`SPACING.lg`+); denser in mission list (`SPACING.md`).

## Motion
- Enter hero only + list stagger
- Press scale `MOTION.pressScale` on mission cards
- Respect reduced motion

## Do not
- Multiple competing CTAs above the fold
- Emoji as mission category icons (use vector + domain color)
