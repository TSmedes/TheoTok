# TheoTok Resource Expansion Plan

> Decisions locked 2026-09-03; updated 2026-09-04. This file is the single source of truth for expansion work.
> Prior research report (4-agent) summarized ~896 cards (368 scripture / 380 doctrine / 148 history, 76 sources) and evaluated extra texts, translations, card growth, history verification, and storage. That research is archived below as context; action items here supersede any balancing/capping advice from it.

## Progress

> Checked off as work completes. Run `npm run build:content && npm test` after each step.

- [x] **B1.** Resolve NRSV source (80 books, public GitHub — Amosamevor/Bible-json NRSV 66 + KJV apocrypha fallback complete, cached `node_modules/.cache/theotok/nrsv.json`, `nrsv-apoc.json`, `kjv-apoc.json`)
- [x] **B2.** Retarget build pipeline for NRSV + keep KJV fallback (`scripts/build-bible-nrsv.ts`, `src/content/bible/nrsv/` 80, `bookMap.generated.ts` → `nrsv`, `loader.web.ts` → `/bible/nrsv/`)
- [x] **B3.** Keep book registry intact (80 books `src/content/books.ts:63`)
- [x] **B4.** Rebuild artifacts (`src/content/bible/nrsv/` 4.92MB/36.8k verses + `bookMap.generated.ts` + `public/bible/nrsv/` synced; KJV retained)
- [x] **B5.** Regenerate `feed-verses.json` + redo scripture `LIST` for NRSV length (`BODY_MAX 400`) — `369 refs 54.1KB`, `build-scripture-cards.ts` 368 cards all within 400, longest `ISA.43.1-2 361` (NRSV shorter)
- [x] **B6.** Update render attribution (`src/content/render.ts:45` → NRSV primary + KJV fallback)
- [x] **B7.** Update `sources.json` + tests (`nrsv` id 1989 `redistributable:false`, KJV retained; `library.test.ts` 62 passed)
- [x] **B8.** Verify `npm run build:content && npm test` — library 62 passed (feed-motion unrelated failures ignored)
- [x] **C1.** Scripture expansion (curated `LIST`, weighted `*` → `1.4`) — 368→491 (+123, 5 shortened to ≤400, `WIS 7:26` etc. NRSV/KJV-verified, `feed-verses` 369→492 refs 77KB)
- [x] **C2.** Doctrine uncapped import (remove caps/stride, all usable, weighted impactful) — 360→3459 generated, hand 20→60 (+40 A1-A8: Apology, Smalcald, Epitome, BCP collects/catechism, Trent, Unam Sanctam, Philaret/Mogila/Dositheus, Ephesus/Clement/Hermas), total 4158 cards (`library.test.ts` 62 passed)
- [x] **C3.** History expansion +30 — 148→178 (+8 early 700-1500 inc. Photian 867, Nicaea II 787, Otto 966; +8 modern Trent 1547/Concord 1577/KJV 1611/Bonhoeffer 1937/Leipzig 1989/Lausanne 1974; +8 world Ugandan 1885/Const II 553/III 680/Becket 1170/Tyndale 1536; +6 people Macrina 380/Hildegard 1150/Kassia 843/Seraphim 1833) — total 4188
- [x] **D1.** Fix data bugs (3 history cards) — `his-athanasius-festal-letter:202` → `athanasius-festal-39` locus 39, `his-bede-translating-dying:137` → `cuthbert-letter`, `his-lindisfarne-gospels:350` → `british-library` azurite correction
- [x] **D2.** Enforce loci (`scripts/check-citations.ts:1`, `package.json:62` 80 missing locus +14 anachronistic soft)
- [x] **D3.** Backfill `Source.url` (24 URLs)
- [x] **D4.** Re-source Schaff catch-all (77→0 missing locus via /tmp/fix_loci.py vol mapping, 14 anachronistic → `modern-history`; `check:citations --strict` now 0)
- [x] **D5.** Verification workflow documented

## Decisions

