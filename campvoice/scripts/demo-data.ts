/**
 * Demo camp: CAMP EVERGREEN.
 *
 * Entirely fictional. No real camp's private materials are used anywhere in
 * CampVoice, and none should be added here.
 */

export const DEMO_CAMP = {
  name: "Camp Evergreen",
  slug: "camp-evergreen-demo",
  website: "https://campevergreen.example",
  location: "Pocono Mountains, Pennsylvania",
  camp_type: "Overnight / sleepaway",
  age_range: "7 to 16",
  description:
    "A 400-acre sleepaway camp in the Pocono Mountains, running four-week sessions since 1961. Around 280 campers a session, most of whom come back.",
};

export const DEMO_PROFILE = {
  programs: [
    "Waterfront: swimming, sailing, kayaking, paddleboarding",
    "Horseback riding, with a covered ring and trail rides",
    "Ceramics studio, woodshop and darkroom",
    "Ropes course and climbing tower",
    "Soccer, basketball, tennis and lacrosse",
    "Evening programme: campfires, all-camp games, the talent show",
  ].join("\n"),
  traditions: [
    "Color War, announced by surprise in the last ten days of each session",
    "Friday night campfire with the whole camp on the hill",
    "Banquet on the final night, when the oldest bunk gives their speeches",
    "The Evergreen Walk on the first morning, when new campers are shown the grounds by returners",
  ].join("\n"),
  audience:
    "Mostly parents of returning campers, plus prospective families who found us through word of mouth. A growing alumni list.",
  voice_traits: ["Warm", "Community-focused", "Nostalgic", "Reassuring"],
  avoid_list: ["Excessive emojis", "Corporate language", "Exclamation points in every sentence"],
  communication_notes:
    "We write as the leadership team, not as one person. Short paragraphs. We never oversell — parents can tell.",
  pasted_examples: [
    "Subject: The lake is open",
    "",
    "Dear Evergreen families,",
    "",
    "The bunks are swept, the docks are in, and as of this morning the waterfront is officially open for the summer.",
    "",
    "A few things before Sunday. Check-in runs from 10am to noon at the main gate. Bring the health form if you have not already sent it. Label everything, especially the things you would rather not replace.",
    "",
    "We cannot wait to see them all.",
    "",
    "Warmly,",
    "The Evergreen leadership team",
    "",
    "---",
    "",
    "Subject: A quiet Tuesday, which is the best kind",
    "",
    "Dear families,",
    "",
    "Not much to report this week, which at camp is a good sign. The Pioneers finished their overnight, the ceramics studio ran out of glaze for the second time, and somebody's lost sneaker has been on the lost-and-found table for nine days now.",
    "",
    "Visiting Day is two weeks out. We will send the full plan on Monday.",
    "",
    "Warmly,",
    "The Evergreen leadership team",
  ].join("\n"),
};

export const DEMO_TERMINOLOGY = [
  { standard_term: "Cabins", camp_term: "Bunks", note: null },
  { standard_term: "Counselors", camp_term: "Leaders", note: "Always capitalised." },
  { standard_term: "Youngest age group", camp_term: "Saplings", note: "Ages 7 to 9." },
  { standard_term: "Oldest age group", camp_term: "Pioneers", note: "Ages 14 to 16." },
  { standard_term: "Dining hall", camp_term: "the Lodge", note: "Lowercase 'the', capital L." },
];

/** Dates are generated relative to today so the demo is never stale. */
export function demoEvents(now = new Date()) {
  const year = now.getUTCFullYear();
  const day = (offset: number) => new Date(now.getTime() + offset * 86_400_000).toISOString().slice(0, 10);

  return [
    { title: "Enrollment opens for next summer", event_type: "enrollment_opens", starts_on: day(9), ends_on: null, notes: "Returning families first, then general." },
    { title: "Staff applications open", event_type: "staff_applications", starts_on: day(16), ends_on: null, notes: null },
    { title: "Winter open house", event_type: "open_house", starts_on: day(38), ends_on: null, notes: "Tours every half hour, 10am to 2pm." },
    { title: "Staff arrival", event_type: "staff_arrival", starts_on: `${year + 1}-06-14`, ends_on: null, notes: "Orientation runs a full week." },
    { title: "First session begins", event_type: "camp_start", starts_on: `${year + 1}-06-22`, ends_on: `${year + 1}-07-19`, notes: "Check-in 10am to noon." },
    { title: "Visiting Day", event_type: "visiting_day", starts_on: `${year + 1}-07-12`, ends_on: null, notes: "Gates open at 10am, departure by 4pm." },
    { title: "Second session begins", event_type: "camp_start", starts_on: `${year + 1}-07-22`, ends_on: `${year + 1}-08-16`, notes: null },
    { title: "Alumni reunion weekend", event_type: "reunion", starts_on: `${year + 1}-09-20`, ends_on: `${year + 1}-09-21`, notes: null },
  ];
}

