// Built-in sample questions so practice mode works without an API key.
// Explanations refer to answer content (never letters) so choices can be
// safely shuffled on every run.

const BANKS = {
  Math: [
    {
      question: "If 3x + 5 = 20, what is the value of x?",
      choices: ["3", "5", "8", "15"],
      answerIndex: 1,
      explanation:
        "Subtract 5 from both sides to get 3x = 15, then divide by 3 to find x = 5. A common slip is stopping at 3x = 15 and picking 15 — that's the value of 3x, not x.",
    },
    {
      question:
        "A student's average score on 4 tests is 85. Her first three scores are 80, 88, and 84. What did she score on the fourth test?",
      choices: ["84", "86", "88", "90"],
      answerIndex: 2,
      explanation:
        "An average of 85 across 4 tests means the total is 4 × 85 = 340. The first three tests sum to 80 + 88 + 84 = 252, so the fourth score is 340 − 252 = 88. Averaging the three given scores instead gives 84, which ignores the missing test.",
    },
    {
      question:
        "A rectangle's length is twice its width. If its perimeter is 36, what is its area?",
      choices: ["36", "54", "72", "108"],
      answerIndex: 2,
      explanation:
        "With width w and length 2w, the perimeter is 2(w + 2w) = 6w = 36, so w = 6 and the length is 12. The area is 6 × 12 = 72. Choosing 36 mistakes the perimeter for the area — they measure different things, so always solve for the actual side lengths before multiplying.",
    },
    {
      question:
        "A $45 jacket is discounted 20%, and a $5 coupon is applied after the discount. What is the final price?",
      choices: ["$31", "$32", "$35", "$40"],
      answerIndex: 0,
      explanation:
        "20% off $45 leaves 0.8 × 45 = $36, and subtracting the $5 coupon gives $31. Applying the coupon first ($40) and then the discount would give $32 — order matters, and the problem applies the discount first.",
    },
    {
      question: "If f(x) = x^2 - 3x, what is f(-2)?",
      choices: ["-10", "-2", "4", "10"],
      answerIndex: 3,
      explanation:
        "Substitute carefully: (-2)^2 = 4 and -3(-2) = +6, so f(-2) = 4 + 6 = 10. The trap answer -10 comes from two sign errors at once — treating (-2)^2 as -4 and -3(-2) as -6. Squaring a negative always gives a positive, and a negative times a negative is positive.",
    },
  ],

  English: [
    {
      question: 'Choose the correct verb: "Each of the players ___ a uniform."',
      choices: ["have", "has", "are having", "were having"],
      answerIndex: 1,
      explanation:
        '"Each" is a singular pronoun and is the true subject of the sentence, so it takes the singular verb "has." The prepositional phrase "of the players" sits between subject and verb specifically to tempt you toward the plural "have" — agreement never lives inside a prepositional phrase.',
    },
    {
      question:
        'Which version correctly joins the two complete thoughts? "The results were clear ___ the experiment had worked."',
      choices: [
        "clear, the experiment",
        "clear; the experiment",
        "clear the experiment",
        "clear, however the experiment",
      ],
      answerIndex: 1,
      explanation:
        "Both halves are independent clauses, and a semicolon is the only option here that legally joins two independent clauses. A comma alone creates a comma splice, no punctuation creates a run-on, and \"however\" used this way needs a semicolon before it and a comma after.",
    },
    {
      question:
        'Choose the most concise version: "The committee meets annually each year to review the budget."',
      choices: [
        "annually each year",
        "each year on an annual basis",
        "annually",
        "yearly each year",
      ],
      answerIndex: 2,
      explanation:
        '"Annually" already means "each year," so pairing the two is redundant. Standardized tests consistently reward the shortest version that preserves the meaning — every other option here says the same thing twice.',
    },
    {
      question: 'Choose the correct word: "The robot extended ___ mechanical arm."',
      choices: ["it's", "its", "its'", "their"],
      answerIndex: 1,
      explanation:
        'The possessive form of "it" is "its" with no apostrophe. "It\'s" is only ever the contraction of "it is" or "it has," "its\'" is not a word, and "their" fails because the subject "robot" is singular.',
    },
    {
      question:
        'Which choice fixes the dangling modifier? "Running to catch the bus, ___."',
      choices: [
        "my backpack fell off",
        "the backpack slipped from the seat",
        "Maria dropped her backpack",
        "the bus pulled away quickly",
      ],
      answerIndex: 2,
      explanation:
        'The opening phrase "Running to catch the bus" must describe whoever appears right after the comma — and only a person can run for a bus. "Maria dropped her backpack" puts the runner in that spot; the other options absurdly suggest a backpack or the bus itself was doing the running.',
    },
  ],

  Reading: [
    {
      question:
        "Passage: Urban beekeeping has surged over the past decade. City honey, once a novelty, now appears in farmers' markets from Chicago to Tokyo. Researchers note that urban hives often out-produce rural ones, since city gardens offer a diverse, pesticide-light buffet.\n\nThe main purpose of the passage is to:",
      choices: [
        "argue that cities are better for all wildlife than farmland",
        "describe the rise and surprising advantages of urban beekeeping",
        "explain step-by-step how to start a rooftop hive",
        "criticize rural farmers for their use of pesticides",
      ],
      answerIndex: 1,
      explanation:
        "The passage reports a trend (beekeeping surging in cities) and a surprising finding (urban hives out-producing rural ones) — that is description, not argument or instruction. The pesticide detail explains why urban bees thrive; it isn't a criticism of farmers, and nothing in the passage generalizes to all wildlife.",
    },
    {
      question:
        "Passage: When the factory whistle fell silent in 1987, the town did not empty overnight. Instead it thinned gradually — a shuttered storefront here, a moved-away family there — until the silence itself felt like a neighbor.\n\nIt can reasonably be inferred that the town's decline was:",
      choices: [
        "sudden and catastrophic",
        "slow and cumulative",
        "quickly reversed by new industry",
        "limited to a single neighborhood",
      ],
      answerIndex: 1,
      explanation:
        'The passage explicitly rejects an overnight collapse and instead stacks small losses — "a shuttered storefront here, a moved-away family there" — signaling gradual, accumulating decline. Nothing suggests recovery or that the decline was geographically contained.',
    },
    {
      question:
        "Passage: The findings were so novel that several reviewers asked the team to repeat the experiment before they would accept the results.\n\nAs used in the passage, \"novel\" most nearly means:",
      choices: ["fictional", "new", "lengthy", "popular"],
      answerIndex: 1,
      explanation:
        'The reviewers\' skepticism makes sense only if the findings were unprecedented — that is, new. While "novel" can be a noun meaning a work of fiction, the context here uses it as an adjective; "fictional" would imply the results were fabricated, which is not what prompted the request to replicate.',
    },
    {
      question:
        "Passage: Another \"revolutionary\" fitness gadget hits stores this week, promising results no laboratory has ever managed to measure.\n\nThe author's tone is best described as:",
      choices: ["enthusiastic", "skeptical", "indifferent", "nostalgic"],
      answerIndex: 1,
      explanation:
        'The scare quotes around "revolutionary" and the jab that no lab can measure the promised results signal doubt about the product\'s claims — classic skepticism. An enthusiastic author would endorse the gadget, and an indifferent one wouldn\'t bother with pointed irony.',
    },
    {
      question:
        "Passage: Sea otters wrap themselves in strands of kelp before sleeping. The kelp anchors them in place, keeping currents from carrying them out to open water while they rest.\n\nAccording to the passage, otters use kelp in order to:",
      choices: [
        "hide from predators while hunting",
        "stay anchored while they sleep",
        "gather food from the seabed",
        "keep their fur warm and dry",
      ],
      answerIndex: 1,
      explanation:
        'The passage states the kelp "anchors them in place" while they rest — staying put while sleeping is the stated purpose. The other options describe plausible otter behaviors, but detail questions are answered strictly by what the passage actually says.',
    },
  ],

  Science: [
    {
      question:
        "An experiment grew three groups of bean plants under 4, 8, and 12 hours of daily light. After three weeks, average heights were 12 cm, 19 cm, and 26 cm respectively. Which conclusion is best supported?",
      choices: [
        "Light exposure has no effect on plant height",
        "Plant height increased as daily light exposure increased",
        "8 hours of light is optimal for bean plants",
        "Bean plants cannot survive on fewer than 4 hours of light",
      ],
      answerIndex: 1,
      explanation:
        "Height rose consistently with each increase in light (12 → 19 → 26 cm), which directly supports a positive relationship. Calling 8 hours optimal contradicts the data since 12 hours produced taller plants, and the experiment never tested below 4 hours, so no survival claim is supported.",
    },
    {
      question:
        "A table shows the solubility of a gas in water: 1.3 g/L at 10°C, 0.9 g/L at 20°C, and 0.6 g/L at 30°C. Based on this trend, the solubility at 40°C would most likely be closest to:",
      choices: ["0.0 g/L", "0.4 g/L", "0.7 g/L", "1.5 g/L"],
      answerIndex: 1,
      explanation:
        "Solubility drops as temperature rises — by 0.4 then 0.3 g/L per 10° step — so the next value should fall a bit below 0.6, making 0.4 g/L the best extrapolation. A value of 0.7 would reverse the trend, and 0.0 overshoots the gradual decline.",
    },
    {
      question:
        "A scientist testing a new fertilizer treats nine plots of soil with it but leaves one plot untreated. The untreated plot's main purpose is to:",
      choices: [
        "save fertilizer for later experiments",
        "provide a baseline for comparison",
        "test whether the soil type matters",
        "increase the total crop yield",
      ],
      answerIndex: 1,
      explanation:
        "The untreated plot is a control group: it shows what happens without the fertilizer, so any difference in the treated plots can be attributed to the treatment. Without that baseline, the scientist couldn't tell whether growth came from the fertilizer or would have happened anyway.",
    },
    {
      question:
        "Scientist 1 argues an asteroid impact was the primary cause of the dinosaur extinction. Scientist 2 argues massive volcanic eruptions were the primary cause. Both agree the extinction occurred about 66 million years ago. The two scientists disagree about:",
      choices: [
        "when the extinction occurred",
        "whether dinosaurs went extinct at all",
        "the primary cause of the extinction",
        "whether asteroids ever struck the Earth",
      ],
      answerIndex: 2,
      explanation:
        "Each scientist proposes a different primary mechanism — impact versus volcanism — which is exactly where their viewpoints split. The timing is explicitly shared ground, and neither denies the extinction happened or that asteroids exist; conflicting-viewpoints questions reward isolating the precise point of dispute.",
    },
    {
      question:
        "Atmospheric pressure decreases as altitude increases. A climber's instrument reads 350 mmHg at a mountain summit and 500 mmHg at base camp. Which statement is consistent with these readings?",
      choices: [
        "The summit is at a lower altitude than base camp",
        "The summit is at a higher altitude than base camp",
        "Both locations are at the same altitude",
        "The instrument must be malfunctioning",
      ],
      answerIndex: 1,
      explanation:
        "Pressure falls as you climb, so the lower reading (350 mmHg) belongs to the higher location — the summit. Reading the relationship backwards leads to the lower-altitude answer; the readings are perfectly consistent with the stated principle, so there's no reason to suspect the instrument.",
    },
  ],
};

