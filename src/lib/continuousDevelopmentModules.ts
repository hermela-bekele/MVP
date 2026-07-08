// Continuous Professional Development Modules
// TEACHING SKILLS modules for all Ethiopian secondary school teachers

import {
  PRIME_DAY1_DAY2_ASSESSMENT_CONTENT,
  PRIME_DAY1_DAY2_ASSESSMENT_QUESTIONS,
  PRIME_DAY1_DAY2_SESSIONS,
} from './primeTeacherDevelopmentDay1Day2';

export interface SessionContent {
  id: string;
  number: string;
  title: string;
  duration: string;
  content: string;
  completed: boolean;
}

export interface ModuleAssessment {
  id: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
}

export interface TrainingModule {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  sessionsCount: number;
  target: string;
  overview: string;
  objectives: string[];
  sessions: SessionContent[];
  assessmentContent: string;
  assessmentQuestions: ModuleAssessment[];
  passingScore: number;
  completed: boolean;
  score?: number;
  videoCount: number;
  videos?: {
    id: string;
    title: string;
    duration: string;
    url: string;
    thumbnail?: string;
  }[];
}

// Helper functions
export function calculateModuleProgress(module: TrainingModule): number {
  const completedSessions = module.sessions.filter(s => s.completed).length;
  return Math.round((completedSessions / module.sessions.length) * 100);
}

export function isAssessmentUnlocked(module: TrainingModule): boolean {
  return module.sessions.every(s => s.completed);
}

export function getModuleById(id: string): TrainingModule | undefined {
  return CONTINUOUS_DEVELOPMENT_MODULES.find(m => m.id === id);
}