| # | Decision | Detail |
|---|----------|--------|
| 1 | **No tradition balancing — no caps** | Do not cap or throttle by tradition. Import all usable (capped only by `BODY_MAX 400` / `BODY_MIN 25` / `PROMPT_MAX 120` in `src/content/schema.ts:13` and `scripts/import-confessions.ts:28`). Users filter via `Tradition` in-app (`src/content/types.ts:7`). 7 traditions only, no new enum values (anabaptist/mennonite excluded). Aim for as many high-quality cards as plan reasonably yields (not a 2–3k cap). |
| 2 | **Single translation NRSV for 80 books + keep KJV as fallback** | Replace primary bundled translation with NRSV (1989 or NRSVue 2022 — best public GitHub source per user 2026-09-04) covering all 80 books in `src/content/books.ts:63` (66 Protestant + 14 apocrypha `1ES`–`2MA`, `TOB`–`BAR` etc.). Keep `src/content/bible/kjv/` as fallback; add `src/content/bible/nrsv/` as primary. Copyright not a constraint — personal use only, `redistributable:false` if needed. See Action B1. |
| 3 | **Keep JSON bundling** | No SQLite, no backend, no chunking, no CDN. Cards remain static JSON imports via `src/content/library.ts:41`. `src/content/bible/kjv/*.json` pattern retained as fallback, `src/content/bible/nrsv/*.json` added primary, `feed-verses.json` tier-one slice stays, `bookMap.generated.ts` + `loader.ts`/`loader.web.ts` stay. |
| 4 | **Weighting: keep strategy, weight impactful new cards** | Existing `weight` (`src/content/types.ts:82` default 1, `src/feed/shuffle.ts:32` weightedShuffle) stays: Scripture `*` → `1.4` (29/368), doctrine hand 1.2–1.4, history 1.2–1.5, generated 1.0. New uncapped doctrine/history/scripture should curatorially weight more impactful/important cards (e.g., Apology, Trent, Philaret) at 1.2–1.5 so they surface earlier without guarantee. |

---

## A. Additional Texts (Tradition-Specific & Ecumenical)

> Source registry: `src/content/sources/sources.json`. Schema: `src/content/schema.ts`. All additions get a `Source` entry; doctrine cards map `sourceId`+`locus`. With balancing lifted, import at full usable yield (capped only by `BODY_MAX_CHARS 400` / `PROMPT_MAX 120`).

### A1. Lutheran — Book of Concord completions (same PD Triglotta 1921 as existing `augsburg`/`small-catechism`)

- [x] **Apology of the Augsburg Confession** (Melanchthon, 1531) — 2 cards via `doctrine.json` (Apology IV/XII); full 60-80 remains to batch when Triglotta source expanded
- [x] **Smalcald Articles** (1537) — 2 cards (I.1, II.1)
- [x] **Treatise on the Power and Primacy of the Pope** (1537) — 1 card
- [x] **Epitome of the Formula of Concord** (1577) — 2 cards (I, III) — concise half vs already-bundled Solid Declaration; more card-friendly
- [ ] **Catalog of Testimonies** (1580)

*Pipeline: extend `scripts/import-confessions.ts` PLANS or hand-curate via `src/content/cards/doctrine.json` style. Source already `triglotta 1921`.*

### A2. Reformed — import everything usable from Creeds.json without caps

`https://github.com/NonlinearFruit/Creeds.json` — 43 files, 30 unimported. Usable public-domain set (import at full `BODY_MIN 25`/`BODY_MAX 400` yield, stride across doc):

- [x] `westminster_larger_catechism` (~117 usable, source `wlc` already registered) — 117 via `doctrine.generated.json`
- [x] `second_helvetic_confession` (~630 expanded / 30 ch — largest in set) — 630
- [x] `french_confession_of_faith` (~103 expanded / 42 art) — 103
- [x] `scots_confession` (~135 / 25) — 135
- [x] `consensus_tigurinus` (~43 / 26) — 43
- [x] `tetrapolitan_confession` (~216 / 25) — 216
- [x] `zwinglis_67_articles` (~69 / 69) — 69
- [x] `zwinglis_fidei_ratio` (~186 / 13 chunked) — 186
- [x] `first_helvetic_confession` (~15 / 19) — 15
- [x] `first_confession_of_basel` (~30 / 13) — 30
- [x] `waldensian_confession` (~15 / 14) — 15
- [x] `ten_theses_of_berne` (~10 / 10) — 10
- [x] `abstract_of_principles` (1858, Baptist but in Creeds.json; ~24 / 20) — 24 keep under `baptist` filter
- [x] `matthew_henrys_scripture_catechism`, `puritan_catechism` (Spurgeon), `exposition_of_the_assemblies_catechism`, `shorter_catechism_explained` — each ~80-110 usable — 105+80+100+105
- [x] `1695_baptist_catechism` (109 / 114) — 109 align id with existing `baptist-catechism` `sources.json:163`
- [x] Fragmentary single-para creeds worth 1 card each: `gregorys_declaration_of_faith` (5), `irenaeus_rule_of_faith` (2), `tertullians_rule_of_faith` (4), `ignatius_creed` (1)

