import { analyse, cleanExcerpt, hasLeadingMark, hasTrailingMark } from '../excerpt';

describe('reading an excerpt', () => {
  it('leaves a whole sentence exactly as it found it', () => {
    const whole = 'God is love, and those who abide in love abide in God, and God abides in them.';
    expect(cleanExcerpt(whole)).toBe(whole);
  });

  it('sees where a sentence was cut', () => {
    expect(analyse('and after the earthquake a fire.').startsMidSentence).toBe(true);
    expect(analyse('In the beginning when God created the heavens,').endsMidSentence).toBe(true);
    expect(analyse('The LORD is my shepherd.').startsMidSentence).toBe(false);
    expect(analyse('The LORD is my shepherd.').endsMidSentence).toBe(false);
  });

  it('does not mistake an apostrophe for a quotation mark', () => {
    // Balancing single quotes would eat the apostrophe out of the middle of a
    // word, which is worse than the stray mark it would fix.
    const text = "The Jews’ law and God's own word remain.";
    expect(cleanExcerpt(text)).toBe(text);
  });
});

describe('repairing an excerpt', () => {
  it('marks a passage that opens partway through a sentence', () => {
    expect(cleanExcerpt('and after the earthquake a fire, but the LORD was not in the fire.')).toBe(
      '… and after the earthquake a fire, but the LORD was not in the fire.',
    );
  });

  it('marks a passage that stops before its sentence does, dropping the comma', () => {
    // Genesis 1:1 in the NRSV: the verse boundary is not a sentence boundary.
    expect(cleanExcerpt('In the beginning when God created the heavens and the earth,')).toBe(
      'In the beginning when God created the heavens and the earth …',
    );
  });

  it('completes a quotation whose opening mark was in the verse before', () => {
    // Exodus 14:14 — Moses is still speaking; the quote opens in verse 13.
    expect(cleanExcerpt('The LORD will fight for you, and you have only to keep still.”')).toBe(
      '“The LORD will fight for you, and you have only to keep still.”',
    );
  });

  it('completes a quotation whose closing mark is in the verse after', () => {
    const ruth = 'But Ruth said, “Where you go, I will go; your people shall be my people.';
    expect(cleanExcerpt(ruth)).toBe(
      'But Ruth said, “Where you go, I will go; your people shall be my people.”',
    );
  });

  it('answers a straight quote with a straight quote', () => {
    // The confessions punctuate with straight quotes; handing one back a curly
    // partner would look like a typo rather than a repair.
    expect(cleanExcerpt('And how shall they preach, except they be sent?" (Rom. 10:14-15).')).toBe(
      '"And how shall they preach, except they be sent?" (Rom. 10:14-15).',
    );
  });

  it('drops a proof-text reference the cut left in half', () => {
    // Belgic 26 splits mid-citation, leaving "2:18)" at the head of the next
    // card — a reference the reader cannot follow and did not ask for.
    expect(cleanExcerpt('2:18) And further, he says that we may approach him.')).toBe(
      'And further, he says that we may approach him.',
    );
    expect(cleanExcerpt('He is able to save those who approach God through him. (Heb. 7:24')).toBe(
      'He is able to save those who approach God through him.',
    );
  });

  it('trims a dangling semicolon rather than ending a card on one', () => {
    expect(
      cleanExcerpt('therefore it pleased the Lord to reveal himself unto his Church;'),
    ).toBe('… therefore it pleased the Lord to reveal himself unto his Church …');
  });

  it('takes the caller at its word when the position is known', () => {
    // "part 2 of 3" is proof that text was cut away, which punctuation alone
    // cannot tell from an article that simply ends on a full stop.
    // The full stop stays: the sentence did finish, the article did not.
    expect(cleanExcerpt('The Church is holy.', { elideEnd: true })).toBe('The Church is holy. …');
    expect(cleanExcerpt('The Church is holy.', { elideStart: true })).toBe('… The Church is holy.');
  });

  it('never marks the same end twice', () => {
    const once = cleanExcerpt('and the fire was not the LORD,');
    expect(cleanExcerpt(once)).toBe(once);
    expect(cleanExcerpt(once, { elideStart: true, elideEnd: true })).toBe(once);
  });

  it('reports the marks it added', () => {
    const both = cleanExcerpt('which maketh the Scripture necessary;');
    expect(hasLeadingMark(both)).toBe(true);
    expect(hasTrailingMark(both)).toBe(true);
    expect(hasLeadingMark('The LORD is my shepherd.')).toBe(false);
    expect(hasTrailingMark('The LORD is my shepherd.')).toBe(false);
  });
});
