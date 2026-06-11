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