// Built-in ACT English passage so the exam-replica format works without an API
// key. Already in the shape validatePassageSet() produces, so the UI can render
// it directly. Choice order is curated (NO CHANGE stays first; correct answers
// are spread across positions), so this set is intentionally NOT shuffled.
const SAMPLE_PASSAGE = {
  title: "Saturdays at the Bike Co-op",
  segments: [
    {
      text: "When I first walked into the neighborhood bike co-op, I only meant to patch a flat tire. ",
      underline: false,
      ref: 0,
    },
    { text: "Two years later, I was still showing up every Saturday morning.", underline: true, ref: 1 },
    { text: " The co-op, ", underline: false, ref: 0 },
    { text: "a cramped garage packed with secondhand parts,", underline: true, ref: 2 },
    {
      text: " repaired bicycles for anyone who couldn't pay a shop's prices.\n\nMy first task seemed simple: organize a bin of bolts. ",
      underline: false,
      ref: 0,
    },
    { text: "Therefore,", underline: true, ref: 3 },
    {
      text: " I quickly learned that each bolt had its own thread size ",
      underline: false,
      ref: 0,
    },
    { text: "that was particular to that individual bolt", underline: true, ref: 4 },
    {
      text: ", and mixing them up could ruin a repair. The veteran volunteers ",
      underline: false,
      ref: 0,
    },
    { text: "was", underline: true, ref: 5 },
    { text: " patient with me, naming each tool as they handed it over. ", underline: false, ref: 0 },
    { text: "Its", underline: true, ref: 6 },
    {
      text: " knowledge, gathered over decades, turned a wall of mysterious metal into something I could read.\n\nBy spring I could true a bent wheel myself, tightening each spoke until the rim spun ",
      underline: false,
      ref: 0,
    },
    { text: "smooth and silent.", underline: true, ref: 7 },
    { text: " The work was slow, but it taught me that patience is a skill like any other.", underline: false, ref: 0 },
  ],
  questions: [
    {
      ref: 1,
      prompt:
        "Given that all the choices are accurate, which one most effectively emphasizes how much longer the narrator stayed than she had originally planned?",
      choices: [
        "NO CHANGE",
        "Eventually, I wandered back in.",
        "I returned again the next weekend.",
        "Time passed, as it usually does.",
      ],
      answerIndex: 0,
      explanation:
        'Pairing "Two years later" with "still showing up" sets the long stretch against the one-flat-tire plan, which is exactly the emphasis the question asks for. "The next weekend" badly understates the span, and the other options stay vague about how much time passed.',
    },
    {
      ref: 2,
      prompt: "Which choice makes the sentence most grammatically acceptable?",
      choices: [
        "NO CHANGE",
        "a cramped garage packed with secondhand parts",
        "(a cramped garage packed with secondhand parts)",
        "a cramped garage, packed with secondhand parts",
      ],
      answerIndex: 0,
      explanation:
        'The phrase is an appositive renaming "the co-op," so it must be closed off by a comma on each side; the opening comma is already in place before it. Dropping the closing comma leaves the aside unclosed, and switching to parentheses clashes with the comma that already opens the interruption.',
    },
    {
      ref: 3,
      prompt: "Which choice provides the most logical transition from the preceding sentence?",
      choices: ["NO CHANGE", "For example,", "However,", "Meanwhile,"],
      answerIndex: 2,
      explanation:
        'A task that "seemed simple" turning out to be finicky is a contrast, and "However" signals exactly that reversal. "Therefore" wrongly implies the difficulty was a logical result of the task seeming simple, and "For example" and "Meanwhile" signal relationships the sentences don\'t have.',
    },
    {
      ref: 4,
      prompt: "Which choice is least redundant in context?",
      choices: [
        "NO CHANGE",
        "that was particular and specific to it",
        "DELETE the underlined portion (and end with a comma).",
        "belonging to that one bolt alone",
      ],
      answerIndex: 2,
      explanation:
        '"Its own thread size" already says the size is unique to that bolt, so the underlined clause only repeats the idea. Deleting it is the least redundant option; every other choice keeps restating the same point in different words.',
    },
    {
      ref: 5,
      prompt: "Which choice makes the sentence most grammatically acceptable?",
      choices: ["NO CHANGE", "were", "is", "has been"],
      answerIndex: 1,
      explanation:
        'The subject "volunteers" is plural, so it needs the plural verb "were." "Was," "is," and "has been" are all singular and clash with a subject naming more than one person.',
    },
    {
      ref: 6,
      prompt: "Which choice makes the sentence most grammatically acceptable?",
      choices: ["NO CHANGE", "There", "They're", "Their"],
      answerIndex: 3,
      explanation:
        'The knowledge belongs to the volunteers — a plural antecedent — so the possessive "Their" is correct. "Its" is singular, "There" indicates a place, and "They\'re" is the contraction of "they are."',
    },
    {
      ref: 7,
      prompt: "Which choice makes the sentence most grammatically acceptable?",
      choices: [
        "NO CHANGE",
        "in a smooth and silent way.",
        "smoothly and silently.",
        "smooth and silently.",
      ],
      answerIndex: 2,
      explanation:
        'The words describe how the rim "spun," and adverbs modify verbs, so "smoothly and silently" is correct. "Smooth and silent" are adjectives, the mixed "smooth and silently" is inconsistent, and "in a smooth and silent way" is wordy padding.',
    },
    {
      ref: 0,
      prompt:
        "Suppose the writer's primary purpose had been to explain the step-by-step process of repairing a bicycle. Would this essay accomplish that purpose?",
      choices: [
        "Yes, because it lists the exact tools a beginner needs to true a wheel.",
        "Yes, because it walks through how to sort bolts by their thread size.",
        "No, because it is a personal account of what the narrator gained from volunteering, not a how-to guide.",
        "No, because it never mentions bicycles or repairs anywhere in the essay.",
      ],
      answerIndex: 2,
      explanation:
        "The essay is a first-person reflection on two years at the co-op and what the work taught the narrator; it touches on repairs only in passing, so it would not serve as a step-by-step guide. The choice claiming it never mentions bicycles is simply false.",
    },
  ],
};

