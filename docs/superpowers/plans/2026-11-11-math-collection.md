# Expanded mathematical collection implementation plan

Goal: 240 total levels, with 120 mathematical puzzles using 20 recognizable patterns.
Architecture: preserve levels 1–140 exactly; extend the deterministic pattern factory and keep the existing Color Zen rules, local saves, manual hints and offline cache.
Tech stack: buildless JavaScript, SVG, CSS, Node assertions and Chrome CDP tests.

- [x] Extend tests first: exact count, chapter mapping, geometry, unique layouts and logical solutions for 121–240; snapshot 1–140 for compatibility.
- [x] Add ten patterns and four puzzle profiles (nested colours, limited white movers, black shell, repeated protected colours) in zen/patterns.js. Expose 12 chapters and 240 levels from zen/levels.js.
- [x] Update menu labels, total, offline cache and README. Keep all chapters at 20 directly selectable levels.
- [x] Run full core checks; complete each mathematical level through UI controls, verify old saves, phone layouts and offline loading. Inspect screenshots of the new patterns.
Review focus: old session compatibility; no starting overlaps or out-of-bounds shapes; repeated colours require shields; wildcard order can matter; last level wraps at 240.

Validation: all Node rule/geometry/solver/offline tests pass. Chrome mobile checks replay all 120 mathematical puzzles, validate native drag and tap hints, restored progress, 320px navigation, landscape/desktop layout, and offline level 240. Two review findings were fixed: unchecked hint curves and fallback tap instructions.
