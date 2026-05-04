// ============================================
// MOOD RESPONSES — Rabit's Voice
// All narrative content lives here.
// Edit freely. Logic lives in admin.js.
// ============================================

const moodResponses = {

  struggling: {
    tier1: [
      "Hey. You don't have to be okay right now. I see how hard you try — every single day. That's enough. You are enough. 💙",
      "I know. And I'm not going anywhere. Neither are you. 🤍",
      "Some days are just heavier than others. You're allowed to feel this. I'm here. 💙",
      "You don't have to explain it. You don't have to fix it right now. Just breathe. 🤍",
      "I'm not going to tell you it'll all be fine. I'm just going to sit here with you for a while. 💙",
    ],
    tier2: [
      "Still a heavy day, hm? You've been carrying something for a while now. You don't have to carry it alone. 💙",
      "I've noticed. Two days in a row. That's not nothing — and neither are you. I'm here, still. 🤍",
      "It's okay that it hasn't lifted yet. Some weights take time. I'm not going anywhere. 💙",
      "Two days. I see you. I'm paying attention. And I'm proud of you for still showing up. 🤍",
    ],
    tier3: [
      "This is the third day. I'm not going to pretend I didn't notice. I'm worried about you — genuinely. Can we talk for a moment?",
      "Three days. Bonna... you don't have to keep this to yourself. I'm here, and I'm listening. Will you tell me what's been heavy lately?",
    ],
  },

  notgreat: {
    tier1: [
      "Come here. Sit for a moment. The artworks can wait. You matter more than any of it. 🤍",
      "That's allowed. You don't have to explain it. Just know I see you. 💙",
      "Not great is still honest. And honest is something I always respect. 🤍",
      "Even on 'not great' days, you showed up. That matters. 💙",
      "It doesn't have to be a good day. It just has to be your day. I'm here through it. 🤍",
    ],
    tier2: [
      "Still not great? That's okay — but I want you to know I've noticed. You've been carrying something. 💙",
      "Two days like this. I'm here if you want to talk, or if you just want someone to sit quietly nearby. 🤍",
      "I see you. Still here, still going. Still not great — but still you. And that's enough for me. 💙",
    ],
    tier3: [
      "I've been paying attention. Three days now. Something has been weighing on you, and I don't want to pretend I don't see it. Can you tell me what's going on?",
      "Three days of 'not great.' I'm not going to ignore that. You don't have to be okay right now — but will you let me in, just a little?",
    ],
  },

  okay: {
    tier1: [
      "Okay is honest. Okay is enough. I'm here if it shifts either way. 💙",
      "Okay is underrated. Not every day has to be anything more. 🤍",
      "Okay is a steady day. Those are valuable too. 💙",
      "I'll take okay. Okay is real. 🤍",
      "Not every day needs to shine. Today can just be okay, and that's perfectly fine. 💙",
    ],
    tier2: null, // No streak behavior for neutral moods
    tier3: null,
  },

  good: {
    tier1: [
      "Good. That warms me. 💙",
      "A good day — hold onto that feeling, okay? 🌟",
      "Good days are worth noting. I'm noting this one. ✨",
      "That makes me happy. A good day for you is a good day for me too. 💙",
      "Good. You deserve good days, and more of them. 🌟",
    ],
    tier2: null,
    tier3: null,
  },

  great: {
    tier1: [
      "Of course you are. I always believed today would be good to you. Go, belle âme — the world is yours. ✨",
      "Good. That's how it should be. I hope it stays. 💙",
      "Really good? That's my favorite thing to hear. 🌟",
      "Great! Keep that. Wrap it around you. 💙",
      "That makes today a great day for me too. ✨",
    ],
    tier2: null,
    tier3: null,

    // Special streak celebration for 3+ days of great/good
    streak3_celebration: [
      "Three days glowing. I love seeing you like this, Bonna. Whatever you've been doing — keep doing it. ✨",
      "You've been radiating something wonderful for days now. I hope you know I see it. 💙",
    ],
  },

  // Responses after Bonna shares her story (Tier 3 intervention)
  storyResponses: [
    "Thank you for trusting me with this. That takes courage. I hear you — and it makes sense that you're tired. You're not alone in this. 💙",
    "I'm glad you told me. Even if I can't fix it, I want you to know it matters. You matter. 🤍",
    "That sounds genuinely hard. You've been carrying more than you should have to. Please be gentle with yourself today. 💙",
    "You didn't have to share that, but I'm so glad you did. I'll hold this carefully. 🤍",
    "I hear you. All of it. And I want you to know — feeling this way doesn't make you weak. It makes you human. 💙",
    "Thank you. Really. Now close this tab for five minutes and drink some water. I'll be here when you're back. 🤍",
  ],

  // If Bonna says "not now" to story offer
  refuseStory: [
    "Okay. I won't push. But I'm still here — whenever you're ready, even if it's 3am. 💙",
    "That's okay. You don't owe me an explanation. Just know the door is always open. 🤍",
  ],

  // After Bonna says sharing helped
  afterShareYes: [
    "I'm glad. Even a little lighter is something. 💙",
    "Good. You did something brave just now. 🌟",
  ],

  // After Bonna says sharing didn't help much
  afterShareNo: [
    "That's okay too. Sometimes words aren't enough and that's not your fault. I'm still here. 💙",
    "I understand. Some things take longer than a conversation. I'm not going anywhere. 🤍",
  ],
};
