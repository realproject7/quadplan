# Dogfood: HTML Design Artifact & Browser Review Cycle

> Simulated HEAD design creation and RE1/RE2 browser review for QuadPlan Phase 9c validation.
> Based on the habit tracker proposal from the Butler intake dogfood (#42).

## HEAD Creates HTML Design Artifact

HEAD reads Phase 3 of the proposal (weekly summary) and creates an HTML design mockup at `artifacts/design/weekly-summary-v1.html`.

### Design Brief
- Weekly summary table: days as columns, habits as rows
- Boolean habits show checkmarks, numeric habits show values
- Dark theme matching QuadPlan visual identity
- Responsive: readable on desktop (1024px+), tablet (~768px), mobile (~375px)

### Artifact Created
- Path: `artifacts/design/weekly-summary-v1.html`
- Type: `design_html`
- Includes inline CSS (no external dependencies)
- Static mockup with sample data for 3 habits over 7 days

## RE1 Browser Review — First Round (REQUEST_CHANGES)

**Verdict**: REQUEST_CHANGES

### Browser Validation
- Opened in browser: yes
- Desktop checked (1024px+): yes
- Tablet checked (~768px): yes
- Mobile checked (~375px): yes
- Console errors: none

### Layout and Responsiveness
- Desktop: table renders correctly, columns aligned
- Tablet: table fits, slight horizontal scroll on narrow tablets
- **Mobile: table overflows horizontally with no scroll indicator** — user can't tell there's more content

### UX and Interaction
- No interactive elements (static mockup) — acceptable for v1

### Visual Quality
- Spacing follows 4px grid: yes
- Typography consistent: yes
- Accent color used appropriately: yes
- Text contrast adequate: yes

### Proposal Alignment
- Matches Phase 3 spec for weekly summary display

### Blocking Issues
- [MUST] Mobile table overflow needs `overflow-x: auto` wrapper with visible scroll indicator or horizontal fade hint

## RE2 Browser Review — First Round (REQUEST_CHANGES)

**Verdict**: REQUEST_CHANGES

### Browser Validation
- Opened in browser: yes
- Desktop checked (1024px+): yes
- Tablet checked (~768px): yes
- Mobile checked (~375px): yes
- Console errors: none

### Layout and Responsiveness
- Desktop and tablet: clean
- Mobile: same overflow issue as RE1

### Visual Quality
- **[SHOULD] Checkmark symbol (✓) renders inconsistently across browsers** — Safari shows a different glyph than Chrome. Consider using a CSS-drawn checkmark or SVG.

### Proposal Alignment
- Aligned with Phase 3 weekly summary spec

### Blocking Issues
- [MUST] Same mobile overflow issue as RE1

## HEAD Revises Design

HEAD updates `artifacts/design/weekly-summary-v1.html`:
1. Wraps table in `<div style="overflow-x: auto">` for mobile scroll
2. Adds subtle gradient fade on right edge when scrollable
3. Replaces Unicode checkmarks with CSS `::before` pseudo-element checkmarks for cross-browser consistency

## RE1 Browser Review — Second Round (APPROVE)

**Verdict**: APPROVE

### Browser Validation
- Opened in browser: yes
- Desktop (1024px+): table renders correctly
- Tablet (~768px): table fits, no overflow
- Mobile (~375px): horizontal scroll works, gradient fade visible
- Console errors: none

Mobile overflow resolved. Design is development-ready.

## RE2 Browser Review — Second Round (APPROVE)

**Verdict**: APPROVE

### Browser Validation
- Opened in browser: yes
- All three widths checked: yes
- Console errors: none

CSS checkmarks render consistently. Mobile scroll works. Approved.

## Verification

| Criterion | Status |
|-----------|--------|
| HTML design artifact reaches approved/done | Yes — both approve second round |
| Browser validation documented | Yes — all reviews include browser validation fields |
| Desktop/tablet/mobile checked | Yes — all three widths in every review |
| At least one revision cycle | Yes — both requested changes first round |
| Console errors checked | Yes — none found in any round |

## Friction Points

1. **No automated responsive screenshot** — reviewers manually resize browser window. A built-in responsive preview toggle in the dashboard iframe would save time.
2. **Cross-browser testing not systematic** — RE2 caught a Safari rendering difference, but there's no checklist item for multi-browser testing. Consider adding to REVIEW-FORMATS.md.
3. **Design revision versioning** — HEAD overwrites v1.html in place. No diff between original and revised design. Consider v1/v2 naming or git history.
4. **No design system reference in artifact** — the HTML design doesn't link back to the color tokens or DESIGN-GUIDE.md. Reviewers must check these separately.
