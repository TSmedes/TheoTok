# TheoTok Resource Expansion Plan

> Decisions locked 2026-09-03. This file is the single source of truth for expansion work.
> Prior research report (4-agent) summarized ~896 cards (368 scripture / 380 doctrine / 148 history, 76 sources) and evaluated extra texts, translations, card growth, history verification, and storage. That research is archived below as context; action items here supersede any balancing/capping advice from it.

## Decisions

| # | Decision | Detail |
|---|----------|--------|
| 1 | **No tradition balancing** | Do not cap or throttle by tradition. Import whatever is worth importing per tradition; users filter via `Tradition` in-app (`src/content/types.ts:7`). Reformed may end up larger — accepted. |
| 2 | **Swap KJV → NIV (Protestant canon) + companion modern translation for deuterocanon** | Replace bundled translation. NIV for the 66-book Protestant canon; pair with a stylistically similar modern translation that has a deuterocanon/Apocrypha edition for the 14 books currently in `src/content/books.ts:63` (`1ES`–`2MA`, `TOB`–`BAR`, etc.). Copyright not a constraint — not distributed, personal use only. See Action B1 for pairing. |
| 3 | **Keep JSON bundling** | No SQLite, no backend, no chunking, no CDN. Cards remain static JSON imports via `src/content/library.ts:41`. `src/content/bible/kjv/*.json` pattern stays (renamed to `niv/`), `feed-verses.json` tier-one slice stays, `bookMap.generated.ts` + `loader.ts`/`loader.web.ts` stay. |

---

## A. Additional Texts (Tradition-Specific & Ecumenical)

> Source registry: `src/content/sources/sources.json`. Schema: `src/content/schema.ts`. All additions get a `Source` entry; doctrine cards map `sourceId`+`locus`. With balancing lifted, import at full usable yield (capped only by `BODY_MAX_CHARS 400` / `PROMPT_MAX 120`).

### A1. Lutheran — Book of Concord completions (same PD Triglotta 1921 as existing `augsburg`/`small-catechism`)

- [ ] **Apology of the Augsburg Confession** (Melanchthon, 1531) — largest yield, ~60-80 usable cards
- [ ] **Smalcald Articles** (1537)
- [ ] **Treatise on the Power and Primacy of the Pope** (1537)
- [ ] **Epitome of the Formula of Concord** (1577) — concise half vs already-bundled Solid Declaration; more card-friendly
- [ ] **Catalog of Testimonies** (1580)

*Pipeline: extend `scripts/import-confessions.ts` PLANS or hand-curate via `src/content/cards/doctrine.json` style. Source already `triglotta 1921`.*

### A2. Reformed — import everything usable from Creeds.json without caps

`https://github.com/NonlinearFruit/Creeds.json` — 43 files, 30 unimported. Usable public-domain set (import at full `BODY_MIN 25`/`BODY_MAX 400` yield, stride across doc):

- [ ] `westminster_larger_catechism` (~117 usable, source `wlc` already registered)
- [ ] `second_helvetic_confession` (~630 expanded / 30 ch — largest in set)
- [ ] `french_confession_of_faith` (~103 expanded / 42 art)
- [ ] `scots_confession` (~135 / 25)
- [ ] `consensus_tigurinus` (~43 / 26)
- [ ] `tetrapolitan_confession` (~216 / 25)
- [ ] `zwinglis_67_articles` (~69 / 69)
- [ ] `zwinglis_fidei_ratio` (~186 / 13 chunked)
- [ ] `first_helvetic_confession` (~15 / 19)
- [ ] `first_confession_of_basel` (~30 / 13)
- [ ] `waldensian_confession` (~15 / 14)
- [ ] `ten_theses_of_berne` (~10 / 10)
- [ ] `abstract_of_principles` (1858, Baptist but in Creeds.json; ~24 / 20) — keep under `baptist` filter
- [ ] `matthew_henrys_scripture_catechism`, `puritan_catechism` (Spurgeon), `exposition_of_the_assemblies_catechism`, `shorter_catechism_explained` — each ~80-110 usable
- [ ] `1695_baptist_catechism` (109 / 114) — align id with existing `baptist-catechism` `sources.json:163`
- [ ] Fragmentary single-para creeds worth 1 card each: `gregorys_declaration_of_faith`, `irenaeus_rule_of_faith`, `tertullians_rule_of_faith`, `ignatius_creed`

