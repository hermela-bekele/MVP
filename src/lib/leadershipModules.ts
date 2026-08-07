// Education Leadership Excellence Program (ELEP) modules — shown to School Head
// and Department Head roles. Reuses the TrainingModule shape from
// continuousDevelopmentModules.ts so the existing training-viewer UI works unchanged.

import type { TrainingModule } from './continuousDevelopmentModules';

export const ELEP_MODULES: TrainingModule[] = [
  {
    id: 'elep-module-1',
    title: 'ELEP 1: Instructional Leadership & Coaching Teachers',
    category: 'LEADERSHIP',
    description: 'Moving from monitoring compliance to actively growing your teachers · 3 hrs',
    duration: '3 Hours',
    sessionsCount: 3,
    target: 'Department Heads & School Heads',
    overview:
      'This module reframes the leader\'s role from checking paperwork to actively developing teaching quality. It covers how to read classroom evidence (delivery logs, grade-miss patterns, self-assessments) to decide what a teacher actually needs, and how to have a coaching conversation that leads to a change in practice rather than a defensive reaction.',
    objectives: [
      'Distinguish compliance monitoring from instructional coaching',
      'Read AI gap-analysis and self-assessment data to prioritize what to coach on',
      'Run a coaching conversation that ends in an agreed, specific next action',
    ],
    sessions: [
      {
        id: 'elep-1-s1',
        number: '1',
        title: 'From Checking Boxes to Coaching Practice',
        duration: '1 Hour',
        completed: false,
        content: `## From Checking Boxes to Coaching Practice

A department or school runs smoothly when leaders monitor compliance (lesson plans submitted, attendance logged) — but it only *improves* when leaders coach practice.

### The two different jobs
| Compliance monitoring | Instructional coaching |
|---|---|
| Did they submit the lesson plan? | Is the lesson plan going to work for these students? |
| Did they mark attendance? | Why is attendance dropping in this specific class? |
| Did they deliver the lesson? | What happened when they delivered it, and what would make it land better? |

Both matter, but only the second one changes outcomes. If all of your time as a leader goes to the left column, your teachers will comply and plateau.

### Where the evidence already exists
You don't need to invent new observation systems — the portal already surfaces:
- **Grade-miss patterns** from student assessment results, flagging where a class is consistently missing specific question types or topics.
- **Delivery feedback** teachers log after teaching a lesson (what worked, what didn't).
- **Self-assessment results** from STEP, showing where a teacher rates themselves lowest.

Coaching starts by triangulating these three signals for a teacher, not by guessing.`,
      },
      {
        id: 'elep-1-s2',
        number: '2',
        title: 'Reading the Gap Signals Before You Coach',
        duration: '1 Hour',
        completed: false,
        content: `## Reading the Gap Signals Before You Coach

Before any coaching conversation, spend 10 minutes triangulating the evidence you already have.

### The triangulation check
1. **AI gap analysis** — which topics/question types is this teacher's class consistently missing on assessments? A single low score is noise; a repeated pattern across assessments is signal.
2. **Self-assessment** — where did the teacher rate themselves lowest on the STEP rubric? This tells you what they're already aware of (easier conversation) versus what might be a blind spot (harder, more important conversation).
3. **Delivery notes** — what does the teacher say happened when they taught the topic the gap analysis flagged? Often the gap isn't subject knowledge, it's pacing, checking for understanding, or classroom management eating into content time.

### Turning signals into a coaching focus
- If gap analysis and self-assessment **agree** (teacher already knows it's weak) → assign a specific module and check in on application, don't just re-explain the theory.
- If gap analysis flags something **not** in the teacher's self-assessment → this is a blind spot conversation; lead with curiosity ("Tell me how that topic went") rather than the data itself.
- If self-assessment shows a weakness with **no** matching gap in results yet → this is a preventive coaching opportunity, not urgent, but worth a light-touch resource.

This is exactly the workflow the Teacher Development page is built around: it surfaces both signals side-by-side per teacher so you can decide what to assign and why.`,
      },
      {
        id: 'elep-1-s3',
        number: '3',
        title: 'The Coaching Conversation',
        duration: '1 Hour',
        completed: false,
        content: `## The Coaching Conversation

Data tells you *what* to talk about. This session is about *how* to talk about it so it leads to change instead of defensiveness.

### A simple four-step structure
1. **Open with strengths, specifically** — not generic praise. "Your check-for-understanding in the first ten minutes was strong" is more useful than "good job."
2. **Name the pattern, not the person** — "The last three assessments show students missing multi-step word problems" rather than "your teaching of word problems is weak."
3. **Ask before telling** — "What's your read on why that pattern shows up?" Teachers usually have real insight; coaching that skips this step feels like a lecture.
4. **Agree on one specific, small next action** — not five. "Try one worked-example-then-guided-practice sequence for word problems next week, and let's look at the next assessment together" is coachable; a long list isn't.

### Assigning a module vs. just talking
A conversation without a follow-up resource often fades. Once you've agreed on a focus area, assign the matching STEP module directly from the Teacher Development page with a short reason — this keeps the conversation and the resource connected, and gives you something concrete to check in on next time.

### Closing the loop
Put a date on the calendar to revisit — even two weeks out. Coaching without a follow-up point rarely produces lasting change.`,
      },
    ],
    assessmentContent: 'Reflect on the coaching approach covered in this module.',
    assessmentQuestions: [
      {
        id: 'elep-1-q1',
        type: 'multiple-choice',
        question: 'What distinguishes instructional coaching from compliance monitoring?',
        options: [
          'Coaching checks whether paperwork was submitted',
          'Coaching focuses on whether practice actually improves outcomes',
          'Coaching only happens once a year',
          'There is no meaningful difference',
        ],
        correctAnswer: 'Coaching focuses on whether practice actually improves outcomes',
        explanation: 'Compliance monitoring checks that tasks happened; coaching looks at whether the underlying practice is effective and improving.',
        points: 34,
      },
      {
        id: 'elep-1-q2',
        type: 'multiple-choice',
        question: 'If AI gap analysis flags a weakness the teacher did NOT flag in their self-assessment, what does that suggest?',
        options: [
          'The gap analysis is probably wrong',
          'A likely blind spot worth a curious, non-accusatory conversation',
          'The teacher should be reassigned',
          'Nothing — ignore it until it recurs',
        ],
        correctAnswer: 'A likely blind spot worth a curious, non-accusatory conversation',
        explanation: 'A mismatch between external data and self-perception is exactly the kind of gap coaching conversations are most useful for.',
        points: 33,
      },
      {
        id: 'elep-1-q3',
        type: 'short-answer',
        question: 'Describe the four-step coaching conversation structure from this module.',
        explanation: 'Look for: open with specific strengths, name the pattern not the person, ask before telling, agree on one small next action.',
        points: 33,
      },
    ],
    passingScore: 70,
    completed: false,
    videoCount: 0,
  },
  {
    id: 'elep-module-2',
    title: 'ELEP 2: Leading Change Across a Team',
    category: 'LEADERSHIP',
    description: 'Rolling out a new practice, resource, or expectation across a whole team · 2.5 hrs',
    duration: '2.5 Hours',
    sessionsCount: 2,
    target: 'Department Heads & School Heads',
    overview:
      'Coaching one teacher at a time doesn\'t scale a school-wide or department-wide improvement. This module covers how to introduce a change (a new grading rubric, a new lesson-plan format, an academic-calendar shift) to a whole team so that it actually gets adopted, rather than quietly ignored after week one.',
    objectives: [
      'Sequence a rollout so early adopters build momentum for the rest of the team',
      'Anticipate and address the most common reasons a new practice gets abandoned',
      'Use disseminated resources and announcements effectively as part of a rollout',
    ],
    sessions: [
      {
        id: 'elep-2-s1',
        number: '1',
        title: 'Why Rollouts Fail (and How to Sequence Them So They Don\'t)',
        duration: '1.5 Hours',
        completed: false,
        content: `## Why Rollouts Fail (and How to Sequence Them So They Don't)

Most failed rollouts don't fail because the idea was bad — they fail because everyone was asked to change at once, with no proof it would work for them specifically.

### The most common failure pattern
1. Leader announces a new expectation to the whole team at once.
2. A few teachers try it, most wait to see if it's "really" required.
3. No visible follow-up happens for a few weeks.
4. The initiative quietly disappears, and the next one gets even less buy-in.

### A sequence that actually spreads
1. **Pilot with 1–2 willing teachers first**, ideally ones respected by peers, not just compliant ones.
2. **Make their results visible** — a short share in a team channel or meeting, in their own words, not yours.
3. **Roll out to the rest of the team with the pilot's real examples attached**, not just an abstract policy.
4. **Check in publicly at a fixed interval** (e.g., two weeks) so the initiative visibly stays alive.

### Using the Communication channels for this
Announcements are the right channel for the initial rollout and the fixed check-in; the department/team channel is the right place for the pilot teachers to share what worked — visibility from peers converts skeptics faster than a repeated announcement from you does.`,
      },
      {
        id: 'elep-2-s2',
        number: '2',
        title: 'Handling Resistance Without Losing the Room',
        duration: '1 Hour',
        completed: false,
        content: `## Handling Resistance Without Losing the Room

Some resistance to change is about the change itself; a lot of it is about *how* it was introduced. Separating the two lets you respond appropriately instead of either caving or steamrolling.

### Three common resistance types and what's actually behind them
| What you hear | What's often actually happening |
|---|---|
| "This is just extra work" | Unclear how it replaces something, rather than adding to everything else |
| "This won't work for my class" | A genuine context difference that deserves a real answer, not dismissal |
| Silence / passive non-adoption | Not enough visible proof it's worth the switching cost yet |

### Responding well
- For "extra work" — be explicit about what the new practice *replaces*, not just what it adds.
- For "won't work for my class" — ask what would need to be different, and adapt the rollout for that context rather than insisting on uniformity where it isn't necessary.
- For silence — this is usually a sequencing problem, not a defiance problem; go back to the pilot-and-share approach rather than repeating the same announcement louder.

### Closing note
Leading change across a team is a repeatable skill, not a personality trait — the sequencing in this module works the same way whether the change is a new rubric, a new lesson-plan format, or a new communication norm.`,
      },
    ],
    assessmentContent: 'Check your understanding of leading change across a team.',
    assessmentQuestions: [
      {
        id: 'elep-2-q1',
        type: 'multiple-choice',
        question: 'What is the most reliable way to build momentum for a new practice?',
        options: [
          'Announce it to everyone at once and require immediate compliance',
          'Pilot it with 1–2 respected teachers first and share their real results',
          'Wait until the following school year',
          'Only tell department heads and let them decide whether to mention it',
        ],
        correctAnswer: 'Pilot it with 1–2 respected teachers first and share their real results',
        explanation: 'Peer evidence from a small pilot converts skeptics far more effectively than a top-down announcement alone.',
        points: 34,
      },
      {
        id: 'elep-2-q2',
        type: 'multiple-choice',
        question: '"This is just extra work" resistance is usually best addressed by:',
        options: [
          'Ignoring it',
          'Explaining what the new practice replaces, not just what it adds',
          'Making the requirement stricter',
          'Removing the practice immediately',
        ],
        correctAnswer: 'Explaining what the new practice replaces, not just what it adds',
        explanation: 'This objection is often about perceived net workload increase, which is addressed by clarifying what is being removed or simplified.',
        points: 33,
      },
      {
        id: 'elep-2-q3',
        type: 'short-answer',
        question: 'Describe one way to use the Communication module (announcements vs. team channels) effectively during a rollout.',
        explanation: 'Look for: announcements for the initial rollout/fixed check-ins, team channels for peer-shared pilot results.',
        points: 33,
      },
    ],
    passingScore: 70,
    completed: false,
    videoCount: 0,
  },
];
