/**
 * Build-time only. Turns a curated reference list into scripture cards.
 *
 * The list holds references, not text: the NRSV is already bundled, so a card
 * needs only to say which verses it points at and the text is resolved at
 * render time. That keeps curation cheap to review and edit — the interesting
 * decision about a scripture card is *which passage*, not what it says.
 *
 * Curation is the whole point. Selecting programmatically by length would fill
 * the feed with genealogies, census totals and half-sentences; every reference
 * below was chosen because it stands on its own out of context.
 *
 *   node scripts/build-scripture-cards.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join as join_, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOKS } from '../src/content/books.ts';
import { analyse, cleanExcerpt } from '../src/content/excerpt.ts';

const ROOT = join_(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join_(ROOT, 'src', 'content', 'bible', 'nrsv');
const OUT = join_(ROOT, 'src', 'content', 'cards', 'scripture.json');

/** Kept in step with src/content/schema.ts. */
const BODY_MAX = 400;

/**
 * One reference per line: `BOOK CH:V[-V]  theme theme ...`
 * A leading `*` marks a passage worth surfacing more often.
 *
 * Deuterocanonical books are tagged for Catholic and Orthodox readers; the rest
 * are ecumenical, since Scripture belongs to every tradition in the app.
 */
const LIST = `
# Law
GEN 1:1-2      creation beginning
*GEN 1:27      image-of-god humanity dignity
GEN 2:18       marriage companionship
GEN 3:9        sin hiding god-seeks
GEN 8:22       providence seasons covenant
GEN 12:2       calling covenant abraham
GEN 15:6       faith righteousness abraham
GEN 28:16      presence awe
*GEN 50:20     providence evil-turned-good forgiveness
EXO 3:14       divine-name being i-am
EXO 14:14      deliverance stillness trust
EXO 20:2-3     commandments idolatry
EXO 33:14      presence rest
EXO 34:6       mercy character-of-god patience
LEV 19:18      love-neighbour law
NUM 6:24-26    blessing benediction peace
DEU 6:4-5      shema love god oneness
DEU 8:3        word bread dependence
DEU 30:19-20   choice life covenant
DEU 31:6       courage presence fear
DEU 33:27      refuge everlasting
JOS 1:9        courage presence fear
JOS 24:15      choice service household
JDG 6:12       calling weakness courage
RUT 1:16       loyalty covenant belonging
1SA 3:10       calling listening
1SA 16:7       heart appearance judgment
2SA 22:2-3     refuge deliverance
1KI 19:12      presence stillness still-small-voice
2KI 6:16       providence unseen-help fear
1CH 16:11      seeking prayer strength
2CH 7:13-14    repentance healing prayer
NEH 8:10       joy strength
EST 4:14       providence courage calling
JOB 1:21       suffering worship loss
*JOB 19:25-27  hope redeemer resurrection
JOB 38:4       creation humility mystery
JOB 42:5-6     encounter seeing repentance

# Psalms
*PSA 1:1-2     blessedness law delight
PSA 8:3-4      creation humility wonder
PSA 16:11      joy presence life
PSA 19:1       creation glory revelation
PSA 19:14      prayer words meditation
*PSA 23:1      providence comfort shepherd
PSA 23:4       death comfort fear
PSA 27:1       fear light salvation
PSA 27:14      waiting courage
PSA 30:5       sorrow joy morning
PSA 32:1       forgiveness blessedness
PSA 34:8       goodness taste trust
PSA 34:18      brokenness nearness comfort
PSA 37:4       delight desire trust
PSA 42:1       longing thirst god
PSA 46:1       refuge strength trouble
*PSA 46:10     stillness trust sovereignty
PSA 51:10      repentance renewal clean-heart
PSA 51:17      repentance brokenness sacrifice
PSA 55:22      burden trust sustaining
PSA 62:1       waiting salvation silence
PSA 63:1       longing thirst seeking
PSA 73:26      weakness strength portion
PSA 84:10      worship longing courts
PSA 90:12      mortality wisdom time
PSA 91:1-2     refuge shelter trust
PSA 100:4-5    thanksgiving worship mercy
PSA 103:8      mercy patience character-of-god
PSA 103:11-12  forgiveness removal sin
PSA 116:15     death saints precious
PSA 118:24     joy day rejoicing
PSA 119:105    word guidance light
PSA 121:1-2    help creator refuge
PSA 126:5      sorrow joy harvest
PSA 130:1      lament depths prayer
PSA 133:1      unity brotherhood
*PSA 139:7-8   omnipresence comfort
PSA 139:14     creation wonder made
PSA 139:23-24  searching repentance heart
PSA 145:18     nearness prayer truth
PSA 147:3      healing brokenness comfort
PSA 150:6      praise worship breath

# Wisdom
PRO 1:7        fear-of-god wisdom knowledge
*PRO 3:5-6     trust wisdom guidance
PRO 4:23       heart vigilance
PRO 9:10       fear-of-god wisdom
PRO 15:1       words anger gentleness
PRO 16:9       providence planning steps
PRO 17:17      friendship love adversity
PRO 18:10      refuge name-of-god safety
PRO 22:6       children formation
PRO 27:17      friendship sharpening
PRO 31:30      beauty fear-of-god
ECC 1:2        vanity meaning
ECC 3:1-4      time providence seasons
ECC 12:13      duty fear-of-god conclusion
SNG 8:6-7      love death jealousy

# Prophets
ISA 1:18       forgiveness reasoning scarlet
ISA 6:8        calling sending here-am-i
ISA 9:6        incarnation prophecy messiah
ISA 26:3       peace trust mind
ISA 30:21      guidance voice way
ISA 40:8       word permanence
ISA 40:11      shepherd tenderness care
*ISA 40:30-31  endurance hope waiting
ISA 41:9-10    fear presence strength
ISA 43:1-2     redemption naming waters
ISA 49:15      mother-love faithfulness
*ISA 53:5      atonement suffering healing
ISA 53:6       sin straying substitution
ISA 55:8-9     mystery thoughts transcendence
ISA 55:10-11   word efficacy
ISA 61:1-2     gospel liberty anointing
ISA 64:8       potter creation submission
JER 1:5        calling foreknowledge
JER 17:9       heart deceit sin
JER 29:11      providence hope future
JER 31:2-3     love everlasting drawing
JER 31:33      new-covenant law heart
*LAM 3:22-23   mercy faithfulness morning
EZK 36:26      new-heart regeneration spirit
DAN 3:17-18    courage faithfulness fire
DAN 6:10       prayer courage habit
HOS 6:6        mercy sacrifice knowledge
JOL 2:12-13    repentance mercy rending
AMO 5:24       justice righteousness
JON 2:9        salvation deliverance
*MIC 6:8       justice mercy humility
NAM 1:7-8      refuge goodness knowing
HAB 2:4        faith righteousness living
HAB 3:17-18    joy suffering rejoicing
ZEP 3:17-18    joy love singing
HAG 2:9        peace glory temple
ZEC 4:6        spirit power weakness
MAL 3:6        immutability faithfulness

# Deuterocanon
TOB 4:15       golden-rule ethics
TOB 12:7       secrecy works-of-god
WIS 1:13       death creation god
*WIS 3:1       death martyrdom hope
WIS 7:26       wisdom light image
WIS 11:24      love creation mercy
SIR 1:1        wisdom source
*SIR 2:1       temptation discipleship preparation
SIR 3:2        honour parents commandment
SIR 6:14       friendship faithfulness treasure
SIR 18:13      mercy compassion
SIR 28:2       forgiveness prayer mercy
BAR 3:14       wisdom seeking understanding
1MA 3:19       victory heaven strength
2MA 7:9        resurrection martyrdom hope
2MA 12:45      prayer-for-the-dead resurrection
MAN 1:13-14    repentance mercy confession

# Gospels
MAT 4:4        word bread temptation
*MAT 5:3-4     beatitudes poverty mourning
MAT 5:8        purity heart seeing-god
MAT 5:14       light witness city
MAT 5:16       works light glory
MAT 5:44-45    enemies love prayer
MAT 6:9-10     lords-prayer kingdom prayer
MAT 6:21       treasure heart
MAT 6:33       kingdom priority provision
MAT 7:7        prayer asking seeking
MAT 7:12       golden-rule law
MAT 10:29-30   providence sparrows value
*MAT 11:28-29  rest burden gentleness
MAT 16:24      discipleship cross denial
MAT 18:20      presence gathering church
MAT 22:37-39   love god neighbour commandment
MAT 25:40      mercy least service
MAT 28:19-20   commission baptism presence
MRK 2:17       sinners calling physician
MRK 8:36       soul world gain
MRK 9:24       faith unbelief prayer
MRK 10:15      children kingdom receiving
MRK 10:45      service ransom son-of-man
MRK 12:29-31   love commandment neighbour
LUK 1:37       power impossibility
LUK 1:46-49    magnificat praise mary
LUK 2:10-11    incarnation joy nativity
LUK 4:18-19    gospel liberty anointing
LUK 6:31       golden-rule ethics
LUK 6:37-38    judgment forgiveness
LUK 9:23       discipleship cross daily
LUK 10:27      love god neighbour
LUK 12:34      treasure heart
LUK 15:20      prodigal father compassion
LUK 18:13      prayer mercy humility
LUK 23:34      forgiveness cross
*JHN 1:1       incarnation trinity christology
JHN 1:14       incarnation glory dwelling
JHN 3:3        regeneration new-birth kingdom
*JHN 3:16      gospel love atonement
JHN 4:24       worship spirit truth
JHN 6:35       bread hunger christ
JHN 8:12       light darkness following
JHN 8:31-32    truth freedom abide word disciple
JHN 10:10      abundance life thief
JHN 10:11      shepherd sacrifice
JHN 11:25-26   resurrection life death
JHN 13:34-35   love commandment discipleship
JHN 14:1-2     comfort heaven trouble
JHN 14:6       way truth life
JHN 14:27      peace fear comfort
JHN 15:5       abiding fruit dependence
JHN 15:13      love sacrifice friendship
JHN 16:33      tribulation peace overcoming
JHN 20:29      faith seeing blessedness

# Acts and Epistles
ACT 1:8        witness spirit power
ACT 2:42       church fellowship worship
ACT 4:12       salvation name exclusivity
ACT 17:28      presence being creation
ACT 20:35      giving blessedness
ROM 1:16       gospel power salvation
ROM 3:21-24    sin universality glory
ROM 5:1-2      justification peace faith
*ROM 5:8       love atonement sinners
ROM 6:23       sin death gift
*ROM 8:1       condemnation freedom christ
ROM 8:28       providence suffering hope
*ROM 8:38-39   love security separation
ROM 10:8-9     confession faith salvation
ROM 12:1       worship sacrifice body
ROM 12:2       transformation mind world
ROM 12:21      evil good overcoming
ROM 15:13      hope joy peace
1CO 1:18       cross foolishness power
1CO 6:19-20    body temple purchase
1CO 10:13      temptation faithfulness escape
1CO 10:31      glory eating chief-end
*1CO 13:4-6    love charity patience
1CO 13:13      faith hope love
1CO 15:20      resurrection firstfruits
1CO 15:55      death victory resurrection
2CO 1:3-4      comfort affliction consolation
2CO 4:7        weakness treasure vessels
2CO 4:17-18    suffering glory unseen
2CO 5:17       new-creation regeneration
2CO 5:21       atonement righteousness exchange
*2CO 12:8-9    weakness grace suffering
GAL 2:19-20    union-with-christ faith crucified
GAL 5:1        freedom liberty bondage
GAL 5:22-23    fruit spirit virtue
GAL 6:9        perseverance weariness harvest
EPH 2:8-9      grace faith works
EPH 2:10       works creation purpose
EPH 3:20-21    power prayer abundance
EPH 4:31-32    kindness forgiveness
EPH 6:11       armour spiritual-warfare
*PHP 1:6       perseverance confidence god-finishes
PHP 2:5-8      incarnation humility kenosis
PHP 3:13-14    perseverance forgetting pressing
*PHP 4:6-7     anxiety prayer peace
PHP 4:8        thought virtue meditation
PHP 4:13       strength sufficiency christ
COL 1:15-17    creation christology preeminence
COL 3:2-3      mind heaven affection
COL 3:23-24    work service heartily
1TH 5:16-18    joy prayer thanksgiving
2TH 3:3        faithfulness protection
1TI 1:15       gospel sinners salvation
1TI 6:6-8      contentment godliness gain
2TI 1:6-7      fear power love
2TI 3:16-17    scripture inspiration sufficiency
TIT 3:4-5      mercy regeneration works
PHM 1:6        fellowship faith communication
*HEB 4:12      word living discernment
HEB 4:15-16    priesthood temptation grace
*HEB 11:1      faith hope evidence
HEB 11:6       faith pleasing seeking
HEB 12:2       perseverance looking-to-jesus joy
HEB 13:8       immutability christ
JAS 1:2-4      trials joy patience
JAS 1:17       gifts goodness immutability
JAS 1:22       obedience hearing doing
JAS 2:17       faith works
JAS 4:8        nearness drawing repentance
JAS 5:16       confession prayer healing
1PE 1:3-5      hope resurrection mercy
1PE 2:9        election priesthood calling
1PE 5:7        anxiety care casting
2PE 3:9        patience repentance longsuffering
1JN 1:9        confession forgiveness cleansing
1JN 3:1        adoption love children
*1JN 4:8       love god nature
1JN 4:18       fear love perfection
1JN 4:19       love response
JUD 1:24-25    keeping glory doxology

# Further passages
GEN 22:8       provision faith sacrifice
GEN 32:26      wrestling blessing persistence
EXO 15:2       salvation strength song
EXO 20:12      commandments honour parents
DEU 6:6-7      teaching children word
1SA 2:2        holiness rock incomparable
1SA 15:22      obedience sacrifice
2CH 20:12      helplessness prayer looking
EZR 3:11       worship foundation joy
NEH 4:6        work perseverance mind
JOB 23:10      testing gold refining
PSA 4:8        sleep peace safety
PSA 25:4-5     guidance teaching truth
PSA 40:1-2     waiting deliverance rock
PSA 56:1-3     fear trust
PSA 71:18-19   age witness generations
PSA 86:15      mercy patience character-of-god
PSA 95:6-7     worship shepherd kneeling
PSA 107:1      thanksgiving mercy goodness
PSA 119:11     word heart sin
PSA 127:1      labour providence vanity
PSA 143:8      morning guidance trust
PRO 11:25      generosity blessing
PRO 19:21      providence planning counsel
PRO 28:13      confession mercy concealment
ECC 4:9-10     friendship companionship labour
ISA 12:2       trust salvation fear
ISA 32:17      righteousness peace quietness
ISA 58:6-7     justice fasting poverty
JER 6:16       tradition ways rest
DAN 12:3       wisdom witness stars
MIC 7:18       pardon mercy incomparable
ZEC 9:9        messiah humility king
MAT 6:34       anxiety today providence
MAT 9:36       compassion crowds shepherd
MAT 12:20      gentleness weakness bruised-reed
MAT 19:26      possibility power god
MRK 1:35       prayer solitude morning
MRK 4:39       storm authority peace
LUK 2:19       mary pondering heart
LUK 11:9       prayer asking persistence
LUK 19:10      salvation seeking lost
LUK 24:32      scripture heart emmaus
JHN 5:39       scripture christ witness
JHN 12:24      death fruit grain
JHN 17:20-21   unity prayer mission
ACT 3:6        poverty healing giving
ACT 16:25      prison praise midnight
ROM 2:4        kindness repentance patience
ROM 14:8       life death belonging
1CO 3:6        growth ministry god
1CO 12:12      body church unity
2CO 3:18       transformation glory beholding
2CO 9:7        giving cheerfulness
GAL 3:28       unity equality baptism
EPH 1:7-10     redemption forgiveness grace
EPH 5:1-2      imitation love sacrifice
PHP 2:3-4      humility others esteem
COL 3:12-13    compassion forgiveness virtue
COL 4:6        speech grace conversation
1TH 4:10-12    quietness work ambition
1TI 4:12       youth example ministry
2TI 4:7        perseverance finishing faith
HEB 6:19-20    hope anchor steadfast
HEB 10:24-25   fellowship encouragement assembly
HEB 13:2       hospitality angels strangers
JAS 3:17       wisdom purity peace
1PE 3:14-15    apologetics hope meekness
1PE 4:10       gifts stewardship service
2PE 1:3        power godliness knowledge
1JN 2:15-16    world love affection
1JN 5:14       prayer confidence will
REV 2:10       faithfulness crown death

# Revelation
REV 1:8        alpha-omega eternity almighty
REV 3:20       invitation door fellowship
REV 5:9-10     redemption nations worship
REV 7:9        nations worship multitude
REV 12:11      victory testimony blood
*REV 21:3-4    new-creation grief hope
REV 21:5       new-creation renewal
REV 22:13      alpha-omega eternity
REV 22:20      hope return maranatha

# Expansion wave — law, wisdom, prophets, psalms, gospels, acts/pauline, pastoral, deuterocanon
GEN 9:6        image-of-god life blood
*EXO 19:5-6    covenant priesthood holiness calling
LEV 16:30      atonement cleansing
DEU 10:12-13   love fear walk commandments
DEU 32:4-5     faithfulness rock justice
NUM 23:19      faithfulness promise god-truth
GEN 17:7       covenant everlasting
EXO 15:26      healing obedience
LEV 20:26      holiness set-apart
DEU 7:9-10     faithfulness covenant love
GEN 18:19      righteousness justice
EXO 23:2-3     justice crowd
JOB 2:10       suffering acceptance sovereignty
JOB 13:15      trust though-slain hope
JOB 28:28      wisdom fear-of-god
PRO 12:25      anxiety encouragement word
*PRO 24:30-31  diligence poverty field sloth
ECC 5:1-2      reverence worship listening
PRO 21:21      righteousness kindness life
JOB 5:17       discipline blessed
PRO 14:26      refuge fear-of-god
ECC 7:12       wisdom protection
PRO 3:27-28    generosity neighbour
JOB 19:14-15   abandonment friends
PRO 16:32      patience self-control
ISA 58:6       fasting justice oppression light
MIC 7:18-19    pardon mercy compassion
HOS 2:14-15    mercy wilderness hope
ZEC 7:9-10     justice mercy oppression
JER 22:3       justice deliverance
AMO 5:14-15    seek-good evil hate
ISA 1:16-17    justice correct oppression
MAL 2:6        teaching truth
HOS 12:6       mercy justice waiting
ISA 30:15-16   return rest salvation
JER 9:23-24    boast wisdom knowledge god
ISA 61:2-3     beauty ashes mourning
MIC 7:7        watch hope salvation
HOS 10:12      sow righteousness
ISA 42:2-3     gentleness bruised reed
PSA 13:1-2     lament forgotten
PSA 22:1       forsaken lament cry
PSA 42:9       rock forgotten lament
PSA 61:2-3     overwhelmed rock higher
PSA 73:28      nearness good refuge
PSA 131:1-2    humility soul weaned
PSA 6:2        mercy weak healing
PSA 31:24      courage heart hope
PSA 62:8-9     trust pour heart
PSA 84:11      sun shield favor
PSA 116:1-2    love hears prayer
PSA 27:4       dwell house beauty
PSA 63:5-8     help shadow cling
PSA 90:1-2     dwelling generation eternity
PSA 103:17-18  mercy generations covenant
PSA 145:8-9    gracious compassion
MAT 13:44      kingdom treasure hidden
LUK 10:36-37   neighbor mercy go
LUK 14:11      humility exalted
JHN 7:37-38    thirst living-water
MAT 18:2-3     humble child kingdom
MAT 20:26-28   service ransom
MRK 10:14      receive kingdom child
LUK 6:27-28    love enemies bless
LUK 15:4       seek lost sheep
MAT 5:6        hunger righteousness filled
LUK 9:47-48    least great
JHN 15:12      love as-loved command
MAT 25:35-36   hunger thirst stranger
MRK 12:42-44   widow offering
LUK 18:16      children kingdom
JHN 13:14-15   wash feet example
MAT 23:11      greatest servant
ACT 2:44-45    fellowship breaking-bread wonder
ACT 13:2-3     spirit fasting sending
ROM 8:15-17    spirit adoption witness
1CO 12:7       spirit manifestation common
EPH 1:13-14    inheritance spirit guarantee
EPH 4:1-3      walk worthy unity humility patience
ROM 15:5-6     patience harmony glory
GAL 6:2        bear burdens law
COL 1:9-10     knowledge fruit
1CO 14:26      edification order
ROM 16:19      wisdom good innocence
ACT 4:32       heart soul common
EPH 2:19-22    household cornerstone dwelling
1CO 12:27      body members christ
ROM 8:26       spirit intercedes
ACT 20:28      flock purchase blood
1CO 6:11       washed sanctified justified
EPH 3:14-17    riches glory strengthened
1TH 4:13-14    sleep hope grieve
TIT 2:11-13    grace training godliness
2TI 2:11-13    faithless faithful
HEB 13:14      city to-come seek
REV 22:17      spirit bride come
1TH 5:23       sanctify spirit soul
2TI 1:11-12    guard entrusted
HEB 10:23      hold confession hope
1PE 1:6-7      tested fire faith
REV 3:11       hold fast crown
2TH 2:16-17    comfort heart work
HEB 3:13       exhort daily hardening
1PE 5:10       restore support strength
HEB 12:28-29   kingdom unshaken gratitude
TIT 2:13-14    blessed-hope grace
1TI 3:16       mystery godliness
WIS 9:1-4      wisdom creation understanding
SIR 15:14-15   choice creation commandment
BAR 4:36-37    joy children east
TOB 12:8-10    prayer fasting alms
JDT 9:11       strength lowly powerless
WIS 6:12-13    wisdom sought teaching
SIR 35:12-13   bribes justice
WIS 11:23-24   mercy all spare
SIR 2:7-8      trust fear reward
BAR 3:37       appeared earth
1MA 4:36       cleanse sanctuary
2MA 6:18-19    example noble death
TOB 4:7        alms bread
WIS 5:15-16    righteous live forever
SIR 38:8-9     physician healing
`;