*No caps. `import-confessions.ts:201` `stride()` already spreads across document; remove cap logic or set caps to usable count.*

### A3. Baptist

- [ ] **First London Confession 1644** (vs 1689 `lbcf-1689` already present)
- [ ] **New Hampshire Confession 1833** (18 arts, fills American gap)
- [ ] **Abstract of Principles 1858** (20 arts, SBTS charter) — if not covered via A2
- [ ] `baptist-catechism` alias cleanup (`keach` is the same work as 1693 Baptist Catechism; merge or alias)

### A4. Anglican

- [ ] **BCP 1662 Catechism** section — same `bcp-1662` sourceId, generate 5-8 cards from catechism (currently only liturgy)
- [ ] **Homilies Book I/II** selections (e.g., Homily on Salvation, on Reading Scripture) — EEBO TCP
- [ ] Expand `articles-39` from 3 → ~15-20 articles (many are single-sentence, fit `BODY_MAX`)
- [ ] Expand `bcp-1662` collects (Collect for Purity, General Thanksgiving etc.) — 8-12 cards

### A5. Catholic

- [ ] Expand `trent-catechism` from 1 → ~20 (1566 Roman Catechism)
- [ ] Expand `trent-council` Decrees (Justification ch.7, Sacraments canons) — 33 canons available
- [ ] **Unam Sanctam** (Boniface VIII, 1302) — single-page, high signal
- [ ] **Newman, Essay on Development** (1845) selections — Gutenberg PD (more doctrinal than existing `newman_apologia`)

*Note: `ccc` (`sources.json:218` `redistributable:false`) stays excluded — no change needed per Decision 2 personal-use scope? Keep excluded unless explicitly decided to include.*

### A6. Orthodox

- [ ] **Confession of Peter Mogila** (1640, Kievan) — Schaff vol.3 / CCEL
- [ ] **Confession of Dositheus / Synod of Jerusalem** (1672, 18 decrees) — Schaff vol.3
- [ ] **Philokalia** selections via PD patristic originals (John Climacus *Ladder* etc.; avoid Palmer/Ware 1979 copyrighted translation)
- [ ] Expand `philaret` (Longer Catechism ~300 QA → ~120 usable) — single largest Orthodox addition

### A7. Ecumenical / Patristic & Missing Traditions

- [ ] **Council of Ephesus — Definition & 12 Anathemas of Cyril** (431) — between Nicaea/Chalcedon
- [ ] **Constantinople II** (553, Three Chapters) + **Constantinople III** (680-81, Two Wills) — completes first 6 ecumenical councils (have Nicaea, Chalcedon, Orange)
- [ ] **1 Clement** (c.96) — next Apostolic Father after Didache/Ignatius/Polycarp
- [ ] **Shepherd of Hermas** (Mandates/Similitudes, abridged) — diverse patristic voice
- [ ] **Schleitheim Confession** (1527, Anabaptist, 7 arts) — map to `ecumenical` unless adding `anabaptist` to `Tradition` enum
- [ ] **Dordrecht Confession** (1632, Mennonite, 18 arts)
- [ ] **General Rules of the Methodist Societies** (Wesley, 1743) — already in Wesley corpus, generatable without new source

*Pentecostal systematic texts remain intentionally omitted — no pre-1929 PD systematic; Ag 1916 still copyrighted.*

### A8. Expand from already-bundled sources (no new Source entries)

- [ ] `vincent-commonitory` → +4-6 cards
- [ ] `large-catechism` / `formula-concord` companions to `small-catechism`/`augsburg` — hand-curate 15-20 each
- [ ] `wesley-sermons` Standard Sermons (44 sermons) + `wesley-journal` — +15 Methodist
- [ ] `aquinas-summa` / `anselm` selections — if desired

