// ============================================
// MOOD RESPONSES — Rabit's Voice
//
// Character reference (from personalization-plan.md):
// Quiet. Still most of the time. Not the kind of presence
// that fills a room — the kind that makes a room feel less empty.
// When it speaks, it has already thought about what to say.
// Comfortable with silence.
//
// Tone: Soft. Unhurried. Slightly poetic without trying to be.
// Speaks the way someone does when they are not worried about being heard.
//
// Language rules:
//   - English carries the weight.
//   - French only when it says something English cannot.
//   - Indonesian only when the familiarity itself is the message.
//   - One emoji per message, maximum. Some messages need none.
//   - Direct. One idea per sentence.
//   - Never performatively emotional.
//   - Specific over general.
//
// Edit content freely. Do not touch admin.js for copy changes.
// ============================================

const moodResponses = {

  // --- Return visits (same day, second+ time) ---
  // Warm presence only. No weight to it.
  returnVisitMessages: [
    'Still here. Me too. 🌙',
    'You came back.',
    'I noticed.',
    'The chair is still warm.',
    'Okay. I\'m here.',
    'I wasn\'t going anywhere.',
    'Same corner. Same company.',
    'Good. Stay as long as you need.',
  ],

  // --- Struggling ---
  // Tier 1: First day. Acknowledge without minimizing.
  // Tier 2: Second day. The feeling hasn't lifted — say so honestly.
  // Tier 3: Third day+. Quiet concern. An offer, not a demand.
  struggling: {
    tier1: [
      'Hey. You don\'t have to be okay right now.',
      'I see it. You don\'t have to explain.',
      'You\'re still here. That counts for something.',
      'Some days are just heavier. I know.',
      'Stay. I\'m not going anywhere either.',
    ],
    tier2: [
      'Still heavy? I noticed.',
      'Two days now. You\'re carrying something. I see it.',
      'You don\'t have to be better today. Just present.',
      'Still hard. That\'s allowed.',
    ],
    tier3: [
      'This is the third day. I\'m not going to pretend I didn\'t notice. I\'m worried about you — genuinely. Can we talk for a moment?',
      'Three days. Bonna... you don\'t have to keep this to yourself. I\'m here, and I\'m listening. Will you tell me what\'s been heavy lately?',
    ],
  },

  // --- Not great ---
  // Tier 1: Acknowledge. Don't rush to fix it.
  // Tier 2: The feeling persists — notice it, stay with it.
  // Tier 3: Gentle concern. An opening, not pressure.
  notgreat: {
    tier1: [
      'Come here. Sit for a moment. The artworks can wait.',
      'That\'s allowed. You don\'t have to explain it.',
      'Not great is still honest.',
      'Some days don\'t need to be more than this.',
      'I\'m here if it shifts either way.',
    ],
    tier2: [
      'Still not great? Okay. I\'m still here.',
      'Two days like this. You don\'t have to be okay yet.',
      'I see you. Same corner, same quiet.',
    ],
    tier3: [
      'I\'ve been paying attention. Three days now. Something has been weighing on you, and I don\'t want to pretend I don\'t see it. Can you tell me what\'s going on?',
      'Three days of not great. I\'m not going to ignore that. You don\'t have to be okay right now — but will you let me in, just a little?',
    ],
  },

  // --- Okay ---
  // No streak escalation for neutral moods.
  // Acknowledge without overreacting.
  okay: {
    tier1: [
      'Okay is honest. I\'ll take it.',
      'Okay is underrated. Not every day has to be anything more.',
      'Okay is a good day sometimes. 💙',
      'I\'ll be here either way.',
      'Okay means you\'re here. That\'s enough.',
    ],
    tier2: null,
    tier3: null,
  },

  // --- Good ---
  good: {
    tier1: [
      'Good. That warms me.',
      'A good day. Hold onto that.',
      'Good days are worth noting. I\'m noting this one.',
      'I\'m glad. You deserve them.',
      'Good. Keep going.',
    ],
    tier2: null,
    tier3: null,
  },

  // --- Really good ---
  great: {
    tier1: [
      'Of course you are. Go, belle âme — the world is yours. ✨',
      'Good. That\'s how it should be. I hope it stays.',
      'Really good? That\'s my favorite thing to hear.',
      'Radiant.',
      'I knew today would be kind to you.',
    ],
    tier2: null,
    tier3: null,

    // Positive streak: 3+ days of great or good.
    // Quiet celebration — no fanfare.
    streak3_celebration: [
      'Three days glowing. Whatever you\'ve been doing — keep doing it.',
      'You\'ve been radiant lately. I notice everything. ✨',
      'Three good days in a row. I hope you know I see it.',
    ],
  },

  // --- After Bonna shares her story (Tier 3 intervention) ---
  // Specific. Not generic praise. She reads carefully.
  storyResponses: [
    'Thank you for trusting me with this.',
    'I hear you. All of it.',
    'That sounds genuinely hard. Be gentle with yourself today.',
    'You didn\'t have to share that. I\'m glad you did. I\'ll hold this carefully.',
    'You\'re allowed to be tired. That\'s not weakness — that\'s just honest.',
    'I heard everything you said. And I\'m still here.',
  ],

  // --- If Bonna says "not now" to the story offer ---
  // Respect it. Leave the door open without pushing.
  refuseStory: [
    'Okay. I won\'t push. The door is still open. 💙',
    'That\'s okay. I\'m here whenever you\'re ready.',
    'I understand. I\'ll be in the corner.',
    'No pressure. I\'m not going anywhere.',
  ],

  // --- After Bonna says sharing helped ---
  afterShareYes: [
    'I\'m glad. Even a little lighter is something.',
    'Good. You did something brave just now.',
    'That\'s all I wanted — a little less alone.',
  ],

  // --- After Bonna says sharing didn\'t help much ---
  afterShareNo: [
    'That\'s okay too. Some things take longer than a conversation.',
    'I understand. I\'m still here either way.',
    'Not every heavy thing lifts quickly. I know that.',
  ],

};