interface Parsed {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  themes: string[];
  weight?: number;
}

// Widened to string: these are membership tests against text parsed out of the
// list above, which is not yet known to be a BookId — that is what they check.
const bookIds = new Set<string>(BOOKS.map((b) => b.id));
const APOCRYPHA = new Set<string>(
  BOOKS.filter((b) => b.section === 'apocrypha').map((b) => b.id),
);

function parse(): Parsed[] {
  const out: Parsed[] = [];
  const seen = new Set<string>();

  for (const raw of LIST.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const starred = line.startsWith('*');
    const rest = starred ? line.slice(1) : line;

    const match = rest.match(/^(\S+)\s+(\d+):(\d+)(?:-(\d+))?\s+(.*)$/);
    if (!match) throw new Error(`Could not parse line: ${raw}`);

    const [, book, chapter, verseStart, verseEnd, themes] = match;
    if (!bookIds.has(book)) throw new Error(`Unknown book "${book}" in: ${raw}`);

    const key = `${book} ${chapter}:${verseStart}-${verseEnd ?? ''}`;
    if (seen.has(key)) throw new Error(`Duplicate reference: ${key}`);
    seen.add(key);

    out.push({
      book,
      chapter: Number(chapter),
      verseStart: Number(verseStart),
      verseEnd: verseEnd ? Number(verseEnd) : undefined,
      themes: themes.split(/\s+/).filter(Boolean),
      weight: starred ? 1.4 : undefined,
    });
  }
  return out;
}