---

## B. Bible Translation — KJV → NIV (Protestant Canon) + Companion for Deuterocanon

> Current: `scripts/build-bible.ts:22` `TRANSLATION = 'eng_kja'` (KJV+Apocrypha, 80 books per `src/content/books.ts:63`, output `src/content/bible/kjv/`, `bookMap.generated.ts` `BOOK_FILES` lazy requires, `loader.ts` native / `loader.web.ts` web fetch from `public/bible/kjv/`). `scripts/build-feed-verses.ts:36` collects `ref`+`proofTexts` → `feed-verses.json` 369 verses.
>
> NIV covers only the 66-book Protestant canon — it has no deuterocanon/Apocrypha edition. The 14 deuterocanon books used by `catholic`/`orthodox` cards (`TOB`, `JDT`, `WIS`, `SIR`, `BAR`, `1MA`–`2MA`, `1ES`–`2ES`, `SUS`, `BEL`, `MAN`, `ESG` etc. — `src/content/books.ts:63` section `apocrypha`) still need a modern text. Per updated Decision 2, pair NIV with a stylistically similar modern translation that does include deuterocanon. Copyright not a constraint (personal use).

- [ ] **B1. Resolve sources — NIV (66) + companion deuterocanon translation** — obtain both texts in `complete.simple.json`-compatible shape (or adapt `normalise()`/`cleanVerse()` in `scripts/build-bible.ts:92`). No `bible.helloao.org` NIV exists; requires private source files.
  - **NIV** for Protestant canon (66 books) — private source required.
  - **Companion for deuterocanon (14 books)** — choose a modern translation close in style/register to NIV that has a deuterocanon edition. Shortlist (closest first):
    - **NRSV / NRSVue** (1989/2022) — the standard critical-text modern peer to NIV; has full Apocrypha; closest stylistic/lexical match. Recommended default.
    - **ESV with Apocrypha** (2009) — more formal than NIV but shares NIV-era modern English; Apocrypha edition exists (Oxford/Cambridge).
    - **NABRE** (2011) — Catholic, has deuterocanon, but register diverges more from NIV.
    - Any other modern with deuterocanon is acceptable — criterion is "reads like NIV" so cards feel tonally consistent when browsing across canons.
  - Obtain 14 deuterocanon books as per-book JSON matching the same `BibleBook` shape (`src/content/bible/types.ts:2`).
- [ ] **B2. Retarget build pipeline for dual-source** — update `scripts/build-bible.ts:22` `TRANSLATION` + `SOURCE_URL`, `OUT_DIR`, `CACHE` key, `writeBookMap()` prefix to support two origins:
  - Option A (recommended, minimal change): keep single output dir `src/content/bible/niv/` (or `src/content/bible/modern/`) but build 66 books from NIV source + 14 books from companion source, merged before `writeBookMap()`. Tag provenance per book (e.g., `source` field) if needed for attribution.
  - Option B: two output dirs (`niv/` + `niv-deutero/` or `nrsv-apoc/`) and a merged `bookMap.generated.ts` that points apocrypha ids to companion dir.
  - Keep `cleanVerse()` red-letter fix if source has `wordsOfJesus` spans; otherwise simplify per source.
