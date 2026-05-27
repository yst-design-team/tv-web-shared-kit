# Page Implementation Checklist

Use this checklist before considering a new page or a page refactor complete.

## 1. Register The Page First

Add the page to [src/pageRegistry.ts](/Users/guo/Library/Application%20Support/Open%20Design/namespaces/release-stable/data/projects/c9a9fa5d-4630-4300-99c5-6bed8ae79648/src/pageRegistry.ts:1) before wiring JSX:

- `id`
- `label`
- `scene`
- `defaultFocusKey`
- `duiMode`
- `opensPlayerOnSelect`
- `componentProfile`
- `entryIntentIds`

Rule:

- `waterfall` and `player` are `epg`
- all current non-player feature pages are `ai-space`
- if a new page does not fit the rule, update the registry intentionally instead of overriding component props inline

## 2. Pick The Right Component Profile

Do not fork page-local markup when a scene variant is enough.

- `epg-waterfall`: traditional GUI cards, EPG DUI dock, recommendation overlay
- `epg-player`: player overlays and playback actions
- `ai-search`: AI space search / recommendation layout
- `ai-documentary`: filter + rail layout
- `ai-person-topic`: person-topic detail layout
- `ai-topic`: topic list layout
- `ai-topic-landing`: topic landing aggregation layout
- `ai-music`: music home layout

If an existing shared component is close, extend it with a variant first.

## 3. Focus Rules

Every focusable path must be explicit and testable.

- only one focused state should exist at any time
- first landing focus must match `defaultFocusKey`
- left/right/up/down should move one logical step at a time
- entering a new card group should land on its first internal card unless the design requires focus memory
- every GUI element adjacent to DUI must implement explicit cross-lane navigation
- input fields must keep focus during typing and swallow raw arrow keys unless intentionally remapped

## 4. Layout And Clipping

- the rightmost focus ring must be fully visible
- the last visible row must be fully revealed before stopping scroll
- when focus reaches the last row, preserve a 51px bottom gap
- use `overflow: clip` for visual clipping when scroll containers must not auto-scroll
- tab rails must show the first and last items completely if the design requires it
- edge masks must be present when the design shows them

## 5. Copy And Adaptive Content

- long Chinese button copy must wrap correctly
- button height must grow with text when the component is multi-line
- recommendation prompts should be generated from page context, not hardcoded globally
- placeholder poster titles, badges, counts, and ranking numbers must stay logically consistent

## 6. DUI Rules

- EPG pages use `epg-dock` behavior
- AI-space pages use page-local DUI layouts
- reply bubbles, prompt buttons, and input shell should reuse shared components unless the geometry is different enough to justify a dedicated component
- input must be native `<input>` or `<textarea>`, not a simulated caret block

## 7. Verification

Before closing work:

- verify the changed component in Storybook
- run `npm run verify:storybook` when the change touches shared component visuals
- verify the changed page in the app
- use a direct deep link from [docs/DEV_DEEP_LINKS.md](/Users/guo/Library/Application%20Support/Open%20Design/namespaces/release-stable/data/projects/c9a9fa5d-4630-4300-99c5-6bed8ae79648/docs/DEV_DEEP_LINKS.md:1) instead of manually re-navigating every time
- run `npm run verify:app` when the change touches page registration, scene tagging, or top-level page structure
- run `npm run verify:focus` when the change touches default landing focus, directional navigation, DUI enter/leave, or overlay focus
- run `npm run verify:layout` when the change touches clipping, last-row reveal, bottom breathing room, or edge masks
- run `npm run build`
- run targeted `eslint` on touched TS/TSX files
- run `git diff --check`

If the change touches focus or layout, test:

- first focus landing
- arrow navigation across every boundary
- DUI enter / leave path
- right edge clipping
- bottom row reveal
