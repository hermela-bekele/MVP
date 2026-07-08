// Teacher Training Modules Data Structure

export interface SessionContent {
  id: string;
  number: string; // e.g., "1.1"
  title: string;
  duration: string;
  content: string; // Markdown content for this session
  completed: boolean;
}

export interface ModuleAssessment {
  id: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer?: string;
  explanation?: string;
  points: number;
}

export interface TrainingModule {
  id: string;
  title: string;
  category: string; // e.g., "MATH · SECONDARY", "MATH · GR 10-11"
  description: string;
  duration: string; // e.g., "5 Hours"
  sessionsCount: number;
  target: string; // e.g., "Secondary School Mathematics Teachers"
  
  // Module content
  overview: string;
  objectives: string[];
  sessions: SessionContent[];
  
  // Assessment
  assessmentContent: string; // Assessment markdown
  assessmentQuestions: ModuleAssessment[];
  passingScore: number; // Percentage
  
  // Progress tracking
  completed: boolean;
  score?: number;
  
  // Videos
  videoCount: number;
  videos?: {
    id: string;
    title: string;
    duration: string;
    url: string;
    thumbnail?: string;
  }[];
}

// Helper computed property to get module content (all sessions combined)
export function getModuleContent(module: TrainingModule): string {
  return `# ${module.title}

## 🎯 UNIT OVERVIEW

${module.overview}

## By the end of this unit, you will be able to:

${module.objectives.map(obj => `- ${obj}`).join('\n')}

---

${module.sessions.map(session => session.content).join('\n\n---\n\n')}`;
}

// Helper function to calculate module progress
export function calculateModuleProgress(module: TrainingModule): number {
  const completedSessions = module.sessions.filter(s => s.completed).length;
  return Math.round((completedSessions / module.sessions.length) * 100);
}

// Helper function to check if assessment is unlocked
export function isAssessmentUnlocked(module: TrainingModule): boolean {
  return module.sessions.every(s => s.completed);
}