- [ ] **B3. Keep book registry intact** — `src/content/books.ts:63` 80 books stays as-is (no filtering). Build must write all 80 ids: 66 from NIV, 14 from companion. `citationName()` unchanged. `BOOKS` `section` field (`apocrypha` vs `ot`/`nt`) already routes apocrypha provenance if needed.
- [ ] **B4. Rebuild artifacts** — `npm run build:bible -- --refresh` → 80 per-book JSONs (66 NIV + 14 companion) + `src/content/bible/bookMap.generated.ts` + `public/bible/niv/` (or `modern/`) via `scripts/sync-web-bible.ts:28`. Update `sync-web-bible.ts` source dir if renamed.
- [ ] **B5. Regenerate `feed-verses.json`** — `npm run build:verses` must re-resolve every `scripture.json` `Ref` + `doctrine` `proofTexts` against the merged text (NIV for 66, companion for 14). Any verse > `BODY_MAX 400` under the new translations (different lengths vs KJV) will be flagged by `build-scripture-cards.ts:499` skip path — review and adjust `LIST` ranges if needed.
- [ ] **B6. Update render attribution — canon-aware** — `src/content/render.ts:45` hard-codes `attribution = "King James Version"` for `scripture` type → make it per-book:
  - Protestant canon books → `"New International Version"`
  - Deuterocanon books → companion attribution (e.g., `"New Revised Standard Version"` if NRSV chosen)
  - Or a single combined string if preferred (e.g., `"NIV (Protestant canon) / NRSV (Deuterocanon)"`). Update `sources.json` entries accordingly: `kjv` → `niv` + companion (e.g., `nrsv`) with `redistributable` note (copyright irrelevant per Decision 2 personal-use scope).
- [ ] **B7. Update `sources.json` + tests** — add `id:"niv"` (`tradition:"ecumenical"`, 66 books) + companion id (e.g., `id:"nrsv"`, 14 books, or `nrsv-apoc` alias). Update `src/content/__tests__/library.test.ts` expectations that assert KJV-specific strings / deuterocanon checks (`L284-312` — `traditions: ["catholic","orthodox"]` vs `["ecumenical"]` boundary may now be NIV vs companion).
- [ ] **B8. Verify with `npm run build:content && npm test`** — every `ref` must resolve, every `RenderedCard.body` ≤400, `library.test.ts` citation shapes pass for both canons.

*No helloao dependency for NIV/NRSV; both require private source files. Do not add BSB/WEB — NIV + companion covers the full 80-book set in modern English per Decision 2.*

---

## C. Card Set Expansion — Scripture, Doctrine, History

### C1. Scripture — 368 → ~550-620 (method in `scripts/build-scripture-cards.ts:36` `LIST`)

Keep curated `LIST` approach (`build-scripture-cards.ts:9` "stands on its own out of context"). `BOOKS` stays 80 — Protestant cards resolve against NIV, deuterocanon cards against companion (B1).

- [ ] Add 180-250 cards across these gaps (first wave ~100, dogfood, then second wave):
  - **Law/Torah theology** (GEN-DEU currently 20): `GEN 9:6`, `EXO 19:5-6`, `LEV 16:30`, `DEU 10:12-13`, `DEU 32:4` — ~10-12
  - **Wisdom dialogue** (JOB 5, PRO 14): `JOB 2:10`, `JOB 13:15`, `PRO 12:25`, `PRO 24:30-34`, `ECC 5:1-2` — ~10-12
  - **Prophets justice/mercy** (ISA-MAL 37): `ISA 58:6-8`, `MIC 7:18-19`, `HOS 2:14-15`, `ZEC 7:9-10` — ~15-18
  - **Psalms lament** (53 cards but 30 psalms empty): `PSA 13:1-2`, `PSA 22:1`, `PSA 42:9`, `PSA 61:2`, `PSA 73:28`, `PSA 131` — ~12-15
  - **Gospel parables/hard sayings** (LUK light): `MAT 13:44`, `LUK 10:36-37`, `LUK 14:11`, `JHN 7:37-38` — ~15-20
  - **Acts/Pauline church & Spirit**: `ACT 2:44-47`, `ACT 13:2-3`, `ROM 8:15-16`, `1CO 12:7`, `EPH 1:11-14`, `EPH 4:1-3` — ~18-22
  - **Pastoral/eschatological**: `1TH 4:13-14`, `TIT 2:11-12`, `2TI 2:13`, `HEB 13:14`, `REV 22:17` — ~15-18
  - **Deuterocanon** (companion text, `catholic`/`orthodox` only): `WIS 7:26`, `WIS 9:1-2`, etc. — ~8-10
- [ ] Enforce per-PR quality gates: standalone test, NIV (or companion for deuterocanon) text ≤400 after concatenation, maps to theological theme, dedup pericopes (`build-scripture-cards.ts:458` `seen` set), no book >30% growth without justification.

