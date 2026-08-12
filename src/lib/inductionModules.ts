// Teacher Induction Program (TIP) modules — shown to teachers with < 2 years of
// experience (or manually flagged "new" by their HoD) in place of / alongside STEP.
// Reuses the same TrainingModule shape as continuousDevelopmentModules.ts so the
// existing session/assessment viewer in TeacherTrainingTab works unchanged.

import type { TrainingModule } from './continuousDevelopmentModules';

export const TIP_MODULES: TrainingModule[] = [
  {
    id: 'tip-module-1',
    title: 'TIP 1: Orientation to the Classroom & School Systems',
    category: 'INDUCTION',
    description: 'Getting oriented: routines, records, and your first weeks in the classroom · 3 hrs',
    duration: '3 Hours',
    sessionsCount: 3,
    target: 'Newly Appointed Teachers (0–2 years)',
    overview:
      'This induction module helps new teachers settle into the school\'s daily rhythm: how classes, attendance, and lesson records actually work here, how to plan a survivable first two weeks, and who to go to when something goes wrong. It is deliberately practical rather than theoretical — the goal is confidence in the basics before layering on pedagogy.',
    objectives: [
      'Navigate the school\'s daily schedule, attendance, and record-keeping routines',
      'Build a realistic lesson-delivery plan for the first two weeks',
      'Identify the right person to ask for help with common early-career problems',
    ],
    sessions: [
      {
        id: 'tip-1-s1',
        number: '1',
        title: 'How This School Runs',
        duration: '1 Hour',
        completed: false,
        content: `## How This School Runs

Every school has its own rhythm, and most first-year stress comes from not knowing it yet, not from the subject matter itself.

### The daily cycle
- **Bell schedule** — know your periods and the transition time between them before day one.
- **Attendance** — you are responsible for marking attendance for every period you teach, submitted through your Teacher Portal ("Attendance" tab) by the end of the period.
- **Lesson plans** — your weekly lesson plan is submitted through the portal and reviewed by your Department Head; it should reach them at least a day before you teach it, not after.
- **Grade book** — assessment scores are entered under "Grades" and roll up into the student's GPA automatically; a late entry is better than a missing one.

### Who to ask
| Situation | Go to |
|---|---|
| Lesson plan or content question | Your Department Head |
| Student behavior escalation | Department Head, then School Head if unresolved |
| Timetable or room conflict | School office / Registrar |
| Payroll, contract, leave | HR |

### First-week checklist
1. Walk your teaching rooms before the first class — check board, seating, and any broken equipment.
2. Confirm your class lists and section numbers against the portal roster.
3. Introduce yourself to the teachers you share a corridor or department with.
4. Submit your first week's lesson plan early — it's normal for it to come back with comments; that's how the review process is supposed to work.

Nothing here is meant to be memorized perfectly on day one. Bookmark it and come back when something feels unclear.`,
      },
      {
        id: 'tip-1-s2',
        number: '2',
        title: 'Planning Your First Two Weeks',
        duration: '1 Hour',
        completed: false,
        content: `## Planning Your First Two Weeks

New teachers often over-plan content and under-plan classroom logistics. This session flips that ratio.

### Days 1–2: Establish, don't impress
Your first two lessons with any class matter more for **routines** than for content depth:
- State how you want students to enter the room, where they sit, and what happens in the first 2 minutes.
- Teach one small, clear routine (e.g., how you take attendance, how students ask a question) and repeat it exactly the same way both days.
- Keep content light — a diagnostic or review activity works better than new material while you're still learning names and dynamics.

### Days 3–10: Build the pattern
- Settle into a repeatable lesson shape: warm-up → main task → check-for-understanding → close. Predictability lowers behavior issues for both you and the students.
- Grade something small every day so feedback stays current — a 5-question exit ticket is enough.
- Flag any student who seems consistently lost or disengaged to your Department Head early; don't wait for the first exam to raise it.

### A realistic two-week planning table
| Days | Focus | Common mistake to avoid |
|---|---|---|
| 1–2 | Routines & rapport | Trying to cover a full syllabus unit already |
| 3–5 | Light content + routine repetition | Changing the lesson structure every day |
| 6–10 | Full pacing begins | Ignoring quiet students who haven't engaged yet |

By the end of week two you should have a lesson plan template you can reuse, not reinvent, for the rest of the term.`,
      },
      {
        id: 'tip-1-s3',
        number: '3',
        title: 'Asking for Help Without It Feeling Like Failure',
        duration: '1 Hour',
        completed: false,
        content: `## Asking for Help Without It Feeling Like Failure

The single biggest predictor of a strong first year is not talent — it's how early a teacher asks for help.

### Reframing the ask
Experienced teachers don't see a new colleague's question as weakness; they see it as a colleague who is paying attention. The mindset shift: **"How do you usually handle X?"** is a stronger, easier question to ask than **"I don't know what I'm doing."**

### What to escalate immediately (don't wait it out)
- A student safety concern, in class or reported to you.
- A parent complaint that references something you're unsure how to respond to.
- Falling more than one full lesson behind your department's shared pacing guide.
- Feeling consistently unable to manage one specific class — this is common and fixable with a co-observation, not something to hide.

### What to solve yourself first, then report
- A single disruptive day from a usually-fine class.
- A grading question specific to your own rubric.
- A resource you can't find — check the Resources tab before escalating.

### Your induction support loop
Your Department Head will check in on your teaching notes and delivered lessons through the portal. Treat their comments as the same kind of feedback loop you'd want from a mentor, because that's exactly what it is — it's how they'll know which STEP modules or coaching to line up for you later.`,
      },
    ],
    assessmentContent:
      'Complete the checklist below reflecting honestly on your first two weeks. This assessment is about establishing habits, not testing recall.',
    assessmentQuestions: [
      {
        id: 'tip-1-q1',
        type: 'multiple-choice',
        question: 'Where should your weekly lesson plan be submitted, and by when?',
        options: [
          'By email to the School Head, any time before the term ends',
          'Through the Teacher Portal, at least a day before you teach it',
          'Verbally to your Department Head after the lesson',
          'It is not required in the first term',
        ],
        correctAnswer: 'Through the Teacher Portal, at least a day before you teach it',
        explanation: 'Lesson plans go through the portal ahead of delivery so your Department Head can review and comment before the lesson happens.',
        points: 25,
      },
      {
        id: 'tip-1-q2',
        type: 'multiple-choice',
        question: 'In your first two lessons with a new class, what should you prioritize?',
        options: [
          'Covering as much syllabus content as possible',
          'Routines, rapport, and a light diagnostic activity',
          'A full unit test to see where students stand',
          'Letting students choose their own seating permanently',
        ],
        correctAnswer: 'Routines, rapport, and a light diagnostic activity',
        explanation: 'Predictable routines in the first days reduce behavior issues and give you room to learn the class before pacing kicks in.',
        points: 25,
      },
      {
        id: 'tip-1-q3',
        type: 'multiple-choice',
        question: 'Which of these should you escalate immediately rather than try to solve alone?',
        options: [
          'A single disruptive day from an otherwise calm class',
          'A student safety concern',
          'Not finding a worksheet you remember seeing once',
          'A grading question about your own rubric',
        ],
        correctAnswer: 'A student safety concern',
        explanation: 'Safety concerns and falling significantly behind pacing are escalate-immediately situations; day-to-day friction is normal and usually self-resolves.',
        points: 25,
      },
      {
        id: 'tip-1-q4',
        type: 'short-answer',
        question: 'Name one routine you will repeat identically in your first two lessons with each class, and why.',
        explanation: 'There is no single correct answer — the goal is a concrete, repeatable routine (e.g., entry routine, attendance check, first-5-minutes warm-up).',
        points: 25,
      },
    ],
    passingScore: 70,
    completed: false,
    videoCount: 0,
  },
  {
    id: 'tip-module-2',
    title: 'TIP 2: Classroom Management Foundations for New Teachers',
    category: 'INDUCTION',
    description: 'Practical, low-drama classroom management for your first year · 3 hrs',
    duration: '3 Hours',
    sessionsCount: 2,
    target: 'Newly Appointed Teachers (0–2 years)',
    overview:
      'Classroom management is the single most common source of first-year stress. This module gives new teachers a small set of concrete, repeatable techniques — proactive structure, calm correction, and de-escalation — rather than abstract theory, so they can be applied in the very next lesson.',
    objectives: [
      'Set up classroom structure that prevents most disruptions before they start',
      'Use calm, dignity-preserving correction language consistently',
      'De-escalate a confrontation without involving the whole class',
    ],
    sessions: [
      {
        id: 'tip-2-s1',
        number: '1',
        title: 'Structure Prevents Most Problems',
        duration: '1.5 Hours',
        completed: false,
        content: `## Structure Prevents Most Problems

Most classroom disruption isn't a discipline problem — it's a structure gap. Filling the gap prevents the problem before it needs "management" at all.

### The three structural gaps that cause the most disruption
1. **Dead time** — the seconds between activities where no instruction is happening. Always have the next instruction visible or spoken before students finish the current task.
2. **Unclear expectations** — "work quietly" means something different to every student. Say the specific, observable behavior instead: "pens down, eyes on me."
3. **Unequal attention** — students in the back or sides of the room test boundaries more when they feel unseen. Move through the room, not just the front three rows.

### A simple structural checklist for every lesson
- Objective stated in the first 2 minutes, in plain language.
- Instructions given once, clearly, then repeated by a student to confirm understanding — not repeated by you three times.
- A visible countdown or signal for transitions (e.g., "you have 2 minutes left").
- A default "if you finish early" task so idle time doesn't become disruption.

### Why this matters more than punishment
A well-structured lesson removes the opportunity for most disruption. Correction becomes rare, calmer, and more effective when it isn't your primary management tool.`,
      },
      {
        id: 'tip-2-s2',
        number: '2',
        title: 'Correcting and De-escalating Without an Audience',
        duration: '1.5 Hours',
        completed: false,
        content: `## Correcting and De-escalating Without an Audience

When structure isn't enough and correction is needed, *how* you correct matters as much as *that* you correct.

### The dignity-preserving correction sequence
1. **Proximity first** — walk toward the student while continuing to teach; often this alone resolves it.
2. **Private, low-volume redirect** — say the correction quietly, near the student, not across the room.
3. **State the expected behavior, not the complaint** — "Face the board, please" lands better than "Stop talking."
4. **Give a clear, small consequence only if the behavior continues** — and follow through on it consistently.

### If it escalates into confrontation
- Lower your own voice and pace — matching a student's raised volume typically escalates further.
- Give a face-saving out: "Let's talk about this after class" removes the audience and the pressure to "win" in front of peers.
- Never make the correction a public power struggle; if a student refuses in front of the class, disengage from the argument and follow up individually, then escalate through the department if it repeats.

### After the incident
Log what happened factually (what, when, who) rather than emotionally, and mention it to your Department Head if it's a repeat pattern — not to get the student in trouble, but so the pattern is visible to the people who can support you, including through STEP/TIP coaching later.`,
      },
    ],
    assessmentContent:
      'This short assessment checks your understanding of proactive structure and dignity-preserving correction.',
    assessmentQuestions: [
      {
        id: 'tip-2-q1',
        type: 'multiple-choice',
        question: 'What is the most common structural cause of classroom disruption?',
        options: ['Dead time between activities', 'Students being naturally disruptive', 'Classroom size', 'Lack of punishment'],
        correctAnswer: 'Dead time between activities',
        explanation: 'Gaps with no instruction happening are where most off-task behavior starts.',
        points: 34,
      },
      {
        id: 'tip-2-q2',
        type: 'multiple-choice',
        question: 'What should you say instead of "Stop talking"?',
        options: ['"Why do you always do this?"', '"Face the board, please."', 'Nothing, ignore it', '"Everyone be quiet!"'],
        correctAnswer: '"Face the board, please."',
        explanation: 'Stating the expected behavior is more effective and preserves dignity better than naming the complaint.',
        points: 33,
      },
      {
        id: 'tip-2-q3',
        type: 'short-answer',
        question: 'Describe one way to de-escalate a confrontation without an audience.',
        explanation: 'Look for answers referencing lowering volume, offering a private follow-up, or disengaging from a public power struggle.',
        points: 33,
      },
    ],
    passingScore: 70,
    completed: false,
    videoCount: 0,
  },
];