export const CONTINUOUS_DEVELOPMENT_MODULES: TrainingModule[] = [
  {
    id: 'cpd-module-7',
    title: 'Module 1: Professional Teacher Role & Inclusive Teaching (Day 1-2)',
    category: 'TEACHING SKILLS',
    description: 'Classroom readiness, learners & inclusion · 4 hrs',
    duration: '4 Hours',
    sessionsCount: 7,
    target: 'Secondary School Teachers (All Subjects)',

    overview: `This PRIME Teacher Development Programme module covers Day 1 and Day 2 of professional teacher training. Day 1 focuses on the professional teacher role and classroom readiness — preparing the board, materials, students, and yourself before students enter the room, and using a simple first 5-minute routine. Day 2 focuses on understanding learners and inclusive teaching — recognizing adolescent needs, identifying participation barriers, and applying low-cost supports so every student can reach the same learning goal.`,

    objectives: [
      'List six duties of a professional teacher',
      'Prepare a classroom readiness checklist and first 5-minute routine',
      'Apply respectful correction that protects dignity',
      'Name four needs of high school students',
      'Identify barriers to student participation and plan simple supports',
      'Use inclusive strategies for large classes without lowering standards',
    ],

    sessions: PRIME_DAY1_DAY2_SESSIONS,
    assessmentContent: PRIME_DAY1_DAY2_ASSESSMENT_CONTENT,
    assessmentQuestions: PRIME_DAY1_DAY2_ASSESSMENT_QUESTIONS,
    passingScore: 70,
    completed: false,
    videoCount: 0,
  },

  {
    id: 'cpd-module-1',
    title: 'Module 2: Classroom Delivery and Explanation Skills',
    category: 'TEACHING SKILLS',
    description: 'Foundation skills for effective instruction · 3 hrs',
    duration: '3 Hours',
    sessionsCount: 3,
    target: 'Secondary School Teachers (All Subjects)',
    
    overview: `Effective classroom delivery is the foundation of learning. In Ethiopian high schools where class sizes regularly reach 50 to 70 students, the ability to explain clearly, pace instruction appropriately, and use the available resources — primarily the chalkboard — is not just a skill. It is a professional responsibility. This module develops the core delivery and explanation skills every secondary school teacher in Ethiopia needs to maximize learning across a diverse and large class.`,
    
    objectives: [
      'Structure an explanation so it moves logically from the known to the unknown',
      'Use the chalkboard strategically to anchor explanations for all 50+ students',
      'Adjust the pace of delivery based on student responses and visible comprehension signals',
      'Apply questioning techniques that check understanding without embarrassing students',
      'Break a complex concept into teachable parts using the chunking method'
    ],
    
    sessions: [
      {
        id: 'cpd-s1-1',
        number: '1.1',
        title: 'What Makes an Explanation Work?',
        duration: '1 hour',
        completed: false,
        content: `# Session 1 — What Makes an Explanation Work?

Many teachers in Ethiopian high schools were trained in a system that valued content mastery above delivery skill. The assumption was: if you know the subject, you can teach it. Research and classroom experience consistently prove this wrong.

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Mr. Bekele teaches Grade 10 mathematics at a government school in Hawassa. His class has 62 students. When he introduces linear equations, he writes the formula on the board, works three examples, and moves on. By the end of the period, 15 students have completed the classwork correctly. The other 47 copied the examples but cannot attempt a new problem independently.

## The Known-to-Unknown Principle

Every new concept should be introduced by connecting it to something students already know and understand.

| Instead of this | Try this |
|----------------|----------|
| Starting with the definition of a linear equation | Starting with: 'If you save 50 Birr each week, how much do you have after 4 weeks?' |
| Writing the formula for photosynthesis immediately | Asking: 'What do plants need to survive? Where does their food come from?' |
| Explaining Newton's first law as an abstract principle | Asking students to push a book on a desk and observe what stops it |

## Chunking — Breaking It Down

A chunk is the smallest unit of new information that a student can process and understand before receiving the next piece.

### ✅ TEACHING TIPS

**The 3-step chunking method:**

1. State the idea in one sentence — no more
2. Show one concrete example from Ethiopian daily life
3. Check understanding with one specific question before moving to the next chunk

Repeat this cycle for every new chunk. In a 40-minute lesson, aim for 3 to 4 chunks maximum.`
      },
      {
        id: 'cpd-s1-2',
        number: '1.2',
        title: 'Chalkboard as a Teaching Tool',
        duration: '1 hour',
        completed: false,
        content: `# Session 2 — Chalkboard as a Teaching Tool

In most Ethiopian government high schools, the chalkboard is the primary — and often only — visual teaching tool available.

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Tigist teaches Grade 11 biology in a rural school in Tigray. Her class has 58 students. She has no projector, no printed materials, and limited textbooks. Her chalkboard is her entire visual resource.

## Chalkboard Organization Principles

- **Always write the lesson topic at the top** before students arrive
- **Divide your board into sections** — left for main explanation, right for key vocabulary
- **Write large enough** for the student at the furthest desk to read clearly
- **Never erase a step** before the slowest student has had time to copy it
- **Use colored chalk strategically** — one color for main content, another for emphasis
- **Your chalkboard should tell the story** of the entire lesson

At the end of the lesson, a student arriving late should be able to reconstruct what was taught by reading the board.`
      },
      {
        id: 'cpd-s1-3',
        number: '1.3',
        title: 'Pacing and Reading Student Signals',
        duration: '1 hour',
        completed: false,
        content: `# Session 3 — Pacing and the Reading of Student Signals

Pacing is the speed at which you move through content. Too fast and students are left behind. Too slow and advanced students disengage.

## Student Signals and What They Mean

| Student Signal | What It Means |
|---------------|---------------|
| Students writing slowly, still copying when you move on | Too fast — slow down |
| Students looking around the room, not at board | Lost the thread — check understanding |
| Students completing classwork quickly and chatting | Too slow — increase challenge |
| No hands raised when you ask a question | Either too easy or too hard |
| Students copying without looking up | They are in copying mode, not thinking mode |

## ⚠️ COMMON MISTAKES

1. **Asking 'Do you understand?'** — students will almost always say yes. Ask a specific question instead
2. **Talking while writing with your back to students** — you lose voice projection
3. **Moving to a new concept before the current one is secure** — most common source of confusion

## 🪞 REFLECTION ACTIVITY

After your next lesson:
1. Did I connect today's new concept to something students already knew?
2. How many chunks did I deliver? Did I check understanding after each one?
3. At what point did I notice students losing focus? What did I do?`
      }
    ],
    
    assessmentContent: `# Module 2 Assessment

## Section A — Multiple Choice

1. The known-to-unknown principle means:
   - A) Starting with simple problems
   - B) Connecting new content to students' existing knowledge ✓
   - C) Teaching easy subjects first
   - D) Using familiar words

2. A teacher asks 'Does everyone understand?' What is the problem?
   - A) It takes too long
   - B) Students who don't understand will rarely admit it publicly ✓
   - C) Not appropriate for high school
   - D) Only works in small classes

## Section B — Short Answer

3. Design a known-to-unknown introduction for a difficult topic in your subject (5 marks)
4. Give specific advice on chunking and pacing (5 marks)`,
    
    assessmentQuestions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'The known-to-unknown principle in teaching means:',
        options: [
          'Starting with simple problems and moving to complex ones',
          'Connecting new content to students\' existing knowledge before introducing it',
          'Teaching easy subjects before difficult ones',
          'Using familiar words before technical vocabulary'
        ],
        correctAnswer: 'Connecting new content to students\' existing knowledge before introducing it',
        points: 1
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'A teacher asks "Does everyone understand?" after an explanation. What is the main problem?',
        options: [
          'It takes too long',
          'Students who do not understand will rarely admit it publicly',
          'It is not appropriate for high school',
          'It only works in small classes'
        ],
        correctAnswer: 'Students who do not understand will rarely admit it publicly',
        points: 1
      }
    ],
    
    passingScore: 70,
    completed: false,
    videoCount: 2,
    
    videos: [
      {
        id: 'v1-1',
        title: 'Teacher Induction',
        duration: '10:00',
        url: 'https://res.cloudinary.com/bdztfxvd/video/upload/v1783276593/Teacher_Induction_xxkqt0.mp4',
        thumbnail: '/videos/training/thumbnails/module-1-video-1.jpg'
      },
      {
        id: 'v1-2',
        title: 'Teacher Induction and Classroom Management',
        duration: '12:00',
        url: 'https://res.cloudinary.com/bdztfxvd/video/upload/v1783276765/Teacher_induction_and_class_room_management_dud6ys.mp4',
        thumbnail: '/videos/training/thumbnails/module-1-video-2.jpg'
      }
    ]
  },

  {
    id: 'cpd-module-2',
    title: 'Module 3: Active Learning and Student Engagement',
    category: 'TEACHING SKILLS',
    description: 'Transform passive classrooms · 3 hrs',
    duration: '3 Hours',
    sessionsCount: 3,
    target: 'Secondary School Teachers (All Subjects)',
    
    overview: `Passive learning — where students sit, listen, and copy — is the dominant teaching mode in most Ethiopian high schools. This module teaches you to transform passive classrooms into active learning environments — without additional resources, without extra preparation time, and without abandoning curriculum coverage.`,
    
    objectives: [
      'Understand why passive learning fails to produce deep understanding',
      'Apply the 10-minute engagement rule in every lesson',
      'Use Think-Pair-Share, Exit Tickets, and Cold Calling with Think Time',
      'Design active learning tasks for your subject',
      'Manage active learning in a class of 50+ students'
    ],
    
    sessions: [
      {
        id: 'cpd-s2-1',
        number: '2.1',
        title: 'Why Passive Learning Is Not Enough',
        duration: '1 hour',
        completed: false,
        content: `# Session 1 — Why Passive Learning Is Not Enough

Consider a typical 40-minute lesson. The teacher speaks and writes for 30 minutes. Students copy for 28 minutes. They get 10 minutes of classwork. What percentage truly engaged with the concept? Research shows: fewer than 30%.

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Hiwot teaches Grade 11 chemistry in Addis Ababa. Her class of 54 students performs well on copying tasks and struggles badly on national exams. Every student can write the definition of a chemical bond correctly. But when asked to explain why sodium and chlorine combine, fewer than 10 can answer. The students memorized the words without constructing the understanding.

## The Neuroscience of Active Learning

The human brain does not store information passively received. It stores information that it has processed, connected, questioned, and used. When a student copies notes from the board, the brain is performing a motor task — hand movement — not a cognitive task.

**Active learning forces the brain to:** retrieve, connect, and apply — the three processes that move information from short-term to long-term memory.`
      },
      {
        id: 'cpd-s2-2',
        number: '2.2',
        title: 'The 10-Minute Engagement Rule',
        duration: '1 hour',
        completed: false,
        content: `# Session 2 — The 10-Minute Engagement Rule

Student attention in a lecture-style lesson peaks at around 5 minutes and begins declining after 10 minutes. The 10-minute rule is simple: **never allow students to be passive for more than 10 consecutive minutes.**

## ✅ TEACHING TIPS

**10-minute engagement strategies:**

- **Think-Pair-Share:** Pose a question. 30 seconds thinking. 60 seconds partner discussion. Take 2-3 responses. Total: 2 minutes. Every student participates.

- **Quick Write:** 'Write one sentence summarizing what we just learned.' 60 seconds. The act of writing forces cognitive processing.

- **Board Race:** Two teams. One representative from each comes to the board. First to complete correctly wins. Energizes a drowsy class in 90 seconds.

- **Agree or Disagree:** State a claim. Students stand if they agree, sit if they disagree. Then defend their position.

- **One Question Out:** Before moving to the next section, every student writes one question they still have. Collect randomly. Answer the two most common.`
      },
      {
        id: 'cpd-s2-3',
        number: '2.3',
        title: 'Managing Active Learning With Large Classes',
        duration: '1 hour',
        completed: false,
        content: `# Session 3 — Managing Active Learning With Large Classes

The most common objection: 'My class has 65 students. I cannot manage group work.' This reveals a misunderstanding. You do not need to reorganize furniture or create elaborate group structures. Most high-impact active learning techniques take 60 to 120 seconds and require nothing but a question.

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Samuel teaches Grade 10 history in Jimma with 67 students in fixed bench seating. He cannot move furniture. Every 10 minutes, he poses a question written on the board. Students discuss it with the person beside them for 60 seconds. He then calls on 3 students using name sticks. Students know their name might be called so they all prepare. In 4 months, his class average on national practice exams rose by 18%.

## Cold Calling With Think Time

Cold calling — calling on a student who did not raise their hand — is the single most powerful engagement technique. But cold calling **without** think time produces anxiety. Cold calling **with** think time produces engagement.

| Without Think Time | With Think Time |
|-------------------|-----------------|
| Teacher asks, immediately calls a name | Teacher asks, gives 30 seconds to write/think, then calls |
| Student feels ambushed | Every student has prepared an answer |
| Rest of class disengages | Every student must think |
| Creates fear | Creates confident participation |`
      }
    ],
    
    assessmentContent: `# Module 3 Assessment

## Section A — Multiple Choice

1. Passive listening produces:
   - B) Short-term retention that fades within 24 hours ✓

2. Cold calling WITH think time is effective because:
   - B) Every student prepares an answer ✓

## Section B — Short Answer

3. Design a complete 40-minute lesson using the 10-minute engagement rule (5 marks)`,
    
    assessmentQuestions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Passive listening produces:',
        options: [
          'Deep long-term understanding',
          'Short-term retention that fades within 24 hours without active processing',
          'Better results than active learning in large classes',
          'Stronger exam performance'
        ],
        correctAnswer: 'Short-term retention that fades within 24 hours without active processing',
        points: 1
      }
    ],
    
    passingScore: 70,
    completed: false,
    videoCount: 2,
    
    videos: [
      {
        id: 'v2-1',
        title: 'How Student Engagement Improves Learning Outcomes',
        duration: '10:00',
        url: '/videos/training/module-2/how_student_engagement_improves_learning_outcomes.mp4',
        thumbnail: '/videos/training/thumbnails/module-2-video-1.jpg'
      },
      {
        id: 'v2-2',
        title: 'Student Motivation Training Video',
        duration: '11:00',
        url: '/videos/training/module-2/W8Y5AWRBAQO9WGL6.mp4',
        thumbnail: '/videos/training/thumbnails/module-2-video-2.jpg'
      }
    ]
  },
  
  {
    id: 'cpd-module-3',
    title: 'Module 4: How to Develop Effective Assessment',
    category: 'TEACHING SKILLS',
    description: 'Design assessments that serve learning · 3 hrs',
    duration: '3 Hours',
    sessionsCount: 3,
    target: 'Secondary School Teachers (All Subjects)',
    
    overview: `Assessment in most Ethiopian high schools follows one pattern: end-of-unit tests, mid-term exams, and finals. These are all summative — they measure what happened. They do not tell you what is happening right now, and they give you no opportunity to intervene before students fall behind.`,
    
    objectives: [
      'Distinguish clearly between formative and summative assessment',
      'Write assessment questions at three cognitive levels',
      'Design formative assessment strategies using Exit Tickets',
      'Read assessment results as teaching data',
      'Create fair, curriculum-aligned summative assessments'
    ],
    
    sessions: [
      {
        id: 'cpd-s3-1',
        number: '3.1',
        title: 'Formative vs Summative Assessment',
        duration: '1 hour',
        completed: false,
        content: `# Session 1 — Formative vs. Summative: The Critical Difference

| Formative | Summative |
|-----------|-----------|
| Happens DURING learning | Happens AFTER learning |
| Purpose: adjust teaching now | Purpose: measure final achievement |
| Exit tickets, questions, observation | Mid-term, final exam |
| Not graded — for teacher insight | Graded — for certification |
| Can change tomorrow's lesson | Cannot change the learning that happened |
| Catch problems EARLY | Discover problems TOO LATE |

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Meseret teaches Grade 11 physics in Bahir Dar. After teaching Newton's laws for two weeks, her class sits a unit test. 34 of 52 students score below 50%. She is frustrated.

If Meseret had used a 2-minute Exit Ticket at the end of each lesson — asking students to write one thing they understood and one thing still confusing — she would have identified the misconception about inertia in lesson 3. She could have re-taught it in lesson 4.`
      },
      {
        id: 'cpd-s3-2',
        number: '3.2',
        title: 'Writing Questions at Three Levels',
        duration: '1 hour',
        completed: false,
        content: `# Session 2 — Writing Questions at Three Levels

Every assessment should include questions at three cognitive levels. Questions that only require recall produce students who can remember facts but cannot use them.

## Three Levels — Example: Photosynthesis (Grade 10 Biology)

**Level 1 — Recall:** 'Write the word equation for photosynthesis.'

**Level 2 — Application:** 'A plant is placed in a dark room for 48 hours. Predict what will happen to its glucose stores and explain why.'

**Level 3 — Analysis:** 'Two identical plants are grown under the same conditions. One receives red light only, the other green light only. After 30 days, one plant has died. Which one, and why?'

## Ethiopian Context in Assessment

Questions that reference Ethiopian contexts are cognitively more accessible because students can draw on prior real-world knowledge.

**Examples:**
- Mathematics: Use Birr, hectares, coffee yields, distances between Ethiopian towns
- Biology: Use Ethiopian plants, teff, injera, traditional medicine
- Physics: Use Ethiopian construction materials, local machinery
- Chemistry: Use traditional food preparation, water treatment`
      },
      {
        id: 'cpd-s3-3',
        number: '3.3',
        title: 'Reading Assessment Results as Teaching Data',
        duration: '1 hour',
        completed: false,
        content: `# Session 3 — Reading Assessment Results as Teaching Data

Most Ethiopian teachers mark assessments, calculate grades, record them, and move on. This wastes the most valuable data available. An assessment result is a diagnostic tool.

## ✅ TEACHING TIPS

**After every test, do a 10-minute error analysis:**

1. Tally how many students got each question wrong. Any question missed by more than 40% of the class is a **teaching problem** — not a student problem.

2. Look at the wrong answers, not just the right ones. Wrong answers reveal specific misconceptions.

3. Group questions by concept. If all questions on one concept have high error rates, that concept needs to be retaught.

4. Use the data to plan your next lesson — start by addressing the most common misconception.

This process takes 10 minutes. It will save you hours of re-teaching later.`
      }
    ],
    
    assessmentContent: `# Module 4 Assessment

Questions on formative vs summative assessment, three cognitive levels, and using assessment data.`,
    
    assessmentQuestions: [],
    passingScore: 70,
    completed: false,
    videoCount: 1,
    
    videos: [
      {
        id: 'v3-1',
        title: 'How Feedback Improves Student Performance',
        duration: '10:00',
        url: '/videos/training/module-3/how_feedback_improves_student_performance.mp4',
        thumbnail: '/videos/training/thumbnails/module-3-video.jpg'
      }
    ]
  },
  
  {
    id: 'cpd-module-4',
    title: 'Module 5: Classroom Management',
    category: 'TEACHING SKILLS',
    description: 'Strategies for 50-70 students · 3 hrs',
    duration: '3 Hours',
    sessionsCount: 3,
    target: 'Secondary School Teachers (All Subjects)',
    
    overview: `Classroom management in Ethiopian high schools is uniquely challenging. Classes of 50 to 70 students, fixed bench seating, students who have traveled hours to reach school, extreme heat in some regions, and limited access to basic classroom materials create conditions that would challenge any teacher. This module offers strategies developed specifically for the Ethiopian government high school reality.`,
    
    objectives: [
      'Design and establish classroom routines that work with 50+ students',
      'Use pause, proximity, and private correction techniques',
      'Prevent management problems through lesson structure and engagement',
      'Build a classroom culture where students feel respected and safe',
      'Respond to specific Ethiopian high school challenges'
    ],
    
    sessions: [
      {
        id: 'cpd-s4-1',
        number: '4.1',
        title: 'Prevention Is Better Than Correction',
        duration: '1 hour',
        completed: false,
        content: `# Session 1 — Prevention Is Better Than Correction

The most effective classroom management technique is designing a lesson that does not allow space for disruption. When students are engaged, disruption is rare. When students are bored, confused, or idle, disruption is inevitable.

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Dawit teaches Grade 10 Amharic in Gondar. His class of 63 students is noisy and difficult. He realizes students are inactive for 25 of 40 minutes — copying from the board while he explains.

He changes his approach: writes the main text on the board before class, students spend the first 5 minutes reading silently, and every 8 minutes he poses a discussion question. Within two weeks, the noise level drops significantly.

## The Three Pre-Conditions for a Well-Managed Classroom

1. **Students know what they are supposed to be doing** at every moment
2. **Students believe the task is worth doing**
3. **Students believe they will not be humiliated** for making mistakes`
      },
      {
        id: 'cpd-s4-2',
        number: '4.2',
        title: 'Routines That Work at Scale',
        duration: '1 hour',
        completed: false,
        content: `# Session 2 — Routines That Work at Scale

A routine is a sequence of actions that becomes automatic through repetition. In a class of 65 students, routines are the difference between 8 minutes of settling time wasted every lesson and 1 minute.

## ✅ TEACHING TIPS

**Five routines to establish in the first two weeks:**

1. **Entry routine:** Write the lesson agenda on the board before students arrive. When students enter, they read and begin the first task independently.

2. **Question routine:** Establish one clear signal for when students may ask questions — raised hand, specific time slots, or a question board.

3. **Group transition routine:** If you use partner activities, establish and practice the transition. 'Form pairs — you have 20 seconds.'

4. **Exit routine:** The last 2 minutes of every lesson are an Exit Ticket. Students write one key learning and one remaining question.

5. **Correction routine:** When you correct a student, do it privately and specifically. 'Abebe, I need you to focus on the task' — not 'Abebe, you are always disturbing the class.'`
      },
      {
        id: 'cpd-s4-3',
        number: '4.3',
        title: 'Responding to Disruption With Authority and Calm',
        duration: '1 hour',
        completed: false,
        content: `# Session 3 — Responding to Disruption With Authority and Calm

When disruption happens, the quality of your response determines whether it escalates or resolves. The most common mistake is escalating your own energy in response.

## Effective Responses

| Situation | Effective Response |
|-----------|-------------------|
| Two students talking during explanation | Pause. Make eye contact. Wait 3 seconds in silence. Continue. |
| Student making jokes that distract others | Move toward them while continuing to teach. Physical proximity stops behavior without confrontation. |
| Student refusing to do classwork | Crouch beside them. Speak quietly: 'I noticed you have not started. What is stopping you?' |
| Entire class becomes noisy | Stop speaking completely. Write on board: 'When it is quiet, we continue.' Wait. |
| Student is rude in front of class | 'We will discuss this after class.' Do not engage publicly. |

## ⚠️ COMMON MISTAKES

- Never threaten a consequence you cannot carry out
- Never make a management issue about your ego
- Never punish an entire class for the behavior of two students
- Never use academic work as punishment`
      }
    ],
    
    assessmentContent: `# Module 5 Assessment`,
    assessmentQuestions: [],
    passingScore: 70,
    completed: false,
    videoCount: 1,
    
    videos: [
      {
        id: 'v4-1',
        title: 'Classroom Management: Creating a Positive Learning Environment',
        duration: '13:00',
        url: '/videos/training/module-4/classroom_management_creating_a_positive_learning_.mp4',
        thumbnail: '/videos/training/thumbnails/module-4-video.jpg'
      }
    ]
  },
  
  {
    id: 'cpd-module-5',
    title: 'Module 6: Student Motivation and Adolescent Development',
    category: 'TEACHING SKILLS',
    description: 'Understanding and building motivation · 3 hrs',
    duration: '3 Hours',
    sessionsCount: 3,
    target: 'Secondary School Teachers (All Subjects)',
    
    overview: `Motivation is the most misunderstood concept in Ethiopian secondary education. Teachers frequently describe their students as 'lazy' or 'uninterested'. But motivation is never simply a student character trait. It is a response to the learning environment, the teacher's beliefs, the relevance of content, and the experience of success or failure.`,
    
    objectives: [
      'Understand key factors that drive and destroy motivation',
      'Apply specific praise techniques that build student capability beliefs',
      'Connect subject content to real lives and aspirations of Ethiopian students',
      'Recognize the impact of family and economic pressure on motivation',
      'Design motivational interventions for disengaged students'
    ],
    
    sessions: [
      {
        id: 'cpd-s5-1',
        number: '5.1',
        title: 'What Motivation Actually Is',
        duration: '1 hour',
        completed: false,
        content: `# Session 1 — What Motivation Actually Is

Motivation is not a personality trait. It is a state — it rises and falls based on what happens in the classroom, at home, and in a student's social world.

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Yonas is a 16-year-old Grade 10 student in Dire Dawa. He was among the top students in Grade 8. Now he rarely submits homework, sits at the back, and has twice been found sleeping in class.

What the teacher does not know: Yonas's father lost his job six months ago. Yonas works at a small shop from 6am to 8am before school every day. He arrives exhausted, often without having eaten. His motivation has not collapsed because of laziness. It has collapsed under weight.

## The Two Types of Motivation

| Extrinsic | Intrinsic |
|-----------|-----------|
| Driven by external rewards and punishments | Driven by internal interest and meaning |
| Grades, prizes, fear of failure | Curiosity, mastery, relevance, purpose |
| Works short-term, fades quickly | Sustains long-term engagement |
| Dominant approach in Ethiopian high schools | The goal of high-quality teaching |`
      },
      {
        id: 'cpd-s5-2',
        number: '5.2',
        title: 'Building Intrinsic Motivation',
        duration: '1 hour',
        completed: false,
        content: `# Session 2 — Building Intrinsic Motivation

Three conditions reliably build intrinsic motivation: autonomy, competence, and relatedness. Teachers can engineer all three without changing curriculum.

## ✅ TEACHING TIPS

**Autonomy:**
- Give students a choice between two ways to demonstrate understanding
- Allow students to choose which of three practice problems they attempt first
- Ask students to write their own question about the content

**Competence:**
- Design tasks where every student can experience success
- Give specific praise immediately after genuine thinking
- Make progress visible — track improvement over time

**Relatedness:**
- Learn 5 students' names per week until you know everyone
- Spend 2 minutes before class talking informally with students
- Acknowledge students' real-world challenges: 'I know many of you have responsibilities at home'`
      },
      {
        id: 'cpd-s5-3',
        number: '5.3',
        title: 'Specific Praise: The Most Underused Tool',
        duration: '1 hour',
        completed: false,
        content: `# Session 3 — Specific Praise: The Most Underused Tool

Most Ethiopian teachers use praise sparingly: 'Good.' 'Correct.' 'Well done.' General praise has very limited motivational impact.

The most powerful form of praise is specific, process-focused, and tied to effort rather than ability.

| General Praise (low impact) | Specific Process Praise (high impact) |
|------------------------------|--------------------------------------|
| 'Good.' | 'You set up that equation correctly even though we only covered it once. That took real concentration.' |
| 'Correct.' | 'You caught the error in your second step and corrected it yourself. That is exactly the kind of thinking mathematicians do.' |
| 'You are clever.' | 'You kept trying different approaches until you found one that worked. That persistence will take you far.' |

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Zewditu teaches Grade 11 physics. Fatima, a student disengaged for two months, correctly identifies an error in a worked example. Instead of saying 'correct', Zewditu says: 'Fatima — you spotted an error that the rest of the class missed. That required close attention and genuine understanding. Thank you.' Fatima sits up straighter. She participates twice more in the next 20 minutes.`
      }
    ],
    
    assessmentContent: `# Module 6 Assessment`,
    assessmentQuestions: [],
    passingScore: 70,
    completed: false,
    videoCount: 1,
    
    videos: [
      {
        id: 'v5-1',
        title: 'Inspiring Student Motivation in the Classroom',
        duration: '11:00',
        url: '/videos/training/module-5/inspiring_student_motivation_in_the_classroom.mp4',
        thumbnail: '/videos/training/thumbnails/module-5-video.jpg'
      }
    ]
  },
  
  {
    id: 'cpd-module-6',
    title: 'Module 7: Accountability and Parent Communication',
    category: 'TEACHING SKILLS',
    description: 'Building collaborative partnerships · 2.5 hrs',
    duration: '2.5 Hours',
    sessionsCount: 3,
    target: 'Secondary School Teachers (All Subjects)',
    
    overview: `The relationship between Ethiopian schools and families is often transactional and crisis-driven. Parents hear from teachers when their child has a serious problem. Outside of these moments, communication is minimal. This module transforms your approach to parent communication from reactive to proactive, and from adversarial to collaborative.`,
    
    objectives: [
      'Understand why proactive parent communication improves student outcomes',
      'Conduct parent meetings that are collaborative and solution-focused',
      'Use written communication tools appropriate for Ethiopian context',
      'Build three-way accountability partnerships',
      'Navigate difficult conversations with parents of struggling students'
    ],
    
    sessions: [
      {
        id: 'cpd-s6-1',
        number: '6.1',
        title: 'The Problem With Crisis-Only Communication',
        duration: '50 minutes',
        completed: false,
        content: `# Session 1 — The Problem With Crisis-Only Communication

When parents only hear from the school during a crisis, they develop a conditioned fear response to school contact. A note from the teacher produces anxiety before they have even read it.

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Almaz is the mother of a Grade 10 student in Adama. In three years of secondary education, she has been called to school twice — once when he was caught fighting, once when his Grade 9 results were below promotion threshold. When she receives a note from his Grade 10 teacher asking to meet, she immediately assumes he has done something wrong. She arrives defensive and anxious.

## Resetting the Pattern: Lead With Positive

The single most effective thing a teacher can do is make positive contact before any problem exists. One positive message per week, for a different student each week, resets the emotional association.

**Positive contact methods:**
- Verbal message via student: 'Please tell your mother you made excellent contributions today'
- Written note sent home: 'Your daughter showed real improvement this week'
- School communication system message
- Unprompted parent meeting to share something positive`
      },
      {
        id: 'cpd-s6-2',
        number: '6.2',
        title: 'Conducting an Effective Parent Meeting',
        duration: '1 hour',
        completed: false,
        content: `# Session 2 — Conducting an Effective Parent Meeting

Most Ethiopian parent meetings follow a one-directional pattern: the teacher tells the parent what the student did wrong, what grade they received, and what they need to do differently. The parent listens, apologizes, and leaves. This is not a meeting — it is a report.

## ✅ TEACHING TIPS

**The four-part parent meeting structure:**

1. **Open with something genuine and positive.** Even for a challenging student, find one genuine positive.

2. **Share the specific concern with evidence, not emotion.** 'Over the last four weeks, Kebede has submitted 2 of 8 homework assignments. Here are his test scores: 34%, 28%, 41%.'

3. **Ask before you advise.** 'Is there anything happening at home that might be affecting his focus?' Listen fully.

4. **Make a specific shared plan with follow-up.** 'Here is what I will do in class. Here is what I am asking you to support at home. Let us check in again in three weeks.' Write it down. Give the parent a copy.`
      },
      {
        id: 'cpd-s6-3',
        number: '6.3',
        title: 'The Three-Way Accountability Partnership',
        duration: '40 minutes',
        completed: false,
        content: `# Session 3 — The Three-Way Accountability Partnership

The most powerful accountability structure is when the teacher, student, and parent all share the same goal, the same understanding of current performance, and the same next step.

## 📍 ETHIOPIAN CLASSROOM SCENARIO

Tesfaye teaches Grade 11 mathematics in Hawassa. For five students at risk of failing, he runs a monthly three-way check-in: a brief letter home summarizing current performance, one specific goal for the month, and one action the parent can take — even if it is simply asking 'what did you learn in mathematics today?'

Three months later, four of the five students have improved their grades. The fifth revealed in the parent meeting that he had an undiagnosed vision problem and could not see the board.

| Who | Responsibility in the Partnership |
|-----|----------------------------------|
| Teacher | Clear explanations, regular feedback, proactive communication |
| Student | Regular attendance, completion of work, honesty about confusion |
| Parent/Guardian | Asking about school daily, ensuring attendance, providing quiet study space |
| All three together | Shared knowledge of the goal, shared commitment to the plan, regular check-ins |`
      }
    ],
    
    assessmentContent: `# Module 7 Assessment`,
    assessmentQuestions: [],
    passingScore: 70,
    completed: false,
    videoCount: 1,
    
    videos: [
      {
        id: 'v6-1',
        title: 'Accountability and Parent Communication in Education',
        duration: '10:00',
        url: '/videos/training/module-6/accountability_and_parent_communication_in_educati (1).mp4',
        thumbnail: '/videos/training/thumbnails/module-6-video.jpg'
      }
    ]
  },

];
