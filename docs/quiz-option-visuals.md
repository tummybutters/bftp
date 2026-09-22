# Quiz option artwork

Created September 22, 2026 with the built-in `image_gen` tool (not the fallback CLI). One call per distinct asset. Final transparent WebP assets are in `site/public/assets/quiz/`; the quiz serves precompressed images through content-hashed static imports. Original selected PNGs and alpha/size verification are retained locally in `qa/quiz-visuals/` (excluded from Git).

The images are decorative: existing labels provide accessible names. Service, property, timing, device count and contact preference retain their existing values and behavior. Address entry remains a text/search step. Numeric device options reuse one device illustration with the existing exact number beside it; both uncertainty options reuse the guidance illustration.

## Initial service prompt

Use case: product-mockup. Asset type: one production website quiz choice illustration, a square transparent PNG cutout. Style: premium photorealistic 3D catalog photography, crisp realistic material edges, restrained detail readable at 110 pixels, not cartoon. Soft studio light from upper left, three-quarter front view, centered full object with 12 percent transparent padding. Coordinated materials: natural brass/bronze, dark navy enamel and small warm orange accents, appropriate to a professional Southern California backflow testing company. GENUINELY TRANSPARENT ALPHA BACKGROUND, no floor, no wall, no scenery, no solid white background, no baked checkerboard, no cast shadow outside the object, no frame. No words, letters, numbers, logos, watermark or people. Only one complete isolated composition. Subject:

- `testing`: A realistic compact bronze reduced-pressure backflow preventer being tested: one industrial dual-valve backflow assembly with two small blue valve handles, one clear round differential pressure test gauge and neatly connected red and blue testing hoses. Show testing equipment as a coherent tidy product grouping; no loose clutter.
- `repair`: One realistic compact bronze backflow preventer with a single adjustable steel wrench diagonally beside it, implying repair. Two blue valve handles. Tidy coherent still-life, hardware physically plausible, no extra props.
- `installation`: A new realistic bronze backflow preventer fitted between two short vertical galvanized pipe risers with elbow joints and blue shutoff handles. Complete self-contained installed assembly without ground or environment. Clean new metal.

## Property, timing and contact subjects

These initial images were corrected with the transparent extraction prompt below, preserving their foreground composition.

- `business`: A small freestanding Southern California commercial storefront building, miniature architectural model quality, one story, cream stucco, broad glazed windows, dark navy awning, warm orange entry-door accent, realistic architectural proportions. No sign lettering. Building only, no pavement slab, no environment. Use realistic building materials rather than brass.
- `apartments`: A compact elegant three-story Southern California apartment building with balconies and multiple apartment entrances, cream stucco, subtle navy window frames, terracotta accent, realistic architectural model photography. Readably multi-family rather than a mansion. Building only, no ground slab or surroundings. Use realistic building materials rather than brass.
- `home`: One inviting detached Southern California single-family home, two stories, cream stucco, a terracotta tile roof, small navy front door, realistic high-end architectural model photography, obvious house silhouette. House only, no lawn, trees, pavement slab or surroundings. Use realistic building materials rather than brass.
- `industrial`: One clean low-rise industrial warehouse building with a sawtooth roof profile and two large navy roll-up loading doors, cream and pale gray metal panels, a small orange door accent. Realistic high-end architectural model photography. Warehouse only, no trucks, smokestacks, smoke, pavement slab or surroundings. Use realistic building materials rather than brass.
- `asap`: A precision navy analog stopwatch with a warm orange push button and bright orange hand, clean silver metal rim. Blank dial with simple subtle hour tick marks, no numbers or typography. Small strong single-object silhouette representing urgent service.
- `week`: A small upright cream desk calendar with two navy binding rings. Face has one horizontal row of exactly seven simple square day cells, with the first five highlighted in muted orange, minimal embossed detail and no numbers or words. Single solid three-dimensional calendar object, no separate props.
- `pricing`: A compact premium navy calculator with pale blank keys and a blank glass display, leaning against one cream estimate sheet with subtle embossed lines but no writing. One tiny warm orange equals key without a visible symbol. Neat clear product grouping representing getting a price, not a payment.
- `device`: Exactly one compact realistic bronze reduced-pressure backflow prevention assembly, short horizontal bronze body with two blue quarter-turn shutoff handles and a small downward relief outlet. Standalone complete fitting viewed at three-quarter angle, no hoses, no pipes extending outside frame, no tools. Strong simple silhouette readable at 50 pixels.
- `call`: A single elegant navy telephone handset, classic recognizable receiver shape, gently tilted diagonally, subtle glossy material and one discreet warm orange detail. No base, no cable, no floating lines or extra symbols.
- `email`: One crisp cream paper envelope, slightly open to reveal a navy card, tiny warm orange circular seal on the flap. Premium tactile paper texture and dimensional folded edges, clear instantly readable email/contact metaphor. No letters or writing.

### Final background extraction prompt

For each of the ten subjects above, the initial image was supplied as the edit target:

> Use case: background-extraction. Edit target: attached {asset name} image. Remove the entire background and all floor shadows, output a TRUE TRANSPARENT ALPHA PNG cutout. Preserve the foreground object, materials, lighting, perspective, color and crisp detail. Center the complete isolated object within a square canvas with 12% transparent padding. No white or colored background, no checkerboard baked into pixels. Remove any tiny lettering, logos or numbers on the object. Keep otherwise unchanged.

## Final guidance and month prompts

Shared prefix:

> Use case: product-mockup. One square production website quiz choice illustration: premium realistic 3D catalog photography, crisp edges, readable at 110px. Soft studio light, three-quarter view, centered complete object with 12 percent padding. Dark navy, warm cream, small orange accents. GENUINELY TRANSPARENT ALPHA PNG BACKGROUND. No floor, shadows outside object, scenery, white backdrop, checkerboard, words, logos, watermark or people. Subject:

- `guidance`: One dark navy clipboard with cream sheet, three blank checklist lines with checkmarks and a brass-rimmed magnifying glass. Coherent tidy product grouping.
- `month`: One small upright cream desk calendar with two navy binding rings. Full-month grid of five rows and seven columns of simple embossed day cells, one orange highlighted cell. No numbers or words.

## Delivery

Selected PNGs are resized to 224 × 224 and encoded as WebP at quality 72 with alpha quality 90, preserving transparency. The complete set is 126,760 bytes (65% smaller than the original 365,584-byte sources). No scripted background removal or artistic edits were applied. Static imports produce content-hashed, immutable image URLs. The quiz preloads all 15 small images at low priority and renders current choices eagerly with `unoptimized`, avoiding click-time optimizer requests. Only the current quiz step mounts its visible pictures.