/**
 * How far a reference may be stretched to reach a sentence boundary. Beyond
 * this the passage stops being the one that was curated: three verses either
 * side of "Be still, and know that I am God" is a different card.
 */
const WIDEN_MAX = 3;

/**
 * The NRSV numbers verses, not sentences, so a curated reference regularly
 * opens on a lowercase word or closes on a comma. Where the neighbouring verse
 * completes the thought and the whole still fits a card, take it — a whole
 * sentence always reads better than an elided one.
 *
 * Returns the widened reference, or the original where widening would not help
 * or would not fit.
 */
function widen(p: Parsed): Parsed {
  const chapter = chapterOf(p);
  const lastVerse = Math.max(...Object.keys(chapter).map(Number));
  let start = p.verseStart;
  let end = p.verseEnd ?? p.verseStart;

  for (let step = 0; step < WIDEN_MAX; step++) {
    const flags = analyse(join(chapter, start, end));
    let moved = false;

    if (flags.startsMidSentence && start > 1) {
      if (fits(join(chapter, start - 1, end))) {
        start -= 1;
        moved = true;
      }
    }

    if (flags.endsMidSentence && end < lastVerse) {
      if (fits(join(chapter, start, end + 1))) {
        end += 1;
        moved = true;
      }
    }

    if (!moved) break;
  }

  if (start === p.verseStart && end === (p.verseEnd ?? p.verseStart)) return p;
  return { ...p, verseStart: start, verseEnd: end === start ? undefined : end };
}

