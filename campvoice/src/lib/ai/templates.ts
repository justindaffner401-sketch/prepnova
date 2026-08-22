/**
 * The CampVoice content library.
 *
 * Each template is a small form plus the instructions that turn those answers
 * into a good communication. A camp director never writes a prompt — they
 * answer three or four plain questions and CampVoice does the rest.
 *
 * TO ADD A NEW CONTENT TYPE: copy an existing entry, give it a unique `id`,
 * list its `fields`, and write `instructions`. It appears in the app
 * automatically. See README → "How to add a new content template".
 */

export type FieldType = "text" | "textarea" | "date" | "select" | "radio";

export interface TemplateField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  maxLength?: number;
}

export type CategoryId = "prospective" | "families" | "staff" | "marketing" | "alumni";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  blurb: string;
}

export interface ContentTemplate {
  id: string;
  category: CategoryId;
  label: string;
  blurb: string;
  /** Shown on the dashboard "Quick Generate" row. */
  quick?: boolean;
  /** What the finished piece is, so the model formats it correctly. */
  format: "email" | "social" | "script" | "newsletter";
  fields: TemplateField[];
  /** Category-specific writing instructions appended to the global system prompt. */
  instructions: string;
  /** Context the template needs. Keeps requests small and relevant. */
  context: {
    includeEvents?: boolean;
    eventHorizonDays?: number;
    includeSamples?: boolean;
    sampleBudgetChars?: number;
  };
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "prospective", label: "Prospective Families", blurb: "Follow-ups, tours, enrollment and open houses." },
  { id: "families", label: "Current Families", blurb: "Everything parents need before, during and after camp." },
  { id: "staff", label: "Staff", blurb: "Recruiting, hiring and pre-camp communication." },
  { id: "marketing", label: "Marketing", blurb: "Social posts, reels and newsletters." },
  { id: "alumni", label: "Alumni", blurb: "Reunions, giving and staying in touch." },
];

/** Reusable fields so every form feels consistent. */
const LENGTH_FIELD: TemplateField = {
  name: "length",
  label: "Length",
  type: "radio",
  required: true,
  options: [
    { value: "short", label: "Short" },
    { value: "standard", label: "Standard" },
    { value: "detailed", label: "Detailed" },
  ],
};

const NOTES_FIELD: TemplateField = {
  name: "notes",
  label: "Anything else CampVoice should know?",
  type: "textarea",
  placeholder: "Optional. Details you want included.",
  maxLength: 1500,
};

const FAMILY_NAME: TemplateField = {
  name: "family_name",
  label: "Family name",
  type: "text",
  placeholder: "Optional. e.g. the Smith family",
  maxLength: 120,
};

const CHILD_NAME: TemplateField = {
  name: "child_name",
  label: "Child's first name",
  type: "text",
  placeholder: "Optional. First name only.",
  help: "CampVoice never stores camper profiles. A first name is used only for this one message.",
  maxLength: 60,
};

const LENGTH_GUIDE = `Length: "short" is roughly 60-90 words, "standard" is 120-180 words, "detailed" is 220-320 words. Respect the requested length closely.`;

