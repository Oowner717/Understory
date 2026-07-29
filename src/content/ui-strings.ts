/*
 * Every user-facing string in the app, in one place. Nothing is hardcoded
 * in components. All copy answers to VOICE.md: name what the person
 * controls, active voice, sentence case, one job per string, invitations
 * rather than apologies, no predictions, no advice.
 */

export const STR = {
  app: {
    wordmark: 'Understory',
    skipLink: 'Skip to content',
  },

  nav: {
    today: 'Today',
    journal: 'Journal',
    library: 'Library',
    spread: 'Spread',
    settings: 'Settings',
    ariaLabel: 'Main',
  },

  today: {
    title: "Today's card",
    flipLabel: "Turn today's card",
  },

  cardFlip: {
    defaultLabel: 'Turn the card',
    faceDownAlt: 'Card, face down',
  },

  echo: {
    ariaLabel: 'Echo — your earlier entry with this card',
    /** Followed by an em dash and a relative date. */
    titlePrefix: 'Last time you drew this card',
    readEntry: 'Read entry',
  },

  editor: {
    label: 'Journal entry',
    placeholder: "Nothing here yet. The first entry doesn't need to be wise — it just needs to be true.",
    saved: 'Saved',
    typing: '…',
  },

  journal: {
    title: 'Journal',
    emptyLead: "Nothing here yet. The first entry doesn't need to be wise — it just needs to be true.",
    emptyLink: "Today's card is waiting.",
  },

  threads: {
    title: 'Threads',
    /** `n` is the window in days. */
    titleWindowed: (n: number) => `Threads · last ${n} days`,
    preview:
      'Threads is still sprouting. After five draws it starts noticing what keeps coming up — which cards return, and how the four suits balance across your month. Draw a card a day and watch this space fill in.',
    suitBalanceLabel: 'Suit balance',
  },

  entry: {
    backToJournal: '← Journal',
    delete: 'Delete entry',
    deleteConfirm: 'Delete this entry? There is no undo.',
    notFound: 'No entry here.',
    notFoundLink: 'Back to the journal.',
  },

  library: {
    title: 'Library',
    majors: 'Major Arcana',
  },

  card: {
    backToLibrary: '← Library',
    notFound: 'No such card in this deck.',
    notFoundLink: 'Back to the library.',
    drawnNever: "You haven't drawn this card yet. The deck takes its time.",
    drawnOnce: "You've drawn this card once.",
    drawnTimes: (n: number) => `You've drawn this card ${n} times.`,
  },

  spread: {
    title: 'A small spread',
    subtitle: 'Situation · Knot · Direction. Three cards, one look at the week.',
    positions: ['Situation', 'Knot', 'Direction'] as const,
    flipLabel: (position: string) => `Turn the ${position} card`,
    draw: 'Draw three cards',
    editorPlaceholder: 'Anything worth keeping from this one?',
  },

  settings: {
    title: 'Settings',
    journalHeading: 'Your journal',
    journalNote: "Everything you've written, as one plain-text file.",
    exportButton: 'Export journal (.txt)',
    exportFilename: 'understory-journal.txt',
    exportHeader: 'UNDERSTORY — JOURNAL EXPORT',
    exportEmpty: 'No entries yet.',
    motionHeading: 'Motion',
    motionToggle: 'Reduce motion (the card flip becomes a crossfade)',
    motionNote: "Your system's reduce-motion setting is honored either way.",
    startOverHeading: 'Start over',
    startOverNote: 'Erase every entry, draw, and setting on this device.',
    startOverButton: 'Start over',
    startOverConfirm1: 'Start over? This erases every entry, draw, and setting on this device.',
    startOverConfirm2: 'Once more, to be sure: erase everything? There is no undo and no backup.',
    privacyLine: 'Everything you write stays on this device. This playtest makes no network requests.',
  },

  /*
   * Onboarding — three screens, written and ready; the first-run flow that
   * shows them is not part of the playtest build yet.
   */
  onboarding: {
    screens: [
      {
        title: 'Understory',
        body: "A card a day, drawn from a naturalist's deck. You read it, then you write. Two minutes, most days.",
        button: 'Next',
      },
      {
        title: 'The deck notices',
        body: "When a card comes back, Understory shows you what you wrote the last time it was here. That's the whole trick — attention, kept.",
        button: 'Next',
      },
      {
        title: 'Yours, entirely',
        body: 'Everything you write stays on this device. No account, no cloud, no analytics. Export your journal any time as plain text.',
        button: 'Begin',
      },
    ],
  },

  /*
   * Notification copy — static only. Never a card name, never journal
   * content. Written to sit comfortably on a lock screen a stranger can see.
   */
  notifications: [
    "Today's card is on the table.",
    'One card, two minutes, done.',
    'The deck kept your place.',
    'A plate for today, unturned.',
    'Two quiet minutes, whenever suits.',
    "Today's page is still blank. That's allowed.",
    'The deck is patient. It can also be tapped.',
    'Nothing due. One card, if you want it.',
  ],
} as const