/**
 * Whether a passage fits a card once it has been repaired. A passage that still
 * ends mid-sentence gains an ellipsis, so measuring the raw text would let a
 * widening overflow the schema by the width of its own mark.
 */
function fits(text: string): boolean {
  return cleanExcerpt(text).length <= BODY_MAX;
}

/** How the reference is written in LIST, so a widening can be reported back to it. */
function label(p: Parsed): string {
  const range = p.verseEnd ? `${p.verseStart}-${p.verseEnd}` : String(p.verseStart);
  return `${p.book} ${p.chapter}:${range}`;
}

function join(chapter: Record<string, string>, start: number, end: number): string {
  const parts: string[] = [];
  for (let v = start; v <= end; v++) if (chapter[String(v)]) parts.push(chapter[String(v)]);
  return parts.join(' ');
}

function chapterOf(p: Parsed): Record<string, string> {
  const book = loadBook(p.book);
  const chapter = book.chapters[String(p.chapter)];
  if (!chapter) throw new Error(`${p.book} ${p.chapter} does not exist`);
  return chapter;
}

const bookCache = new Map<string, any>();
function loadBook(id: string): any {
  let book = bookCache.get(id);
  if (!book) {
    book = JSON.parse(readFileSync(join_(KJV_DIR, `${id}.json`), 'utf8'));
    bookCache.set(id, book);
  }
  return book;
}