export const TEMPLATES: ContentTemplate[] = [
  // ------------------------- Prospective families -------------------------
  {
    id: "inquiry-follow-up",
    category: "prospective",
    label: "Inquiry Follow-Up",
    blurb: "Reply to a family who just asked about camp.",
    format: "email",
    fields: [
      FAMILY_NAME,
      CHILD_NAME,
      { name: "context", label: "What did they ask about?", type: "textarea", placeholder: "e.g. first-time camper, wanted to know about the horseback program", maxLength: 1200 },
      {
        name: "tour_scheduled",
        label: "Is a tour already scheduled?",
        type: "radio",
        options: [
          { value: "no", label: "Not yet" },
          { value: "yes", label: "Yes" },
        ],
      },
      {
        name: "cta",
        label: "What should they do next?",
        type: "radio",
        required: true,
        options: [
          { value: "book_tour", label: "Book a tour" },
          { value: "call", label: "Schedule a call" },
          { value: "enroll", label: "Start enrollment" },
          { value: "reply", label: "Just reply with questions" },
        ],
      },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a warm reply to a family who has just inquired about camp. Answer what they asked using only the camp material provided. Do not oversell. Close with the single next step requested and nothing else. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 240, includeSamples: true },
    quick: true,
  },
  {
    id: "tour-follow-up",
    category: "prospective",
    label: "Tour Follow-Up",
    blurb: "Thank a family who just visited and keep momentum.",
    format: "email",
    quick: true,
    fields: [
      { ...FAMILY_NAME, required: true, placeholder: "e.g. the Smith family" },
      CHILD_NAME,
      { name: "tour_date", label: "Tour date", type: "date" },
      { name: "memorable", label: "Anything memorable from the tour?", type: "textarea", placeholder: "e.g. their daughter loved the waterfront", maxLength: 1200, help: "One specific detail makes this email feel personal." },
      {
        name: "cta",
        label: "Main goal",
        type: "radio",
        required: true,
        options: [
          { value: "thank", label: "Thank them" },
          { value: "enroll", label: "Encourage enrollment" },
          { value: "conversation", label: "Schedule another conversation" },
          { value: "custom", label: "Something else (describe below)" },
        ],
      },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a follow-up email to a family who just toured the camp. Open by referring to their visit. If a memorable detail was provided, use it naturally in the first or second sentence, exactly once, without embellishing it. End with the single stated goal. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 240, includeSamples: true },
  },
  {
    id: "enrollment-reminder",
    category: "prospective",
    label: "Enrollment Reminder",
    blurb: "Nudge families before a deadline.",
    format: "email",
    quick: true,
    fields: [
      { name: "audience", label: "Who is this going to?", type: "radio", required: true, options: [
        { value: "returning", label: "Returning families" },
        { value: "new", label: "New / prospective families" },
        { value: "both", label: "Everyone on the list" },
      ] },
      { name: "deadline", label: "Deadline or key date", type: "date", help: "Leave blank if there is no fixed deadline. CampVoice will never invent one." },
      { name: "detail", label: "What should they know?", type: "textarea", placeholder: "e.g. sessions filling, early-bird rate ending", maxLength: 1200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write an enrollment reminder. Be helpful rather than pushy: state clearly what is happening, when, and what to do. Mention a deadline only if one was provided or appears in the camp's important dates. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 300, includeSamples: true },
  },
  {
    id: "open-house-invitation",
    category: "prospective",
    label: "Open House Invitation",
    blurb: "Invite families to visit.",
    format: "email",
    fields: [
      { name: "event_date", label: "Open house date", type: "date" },
      { name: "details", label: "What happens at the open house?", type: "textarea", placeholder: "e.g. tours every half hour, meet the directors, lunch on the lawn", maxLength: 1200 },
      { name: "rsvp", label: "How do families RSVP?", type: "text", placeholder: "e.g. reply to this email, or a link", maxLength: 200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write an invitation to a camp open house. Make it easy to say yes: what it is, when, and how to RSVP. Only include a date, time or location that was provided. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, includeSamples: true },
  },
  {
    id: "re-engagement",
    category: "prospective",
    label: "Re-Engagement Email",
    blurb: "Reach back out to a family who went quiet.",
    format: "email",
    fields: [
      FAMILY_NAME,
      { name: "last_contact", label: "When did you last speak?", type: "text", placeholder: "e.g. they toured last spring", maxLength: 200 },
      { name: "reason", label: "What's a genuine reason to reach out now?", type: "textarea", placeholder: "e.g. sessions just opened, we added a new program they asked about", maxLength: 1200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a short, low-pressure email to a family who has not been in touch for a while. Give a real reason for the note, make it easy to reply, and never imply they did something wrong by going quiet. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, includeSamples: true },
  },
  {
    id: "personalized-follow-up",
    category: "prospective",
    label: "Personalized Follow-Up",
    blurb: "A one-off note for a specific family conversation.",
    format: "email",
    fields: [
      FAMILY_NAME,
      CHILD_NAME,
      { name: "conversation", label: "What did you talk about?", type: "textarea", required: true, placeholder: "The more specific, the better.", maxLength: 1500 },
      { name: "cta", label: "What should happen next?", type: "text", placeholder: "e.g. they'll send the enrollment form this week", maxLength: 200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a personal follow-up email based on a specific conversation. Reference the conversation concretely. Keep it human and brief. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, includeSamples: true },
  },

  // --------------------------- Current families ---------------------------
  {
    id: "parent-email",
    category: "families",
    label: "Parent Email",
    blurb: "A general update to current camp families.",
    format: "email",
    quick: true,
    fields: [
      { name: "topic", label: "What is this email about?", type: "textarea", required: true, placeholder: "e.g. the first week recap and what's coming next", maxLength: 1500 },
      { name: "action", label: "Is there anything parents need to do?", type: "text", placeholder: "Optional", maxLength: 300 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write an email from the camp to current camp families. Lead with what matters to a parent. If there is an action for them, state it plainly in its own short paragraph. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 90, includeSamples: true },
  },
  {
    id: "packing-reminder",
    category: "families",
    label: "Packing Reminder",
    blurb: "What to bring, and what to leave home.",
    format: "email",
    fields: [
      { name: "session", label: "Which session?", type: "text", placeholder: "e.g. first session, all campers", maxLength: 200 },
      { name: "items", label: "Key items to mention", type: "textarea", placeholder: "One per line. CampVoice will only list what you enter here.", maxLength: 2000 },
      { name: "not_allowed", label: "Anything they should NOT bring?", type: "textarea", placeholder: "Optional", maxLength: 800 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a packing reminder email. A bullet list is appropriate here. List ONLY the items provided — never add typical camp items that were not listed. Keep the tone practical and reassuring. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 90, includeSamples: false },
  },
  {
    id: "opening-day",
    category: "families",
    label: "Opening Day Email",
    blurb: "Everything families need for arrival day.",
    format: "email",
    fields: [
      { name: "arrival", label: "Arrival details", type: "textarea", placeholder: "e.g. check-in 10am-12pm at the main gate", maxLength: 1200 },
      { name: "reminders", label: "Reminders for the day", type: "textarea", placeholder: "Optional", maxLength: 1200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write an opening-day email. Parents are excited and slightly nervous, so be clear and calming. Put logistics in a scannable form. Only state times, places and rules that were provided. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 90, includeSamples: true },
  },
  {
    id: "visiting-day",
    category: "families",
    label: "Visiting Day Communication",
    blurb: "The plan for the biggest day of the summer.",
    format: "email",
    fields: [
      { name: "schedule", label: "Schedule and logistics", type: "textarea", placeholder: "e.g. gates open 10am, lunch at noon, departure by 4pm", maxLength: 1500 },
      { name: "guidelines", label: "Guidelines for families", type: "textarea", placeholder: "Optional", maxLength: 1200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a Visiting Day email. Match the camp's capitalisation of this event exactly as it appears in their terminology. Be warm about the reunion and precise about logistics. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 90, includeSamples: true },
  },
  {
    id: "transportation",
    category: "families",
    label: "Transportation Reminder",
    blurb: "Buses, pickups and travel details.",
    format: "email",
    fields: [
      { name: "details", label: "Transportation details", type: "textarea", required: true, placeholder: "e.g. bus leaves the mall lot at 8am sharp", maxLength: 1500 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a transportation email. Precision matters more than warmth here. Repeat the critical time and place once at the end. Never invent a stop, time or route. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 60, includeSamples: false },
  },
  {
    id: "weather-update",
    category: "families",
    label: "Weather Update",
    blurb: "Reassure families when the forecast turns.",
    format: "email",
    fields: [
      { name: "situation", label: "What's happening?", type: "textarea", required: true, placeholder: "e.g. thunderstorms tonight, all campers indoors", maxLength: 1200 },
      { name: "camp_response", label: "What is camp doing about it?", type: "textarea", placeholder: "e.g. indoor programming, staff sleeping in the bunks", maxLength: 1200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a calm, factual weather update to families. Lead with the fact that campers are safe. Say what is happening and what camp is doing. Do not speculate about the forecast or make safety promises beyond what was provided. ${LENGTH_GUIDE}`,
    context: { includeEvents: false, includeSamples: true },
  },
  {
    id: "event-reminder",
    category: "families",
    label: "Event Reminder",
    blurb: "A nudge before something on the calendar.",
    format: "email",
    fields: [
      { name: "event", label: "Which event?", type: "text", required: true, maxLength: 200 },
      { name: "event_date", label: "Date", type: "date" },
      { name: "detail", label: "What do families need to know?", type: "textarea", maxLength: 1200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a brief reminder about an upcoming camp event. Short is better. State what, when, and anything families need to bring or do. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 120, includeSamples: true },
  },
  {
    id: "thank-you",
    category: "families",
    label: "Thank You Email",
    blurb: "Gratitude that doesn't sound like a form letter.",
    format: "email",
    fields: [
      { name: "reason", label: "What are you thanking them for?", type: "textarea", required: true, maxLength: 1200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a genuine thank-you note. Be specific about what you are grateful for. Avoid flattery and avoid asking for anything in the same message. ${LENGTH_GUIDE}`,
    context: { includeEvents: false, includeSamples: true },
  },
  {
    id: "end-of-summer",
    category: "families",
    label: "End-of-Summer Message",
    blurb: "Close the season well.",
    format: "email",
    fields: [
      { name: "highlights", label: "Highlights of the summer", type: "textarea", placeholder: "Only what actually happened.", maxLength: 1500 },
      { name: "next_step", label: "What comes next?", type: "text", placeholder: "e.g. re-enrollment opens in September", maxLength: 300 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write an end-of-summer message to families. Reflective and warm, not saccharine. Reference only highlights that were provided or that appear in the camp material. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 300, includeSamples: true },
  },

  // -------------------------------- Staff --------------------------------
  {
    id: "staff-recruitment-email",
    category: "staff",
    label: "Recruitment Email",
    blurb: "Reach potential staff.",
    format: "email",
    quick: true,
    fields: [
      { name: "roles", label: "Which roles are you hiring?", type: "textarea", required: true, placeholder: "One per line", maxLength: 1200 },
      { name: "audience", label: "Who are you writing to?", type: "radio", required: true, options: [
        { value: "returning", label: "Returning staff" },
        { value: "college", label: "College students / new applicants" },
        { value: "referrals", label: "Referrals from current staff" },
      ] },
      { name: "apply", label: "How do they apply?", type: "text", placeholder: "e.g. application link, email the office", maxLength: 200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a staff recruitment email. Be honest about the work and clear about what makes this camp worth a summer. List only the roles provided. End with one clear way to apply. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 300, includeSamples: true },
  },
  {
    id: "staff-recruitment-social",
    category: "staff",
    label: "Recruitment Social Post",
    blurb: "A hiring post for social media.",
    format: "social",
    fields: [
      { name: "roles", label: "Roles you're hiring", type: "textarea", required: true, maxLength: 800 },
      { name: "platform", label: "Platform", type: "radio", required: true, options: [
        { value: "instagram", label: "Instagram" },
        { value: "facebook", label: "Facebook" },
      ] },
      NOTES_FIELD,
    ],
    instructions: `Write a staff recruitment social post. Instagram: 60-120 words, conversational, hashtags on a final line. Facebook: 80-150 words, slightly more informational, no hashtag block. Speak to what the summer is actually like.`,
    context: { includeEvents: true, eventHorizonDays: 300, includeSamples: true },
  },
  {
    id: "interview-follow-up",
    category: "staff",
    label: "Interview Follow-Up",
    blurb: "After you've met a candidate.",
    format: "email",
    fields: [
      { name: "candidate_name", label: "Candidate first name", type: "text", maxLength: 60 },
      { name: "role", label: "Role discussed", type: "text", maxLength: 120 },
      { name: "outcome", label: "What's the next step?", type: "radio", required: true, options: [
        { value: "offer", label: "Making an offer" },
        { value: "next_round", label: "Another conversation" },
        { value: "thinking", label: "Still deciding" },
        { value: "no", label: "Not moving forward" },
      ] },
      { name: "detail", label: "Anything from the conversation to reference?", type: "textarea", maxLength: 1000 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a follow-up email to a staff candidate. Be direct about the next step. If not moving forward, be kind, brief and definite, and do not offer false hope or a detailed critique. ${LENGTH_GUIDE}`,
    context: { includeEvents: false, includeSamples: true },
  },
  {
    id: "staff-offer",
    category: "staff",
    label: "Offer / Welcome Communication",
    blurb: "Welcome someone to the team.",
    format: "email",
    fields: [
      { name: "candidate_name", label: "First name", type: "text", maxLength: 60 },
      { name: "role", label: "Role", type: "text", required: true, maxLength: 120 },
      { name: "next_steps", label: "What do they need to do next?", type: "textarea", placeholder: "e.g. sign the agreement, background check, staff portal", maxLength: 1200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a welcome email to a new staff member. Genuinely glad, then practical. State only the next steps provided. Do not state pay, dates or terms unless they were given to you. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 300, includeSamples: true },
  },
  {
    id: "pre-camp-reminder",
    category: "staff",
    label: "Pre-Camp Reminder",
    blurb: "Get staff ready before they arrive.",
    format: "email",
    fields: [
      { name: "arrival", label: "Staff arrival details", type: "textarea", maxLength: 1200 },
      { name: "to_do", label: "What should staff do before arriving?", type: "textarea", maxLength: 1500 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a pre-camp email to staff. Practical and energising. Use a short checklist for anything they must complete. Only include tasks and dates that were provided. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 120, includeSamples: true },
  },
  {
    id: "staff-newsletter",
    category: "staff",
    label: "Staff Newsletter",
    blurb: "Keep the team in the loop.",
    format: "newsletter",
    fields: [
      { name: "sections", label: "What's in this issue?", type: "textarea", required: true, placeholder: "One topic per line", maxLength: 2000 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a staff newsletter. Short intro, then one clear section per topic provided with a plain heading. No section may contain information that was not provided. End with anything staff need to do.`,
    context: { includeEvents: true, eventHorizonDays: 180, includeSamples: true },
  },

  // ------------------------------ Marketing ------------------------------
  {
    id: "instagram-caption",
    category: "marketing",
    label: "Instagram Caption",
    blurb: "A caption that sounds like your camp.",
    format: "social",
    quick: true,
    fields: [
      { name: "subject", label: "What's the photo or video?", type: "textarea", required: true, placeholder: "e.g. campers on the ropes course at sunset", maxLength: 1000 },
      { name: "goal", label: "Goal of the post", type: "radio", required: true, options: [
        { value: "connection", label: "Connect with our community" },
        { value: "enrollment", label: "Drive enrollment interest" },
        { value: "recruitment", label: "Attract staff" },
        { value: "celebrate", label: "Celebrate a moment" },
      ] },
      { name: "hashtags", label: "Include hashtags?", type: "radio", options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ] },
      NOTES_FIELD,
    ],
    instructions: `Write an Instagram caption, 40-110 words. Start with a specific image, not a question. One idea only. If hashtags are requested, put 4-8 relevant ones on a single final line and use the camp's own tags where the material shows them.`,
    context: { includeEvents: true, eventHorizonDays: 120, includeSamples: true, sampleBudgetChars: 5000 },
  },
  {
    id: "facebook-post",
    category: "marketing",
    label: "Facebook Post",
    blurb: "For the parent audience.",
    format: "social",
    fields: [
      { name: "subject", label: "What's this post about?", type: "textarea", required: true, maxLength: 1000 },
      { name: "cta", label: "What should people do?", type: "text", placeholder: "Optional", maxLength: 200 },
      NOTES_FIELD,
    ],
    instructions: `Write a Facebook post, 80-160 words, aimed at parents and the wider camp community. Slightly more explanatory than Instagram. No hashtag block.`,
    context: { includeEvents: true, eventHorizonDays: 120, includeSamples: true, sampleBudgetChars: 5000 },
  },
  {
    id: "reel-script",
    category: "marketing",
    label: "Reel / Short Video Script",
    blurb: "A 20-40 second script with shot notes.",
    format: "script",
    fields: [
      { name: "concept", label: "What's the idea?", type: "textarea", required: true, placeholder: "e.g. a day at camp in 30 seconds", maxLength: 1000 },
      { name: "duration", label: "Length", type: "radio", required: true, options: [
        { value: "15", label: "~15 seconds" },
        { value: "30", label: "~30 seconds" },
        { value: "60", label: "~60 seconds" },
      ] },
      NOTES_FIELD,
    ],
    instructions: `Write a short vertical-video script. Use plain lines in the form "0-3s | on screen: ... | voiceover: ...". Open with something visual in the first two seconds. Keep spoken words under about 2.5 per second of runtime. Suggest only shots the camp could realistically film.`,
    context: { includeEvents: false, includeSamples: true, sampleBudgetChars: 4000 },
  },
  {
    id: "throwback-post",
    category: "marketing",
    label: "Throwback Post",
    blurb: "Keep families warm in the off-season.",
    format: "social",
    fields: [
      { name: "memory", label: "What are you looking back on?", type: "textarea", required: true, maxLength: 1000 },
      { name: "platform", label: "Platform", type: "radio", required: true, options: [
        { value: "instagram", label: "Instagram" },
        { value: "facebook", label: "Facebook" },
      ] },
      NOTES_FIELD,
    ],
    instructions: `Write a nostalgic throwback post. Ground it in one specific moment. Warm, not sentimental. Do not invent details about the memory beyond what was provided.`,
    context: { includeEvents: false, includeSamples: true, sampleBudgetChars: 5000 },
  },
  {
    id: "enrollment-post",
    category: "marketing",
    label: "Enrollment Post",
    blurb: "Announce that registration is open.",
    format: "social",
    fields: [
      { name: "detail", label: "What's opening, and when?", type: "textarea", required: true, maxLength: 1000 },
      { name: "platform", label: "Platform", type: "radio", required: true, options: [
        { value: "instagram", label: "Instagram" },
        { value: "facebook", label: "Facebook" },
      ] },
      NOTES_FIELD,
    ],
    instructions: `Write an enrollment announcement post. Clear about what is open and how to act. State a date only if provided or present in the camp's important dates.`,
    context: { includeEvents: true, eventHorizonDays: 300, includeSamples: true, sampleBudgetChars: 5000 },
  },
  {
    id: "program-spotlight",
    category: "marketing",
    label: "Program Spotlight",
    blurb: "Show off one thing you do well.",
    format: "social",
    fields: [
      { name: "program", label: "Which program?", type: "text", required: true, maxLength: 200, help: "Use the camp's own name for it." },
      { name: "detail", label: "What makes it special?", type: "textarea", maxLength: 1200 },
      { name: "platform", label: "Platform", type: "radio", required: true, options: [
        { value: "instagram", label: "Instagram" },
        { value: "facebook", label: "Facebook" },
      ] },
      NOTES_FIELD,
    ],
    instructions: `Write a program spotlight post. Concrete detail about what a camper actually does. Never invent equipment, instructors, certifications or outcomes.`,
    context: { includeEvents: false, includeSamples: true, sampleBudgetChars: 5000 },
  },
  {
    id: "camper-experience-post",
    category: "marketing",
    label: "Camper Experience Post",
    blurb: "A day-in-the-life style post.",
    format: "social",
    fields: [
      { name: "moment", label: "What moment are you describing?", type: "textarea", required: true, maxLength: 1200 },
      { name: "platform", label: "Platform", type: "radio", required: true, options: [
        { value: "instagram", label: "Instagram" },
        { value: "facebook", label: "Facebook" },
      ] },
      NOTES_FIELD,
    ],
    instructions: `Write a post describing a camper's experience. Use sensory, specific detail from what was provided. Never use a fabricated camper quote or name.`,
    context: { includeEvents: false, includeSamples: true, sampleBudgetChars: 5000 },
  },
  {
    id: "monthly-newsletter",
    category: "marketing",
    label: "Monthly Newsletter",
    blurb: "Your regular update to the whole list.",
    format: "newsletter",
    quick: true,
    fields: [
      { name: "sections", label: "What's in this issue?", type: "textarea", required: true, placeholder: "One topic per line", maxLength: 2500 },
      { name: "audience", label: "Who receives it?", type: "radio", required: true, options: [
        { value: "families", label: "Current families" },
        { value: "all", label: "Everyone on our list" },
        { value: "alumni", label: "Alumni" },
      ] },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a camp newsletter. Short warm intro, then one section per topic provided, each with a plain text heading and two or three short paragraphs. Close with what is coming next. Do not add sections that were not provided.`,
    context: { includeEvents: true, eventHorizonDays: 180, includeSamples: true },
  },

  // -------------------------------- Alumni --------------------------------
  {
    id: "alumni-post",
    category: "alumni",
    label: "Alumni Post",
    blurb: "Speak to people who grew up at camp.",
    format: "social",
    fields: [
      { name: "subject", label: "What's the post about?", type: "textarea", required: true, maxLength: 1000 },
      { name: "platform", label: "Platform", type: "radio", required: true, options: [
        { value: "instagram", label: "Instagram" },
        { value: "facebook", label: "Facebook" },
      ] },
      NOTES_FIELD,
    ],
    instructions: `Write a post aimed at camp alumni. Assume shared history and use the camp's own terminology. Warm, a little nostalgic, never corny.`,
    context: { includeEvents: false, includeSamples: true, sampleBudgetChars: 5000 },
  },
  {
    id: "reunion-communication",
    category: "alumni",
    label: "Reunion Communication",
    blurb: "Invite alumni back.",
    format: "email",
    fields: [
      { name: "event_date", label: "Reunion date", type: "date" },
      { name: "details", label: "Details", type: "textarea", placeholder: "e.g. where, what's planned, who's coming", maxLength: 1500 },
      { name: "rsvp", label: "How do they RSVP?", type: "text", maxLength: 200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a reunion invitation for alumni. Lead with the feeling of coming back, then the practical details provided. Only state a date, place or guest list that was given. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 365, includeSamples: true },
  },
  {
    id: "alumni-newsletter",
    category: "alumni",
    label: "Alumni Newsletter",
    blurb: "Catch alumni up on camp.",
    format: "newsletter",
    fields: [
      { name: "sections", label: "What's in this issue?", type: "textarea", required: true, placeholder: "One topic per line", maxLength: 2500 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write an alumni newsletter. Assume the reader has not been to camp in years: give enough context to follow along, but never explain camp to them as if they were new.`,
    context: { includeEvents: true, eventHorizonDays: 365, includeSamples: true },
  },
  {
    id: "fundraising-message",
    category: "alumni",
    label: "Fundraising Message",
    blurb: "Ask, without sounding like a form letter.",
    format: "email",
    fields: [
      { name: "purpose", label: "What are you raising money for?", type: "textarea", required: true, maxLength: 1500 },
      { name: "ask", label: "What's the specific ask?", type: "text", placeholder: "e.g. a gift of any size before June 30", maxLength: 300 },
      { name: "how", label: "How do they give?", type: "text", maxLength: 200 },
      LENGTH_FIELD,
      NOTES_FIELD,
    ],
    instructions: `Write a fundraising email to alumni or the camp community. Lead with the specific thing the money does, not with the ask. Make the ask once, plainly, near the end. Never invent a fundraising goal, a matching gift, a deadline or a donor name. ${LENGTH_GUIDE}`,
    context: { includeEvents: true, eventHorizonDays: 365, includeSamples: true },
  },
];

const TEMPLATE_INDEX = new Map(TEMPLATES.map((template) => [template.id, template]));

export function getTemplate(id: string): ContentTemplate | undefined {
  return TEMPLATE_INDEX.get(id);
}

export function templatesByCategory(category: CategoryId): ContentTemplate[] {
  return TEMPLATES.filter((template) => template.category === category);
}

export function quickTemplates(): ContentTemplate[] {
  return TEMPLATES.filter((template) => template.quick);
}

export function categoryLabel(id: string): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}