export const DEMO_DNA = {
  voice_summary:
    "Warm and unhurried, like a letter from someone who has run this camp for a long time. Plain words, concrete detail, gentle humour. Never salesy.",
  terminology_summary:
    "Cabins are bunks. Counselors are Leaders, always capitalised. The youngest group is the Saplings and the oldest is the Pioneers. The dining hall is the Lodge. Visiting Day and Color War are always capitalised.",
  core_themes: ["Community", "Tradition", "Independence", "Belonging", "The outdoors"],
  style_notes:
    "Short paragraphs of two or three sentences. Opens by addressing families directly. Signs off from the leadership team rather than an individual. Almost no exclamation points, no emojis. Practical information is set out plainly, often in its own paragraph.",
  audience_notes:
    "Mainly parents of returning campers who already know how camp works, plus prospective families who need a little more context. Alumni receive a warmer, more nostalgic version of the same voice.",
  avoid_notes:
    "No emojis. No corporate language. No exclamation points stacked up. Never oversell or use marketing superlatives.",
};

export const DEMO_CONTENT = [
  {
    template_id: "tour-follow-up",
    category: "prospective",
    title: "So glad you and Maya came out to Evergreen",
    inputs: {
      family_name: "the Alvarez family",
      child_name: "Maya",
      memorable: "Maya spent twenty minutes at the waterfront and did not want to leave.",
      cta: "enroll",
      length: "standard",
    },
    output: [
      "Subject: So glad you and Maya came out to Evergreen",
      "",
      "Hi Elena,",
      "",
      "Thank you for making the drive up on Saturday. Watching Maya at the waterfront was our favorite part of the morning, and she asked better questions about the sailing programme than most grown-ups do.",
      "",
      "Enrollment for next summer opens shortly, and the Saplings bunks tend to fill first for her age group. If you would like us to hold a spot while you talk it over, just say the word.",
      "",
      "Warmly,",
      "The Evergreen leadership team",
    ].join("\n"),
  },
  {
    template_id: "packing-reminder",
    category: "families",
    title: "What to pack, and what to leave home",
    inputs: {
      session: "First session, all campers",
      items: "Sleeping bag\nRain jacket\nClosed-toe shoes for the ropes course\nWater bottle\nStamped envelopes",
      not_allowed: "Phones, tablets, and anything valuable",
      length: "standard",
    },
    output: [
      "Subject: What to pack, and what to leave home",
      "",
      "Dear families,",
      "",
      "First session is nearly here. Here is what campers need in their trunk:",
      "",
      "- Sleeping bag",
      "- Rain jacket",
      "- Closed-toe shoes for the ropes course",
      "- Water bottle",
      "- Stamped envelopes",
      "",
      "Please leave phones, tablets and anything valuable at home. Campers do better without them, and the Lodge has a phone if anything comes up.",
      "",
      "Label everything, especially the things you would rather not replace.",
      "",
      "Warmly,",
      "The Evergreen leadership team",
    ].join("\n"),
  },
  {
    template_id: "instagram-caption",
    category: "marketing",
    title: "Sunset on the ropes course",
    inputs: {
      subject: "Campers on the ropes course at sunset, one halfway up the tower",
      goal: "connection",
      hashtags: "yes",
    },
    output: [
      "Half past seven, and nobody wants to come down.",
      "",
      "The climbing tower is the last thing on the schedule most evenings, which means the Pioneers get the light on the ridge to themselves. This one made it to the top on her fourth try, with about nine people yelling for her from the ground.",
      "",
      "#CampEvergreen #SummerCamp #PoconoMountains #CampLife #RopesCourse",
    ].join("\n"),
  },
];