/**
 * Returns a fresh copy of the built-in ACT English passage set. Not shuffled —
 * the curated choice order (NO CHANGE first) and answer spread are part of the
 * design.
 */
export function getSamplePassage() {
  return {
    title: SAMPLE_PASSAGE.title,
    segments: SAMPLE_PASSAGE.segments.map((s) => ({ ...s })),
    questions: SAMPLE_PASSAGE.questions.map((q) => ({ ...q, choices: [...q.choices] })),
  };
}

// Built-in ACT Reading passage (Natural Science) so the comprehension format
// works without an API key. Answers verified against the passage; correct
// choices are spread across positions.
const SAMPLE_READING = {
  format: "single",
  title: "The Color-Changing Skin of the Octopus",
  genre: "Natural Science",
  paragraphs: [
    "The octopus is among the most accomplished quick-change artists in the animal kingdom. In less than a second, it can shift the color of its skin from mottled brown to vivid red, or raise its texture into bumpy ridges that mimic coral. For decades this talent puzzled biologists, and for a strange reason: the octopus, by every test scientists have devised, appears to be colorblind. How can an animal match colors it cannot see?",
    "The color changes themselves are produced by structures called chromatophores. Each chromatophore is a tiny elastic sac filled with pigment, ringed by small muscles. When those muscles contract, they stretch the sac open, spreading its pigment across a wider area and deepening the skin's color; when the muscles relax, the sac shrinks to a nearly invisible dot. A single octopus may carry several million chromatophores, and beneath them lie reflective cells that bounce back light, adding silvery and iridescent tones the pigments alone cannot produce.",
    "The colorblindness puzzle has only recently begun to yield. Researchers have found light-sensitive proteins called opsins—the same family of molecules the eye uses to detect light—scattered throughout the octopus's skin. In other words, the skin itself may register light directly, independent of the eyes. An octopus might, in a sense, sample the brightness and perhaps the color of its surroundings through the very surface it is trying to disguise.",
    "Camouflage, however, is not the skin's only job. Octopuses also use their shifting patterns to communicate. A male may flash bold stripes at a rival while showing a courting female a calmer pattern on the opposite side of his body at the very same instant—effectively sending two messages at once. Such displays suggest that the skin is not merely a passive disguise but an expressive surface, closer to a face than to a coat of paint.",
    "These abilities have caught the attention of engineers as well as biologists. Teams are studying octopus skin in hopes of designing adaptive materials: fabrics that shift color to match their background, flexible electronic displays, and camouflage that responds to its environment without human control. Nature, in this case, has quietly solved a problem that human technology is only beginning to approach.",
    "Much about the system remains mysterious. The octopus's nervous system is unusually distributed, with the majority of its neurons located not in its central brain but in its arms. A great deal of the processing behind a single color change may therefore happen locally, in the skin and limbs themselves, rather than being dictated from one command center. The animal that cannot see color, it seems, manages it with an intelligence spread across its entire body.",
  ],
  questions: [
    {
      prompt: "The main purpose of the passage is to:",
      choices: [
        "argue that octopuses are more intelligent than all other sea creatures",
        "explain how octopuses change color and the questions that ability raises for scientists",
        "describe a single laboratory's experiments on chromatophores",
        "warn that octopus camouflage makes the animals impossible to study",
      ],
      answerIndex: 1,
      explanation:
        "The passage lays out the mechanism of color change (chromatophores, opsins) and the puzzles it raises (colorblindness, a distributed nervous system). It never ranks octopus intelligence against all other animals, centers on one lab's experiments, or warns that the animals can't be studied.",
    },
    {
      prompt: "According to the passage, chromatophores deepen the skin's color when:",
      choices: [
        "the surrounding water grows darker",
        "the octopus closes its eyes",
        "their surrounding muscles contract and stretch the pigment sac open",
        "reflective cells beneath them bounce back light",
      ],
      answerIndex: 2,
      explanation:
        "The second paragraph states that when the muscles contract they stretch the sac open, spreading pigment and deepening the color. The reflective cells add iridescent tones rather than deepening pigment, and neither darker water nor the eyes is named as the trigger.",
    },
    {
      prompt: 'As it is used in the first paragraph, the word "match" most nearly means:',
      choices: [
        "compete against",
        "set on fire",
        "pair up romantically",
        "reproduce or imitate",
      ],
      answerIndex: 3,
      explanation:
        'To "match colors it cannot see" means to reproduce or imitate those colors on its skin. The other senses of "match"—a contest, a fire-starting stick, or a romantic pairing—do not fit the context of mimicking surrounding colors.',
    },
    {
      prompt:
        "It can reasonably be inferred that scientists found the octopus's camouflage especially puzzling because:",
      choices: [
        "the animal appears unable to see the very colors it reproduces",
        "octopuses change color only at night",
        "chromatophores are too small to observe",
        "octopuses rarely use camouflage in the wild",
      ],
      answerIndex: 0,
      explanation:
        "The first paragraph frames the puzzle directly: the octopus is colorblind yet matches colors. The passage never claims color change is nocturnal, that chromatophores can't be observed, or that camouflage is rare.",
    },
    {
      prompt: "The fourth paragraph primarily serves to:",
      choices: [
        "explain the chemical makeup of octopus pigment",
        "describe how engineers build adaptive materials",
        "show that the skin's color changes serve communication, not only disguise",
        "compare the octopus to other mollusks",
      ],
      answerIndex: 2,
      explanation:
        "The fourth paragraph introduces communication—flashing rival and courtship patterns at once—as a purpose beyond camouflage. Engineering applications appear in the fifth paragraph, and the chemistry and mollusk comparisons are not in the passage.",
    },
    {
      prompt:
        "The discovery of opsins in the octopus's skin (third paragraph) most strongly suggests that:",
      choices: [
        "the octopus's eyes are far more powerful than once believed",
        "octopuses gradually lose their camouflage as they age",
        "pigment sacs can open without any muscles",
        "the skin may detect light on its own, apart from the eyes",
      ],
      answerIndex: 3,
      explanation:
        "The paragraph says the skin may register light directly, independent of the eyes. It makes no claim about the eyes being more powerful, about aging, or about sacs opening without muscles (the second paragraph says muscles open them).",
    },
    {
      prompt: "The author's attitude toward the study of octopus skin can best be described as:",
      choices: [
        "skeptical and dismissive",
        "intrigued and admiring",
        "anxious and alarmed",
        "bored and detached",
      ],
      answerIndex: 1,
      explanation:
        'Phrases like "most accomplished quick-change artists" and "Nature... has quietly solved a problem that human technology is only beginning to approach" convey admiration and curiosity, not skepticism, alarm, or boredom.',
    },
    {
      prompt:
        "According to the passage, one practical application researchers hope to develop from octopus skin is:",
      choices: [
        "materials that change color to match their surroundings",
        "faster and quieter submarines",
        "new medicines for human eyes",
        "tools for counting wild octopus populations",
      ],
      answerIndex: 0,
      explanation:
        "The fifth paragraph names adaptive materials—color-shifting fabrics, flexible displays, and responsive camouflage. Submarines, eye medicines, and population-counting tools are never mentioned.",
    },
  ],
};