### C2. Doctrine/Catechism — ~380 → ~750-1100 (no caps)

- [ ] Import all usable from A2 at full yield (remove caps in `scripts/import-confessions.ts:52` `PLANS` or set to usable counts). Re-run `npm run build:confessions`.
- [ ] Hand-curate A1/A3-A8 additions via `src/content/cards/doctrine.json` (20 hand-written) or new per-tradition files (keep `library.ts:38` hand vs generated split).
- [ ] Verify `BODY_MAX`/`PROMPT_MAX` via `import-confessions.ts:28` / `schema.ts:13` and `chunk()` sentence splitting.

### C3. History — 148 → ~180-185 (30-35 cards)

- [ ] Early medieval refill (700-1200 gap): `his-photian-schism` 867, `his-iconoclast-council-787` 787, `his-otto-missions-poland` 966, `his-fourth-lateran` 1215, `his-dominic-francis-orders` 1216, etc. — ~8
- [ ] Late medieval / pre-Reformation: `his-bridget-sweden` 1373, `his-conciliar-movement` 1415, `his-savonarola-florence` 1498 — ~4
- [ ] Reformation depth: `his-trent-decree-justification` 1547, `his-book-of-concord` 1577, `his-king-james-preface` 1611 — ~6
- [ ] Global / 20th c. / post-1965: `his-bonhoeffer-costly-grace` 1937, `his-chinese-house-church` 1966-76, `his-east-african-revival` 1935, `his-ugandan-martyrs` 1885, `his-berlin-wall-prayers` 1989, `his-lausanne-1974` etc. — pick 8-10 prioritizing Global South + resistance
- [ ] Missing voices: `his-macrina-theologian` 380, `his-hildegard-visions` 1150, `his-kassia-hymnographer` 843, `his-seraphim-sarov` 1833 — ~5
- [ ] Enforce history quality: `headline` hook + `body` tellable in ~45s, `PROMPT_MAX`/`BODY_MAX`, significance filter (changes worship/governance/belief OR virtue at cost OR explains present), no century >15% after expansion.

---

## D. Church History Source Verification

> Current: every `HistoryCard` has `sourceId`+`locus`+`year` (`src/content/types.ts:106`, `render.ts:77`, `schema.ts:71`). `render.ts:20` `formatSourceCitation()` uses `source.locusPrefix`. 69/148 cite `schaff-history` with no locus — unfalsifiable. Spot-checks found 1 wrong source + 2 weak/outdated claims.

- [ ] **D1. Fix data bugs:**
  - `his-athanasius-festal-letter:202` — `sourceId:"athanasius-incarnation"` is wrong (Festal Letter 367 ≠ *On the Incarnation* c.318). Add source `athanasian-festal-39` and set `locus:"39"` (or similar).
  - `his-bede-translating-dying:137` — source is not `bede-he` but **Cuthbert's Letter on Death of Bede**. Add source `cuthbert-letter` and correct `locus`/body (last sentence ~John 6:9 region, not final verse).
  - `his-lindisfarne-gospels:350` — claim "lapis lazuli from Afghanistan" outdated; Raman (2013) shows **azurite**. Correct body and change source from `bede-he` to `british-library` or `blair-lindisfarne`.