// Get module by ID
export function getModuleById(id: string): TrainingModule | undefined {
  return TRAINING_MODULES.find(m => m.id === id);
}

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'module-1',
    title: 'Unit 1 — Problem-solving based mathematics instruction',
    category: 'MATH · SECONDARY',
    description: 'MOE Mathematics Module · 5 hrs',
    duration: '5 Hours',
    sessionsCount: 3,
    target: 'Secondary School Mathematics Teachers',
    
    overview: `Mathematics teaching is most powerful when students discover ideas through engaging problems — not when they passively receive rules. This unit challenges you to rethink how you design and deliver lessons. By the end, you will have the knowledge, tools, and confidence to shift from rule-based instruction to a rich, problem-solving approach that builds real mathematical understanding.`,
    
    objectives: [
      'Appreciate why mathematics instruction needs to move beyond rule memorization.',
      'Identify and design high-quality problem-solving tasks for your students.',
      'Structure a complete problem-solving lesson using the Before-During-After framework.',
    ],
    
    sessions: [
      {
        id: 'session-1-1',
        number: '1.1',
        title: 'Why and How of Problem-Solving Approach',
        duration: '1.5 hours',
        completed: true,
        content: `# Session 1.1 — Why and How of Problem-Solving Approach

Think about your own mathematics classes — as a student, and as a teacher. Was the focus on following procedures, or on thinking through ideas? Most Ethiopian classrooms rely heavily on the rule-based model: the teacher explains a formula, works examples on the board, and students practice similar problems. This session asks a bold question: **Is that enough?**

## The Two Teaching Styles: A Real Comparison

To make this concrete, consider how two teachers — Teacher A and Teacher B — approached the same Grade 9 lesson on solving linear inequalities.

| Teacher A — Rule-Based | Teacher B — Problem-Solving |
|------------------------|----------------------------|
| Starts by announcing the topic and writing rules on the board. | Gives a real story: Helen saves 5 Birr/week (starting from 400). When does she have more than 565 Birr? |
| Demonstrates: $x + 4 < 7 \\rightarrow x < 3$, step by step. | Students work in pairs, explore different approaches. |
| Students practice similar examples. | Students present solutions; teacher connects them to formal notation. |
| Gives homework from textbook. | Inequality emerges naturally: $400 + 5w > 565 \\rightarrow w > 33$ |
| **Result:** Students can copy the method but struggle to transfer it to new situations. | **Result:** Students construct their own understanding and connect new content to real experience. |

## 💡 KEY INSIGHT

Teaching through problem-solving does NOT mean making mathematics harder — it means making it more meaningful. When students solve problems first, formal definitions land on fertile ground. They are not receiving information passively; they are building understanding actively. The rule-based approach produces students who can follow steps but cannot think mathematically in new situations.

---

## Reflection Questions

1. Think of a recent lesson you taught. Was it more like Teacher A or Teacher B?
2. What challenges might you face in shifting to a problem-solving approach?
3. What support would you need to make this transition?`,
      },
      {
        id: 'session-1-2',
        number: '1.2',
        title: 'What Makes a Good Problem-Solving Task?',
        duration: '2 hours',
        completed: true,
        content: `# Session 1.2 — What Makes a Good Problem-Solving Task?

Not all tasks are equal. The difference between a routine exercise and a genuine problem-solving task is significant — and knowing that difference is what allows you to design lessons that develop real mathematical thinking.

## Routine vs. Non-Routine: The Critical Distinction

| Routine Task | Non-Routine (Problem-Solving) Task |
|--------------|-------------------------------------|
| Students already know the method needed. | Method is not immediately obvious. |
| Focus is on getting the correct answer. | Focus is on thinking, exploring, and reasoning. |
| One fixed strategy is expected. | Multiple solution paths are encouraged. |
| **Example:** "Find the area and perimeter of the rectangle below." | **Example:** "A farmer has 16 m of fencing. How can he enclose the largest possible rectangular field?" |

## The Temperature Change Task — A Model Example

Here is a powerful non-routine task drawn from real Ethiopian geography. It develops integer subtraction through meaningful exploration rather than abstract drill:

### 📍 Example Non-Routine Task

**Cities have recorded the following temperatures:**

- Addis Ababa: +12°C
- City-1: -7°C
- City-2: -5°C
- City-3: +22°C

**Questions:**

1. When we travel from Addis Ababa (+12°C) to City-1 (-7°C), does the temperature rise or fall? By how much? Explain your reasoning.
2. What is the temperature change traveling from City-2 (-5°C) to City-3 (+22°C)?
3. If a city in Ethiopia is 15°C warmer than City-1, what is its temperature?

## 💡 KEY INSIGHT

**Why is this task powerful?**

- ✅ It connects integers to real experience (travel, weather).
- ✅ It allows multiple solution strategies (number line, counting, subtraction formula).
- ✅ It builds towards the formal operation of integer subtraction — but the students construct that understanding themselves.
- ✅ It also requires students to communicate their reasoning, developing language alongside mathematics.

## Checklist: Hallmarks of a Strong Problem-Solving Task

- ✅ Connected to a real or meaningful context that students can relate to.
- ✅ Method and solution are not immediately obvious — genuine thinking is required.
- ✅ Multiple solution strategies are possible and encouraged.
- ✅ Builds towards important mathematical concepts or skills.
- ✅ Allows exploration and discussion, not just calculation.
- ✅ Appropriately challenging — difficult enough to engage, achievable enough not to frustrate.

---

## Practice Activity

Design a non-routine problem-solving task for a topic you will teach next week. Use the checklist above to ensure your task has the key characteristics.`,
      },
      {
        id: 'session-1-3',
        number: '1.3',
        title: 'The Three-Phase Lesson Structure',
        duration: '1.5 hours',
        completed: false,
        content: `# Session 1.3 — The Three-Phase Lesson Structure

Teaching through problem-solving is not simply handing students a problem and waiting. It requires deliberate structure. **Van de Walle's three-phase model** — Before, During, After — gives you a clear and effective framework for every problem-solving lesson.

## The Three Phases

| Phase | What the Teacher Does | What Students Do |
|-------|----------------------|------------------|
| **BEFORE** (Getting Ready) | Activate prior knowledge relevant to the problem. Clarify the task — make sure students understand what is being asked, not how to solve it. Set expectations for group work and sharing. | Read and understand the problem. Connect it to what they already know. Begin thinking about possible approaches. |
| **DURING** (Learners' Work) | Circulate and observe without giving away solutions. Ask probing questions: 'What have you tried?' 'Can you show that another way?' Note interesting strategies to highlight later. | Work individually or in small groups to explore the problem. Try different strategies. Discuss ideas with peers. Record their thinking and reasoning. |
| **AFTER** (Whole-Class Discussion) | Invite students to share and explain their solutions. Facilitate discussion of different methods — not just the answer. Connect students' strategies to formal mathematical notation. Summarize key concepts that emerged. | Present and explain their solution approach. Listen to and evaluate peers' strategies. Make connections across different methods. Internalize the formal mathematical concept. |

## Applying the Three Phases — Temperature Change Task Example

### 📋 Lesson Planning Example

**BEFORE:**
Ask students: 'Have you ever felt a big difference in temperature when traveling?' Briefly review positive and negative numbers on the number line. Present the task clearly — ensure all students understand they need to find temperature changes, not just look at numbers.

**DURING:**
Walk around. Some students may draw number lines, others may count steps, others may subtract. Ask: 'Which direction did the temperature go?' 'How far apart are these two values?' Don't correct immediately — let ideas develop.

**AFTER:**
Have 2-3 groups share. One may have used a number line, another subtraction. Show how both connect: traveling from -7 to +12 is a change of $12 - (-7) = 19°C$. Formalize the rule for integer subtraction from the students' own work.

## 💡 KEY INSIGHT

**5 Strategies for Effective Problem-Solving Instruction:**

1. **Select problems that are challenging but accessible** — multiple entry points help all learners.
2. **Create a safe classroom culture** where wrong attempts are valued as learning steps.
3. **Use scaffolding wisely:** guide thinking with questions, never give away the solution.
4. **Celebrate diverse solution methods** — there is rarely only one correct path.
5. **Always close with reflection:** What did we learn? What strategy worked best? Why?

---

## 🎓 Unit Summary

By shifting from rule-based to problem-solving instruction, you empower students to:

- **Think** mathematically, not just memorize procedures
- **Connect** mathematics to real experiences
- **Communicate** their reasoning clearly
- **Transfer** their learning to new situations

This is the foundation of deep mathematical understanding.

---

## Final Reflection

1. Plan one lesson using the Before-During-After framework.
2. What will you do differently in your next mathematics class?
3. How will you know if your students are developing deeper understanding?`,
      },
    ],
    
    assessmentContent: `# MODULE ASSESSMENT

## Unit 1 End-of-Module Assessment

This assessment checks your understanding of problem-solving based mathematics instruction. Answer all questions honestly — the goal is to strengthen your teaching, not to test memorization.

---

## SECTION A: Multiple Choice (1 mark each)

Circle the best answer for each question.

### 1. Which of the following BEST describes the core difference between Teacher A and Teacher B in the case study?

A. Teacher A used more examples than Teacher B.  
B. Teacher A taught rules before problems; Teacher B used problems to develop understanding.  
C. Teacher B gave easier problems to students.  
D. Teacher A focused on homework while Teacher B focused on group work.

### 2. A non-routine problem-solving task is one where:

A. Students can answer it quickly using a memorized rule.  
B. The solution method is not immediately obvious and requires exploration.  
C. Only one correct solution exists.  
D. The problem is very long and complex.

### 3. In the 'Before' phase of a problem-solving lesson, the teacher should primarily:

A. Demonstrate how to solve a similar problem first.  
B. Activate prior knowledge and ensure students understand the task — without showing how to solve it.  
C. Allow students to independently read the textbook.  
D. Correct students' homework from the previous lesson.

### 4. Which of the following makes the Temperature Change Task (Addis Ababa to City-1) a good problem-solving task?

A. It involves large numbers that require a calculator.  
B. It is based on a real context, allows multiple solution strategies, and builds toward integer subtraction.  
C. It can be solved using a formula directly from the textbook.  
D. It is designed for Grade 12 students only.

### 5. During the 'During' phase, when a group of students is stuck, what should the teacher do?

A. Solve the problem on the board so the whole class can see.  
B. Tell the group which formula to use.  
C. Ask probing questions to open their thinking without giving away the solution.  
D. Move on to the next activity since they are not making progress.

---

## SECTION B: Short Answer (5 marks each)

### 6. Explain in your own words why the problem-solving approach to teaching mathematics is more effective than the rule-based approach for developing students' long-term mathematical understanding. Use one specific example from Unit 1 to support your explanation. (5 marks)

*Your answer:*

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

### 7. A colleague tells you: 'I don't use problem-solving tasks because my students are not strong enough — they need to know the rules first before they can do any real problems.' How would you respond to this colleague? What evidence or argument from this unit would you use? (5 marks)

*Your answer:*

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

### 8. Design a brief Before-During-After lesson plan (in point form) for teaching the concept of solving linear equations using a real-life context of your choice. State the context, describe your actions in each phase, and explain how the formal equation will emerge from the students' work. (5 marks)

**Context:** _______________________________________________________________

**BEFORE:**

___________________________________________________________________________

___________________________________________________________________________

**DURING:**

___________________________________________________________________________

___________________________________________________________________________

**AFTER:**

___________________________________________________________________________

___________________________________________________________________________

---

**Total Marks: 20**

**Passing Score: 14/20 (70%)**`,

    assessmentQuestions: [
      { 
        id: 'q1', 
        type: 'multiple-choice', 
        question: 'Which of the following BEST describes the core difference between Teacher A and Teacher B in the case study?', 
        options: [
          'Teacher A used more examples than Teacher B.',
          'Teacher A taught rules before problems; Teacher B used problems to develop understanding.',
          'Teacher B gave easier problems to students.',
          'Teacher A focused on homework while Teacher B focused on group work.'
        ], 
        correctAnswer: 'Teacher A taught rules before problems; Teacher B used problems to develop understanding.', 
        points: 1 
      },
      { 
        id: 'q2', 
        type: 'multiple-choice', 
        question: 'A non-routine problem-solving task is one where:', 
        options: [
          'Students can answer it quickly using a memorized rule.',
          'The solution method is not immediately obvious and requires exploration.',
          'Only one correct solution exists.',
          'The problem is very long and complex.'
        ], 
        correctAnswer: 'The solution method is not immediately obvious and requires exploration.', 
        points: 1 
      },
      { 
        id: 'q3', 
        type: 'multiple-choice', 
        question: 'In the "Before" phase of a problem-solving lesson, the teacher should primarily:', 
        options: [
          'Demonstrate how to solve a similar problem first.',
          'Activate prior knowledge and ensure students understand the task — without showing how to solve it.',
          'Allow students to independently read the textbook.',
          'Correct students\' homework from the previous lesson.'
        ], 
        correctAnswer: 'Activate prior knowledge and ensure students understand the task — without showing how to solve it.', 
        points: 1 
      },
      { 
        id: 'q4', 
        type: 'multiple-choice', 
        question: 'Which of the following makes the Temperature Change Task (Addis Ababa to City-1) a good problem-solving task?', 
        options: [
          'It involves large numbers that require a calculator.',
          'It is based on a real context, allows multiple solution strategies, and builds toward integer subtraction.',
          'It can be solved using a formula directly from the textbook.',
          'It is designed for Grade 12 students only.'
        ], 
        correctAnswer: 'It is based on a real context, allows multiple solution strategies, and builds toward integer subtraction.', 
        points: 1 
      },
      { 
        id: 'q5', 
        type: 'multiple-choice', 
        question: 'During the "During" phase, when a group of students is stuck, what should the teacher do?', 
        options: [
          'Solve the problem on the board so the whole class can see.',
          'Tell the group which formula to use.',
          'Ask probing questions to open their thinking without giving away the solution.',
          'Move on to the next activity since they are not making progress.'
        ], 
        correctAnswer: 'Ask probing questions to open their thinking without giving away the solution.', 
        points: 1 
      },
      { id: 'q6', type: 'short-answer', question: 'Problem-solving effectiveness', points: 5 },
      { id: 'q7', type: 'short-answer', question: 'Respond to colleague', points: 5 },
      { id: 'q8', type: 'essay', question: 'Lesson plan design', points: 5 },
    ],
    
    passingScore: 70,
    completed: false,
    videoCount: 3,
    
    videos: [
      {
        id: 'video-1-1',
        title: 'Introduction to Problem-Solving Approach',
        duration: '12:30',
        url: 'https://example.com/video1',
        thumbnail: '/api/placeholder/320/180',
      },
      {
        id: 'video-1-2',
        title: 'Designing Effective Tasks',
        duration: '15:45',
        url: 'https://example.com/video2',
        thumbnail: '/api/placeholder/320/180',
      },
      {
        id: 'video-1-3',
        title: 'Three-Phase Lesson Structure Demo',
        duration: '18:20',
        url: 'https://example.com/video3',
        thumbnail: '/api/placeholder/320/180',
      },
    ],
  },
  
  {
    id: 'module-2',
    title: 'Unit 2 — Teaching relations and functions',
    category: 'MATH · GR 10-11',
    description: 'MOE Mathematics Module · 11 hrs',
    duration: '11 Hours',
    sessionsCount: 5,
    target: 'Grade 10-11 Mathematics Teachers',
    
    overview: `This unit focuses on helping students develop a deep understanding of relations and functions through visual representations, real-world applications, and GeoGebra technology integration.`,
    
    objectives: [
      'Understand the conceptual difference between relations and functions.',
      'Use multiple representations (tables, graphs, equations) to explore functions.',
      'Integrate GeoGebra to visualize and explore mathematical concepts dynamically.',
      'Design lessons that connect abstract concepts to students\' experiences.',
    ],
    
    sessions: [
      {
        id: 'session-2-1',
        number: '2.1',
        title: 'Relations',
        duration: '2 hours',
        completed: false,
        content: `# Session 2.1 — Relations

*Content in development...*`,
      },
      {
        id: 'session-2-2',
        number: '2.2',
        title: 'Inequalities',
        duration: '2 hours',
        completed: false,
        content: `# Session 2.2 — Inequalities

*Content in development...*`,
      },
      {
        id: 'session-2-3',
        number: '2.3',
        title: 'Functions',
        duration: '3 hours',
        completed: false,
        content: `# Session 2.3 — Functions

*Content in development...*`,
      },
      {
        id: 'session-2-4',
        number: '2.4',
        title: 'Composition',
        duration: '2 hours',
        completed: false,
        content: `# Session 2.4 — Composition

*Content in development...*`,
      },
      {
        id: 'session-2-5',
        number: '2.5',
        title: 'GeoGebra',
        duration: '2 hours',
        completed: false,
        content: `# Session 2.5 — GeoGebra

*Content in development...*`,
      },
    ],
    
    assessmentContent: `# MODULE ASSESSMENT

## Unit 2 End-of-Module Assessment

*Assessment in development...*`,

    assessmentQuestions: [],
    passingScore: 70,
    completed: false,
    videoCount: 4,
    
    videos: [
      {
        id: 'video-2-1',
        title: 'Understanding Relations',
        duration: '14:20',
        url: 'https://example.com/video4',
        thumbnail: '/api/placeholder/320/180',
      },
      {
        id: 'video-2-2',
        title: 'Function Notation and Graphs',
        duration: '16:30',
        url: 'https://example.com/video5',
        thumbnail: '/api/placeholder/320/180',
      },
      {
        id: 'video-2-3',
        title: 'Composition of Functions',
        duration: '12:45',
        url: 'https://example.com/video6',
        thumbnail: '/api/placeholder/320/180',
      },
      {
        id: 'video-2-4',
        title: 'Introduction to GeoGebra for Functions',
        duration: '20:15',
        url: 'https://example.com/video7',
        thumbnail: '/api/placeholder/320/180',
      },
    ],
  },
];