function verseText(p: Parsed): string {
  const chapter = chapterOf(p);
  const last = p.verseEnd ?? p.verseStart;
  for (let v = p.verseStart; v <= last; v++) {
    if (!chapter[String(v)]) throw new Error(`${p.book} ${p.chapter}:${v} does not exist`);
  }
  return join(chapter, p.verseStart, last);
}

function main() {
  const parsed = parse();
  const cards: unknown[] = [];
  const tooLong: string[] = [];
  const widened: string[] = [];

  for (const curated of parsed) {
    const p = widen(curated);
    if (label(p) !== label(curated)) {
      widened.push(`${label(curated)} \u2192 ${label(p)}  ${p.themes.join(' ')}`);
    }

    const text = verseText(p);
    // Widening could not reach a boundary, so say so on the card instead. The
    // `ref` stays as curated: the reader still opens the right verses, and this
    // only changes the sentence the feed shows.
    const display = cleanExcerpt(text);
    if (Math.max(text.length, display.length) > BODY_MAX) {
      tooLong.push(`${label(p)} (${Math.max(text.length, display.length)} chars)`);
      continue;
    }

    const ref: Record<string, unknown> = {
      book: p.book,
      chapter: p.chapter,
      verseStart: p.verseStart,
    };
    if (p.verseEnd) ref.verseEnd = p.verseEnd;

    const card: Record<string, unknown> = {
      id: `scr-${p.book.toLowerCase()}-${p.chapter}-${p.verseStart}${p.verseEnd ? `-${p.verseEnd}` : ''}`,
      type: 'scripture',
      // The deuterocanon is Scripture for some traditions and not others, so
      // those cards are tagged rather than shown to everyone.
      traditions: APOCRYPHA.has(p.book) ? ['catholic', 'orthodox'] : ['ecumenical'],
      themes: p.themes,
      ref,
    };
    if (display !== text) card.display = display;
    if (p.weight) card.weight = p.weight;
    cards.push(card);
  }

  writeFileSync(OUT, `${JSON.stringify(cards, null, 2)}\n`);

  console.log(`Wrote ${cards.length} scripture cards to src/content/cards/scripture.json`);
  if (widened.length > 0) {
    console.log(
      `\n${widened.length} reference(s) widened to a sentence boundary. Fold these back into LIST:`,
    );
    for (const w of widened) console.log(`  ${w}`);
  }
  if (tooLong.length > 0) {
    console.log(`\nSkipped ${tooLong.length} passage(s) longer than ${BODY_MAX} characters:`);
    for (const t of tooLong) console.log(`  ${t}`);
  }
}

main();
