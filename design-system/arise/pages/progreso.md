# Progreso — overrides

Inherits MASTER. Differences:

## Job of the screen
Show progress trend + log metrics. Charts must ship with numeric labels.

## Charts
- Weight / history → line or area (`WeightChart`)
- XP / completion → ring + text value (`XPRing`)
- Heatmap: color + count/label; never color alone
- Empty / error states with retry

## Forms (`MetricsForm`)
- Visible labels, inline errors, submit loading state
- Inputs ≥ 44pt height

## Density
Dashboard-leaning: `SPACING.md` between blocks; avoid cramming &gt;3 charts without section titles.
