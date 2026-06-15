// Pure data: section recipes + exam composition. No imports, so both the app
// and the Node build script (scripts/build-exams.mjs) can use it.
//
// Each plan: which units to generate (mapped to the four runners), the question
// target, and a default timer (minutes) the user can override in practice mode.

export const SECTION_PLANS = {
  "ACT-English": {
    test: "ACT",
    subject: "English",
    label: "ACT English",
    target: 50,
    minutes: 35,
    units: [
      { kind: "passage" },
      { kind: "passage" },
      { kind: "passage" },
      { kind: "passage" },
      { kind: "passage" },
    ],
  },
  "ACT-Reading": {
    test: "ACT",
    subject: "Reading",
    label: "ACT Reading",
    target: 36,
    minutes: 40,
    units: [
      { kind: "reading", variant: "single" },
      { kind: "reading", variant: "single" },
      { kind: "reading", variant: "paired" },
      { kind: "reading", variant: "graph" },
    ],
  },
  "ACT-Math": {
    test: "ACT",
    subject: "Math",
    label: "ACT Math",
    target: 45,
    minutes: 50,
    units: [
      { kind: "mcq", count: 12 },
      { kind: "mcq", count: 12 },
      { kind: "mcq", count: 12 },
      { kind: "mcq", count: 9 },
    ],
  },
  "ACT-Science": {
    test: "ACT",
    subject: "Science",
    label: "ACT Science",
    target: 40,
    minutes: 40,
    units: [
      { kind: "mcq", count: 10 },
      { kind: "mcq", count: 10 },
      { kind: "mcq", count: 10 },
      { kind: "mcq", count: 10 },
    ],
  },
  "SAT-English": {
    test: "SAT",
    subject: "English",
    label: "SAT Reading & Writing",
    target: 27,
    minutes: 32,
    units: [{ kind: "writing" }, { kind: "writing" }, { kind: "writing" }],
  },
  "SAT-Math": {
    test: "SAT",
    subject: "Math",
    label: "SAT Math",
    target: 22,
    minutes: 35,
    units: [
      { kind: "mcq", count: 11 },
      { kind: "mcq", count: 11 },
    ],
  },
};

// Section order for full-exam mode, per test.
export const EXAM_SECTIONS = {
  ACT: ["ACT-English", "ACT-Math", "ACT-Reading", "ACT-Science"],
  SAT: ["SAT-English", "SAT-Math"],
};