// Paired A/B sample (Social Science).
const SAMPLE_READING_PAIRED = {
  format: "paired",
  title: "The Fate of the Third Place",
  genre: "Social Science",
  passageA: {
    label: "Passage A is adapted from an essay by an urban planner.",
    paragraphs: [
      "Between home and work lies a third kind of space: the cafe, the public library, the corner barbershop. The sociologist Ray Oldenburg called these \"third places,\" and argued that they are where community is quietly built. Unlike the privacy of home or the hierarchy of work, a true third place welcomes anyone who walks in, sets rank aside, and runs on nothing more than conversation.",
      "Cities that invest in such places reap the rewards. A well-placed library or shaded plaza gives strangers a reason to linger, and lingering, repeated over months, turns strangers into familiar faces and familiar faces into neighbors. When a city lets these spaces vanish, it does not merely lose buildings; it loses the easy, unplanned contact that makes a scattered population feel like a single public.",
    ],
  },
  passageB: {
    label: "Passage B is adapted from a recent article by a sociologist.",
    paragraphs: [
      "The third place is not so much disappearing as migrating. Today's gathering spots are as likely to be found online as on any street corner. A teenager may feel a stronger sense of belonging in a gaming community than in any neighborhood cafe, and that community asks nothing of geography; its members may never share a single zip code.",
      "Critics mourn the empty plaza, but they may be measuring the wrong thing. Belonging has loosened its old tie to physical place. Whether that shift genuinely weakens community or simply relocates it remains, for now, an open question—though the nostalgic view tends to answer it before it has honestly been asked.",
    ],
  },
  questions: [
    {
      scope: "A",
      prompt: "According to Passage A, a true third place differs from a workplace mainly in that it:",
      choices: [
        "charges no money to enter",
        "sets rank aside and welcomes anyone who comes in",
        "is owned by the city rather than a company",
        "stays open later in the evening",
      ],
      answerIndex: 1,
      explanation:
        "Passage A says a third place, unlike the hierarchy of work, \"sets rank aside\" and \"welcomes anyone who walks in.\" Cost, ownership, and hours are never given as the defining contrast.",
    },
    {
      scope: "A",
      prompt: "In Passage A, the author values \"lingering\" primarily because it:",
      choices: [
        "gives businesses more time to make sales",
        "allows people to avoid going home",
        "turns repeated casual contact into neighborly familiarity",
        "keeps public plazas from sitting empty",
      ],
      answerIndex: 2,
      explanation:
        "Passage A states that lingering \"repeated over months, turns strangers into familiar faces and familiar faces into neighbors.\" The other options are not the reason the author gives.",
    },
    {
      scope: "B",
      prompt: "According to Passage B, today's gathering places are increasingly:",
      choices: [
        "found online rather than in physical locations",
        "limited to wealthy neighborhoods",
        "run by city governments",
        "shared by people who live on the same block",
      ],
      answerIndex: 0,
      explanation:
        "Passage B says modern gathering spots are \"as likely to be found online as on any street corner\" and that such communities ask \"nothing of geography.\" The other choices contradict the passage.",
    },
    {
      scope: "B",
      prompt: "The author of Passage B implies that critics who \"mourn the empty plaza\":",
      choices: [
        "have proven that online community is harmful",
        "may be judging the change before honestly examining it",
        "want cities to build more libraries",
        "prefer gaming communities to cafes",
      ],
      answerIndex: 1,
      explanation:
        "Passage B says the nostalgic view \"tends to answer it before it has honestly been asked\" and that critics \"may be measuring the wrong thing\"—a charge of premature judgment, not proof of harm.",
    },
    {
      scope: "both",
      prompt: "Compared to Passage A, Passage B is more:",
      choices: [
        "nostalgic about neighborhood life",
        "concerned with city budgets",
        "skeptical that community depends on physical place",
        "pessimistic about new technology",
      ],
      answerIndex: 2,
      explanation:
        "Passage A ties community to physical third places; Passage B argues belonging \"has loosened its old tie to physical place.\" That doubt about place—not nostalgia, budgets, or technophobia—is the key difference.",
    },
    {
      scope: "both",
      prompt: "The author of Passage A would most likely respond to Passage B by arguing that:",
      choices: [
        "online communities are simply a passing fad",
        "geography is the only thing that matters to belonging",
        "online belonging cannot supply the unplanned in-person contact that builds a public",
        "teenagers should spend less time playing games",
      ],
      answerIndex: 2,
      explanation:
        "Passage A's central claim is that the \"easy, unplanned contact\" of shared physical space makes a population a public—something the author would argue an online community can't fully replace. The other options overstate or stray from that view.",
    },
    {
      scope: "both",
      prompt: "Both passages are primarily concerned with:",
      choices: [
        "how and where a sense of community forms",
        "the financial cost of public spaces",
        "the history of the public library",
        "the design of modern video games",
      ],
      answerIndex: 0,
      explanation:
        "Both passages examine where belonging and community come from—Passage A locating it in physical third places, Passage B in increasingly online ones. Cost, libraries, and game design are at most incidental details.",
    },
  ],
};