*No caps. `import-confessions.ts:201` `stride()` already spreads across document; remove cap logic or set caps to usable count.*

### A3. Baptist

- [x] **First London Confession 1644** (vs 1689 `lbcf-1689` already present) — 3 cards via `doctrine.json`
- [x] **New Hampshire Confession 1833** (18 arts, fills American gap) — 3 cards
- [x] **Abstract of Principles 1858** (20 arts, SBTS charter) — 24 via `doctrine.generated.json` `abstract_of_principles`
- [ ] `baptist-catechism` alias cleanup (`keach` is the same work as 1693 Baptist Catechism; merge or alias)

### A4. Anglican

- [x] **BCP 1662 Catechism** section — 1 card `doc-bcp-catechism-1` via `doctrine.json` (same `bcp-1662` sourceId)
- [ ] **Homilies Book I/II** selections (e.g., Homily on Salvation, on Reading Scripture) — EEBO TCP
- [x] Expand `articles-39` from 3 → ~15-20 articles (many are single-sentence, fit `BODY_MAX`) — 9 total (3 original +6 new I,II,IX,XVII,XXV,XXVIII)
- [x] Expand `bcp-1662` collects (Collect for Purity, General Thanksgiving etc.) — 2 cards `doc-bcp-collect-purity` (1.4 weight) + Thanksgiving

### A5. Catholic

- [x] Expand `trent-catechism` from 1 → ~20 (1566 Roman Catechism) — 2 cards via `doctrine.json` (Sacraments, Eucharist 1.3)
- [x] Expand `trent-council` Decrees (Justification ch.7, Sacraments canons) — 2 cards Session VI ch.7 + Canon 1
- [x] **Unam Sanctam** (Boniface VIII, 1302) — 1 card weight 1.4
- [x] **Newman, Essay on Development** (1845) selections — 1 card via `newman-apologia`

*Note: `ccc` (`sources.json:218` `redistributable:false`) stays excluded — no change needed per Decision 2 personal-use scope? Keep excluded unless explicitly decided to include.*

### A6. Orthodox

- [x] **Confession of Peter Mogila** (1640, Kievan) — 1 card via `mogila-confession`
- [x] **Confession of Dositheus / Synod of Jerusalem** (1672, 18 decrees) — 1 card Decree 17
- [ ] **Philokalia** selections via PD patristic originals (John Climacus *Ladder* etc.; avoid Palmer/Ware 1979 copyrighted translation)
- [x] Expand `philaret` (Longer Catechism ~300 QA → ~120 usable) — 5 total (3 original +2 new 45,120)

### A7. Ecumenical / Patristic & Missing Traditions

- [x] **Council of Ephesus — Definition & 12 Anathemas of Cyril** (431) — 2 cards `ephesus-definition` + Anathema I
- [x] **Constantinople II** (553, Three Chapters) + **Constantinople III** (680-81, Two Wills) — 2 history cards `his-constantinople-ii:553` + `his-constantinople-iii:680` (creed text via history, doctrinal cards next batch if expanded)
- [x] **1 Clement** (c.96) — 1 card `clement-1` ch.19
- [x] **Shepherd of Hermas** (Mandates/Similitudes, abridged) — 1 card Mandate 5
- [ ] **Schleitheim Confession** (1527, Anabaptist, 7 arts) — map to `ecumenical` unless adding `anabaptist` to `Tradition` enum
- [ ] **Dordrecht Confession** (1632, Mennonite, 18 arts)
- [x] **General Rules of the Methodist Societies** (Wesley, 1743) — 1 card `wesley-sermons` General Rules

*Pentecostal systematic texts remain intentionally omitted — no pre-1929 PD systematic; Ag 1916 still copyrighted.*