- [ ] **D2. Enforce loci:** add `scripts/check-citations.ts` (or `yarn check:citations`) that fails when `source.locusPrefix` defined but card `locus` missing, and when `sourceId==="schaff-history"` and `year>1890` (anachronistic — Schaff died 1893). 70 violations to backfill.
- [ ] **D3. Backfill `Source.url` + `locusUrlTemplate`:** `src/content/types.ts:65` `url` exists but only `kjv` populated. Add URLs for top sources: `eusebius-he` → `newadvent.org/fathers/2501.htm`, `bede-he` → `gutenberg.org/ebooks/38326`, `pliny-letters` → `faculty.georgetown.edu/jod/texts/pliny.html`, `schaff-history` → `ccel.org/ccel/schaff/hcc*.html`, etc. New `RenderedCard.citationUrl` optional if tappable citations desired.
- [ ] **D4. Re-source Schaff catch-all:** migrate modern/global `schaff-history` cards to primaries or PD secondaries with locus; keep Schaff only for medieval narrative where primary fragmentary. Add new sources as needed (`eusebius-vc`, `ephesus-acts`, `cuthbert-letter`, `bonhoeffer-discipleship` flagged `redistributable:false` if quoting copyrighted — prefer paraphrase per existing style).
- [ ] **D5. Verification workflow for new cards:** author quotes 2-3 lines of source in PR; reviewer reproduces from independent translation (e.g., McGiffert vs Lake for Eusebius). Pin edition via `licenseNote` + URL fragment.

---

## E. Storage & Scaling (Keep JSON — Decision 3)

> Measured: cards 361k pretty / 277k dense (69k gz), `feed-verses.json` 57k (21k gz), `kjv` 5.16 MB (1.55 MB gz), total content 5.64 MB. Native JS ~8.3 MB raw / 2.34 MB gz with KJV bundled; web `dist/entry-*.js` 3.16 MB raw / 790k gz excludes KJV (lazy `loader.web.ts`). Zustand persistence stores only ids (`store/seen.ts:10` `SEEN_LIMIT 500`) — not bodies. `buildPool.ts:29` O(n) filter <5ms at 896, still <5ms at 5k.
>
> Projections same mix: 3k → 928k raw / 233k gz; 5k → 1.55 MB / 388k (2.01 MB / 599k for 1k/2k/2k mix); 10k → 3.1 MB / 776k. With KJV at 5k: ~7.2 MB raw / 2.0 MB gz. Store limits 150-200 MB compressed — headroom 100×. No backend needed; JSON stays fine to ~5k (scripture-heavy) / ~3k (history-heavy). Beyond 8-10k consider SQLite — not in scope per Decision 3.

- [ ] No action required beyond normal bundling. If later hitting >8k or adding search, revisit `expo-sqlite` / chunked JSON / CDN per research — explicitly out of scope for now.
- [ ] Keep `library.ts:41` static imports; keep `build-bible.ts` + `build-feed-verses.ts` + `sync-web-bible.ts` pipeline; keep `SEEN_LIMIT` cap.
- [ ] Optional hygiene: emit minified dense JSON (saves 23% already measured: 361k→277k), ensure gz served.

---

## Execution Order (Suggested)

| Step | File / Command | Verifies |
|------|----------------|----------|
| 1 | D1 bug fixes + D2 lint + D3 URLs | `npm test` |
| 2 | B1-B8 NIV (66) + companion deuterocanon (14) swap | `npm run build:content && npm test` |
| 3 | C1 scripture wave 1 (~100) — edit `scripts/build-scripture-cards.ts:36` `LIST` | `npm run build:scripture && npm run build:verses && npm test` |
| 4 | A1-A8 + C2 doctrine (no caps) — `scripts/import-confessions.ts:52` + `src/content/cards/doctrine.json` | `npm run build:confessions && npm test` |
| 5 | C3 + D4 history +30 | `npm test` |
| 6 | C1 wave 2 + remaining A/C2 | `npm run build:content` |

All commands: `npm run build:content` = `build:confessions && build:scripture && build:verses && test` (`package.json:58`).

---

## Research Context (Pre-Decision)

*Prior 4-agent research recommended balancing via caps, BSB/WEB as PD translation (on `bible.helloao.org`), and SQLite/chunking/CDN at scale. Those recommendations are superseded by Decisions 1-3 above but retained here for reference if personal-use scope changes.*

*Key references: `src/content/types.ts:7` `Tradition`, `src/content/schema.ts:13` `BODY_MAX`, `src/content/books.ts:63` apocrypha, `src/content/render.ts:45` KJV attribution, `src/content/__tests__/library.test.ts:284` deuterocanon checks, `AGENTS.md:1` Expo v57 docs.*

