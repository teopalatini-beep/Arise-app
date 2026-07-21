# Design System Master File — ARISE

> **LOGIC:** When building a specific page, first check `design-system/arise/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** ARISE  
**Stack:** Expo / React Native (not web Tailwind)  
**Generated:** 2026-07-19  
**Style:** Dark Luxury Performance (charcoal + gold) — no RPG/anime framing; no emoji-as-icons  
**Color lock:** Updated 2026-07-21 to match premium coaching refs (Aston-glass / gold accent). Purple anime accents retired.

### Color Palette (Dark Luxury → semantic roles)

| Role | Hex / value | Token |
|------|-------------|-------|
| Background (base) | `#050505` | `SURFACES.base` |
| Surface raised | `#0A0A0A` | `SURFACES.raised` |
| Surface elevated | `#121212` | `SURFACES.elevated` |
| Glass | `rgba(255,255,255,0.045)` | `SURFACES.glass` |
| Glass border | `rgba(255,255,255,0.10)` | `SURFACES.glassBorder` |
| Foreground | `#F5F5F5` | `INK.primary` |
| Foreground muted | `#A8A29E` | `INK.secondary` |
| Primary / CTA / Brand | `#D4AF37` | `METAL.gold` / `SEMANTIC.primary` |
| Primary soft | `#E8C547` | `METAL.goldSoft` |
| Intensity / danger | `#E11D48` | `METAL.intensity` |
| Success | `#10B981` | `SEMANTIC.success` |

**Contrast:** Gold CTAs use dark ink on gold fill. Body text white/stone on charcoal ≥ 4.5:1.

### Typography

- **System:** Native RN default / SF Pro (iOS) / Roboto (Android) — no Inter CDN (mobile app).
- **Scale:** `FONT` tokens — xs 11 · sm 13 · base 15 · md 17 · lg 20 · xl 24 · xxl 30 · xxxl 38
- **Display:** `DISPLAY` roles (hero, subtitle, cardTitle, caption)
- **Body minimum:** Prefer ≥15pt for reading; never critical UI text &lt; 12pt
- **Dynamic Type:** Keep `allowFontScaling` on by default; do not disable globally
- **Line height:** Body ~1.5 (see `DISPLAY.subtitle` / `cardBody`)

### Spacing (density 5 — standard 4/8pt)

| Token | Value | Usage |
|-------|-------|-------|
| `SPACING.xs` | 4 | Tight gaps |
| `SPACING.sm` | 8 | Icon gaps, min touch spacing |
| `SPACING.md` | 16 | Standard padding |
| `SPACING.lg` | 24 | Section padding |
| `SPACING.xl` | 32 | Large gaps |
| `SPACING.xxl` | 48 | Hero / section margins |
| `SPACING.xxxl` | 64 | Hero breathing room |

### Radius

Cards/buttons default **16** (`RADIUS.lg`) for Cinema Mobile; ARISE glass shells may use `RADIUS.xxxl` (32) for hero cards — stay consistent within a screen.

### Elevation / Shadow

Use `ELEVATION.sm|md|lg` and `SHADOW.glow` — dark-mode shadows are soft black, not light-theme Material shadows.

### Z-index

| Token | Value | Usage |
|-------|-------|-------|
| `Z_INDEX.base` | 0 | Content |
| `Z_INDEX.sticky` | 10 | Sticky headers |
| `Z_INDEX.overlay` | 20 | Scrims |
| `Z_INDEX.sheet` | 40 | Sheets / modals |
| `Z_INDEX.toast` | 100 | Toasts |
| `Z_INDEX.max` | 1000 | Debug / blockers |

---

## Component Specs (React Native)

### Buttons

- Primary: fill `METAL.gold` text `INK.inverse` (dark on gold), radius ≥ `RADIUS.md`, min height **44**
- Secondary: transparent + `METAL.goldBorder` or `SURFACES.glassBorder`, text `INK.primary`
- Destructive: `METAL.intensity` / danger semantics — never use gold for destructive
- Pressed: slight opacity or `METAL.goldSoft`; keep layout stable (no size jump)
- Press: scale **0.97 → 1.0**, duration 150–300ms, haptic Impact Light
- Async: disable + spinner; never leave tappable during submit
- Prefer `Pressable` over `TouchableOpacity`

### Cards (`GlassCard`)