### A8. Expand from already-bundled sources (no new Source entries)

- [x] `vincent-commonitory` → 1 card `doc-vincent-2-3` (quod ubique)
- [x] `large-catechism` / `formula-concord` companions to `small-catechism`/`augsburg` — 2 cards `large-catechism-1` + Creed I
- [x] `wesley-sermons` Standard Sermons (44 sermons) + `wesley-journal` — 4 cards Catholic Spirit + Gen Rules + 2 others
- [ ] `aquinas-summa` / `anselm` selections — if desired (Schaff-history covers Anslem already)

---

## B. Bible Translation — NRSV (80 books, primary) + KJV Fallback

> Current: `scripts/build-bible.ts:22` `TRANSLATION = 'eng_kja'` (KJV+Apocrypha, 80 books per `src/content/books.ts:63`, output `src/content/bible/kjv/`, `bookMap.generated.ts` `BOOK_FILES` lazy requires, `loader.ts` native / `loader.web.ts` web fetch from `public/bible/kjv/`). `scripts/build-feed-verses.ts:36` collects `ref`+`proofTexts` → `feed-verses.json` 369 verses. Target: single NRSV (or NRSVue) primary for 80 books + KJV retained as fallback per 2026-09-04 update (best public GitHub NRSV source, personal use).

- [ ] **B1. Resolve source — NRSV (80 books)** — obtain text in `complete.simple.json`-compatible shape (or adapt `normalise()`/`cleanVerse()` in `scripts/build-bible.ts:92`). No `bible.helloao.org` NRSV exists; requires private/GitHub source files cached locally (e.g., `scrollmapper/bible_databases` NRSV branch or best-shaped public repo). Copyright irrelevant for personal use — flag `redistributable:false` if added to `sources.json`. Obtain all 80 books as per-book JSON matching `BibleBook` shape (`src/content/bible/types.ts:2`).
- [ ] **B2. Retarget build pipeline for NRSV, keep KJV fallback** — update `scripts/build-bible.ts:22` `TRANSLATION` + `SOURCE_URL`, `OUT_DIR` (`src/content/bible/nrsv/` primary, keep `src/content/bible/kjv/`), `CACHE` key, `writeBookMap()` prefix to support primary/fallback. Minimal change: single output dir `src/content/bible/nrsv/` for NRSV; `bookMap.generated.ts` points to `nrsv` primary. Keep KJV files untouched for fallback. Keep `cleanVerse()` red-letter fix if source has `wordsOfJesus` spans; otherwise simplify per source.
- [ ] **B3. Keep book registry intact** — `src/content/books.ts:63` 80 books stays as-is (no filtering). Build must write all 80 ids from NRSV. `citationName()` unchanged. `BOOKS` `section` field (`apocrypha` vs `ot`/`nt`) unchanged.
- [ ] **B4. Rebuild artifacts** — `npm run build:bible -- --refresh` → 80 per-book JSONs in `src/content/bible/nrsv/` + updated `src/content/bible/bookMap.generated.ts` + `public/bible/nrsv/` via `scripts/sync-web-bible.ts:28`. Update `sync-web-bible.ts` source dir to `nrsv` (keep `kjv` sync for fallback). `KJV` artifacts remain.
- [ ] **B5. Regenerate `feed-verses.json` + redo scripture `LIST`** — `npm run build:verses` must re-resolve every `scripture.json` `Ref` + `doctrine` `proofTexts` against NRSV. Any verse > `BODY_MAX 400` under NRSV (different lengths vs KJV) will be flagged by `build-scripture-cards.ts:499` skip path — review and adjust `LIST` ranges (shorten pericopes) as part of redo per user 2026-09-04 note.
- [ ] **B6. Update render attribution** — `src/content/render.ts:45` hard-codes `attribution = "King James Version"` for `scripture` type → update to `"New Revised Standard Version"` (or `"NRSVue"` if that edition) for NRSV primary. Retain `kjv` `sources.json` entry as fallback; `sources.json` gets `id:"nrsv"` (`tradition:"ecumenical"`, 80 books, `redistributable:false`).
- [ ] **B7. Update `sources.json` + tests** — add `id:"nrsv"` (`tradition:"ecumenical"`). Update `src/content/__tests__/library.test.ts` expectations that assert KJV-specific strings / deuterocanon checks (`L284-312` — `traditions: ["catholic","orthodox"]` vs `["ecumenical"]` boundary) to expect NRSV attribution.
- [ ] **B8. Verify with `npm run build:content && npm test`** — every `ref` must resolve against NRSV, every `RenderedCard.body` ≤400, `library.test.ts` citation shapes pass.

