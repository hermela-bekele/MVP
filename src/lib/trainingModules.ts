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
    title: 'Unit 1 — Relations and Functions',
    category: 'MATH · GR 10-11',
    description: 'MOE Mathematics Module · 6 hrs',
    duration: '6 Hours',
    sessionsCount: 4,
    target: 'Grade 10-11 Mathematics Teachers',
    
    overview: `Relations describe connections between elements of sets using ordered pairs, tables, graphs, or mapping diagrams. A function is a special relation where each input has exactly one output. Inequalities represent regions of solutions on a plane, while function composition models multi-step processes by combining functions in sequence. These concepts form the foundation for advanced topics such as algebraic modeling, calculus, and real-world problem solving.`,
    
    objectives: [
      'Explain a relation as a connection between two sets and represent relations using multiple forms.',
      'Graph linear inequalities and interpret solution regions on a coordinate plane.',
      'Distinguish functions from general relations using the vertical line test.',
      'Evaluate composite functions and interpret function composition in real-world contexts.',
    ],
    
    sessions: [
      {
        id: 'session-2-1',
        number: '2.1',
        title: 'The Concept of Relation',
        duration: '1.5 hours',
        completed: false,
        content: `# Session 2.1 — The Concept of Relation

## Learning Objectives

By the end of the lesson, students should be able to:

- Explain a relation as a connection between two sets
- Represent relations using ordered pairs, tables, mapping diagrams, and graphs
- Identify domain and range

## Classroom Activity

Provide students with real-life paired data:

| Crop | Region |
|------|--------|
| Coffee | Sidama |
| Teff | Arsi |
| Sesame | Humera |
| Maize | Oromia |

**Students:**

1. Write ordered pairs
2. Draw a mapping diagram
3. Identify domain and range
4. Discuss whether one element can relate to multiple outputs

## Key Teaching Points

### 1. **A relation is any rule or connection that pairs elements from one set (input set) to another set (output set)**

Emphasize that **no mathematical formula is required** for a relation to exist. A relation is about association, not computation.

### 2. **Relations are defined as sets of ordered pairs $(x, y)$**

Teachers should stress that:
- The first element $(x)$ always comes from the input set
- The second element $(y)$ comes from the output set

### 3. **The concept of relation is structural, not procedural**

Students must understand that a relation is about **association**, not computation.

### 4. **A relation can be:**

- **One-to-one:** Each input has exactly one unique output
- **One-to-many:** One input can have multiple outputs
- **Many-to-one:** Multiple inputs can share the same output

Teachers should explicitly demonstrate each type using examples.

### 5. **Domain and Range**

- **Domain** = the complete set of all inputs (all first elements without repetition)
- **Range** = the complete set of outputs (all second elements without repetition)

### 6. **The same relation can be shown in different forms**

Teachers should emphasize that representation changes (table, graph, mapping, ordered pairs), but the relation does not change.

### 7. **Real-life connections**

Students should be guided to see that relations exist in everyday life:
- Students ↔ Subjects
- Cities ↔ Climate
- Products ↔ Prices

**Emphasize interpretation over memorization of definitions.**

## Common Difficulties

- Confusing domain with range
- Thinking a relation must follow a formula
- Assuming all relations are functions
- Repeating values incorrectly in sets

## Reflection

What local examples can better help students understand relations in your classroom context?`,
      },
      {
        id: 'session-2-2',
        number: '2.2',
        title: 'Relations Involving Inequalities',
        duration: '1.5 hours',
        completed: false,
        content: `# Session 2.2 — Relations Involving Inequalities

## Learning Objectives

Students should be able to:

- Graph linear inequalities
- Identify solution regions
- Interpret domain and range from graphs

## Classroom Activity

Graph the inequalities:

$$y < 2x + 1$$

$$y \\geq x$$

**Students:**

1. Identify boundary lines (solid or dashed)
2. Shade correct regions
3. Determine overlapping solution region
4. Interpret domain and range

## Key Teaching Points

### 1. **Inequalities represent infinite sets of solutions, not single points or lines**

### 2. **Boundary lines must be interpreted carefully:**

- **≤ or ≥** means the boundary **is included** → **solid line**
- **< or >** means boundary **is excluded** → **dashed line**

### 3. **Each inequality divides the plane into two half-planes**

Students must learn to:
- Pick a test point (often $(0, 0)$ if not on the line)
- Substitute into inequality
- Decide which region satisfies the condition

### 4. **When combining inequalities, the solution is the intersection (overlap) of valid regions**

### 5. **Domain and range are not given directly**

They must be interpreted from the shaded region:
- **Domain** = projection on $x$-axis
- **Range** = projection on $y$-axis

### 6. **Real-world modeling**

Teachers should emphasize that inequalities are used to model:
- Constraints
- Limits
- Real-world decision regions (budget, capacity, time)

## Common Difficulties

- Shading incorrect region
- Confusing inequality symbols
- Using wrong boundary type (solid vs dashed)
- Ignoring test point method

## Reflection

How can inequality graphs help students understand real-life constraints such as budget or production limits?`,
      },
      {
        id: 'session-2-3',
        number: '2.3',
        title: 'The Concept of Function',
        duration: '1.5 hours',
        completed: false,
        content: `# Session 2.3 — The Concept of Function

## Learning Objectives

Students should be able to:

- Distinguish functions from general relations
- Represent functions in multiple forms
- Apply the vertical line test
- Find inputs and outputs

## Classroom Activity

**Function machine:**

$$-2 \\rightarrow -6$$
$$2 \\rightarrow 6$$
$$4 \\rightarrow 12$$

**Students:**

1. Determine rule
2. Predict output for 8
3. Find input for output 18
4. Check whether it is a function

## Key Teaching Points

### 1. **A function assigns exactly one output per input**

This is the **defining property** of a function.

### 2. **Many-to-one is allowed, but one-to-many is NOT**

- ✅ Multiple inputs can have the same output (many-to-one)
- ❌ One input cannot have multiple outputs (one-to-many)

### 3. **Input = independent variable; output = dependent variable**

The output **depends on** the input.

### 4. **Functions can be represented as:**

- Equations: $f(x) = 3x$
- Tables
- Graphs
- Mapping diagrams

### 5. **The vertical line test provides a visual check**

If a vertical line intersects a graph **more than once**, it is **NOT a function**.

### 6. **Finding inputs from outputs requires reverse operations**

Students must work backwards step-by-step (**inverse reasoning**).

### 7. **Direction matters**

Teachers should constantly reinforce direction:

$$\\text{Input} \\rightarrow \\text{Process} \\rightarrow \\text{Output}$$

**Emphasize interpretation, not only computation.**

## Common Difficulties

- Confusing relation with function
- Misinterpreting repeated outputs (thinking they violate function rule)
- Difficulty reversing operations
- Over-relying on memorized rules

## Reflection

Give an example of a real-life situation that is **not** a function and explain why.`,
      },
      {
        id: 'session-2-4',
        number: '2.4',
        title: 'Composition of Functions',
        duration: '1.5 hours',
        completed: false,
        content: `# Session 2.4 — Composition of Functions

## Learning Objectives

Students should be able to:

- Evaluate composite functions
- Interpret function composition in real-world contexts
- Understand order of operations in functions

## Classroom Activity

Let:

$$f(t) = 5t$$ (production rate)

$$g(n) = 20n - 50$$ (profit function)

**Students:**

1. Compute $g(f(t))$
2. Interpret meaning
3. Evaluate profit for given time
4. Compare with $f(g(t))$

## Key Teaching Points

### 1. **Composition means applying one function inside another**

The output of one function becomes the input of the next.

### 2. **Order matters:**

$$f(g(x)) \\neq g(f(x))$$

- $f(g(x))$: apply $g$ first, then $f$
- $g(f(x))$: apply $f$ first, then $g$

### 3. **The inner function is evaluated first**

Always work from the **inside out**.

### 4. **Composition models step-by-step real-life processes**

Examples:
- Production → Cost → Profit
- Distance → Speed → Time
- Temperature → Energy → Cost

### 5. **Function composition is NOT just substitution**

It is a **process chain** where one output feeds into the next input.

### 6. **Function composition is generally NOT commutative**

$$f(g(x)) \\neq g(f(x))$$

Order changes the result!

### 7. **The domain of a composite function depends on:**

- The inner function's domain
- Restrictions from the outer function

**Emphasize interpretation, not only computation.**

## Common Difficulties

- Reversing order of functions
- Incorrect substitution
- Losing meaning of variables
- Treating composition as simple algebra

## Reflection

Design a real-life situation that uses two-step functional processes.

---

## 🎓 Module Summary

Relations describe connections between elements of sets using ordered pairs, tables, graphs, or mapping diagrams. A function is a special relation where each input has exactly one output. Inequalities represent regions of solutions on a plane, while function composition models multi-step processes by combining functions in sequence.

These concepts form the foundation for advanced topics such as algebraic modeling, calculus, and real-world problem solving. Teachers should emphasize conceptual understanding, multiple representations, and real-life applications to strengthen student learning.`,
      },
    ],
    passingScore: 70,
    completed: false,
    videoCount: 0,
    assessmentContent: `# MODULE ASSESSMENT

## Unit 1: Relations and Functions — End-of-Module Assessment

This assessment checks your understanding of relations, functions, inequalities, and composition. Answer all questions honestly — the goal is to strengthen your teaching, not to test memorization.

---

## Multiple Choice Questions (10 Items - 1 mark each)

### 1. What best describes a relation in mathematics?

A. A rule that assigns exactly one output to each input  
B. A set of ordered pairs linking elements of two sets  
C. A formula that always produces a number  
D. A graph that forms a straight line

**Answer: B**

---

### 2. Which of the following correctly defines the domain of a relation?

A. All output values  
B. All second elements in ordered pairs  
C. All first elements in ordered pairs  
D. All points on a graph

**Answer: C**

---

### 3. In a mapping diagram, a relation is NOT a function if:

A. Each input has exactly one output  
B. Multiple inputs have the same output  
C. One input has more than one output  
D. Outputs are repeated

**Answer: C**

---

### 4. Which of the following is TRUE about all functions?

A. Every relation is a function  
B. Each input has exactly one output  
C. Each output has exactly one input  
D. Functions cannot be represented graphically

**Answer: B**

---

### 5. The vertical line test is used to:

A. Find the slope of a line  
B. Determine if a graph represents a function  
C. Find domain and range  
D. Solve inequalities

**Answer: B**

---

### 6. Which of the following is a correct statement about inequalities?

A. They always represent a single point  
B. They represent regions of solutions  
C. They cannot be graphed  
D. They always form straight lines only

**Answer: B**

---

### 7. In graphing inequalities, a dashed line is used when:

A. The boundary is included  
B. The inequality includes equality (≤ or ≥)  
C. The boundary is not included (< or >)  
D. The graph is a function

**Answer: C**

---

### 8. If $f(x)$ is applied after $g(x)$, the correct notation is:

A. $g(f(x))$  
B. $f(g(x))$  
C. $f(x) + g(x)$  
D. $f \\cdot g(x)$

**Answer: B**

---

### 9. Which statement about composition of functions is TRUE?

A. Order does not matter  
B. $f(g(x)) = g(f(x))$ always  
C. The inner function is evaluated first  
D. Functions cannot be composed

**Answer: C**

---

### 10. Which of the following best describes a many-to-one relation?

A. Each input has different outputs  
B. One input has multiple outputs  
C. Multiple inputs share the same output  
D. No inputs have outputs

**Answer: C**

---

**Total Marks: 10**

**Passing Score: 7/10 (70%)**`,

    assessmentQuestions: [
      { 
        id: 'q1', 
        type: 'multiple-choice', 
        question: 'What best describes a relation in mathematics?', 
        options: [
          'A rule that assigns exactly one output to each input',
          'A set of ordered pairs linking elements of two sets',
          'A formula that always produces a number',
          'A graph that forms a straight line'
        ], 
        correctAnswer: 'A set of ordered pairs linking elements of two sets', 
        points: 1 
      },
      { 
        id: 'q2', 
        type: 'multiple-choice', 
        question: 'Which of the following correctly defines the domain of a relation?', 
        options: [
          'All output values',
          'All second elements in ordered pairs',
          'All first elements in ordered pairs',
          'All points on a graph'
        ], 
        correctAnswer: 'All first elements in ordered pairs', 
        points: 1 
      },
      { 
        id: 'q3', 
        type: 'multiple-choice', 
        question: 'In a mapping diagram, a relation is NOT a function if:', 
        options: [
          'Each input has exactly one output',
          'Multiple inputs have the same output',
          'One input has more than one output',
          'Outputs are repeated'
        ], 
        correctAnswer: 'One input has more than one output', 
        points: 1 
      },
      { 
        id: 'q4', 
        type: 'multiple-choice', 
        question: 'Which of the following is TRUE about all functions?', 
        options: [
          'Every relation is a function',
          'Each input has exactly one output',
          'Each output has exactly one input',
          'Functions cannot be represented graphically'
        ], 
        correctAnswer: 'Each input has exactly one output', 
        points: 1 
      },
      { 
        id: 'q5', 
        type: 'multiple-choice', 
        question: 'The vertical line test is used to:', 
        options: [
          'Find the slope of a line',
          'Determine if a graph represents a function',
          'Find domain and range',
          'Solve inequalities'
        ], 
        correctAnswer: 'Determine if a graph represents a function', 
        points: 1 
      },
      { 
        id: 'q6', 
        type: 'multiple-choice', 
        question: 'Which of the following is a correct statement about inequalities?', 
        options: [
          'They always represent a single point',
          'They represent regions of solutions',
          'They cannot be graphed',
          'They always form straight lines only'
        ], 
        correctAnswer: 'They represent regions of solutions', 
        points: 1 
      },
      { 
        id: 'q7', 
        type: 'multiple-choice', 
        question: 'In graphing inequalities, a dashed line is used when:', 
        options: [
          'The boundary is included',
          'The inequality includes equality (≤ or ≥)',
          'The boundary is not included (< or >)',
          'The graph is a function'
        ], 
        correctAnswer: 'The boundary is not included (< or >)', 
        points: 1 
      },
      { 
        id: 'q8', 
        type: 'multiple-choice', 
        question: 'If f(x) is applied after g(x), the correct notation is:', 
        options: [
          'g(f(x))',
          'f(g(x))',
          'f(x) + g(x)',
          'f · g(x)'
        ], 
        correctAnswer: 'f(g(x))', 
        points: 1 
      },
      { 
        id: 'q9', 
        type: 'multiple-choice', 
        question: 'Which statement about composition of functions is TRUE?', 
        options: [
          'Order does not matter',
          'f(g(x)) = g(f(x)) always',
          'The inner function is evaluated first',
          'Functions cannot be composed'
        ], 
        correctAnswer: 'The inner function is evaluated first', 
        points: 1 
      },
      { 
        id: 'q10', 
        type: 'multiple-choice', 
        question: 'Which of the following best describes a many-to-one relation?', 
        options: [
          'Each input has different outputs',
          'One input has multiple outputs',
          'Multiple inputs share the same output',
          'No inputs have outputs'
        ], 
        correctAnswer: 'Multiple inputs share the same output', 
        points: 1 
      },
    ]
  }
]