- Surface: `SURFACES.glass` + hairline `glassBorder`
- Optional `BlurView` intensity **20–28**, `tint="dark"` (iOS)
- Accent wash via domain color at `OPACITY.accentWash`
- Press feedback via `usePressSpring`; respect reduced motion
- One primary action per card when interactive

### Inputs

- Visible label (not placeholder-only)
- Height ≥ 44; fontSize ≥ 16 where keyboard zoom matters
- Error below field; `borderFocus` on focus
- Correct `keyboardType` / `textContentType`

### Modals / Sheets

- Scrim: `OPACITY.sheetScrim` (~0.45 black)
- Spring: damping 20, stiffness 90
- Clear dismiss affordance; confirm if unsaved
- Animate from trigger when possible (spatial continuity)

### Charts (Progreso)

- Weight / metrics trend → **line or area** chart
- Single KPI vs target → gauge/ring + **numeric label** (never color alone)
- Empty: message + CTA, not blank axes
- Loading: skeleton (`ScreenLoadingState` / shimmer)

---

## Style Guidelines

**Keywords:** dark mode, cinematic, glassmorphism, AMOLED, frosted glass, haptic, Reanimated, premium layered

**Key effects (from Cinema Mobile, mapped to ARISE):**

- Easing Expo.out ≈ `Easing.bezier(0.16, 1, 0.3, 1)`
- BlurView on tab bar / headers (intensity ~20)
- Ambient light: optional soft white wash gradients only (no new accent hues)
- Animate **transform + opacity** only; native driver
- Max 1–2 key motion moments per screen

### Navigation

- Bottom tabs ≤ 5, icon **+** label
- Active tab visually distinct (weight/color, not color alone if possible)
- Safe areas on all screens; content inset under tab bar
- Deep links for key flows (Expo Router)
- Predictable back; preserve scroll/state

---

## Motion

| Kind | Duration | Notes |
|------|----------|-------|
| Micro (press) | 150–200ms | Scale 0.97, haptic |
| Enter | 200–300ms | Ease-out / spring |
| Exit | ~60–70% of enter | Feel snappy |
| Stagger | 30–50ms / item | Lists/grids |
| Route | ≤400ms | Spatial continuity; interruptible |

**Reduced motion:** Use `getReducedMotionSetting` / `useReducedMotionSetting` — skip springs, staggers, decorative blobs.

**RN motion (not GSAP):** Reanimated / Animated + Expo Router transitions. Keep overlays mounted at layout root if used.

---

## Anti-Patterns (Do NOT Use)

- ❌ New palette hexes outside locked table (no amber/cream from generic habit templates)
- ❌ Emojis as structural icons — use `@expo/vector-icons` / Lucide-style vectors
- ❌ Instant state snaps (0ms) on interactive UI
- ❌ Touch targets &lt; 44×44 without `hitSlop`
- ❌ Hover-only affordances
- ❌ Decorative infinite animation (only loaders)
- ❌ Color-only status (pair with icon/text)
- ❌ Nested scroll regions fighting the main list
- ❌ Blocking input during animations
- ❌ Mixing filled/outline icons at the same hierarchy without reason

---

## Token architecture (ui-styling principles → RN)

1. **Primitive** — raw surfaces, ink, domain hues (`SURFACES`, `INK`, domain colors)  
2. **Semantic** — roles (`SEMANTIC.background`, `onSurface`, `destructive`, …)  
3. **Component** — `DISPLAY`, `GlassCard`, buttons consume semantics only  

Source of truth in code: `src/theme/index.ts`

---

## Pre-Delivery Checklist (App)

### Visual
- [ ] No emoji icons; one icon family
- [ ] Semantic tokens only (no ad-hoc hex in screens)
- [ ] Pressed states do not shift layout bounds

### Interaction
- [ ] Tap feedback &lt; 100ms perceived
- [ ] Targets ≥ 44×44pt (or hitSlop)
- [ ] Disabled looks disabled and is non-interactive
- [ ] Haptics on confirmations only (not every pixel)

### Dark / OLED
- [ ] Primary text ≥ 4.5:1; secondary ≥ 3:1
- [ ] Borders visible on glass
- [ ] Modal scrim strong enough (~40–60%)

### Layout
- [ ] Safe areas respected
- [ ] Scroll not under tab bar / CTA bars
- [ ] 4/8 spacing rhythm

### A11y
- [ ] `accessibilityLabel` on icon-only controls
- [ ] Reduced motion respected
- [ ] Dynamic Type does not break critical layouts
- [ ] Form errors near fields + recovery path