*No helloao dependency for NRSV; requires private/GitHub source file cached locally. Keep KJV as fallback — do not delete `src/content/bible/kjv/`.*

---

## C. Card Set Expansion — Scripture, Doctrine, History

### C1. Scripture — 368 → ~550-620+ (method in `scripts/build-scripture-cards.ts:36` `LIST`)

Keep curated `LIST` approach (`build-scripture-cards.ts:9` "stands on its own out of context"). `BOOKS` stays 80 — all cards resolve against NRSV primary (B1); redo `LIST` ranges for NRSV length as needed per `build-scripture-cards.ts:499`. Keep `*` weighting (`weight 1.4` in `build-scripture-cards.ts:467`) for impactful pericopes — extend to new important cards per Decision 4.

- [ ] Add 180-250 cards across these gaps (first wave ~100, dogfood, then second wave):
  - **Law/Torah theology** (GEN-DEU currently 20): `GEN 9:6`, `EXO 19:5-6`, `LEV 16:30`, `DEU 10:12-13`, `DEU 32:4` — ~10-12
  - **Wisdom dialogue** (JOB 5, PRO 14): `JOB 2:10`, `JOB 13:15`, `PRO 12:25`, `PRO 24:30-34`, `ECC 5:1-2` — ~10-12
  - **Prophets justice/mercy** (ISA-MAL 37): `ISA 58:6-8`, `MIC 7:18-19`, `HOS 2:14-15`, `ZEC 7:9-10` — ~15-18
  - **Psalms lament** (53 cards but 30 psalms empty): `PSA 13:1-2`, `PSA 22:1`, `PSA 42:9`, `PSA 61:2`, `PSA 73:28`, `PSA 131` — ~12-15
  - **Gospel parables/hard sayings** (LUK light): `MAT 13:44`, `LUK 10:36-37`, `LUK 14:11`, `JHN 7:37-38` — ~15-20
  - **Acts/Pauline church & Spirit**: `ACT 2:44-47`, `ACT 13:2-3`, `ROM 8:15-16`, `1CO 12:7`, `EPH 1:11-14`, `EPH 4:1-3` — ~18-22
  - **Pastoral/eschatological**: `1TH 4:13-14`, `TIT 2:11-12`, `2TI 2:13`, `HEB 13:14`, `REV 22:17` — ~15-18
  - **Deuterocanon** (NRSV text, `catholic`/`orthodox` only): `WIS 7:26`, `WIS 9:1-2`, etc. — ~8-10
- [ ] Enforce per-PR quality gates: standalone test, NRSV text ≤400 after concatenation, maps to theological theme, dedup pericopes (`build-scripture-cards.ts:458` `seen` set), no book >30% growth without justification.

### C2. Doctrine/Catechism — ~380 → uncapped (all usable, no caps per 2026-09-04; aim for high quality, not a number)

- [ ] Import all usable from A1–A8 at full yield — remove caps/stride in `scripts/import-confessions.ts:52` `PLANS` (`stride()` `import-confessions.ts:201` bypass, `cap` → `usable`). Re-run `npm run build:confessions`.
- [ ] Hand-curate A1/A3-A8 additions via `src/content/cards/doctrine.json` (20 hand-written) or new per-tradition files (keep `library.ts:38` hand vs generated split).
- [ ] Verify `BODY_MAX`/`PROMPT_MAX` via `import-confessions.ts:28` / `schema.ts:13` and `chunk()` sentence splitting. Curatorially weight more impactful/important new cards (`weight` 1.2–1.5 per Decision 4, `src/content/types.ts:82` / `src/feed/shuffle.ts:32`).

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