// Graph/figure sample (Social Science).
const SAMPLE_READING_GRAPH = {
  format: "graph",
  title: "Bringing Back the Bus",
  genre: "Social Science",
  paragraphs: [
    "For years, the bus system in the mid-sized city of Marin Falls had been losing riders. Routes wandered across the map in search of every neighborhood, and as a result buses on any given line came rarely—often just once an hour. In 2018, the transit agency tried something that sounded almost backward: it cut the number of routes.",
    "The redesign concentrated service on a handful of main corridors, where buses now arrived every ten minutes from morning to night. Quieter suburban routes were trimmed or dropped. Crucially, the agency did this without spending more money; it simply moved resources from lightly used routes to busy ones.",
    "In the years that followed, ridership climbed. But the gains were not evenly shared. On the frequent main lines, trips rose sharply; on the remaining infrequent routes, ridership barely moved. Riders, it seemed, were drawn less by how many places a bus could reach than by how seldom they had to wait for one.",
    "The lesson Marin Falls drew was blunt: when it comes to winning riders, frequency beats coverage. A bus that comes every ten minutes is a tool people can build a day around; a bus that comes once an hour is a gamble most will avoid.",
  ],
  figure: {
    caption: "Figure 1: Annual bus ridership in Marin Falls (millions of trips)",
    type: "line",
    xLabel: "Year",
    yLabel: "Trips (millions)",
    series: [
      {
        name: "Frequent main lines",
        points: [
          { x: "2017", y: 8 },
          { x: "2018", y: 9 },
          { x: "2019", y: 11 },
          { x: "2020", y: 12 },
          { x: "2021", y: 13 },
        ],
      },
      {
        name: "Infrequent routes",
        points: [
          { x: "2017", y: 5 },
          { x: "2018", y: 5 },
          { x: "2019", y: 5 },
          { x: "2020", y: 5 },
          { x: "2021", y: 5 },
        ],
      },
    ],
  },
  questions: [
    {
      prompt: "The main purpose of the passage is to:",
      choices: [
        "describe how cutting routes but raising frequency increased bus ridership",
        "argue that the city should have spent more on its bus system",
        "explain how to read a transit ridership graph",
        "compare buses with other forms of public transportation",
      ],
      answerIndex: 0,
      explanation:
        "The passage recounts Marin Falls's 2018 redesign—fewer routes, far more frequent main lines—and the ridership gains that followed. It does not call for more spending, teach graph-reading, or compare buses to other modes.",
    },
    {
      prompt: "According to the passage, the city carried out its 2018 redesign by:",
      choices: [
        "raising fares to fund new buses",
        "moving resources from lightly used routes to busy ones, without spending more",
        "adding service to every suburban neighborhood",
        "borrowing money to expand the fleet",
      ],
      answerIndex: 1,
      explanation:
        "The second paragraph says the agency made the change \"without spending more money; it simply moved resources from lightly used routes to busy ones.\" Fares, universal suburban service, and borrowing are not mentioned.",
    },
    {
      prompt: "According to Figure 1, ridership on the frequent main lines in 2021 was about:",
      choices: ["8 million trips", "11 million trips", "13 million trips", "5 million trips"],
      answerIndex: 2,
      explanation:
        "The figure shows the frequent main lines reaching 13 million trips in 2021. Eight million was the 2017 value, 11 million was 2019, and 5 million is the infrequent routes.",
    },
    {
      prompt: "Based on Figure 1, ridership on the infrequent routes between 2017 and 2021:",
      choices: [
        "rose steadily each year",
        "stayed essentially flat",
        "fell to nearly zero",
        "rose and then dropped",
      ],
      answerIndex: 1,
      explanation:
        "The infrequent-routes line holds at about 5 million trips every year in the figure—essentially flat, in contrast to the climbing main-line ridership.",
    },
    {
      prompt: "The figure most strongly supports the passage's claim that:",
      choices: [
        "total ridership fell after the redesign",
        "frequency, not coverage, drove the gains in ridership",
        "suburban routes gained the most new riders",
        "the redesign made no measurable difference",
      ],
      answerIndex: 1,
      explanation:
        "The frequent lines climb while the infrequent routes stay flat, matching the passage's point that riders were drawn by frequent service rather than wide coverage. The other options contradict the data.",
    },
    {
      prompt: "It can reasonably be inferred that a different city hoping to raise bus ridership should:",
      choices: [
        "add as many routes as possible",
        "focus on running frequent service on its busiest corridors",
        "reduce service across the entire system",
        "raise fares to discourage crowding",
      ],
      answerIndex: 1,
      explanation:
        "Marin Falls's results suggest concentrating frequent service on main corridors wins riders. Maximizing routes is the strategy the passage says failed; cutting all service or raising fares would not raise ridership.",
    },
    {
      prompt: 'As it is used in the final paragraph, the word "coverage" most nearly means:',
      choices: [
        "the cost of a bus ticket",
        "protection against accidents",
        "the number of places the routes reach",
        "news reports about the buses",
      ],
      answerIndex: 2,
      explanation:
        'The passage contrasts "frequency" with "coverage"—how many places a bus can reach. The insurance, ticket-price, and news senses of "coverage" do not fit that contrast.',
    },
  ],
};

const SAMPLE_READINGS = [SAMPLE_READING, SAMPLE_READING_PAIRED, SAMPLE_READING_GRAPH];

// Returns a deep copy of a randomly chosen sample (single, paired, or graph) so
// the free sample set shows all three Reading formats.
export function getSampleReading() {
  const pick = SAMPLE_READINGS[Math.floor(Math.random() * SAMPLE_READINGS.length)];
  return JSON.parse(JSON.stringify(pick));
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Returns a fresh, shuffled copy of the sample bank for a subject —
 * question order and choice order both vary between runs.
 */
export function getSampleQuestions(subject) {
  const bank = BANKS[subject] ?? BANKS.Math;
  return shuffle(bank).map((q) => {
    const order = shuffle([0, 1, 2, 3]);
    return {
      question: q.question,
      choices: order.map((i) => q.choices[i]),
      answerIndex: order.indexOf(q.answerIndex),
      explanation: q.explanation,
    };
  });
}