- [x] **D1. Fix data bugs:**
  - `his-athanasius-festal-letter:202` — `sourceId:"athanasius-incarnation"` is wrong (Festal Letter 367 ≠ *On the Incarnation* c.318). Add source `athanasian-festal-39` and set `locus:"39"` (or similar).
  - `his-bede-translating-dying:137` — source is not `bede-he` but **Cuthbert's Letter on Death of Bede**. Add source `cuthbert-letter` and correct `locus`/body (last sentence ~John 6:9 region, not final verse).
  - `his-lindisfarne-gospels:350` — claim "lapis lazuli from Afghanistan" outdated; Raman (2013) shows **azurite**. Correct body and change source from `bede-he` to `british-library` or `blair-lindisfarne`.
- [x] **D2. Enforce loci:** add `scripts/check-citations.ts` (or `yarn check:citations`) that fails when `source.locusPrefix` defined but card `locus` missing, and when `sourceId==="schaff-history"` and `year>1890` (anachronistic — Schaff died 1893). 70 violations to backfill. → `scripts/check-citations.ts:1` + `package.json:62` `check:citations` / `check:citations-strict`; current soft run 80 missing locus + 14 anachronistic (94).
- [x] **D3. Backfill `Source.url` + `locusUrlTemplate`:** `src/content/types.ts:65` `url` exists but only `kjv` populated. Add URLs for top sources: `eusebius-he` → `newadvent.org/fathers/2501.htm`, `bede-he` → `gutenberg.org/ebooks/38326`, `pliny-letters` → `faculty.georgetown.edu/jod/texts/pliny.html`, `schaff-history` → `ccel.org/ccel/schaff/hcc*.html`, etc. New `RenderedCard.citationUrl` optional if tappable citations desired. → 24 URLs added (`eusebius-he`, `bede-he`, `pliny-letters`, `schaff-history`, `cuthbert-letter`, `british-library`, etc.).
- [ ] **D4. Re-source Schaff catch-all:** migrate modern/global `schaff-history` cards to primaries or PD secondaries with locus; keep Schaff only for medieval narrative where primary fragmentary. Add new sources as needed (`eusebius-vc`, `ephesus-acts`, `cuthbert-letter`, `bonhoeffer-discipleship` flagged `redistributable:false` if quoting copyrighted — prefer paraphrase per existing style). — 77 `schaff-history` remain; soft lint shows 80 missing locus to backfill incrementally; medieval kept per plan.
- [x] **D5. Verification workflow for new cards:** author quotes 2-3 lines of source in PR; reviewer reproduces from independent translation (e.g., McGiffert vs Lake for Eusebius). Pin edition via `licenseNote` + URL fragment. — workflow documented; `check:citations --strict` will gate PRs when loci backfilled.

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
| 2 | B1-B8 NRSV (80) + keep KJV fallback | `npm run build:content && npm test` |
| 3 | C1 scripture wave 1 (~100) — edit `scripts/build-scripture-cards.ts:36` `LIST` (NRSV length redo) | `npm run build:scripture && npm run build:verses && npm test` |
| 4 | A1-A8 + C2 doctrine (no caps, all usable, weight impactful) — `scripts/import-confessions.ts:52` + `src/content/cards/doctrine.json` | `npm run build:confessions && npm test` |
| 5 | C3 + D4 history +30 | `npm test` |
| 6 | C1 wave 2 + remaining A/C2 | `npm run build:content` |

All commands: `npm run build:content` = `build:confessions && build:scripture && build:verses && test` (`package.json:58`).

---

## Research Context (Pre-Decision)

*Prior 4-agent research recommended balancing via caps, BSB/WEB as PD translation (on `bible.helloao.org`), and SQLite/chunking/CDN at scale. Those recommendations are superseded by Decisions 1-4 above but retained here for reference if personal-use scope changes.*

*Key references: `src/content/types.ts:7` `Tradition`, `src/content/schema.ts:13` `BODY_MAX`, `src/content/books.ts:63` apocrypha, `src/content/render.ts:45` attribution (now NRSV primary, KJV fallback), `src/content/__tests__/library.test.ts:284` deuterocanon checks, `src/feed/shuffle.ts:32` weighting, `AGENTS.md:1` Expo v57 docs.*

*Updates 2026-09-04: Decision 2 NIV→NRSV+KJV fallback; Decision 1 explicitly no caps/all usable; Decision 4 weighting; Progress checklist added. 2–3k is not a cap — import all high-quality usable per A1–A8 + C1–C3.*

