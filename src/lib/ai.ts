import { LessonPlan, Student } from './mockData';
import type { AnnualLessonPlanResult } from './annualLessonPlan';

// Simulated latency helper
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AILessonPlanResult {
  title: string;
  objectives: string[];
  activities: { session: number; activity: string; duration: string }[];
  assessments: string[];
  homework: string;
}

export interface AnnualPlanUnit {
  order: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  volume: 'Low' | 'Medium' | 'High';
  estimatedDays: number;
  objectives: string[];
  teacherMustInclude: string[];
  expectedOutcomes: string[];
}

export interface AnnualLessonPlanWeekRowAI {
  semester: string;
  month: string;
  week: string;
  date: string;
  unit: string;
  contents: string[];
  periodsNeeded: number;
  page: string;
  generalObjectives: string[];
  teachingMethods: string[];
  teachingAids: string[];
  evaluationMethods: string[];
  homework?: string[];
  comments?: string;
}

export interface AnnualLessonPlanMetaAI {
  academicYear?: string;
  schoolName?: string;
  teacherName?: string;
  grade?: string;
  subject?: string;
  schoolDaysPerYear?: number;
  periodsPerWeek?: number;
  periodsPerYear?: number;
  referenceMaterials?: string;
  generalObjectives?: string[];
}

export interface WeeklyProcedureRow {
  stage: string;
  time: string;
  lessonContents: string;
  teacherActivity: string;
  studentActivity: string;
  teachingAid: string;
  reference: string;
}

export interface WeeklySpecialNeeds {
  active: string;
  medium: string;
  slow: string;
}

export interface WeeklyLessonSession {
  sessionNumber: number;
  subject: string;
  mainTopic: string;
  subTopic: string;
  textbookPages?: string;
  prerequisiteKnowledge: string;
  rationale: string;
  objectives: string[];
  durationMinutes?: number;
  /** School template rows (preferred) */
  procedures?: WeeklyProcedureRow[];
  specialNeeds?: WeeklySpecialNeeds;
  /** Legacy 3-phase shape (still accepted / migrated server-side) */
  teachingApproach?: {
    startingActivity: {
      time: string;
      content: string;
      teacherActivity: string;
      studentActivity: string;
      teachingAids: string[];
      assessment: string;
    };
    mainActivity: {
      time: string;
      content: string;
      teacherActivity: string;
      studentActivity: string;
      teachingAids: string[];
      assessment: string;
    };
    concludingActivity: {
      time: string;
      content: string;
      teacherActivity: string;
      studentActivity: string;
      teachingAids: string[];
      assessment: string;
    };
  };
}

export interface AIDetailedLessonPlanResult {
  type: 'yearly' | 'monthly' | 'weekly';
  subject: string;
  mainTopic: string;
  subTopic: string;
  prerequisiteKnowledge: string;
  rationale: string;
  objectives: string[];
  sources?: { page?: number | string; topic?: string; note?: string }[];
  /** Legacy unit-card annual format */
  units?: AnnualPlanUnit[];
  /** Template-aligned annual table rows (preferred) */
  weeks?: AnnualLessonPlanWeekRowAI[];
  meta?: AnnualLessonPlanMetaAI;
  sessions?: WeeklyLessonSession[];
  overview?: string; // For yearly and monthly
}

export interface AITeachingNotesResult {
  title: string;
  language: string;
  introduction: string;
  explanations: { subtitle: string; content: string; examples: string[] }[];
  visualAids: string[];
  exercises: string[];
}

export interface AIStudentAnalysisResult {
  academicRisk: 'Low' | 'Moderate' | 'High';
  weakSubjectAreas: string[];
  strengthAreas: string[];
  actionItems: string[];
  homeReviewGuide: string;
}

export interface AIQuestion {
  question: string;
  type: string;
  options?: string[];
  answer: string;
}

// ----------------------------------------------------
// AI Simulation Engines
// ----------------------------------------------------

export const generateLessonPlanAI = async (
  grade: string,
  subject: string,
  topic: string,
  sessions: number
): Promise<AILessonPlanResult> => {
  await delay(1500); // Simulate network and AI token generation

  // Dynamic template based on subject
  if (subject.toLowerCase().includes('math')) {
    return {
      title: `AI Generated: ${grade} Mathematics – ${topic || 'Algebraic Equations'}`,
      objectives: [
        `Understand the fundamental properties of ${topic || 'algebraic equations'}.`,
        `Successfully solve multi-step problems with 90% accuracy.`,
        `Apply mathematical models to physical real-world scenarios.`,
      ],
      activities: Array.from({ length: sessions }).map((_, idx) => ({
        session: idx + 1,
        activity: idx === 0 
          ? `Concept introduction & vocabulary review of ${topic || 'variables'}.`
          : idx === sessions - 1 
          ? `Interactive class quiz and collaborative peer grading session.`
          : `Step-by-step problem-solving board exercises and team solving blocks.`,
        duration: '45 mins',
      })),
      assessments: [
        `Continuous check-in quiz (Session 2)`,
        `Group whiteboard presentation of active formulas`,
        `Take-home workbook completion tracking`,
      ],
      homework: `Complete the review practice set B on page 142. Solve all odd-numbered problems for parent review.`,
    };
  }

  // Biology template
  return {
    title: `AI Generated: ${grade} Biology – ${topic || 'Photosynthesis and Ecosystems'}`,
    objectives: [
      `Detail the key metabolic inputs and outputs of ${topic || 'cellular biology'}.`,
      `Construct accurate structural diagrams labeling cell boundaries.`,
      `Examine environmental dependencies affecting biochemical rates.`,
    ],
    activities: Array.from({ length: sessions }).map((_, idx) => ({
      session: idx + 1,
      activity: idx === 0
        ? `Interactive slide presentation detailing organelles and chemical receptors.`
        : idx === sessions - 1
        ? `Laboratory write-up examination, microscope cleaning and summary reports.`
        : `Guided review drawing structures and labeling transport proteins in pairs.`,
      duration: '45 mins',
    })),
    assessments: [
      `Formative diagram quiz`,
      `Ecosystem peer-to-peer modeling challenge score`,
      `Laboratory performance evaluation checklist`,
    ],
    homework: `Draft a 250-word synthesis connecting cell respiration outputs directly to photosynthesis inputs.`,
  };
};

export const generateTeachingNotesAI = async (
  grade: string,
  subject: string,
  topic: string,
  language: string
): Promise<AITeachingNotesResult> => {
  await delay(1200);

  const isAmharic = language === 'Amharic';
  const isAfaanOromo = language === 'Afaan Oromo';
  const isTigrinya = language === 'Tigrinya';

  if (isAmharic) {
    return {
      title: `የማስተማሪያ ማስታወሻ: ${grade} ${subject} - ${topic || 'ክፍልፋዮች (Fractions)'}`,
      language: 'Amharic',
      introduction: `ይህ የማስተማሪያ ማስታወሻ የተዘጋጀው ለኢትዮጵያ የትምህርት ሥርዓት ሥርዓተ-ትምህርት መሠረት በማድረግ ነው። ተማሪዎች የ${topic || 'ክፍልፋዮች'}ን መሠረታዊ ጽንሰ-ሀሳብ በቀላሉ እንዲረዱ ይረዳል።`,
      explanations: [
        {
          subtitle: 'ክፍልፋይ ምንድን ነው?',
          content: 'ክፍልፋይ የአንድ ሙሉ ነገር የተወሰነ እኩል ክፍልን የሚገልጽ የቁጥር ዓይነት ነው። ክፍልፋይ ሁለት ዋና ክፍሎች አሉት፡ ላዕላይ (Numerator) እና ታህታይ (Denominator)።',
          examples: [
            '1/2 ማለት አንድን ዳቦ ለሁለት እኩል ሰንጥቆ አንዱን ክፍል መውሰድ ማለት ነው።',
            '3/4 ማለት አንድን ብርቱካን በአራት እኩል ከፍሎ ሦስቱን ክፍሎች መውሰድ ማለት ነው።',
          ],
        },
        {
          subtitle: 'ክፍልፋዮችን መደመር እና መቀነስ',
          content: 'ታህታያቸው (Denominator) ተመሳሳይ የሆኑ ክፍልፋዮችን ለመደመር ላዕላያቸውን ብቻ መደመር እና ተመሳሳይ ታህታዩን ማስቀመጥ ይበቃል።',
          examples: [
            '1/5 + 2/5 = (1+2)/5 = 3/5',
            '4/7 - 2/7 = (4-2)/7 = 2/7',
          ],
        },
      ],
      visualAids: [
        'የክብ ኬክ ምስልን ለአራት ከፍሎ አንዱን ክፍል በቀለም በመቀባት 1/4 ማሳየት።',
        'የመስመር ቁጥር (Number Line) በመጠቀም ከ0 እስከ 1 ያለውን ርቀት በእኩል በመከፋፈል ክፍልፋዩን ማመልከት።',
      ],
      exercises: [
        'የሚከተሉትን ክፍልፋዮች ደምሩ፡ 2/9 + 4/9 = ?',
        'አንድን ሙሉ ኬክ ለ 8 ተማሪዎች እኩል ብናከፋፍል እያንዳንዱ ተማሪ ምን ያህል ክፍል ይደርሰዋል?',
        'ቀጣዩን ክፍልፋይ አቃልሉ፡ 4/8 = ?',
      ],
    };
  }

  // Multilingual templates structure
  const langPrefix = isAfaanOromo ? '[Afaan Oromo] ' : isTigrinya ? '[Tigrinya] ' : '';
  const welcomeText = isAfaanOromo 
    ? `Qabiyyee barumsaa kana kan qophaa'e sirna barnoota Itoophiyaa irratti hunda'uun barattoota ${grade}tiif.`
    : isTigrinya
    ? `እዚ ትምህርታዊ ፅሑፍ ብመሰረት ስርዓተ ትምህርቲ ኢትዮጵያ ተዳልዩ ዘሎ ኮይኑ ተምሃሮ ብቀሊሉ ክርድእዎ ይሕግዝ።`
    : `This teaching guide is fully aligned with the Ethiopian MOE Curriculum guidelines for ${grade}. It simplifies core parameters for class presentation.`;

  return {
    title: `${langPrefix}Teaching Notes: ${grade} ${subject} – ${topic || 'Fractions & Ratios'}`,
    language: language || 'English',
    introduction: welcomeText,
    explanations: [
      {
        subtitle: 'Core Concept Definition',
        content: `Understanding ${topic || 'the ratio structure'} is fundamental in everyday measurements and scientific ratios. It describes parts of a larger unified system.`,
        examples: [
          'Example 1: A shared classroom supply split equally between students representing sub-fractions.',
          'Example 2: Cooking calculations using simple proportion metrics.',
        ],
      },
      {
        subtitle: 'Practical Class Calculations',
        content: 'Apply basic algebraic arithmetic or cell metabolic balances to solve theoretical text problems.',
        examples: [
          '3/4 representing three out of four total segments.',
          'Scaling factors: doubling the values maintains ratio equivalence.',
        ],
      },
    ],
    visualAids: [
      'Circular pie chart models splitting parameters into colored sectors.',
      'Symmetric rectangular bar divisions for clear parts-to-whole estimation.',
    ],
    exercises: [
      `Solve basic practice worksheets: Identify the larger ratio between 3/5 and 4/7.`,
      `Explain in your own words why fractional systems represent division parameters.`,
    ],
  };
};

export const generateAssessmentAI = async (
  _grade: string,
  subject: string,
  _difficulty: string,
  _type: string
): Promise<AIQuestion[]> => {
  await delay(1500);

  const mockQuestions: Record<string, AIQuestion[]> = {
    biology: [
      { question: 'Which structures are found in plant cells but absent in animal cells?', type: 'MCQ', options: ['Cell Wall & Chloroplasts', 'Nucleus & Ribosomes', 'Cell Membrane & Cytoplasm', 'Mitochondria & Vacuole'], answer: 'Cell Wall & Chloroplasts' },
      { question: 'Active transport requires chemical energy in the form of ATP to move molecules against concentration gradients.', type: 'True/False', answer: 'True' },
      { question: 'Explain the ecological significance of decomposers in Ethiopian savannah systems.', type: 'Essay', answer: 'Decomposers recycle dead organic matter back into basic nutrients (nitrogen, phosphorus), maintaining soil viability for producers and sustaining herbivores.' },
    ],
    math: [
      { question: 'What is the sum of the roots of the quadratic equation x^2 - 5x + 6 = 0?', type: 'Short Answer', answer: '5' },
      { question: 'A quadratic equation always possesses at least one real solution.', type: 'True/False', answer: 'False' },
      { question: 'Solve for x: 2x - 7 = 3(x + 1)', type: 'MCQ', options: ['x=-10', 'x=4', 'x=-4', 'x=10'], answer: 'x=-10' },
    ],
  };

  const selectedKey = subject.toLowerCase().includes('biol') ? 'biology' : 'math';
  return mockQuestions[selectedKey];
};

export const analyzeStudentPerformanceAI = async (student: Student): Promise<AIStudentAnalysisResult> => {
  await delay(1000);

  const isLowPerf = student.gpa < 2.8 || student.attendanceRate < 90;
  
  if (isLowPerf) {
    return {
      academicRisk: 'High',
      weakSubjectAreas: ['Mathematics (Quadratic Roots)', 'Physics (Mechanics formulas)'],
      strengthAreas: ['English language communication', 'Biology diagrams accuracy'],
      actionItems: [
        'Mandatory attendance in Monday afternoon peer-tutor math blocks.',
        'Weekly teacher check-in during homeroom section evaluations.',
        'Daily review logs to be signed off by the parent.',
      ],
      homeReviewGuide: `Ato ${student.parentName}, your child requires strict revision on simple equations. Ensure they dedicate at least 30 minutes every evening to worksheets. Avoid distractions during homework blocks.`,
    };
  }

  return {
    academicRisk: 'Low',
    weakSubjectAreas: ['Advanced chemistry laboratory balancing'],
    strengthAreas: ['Mathematics and algebraic proofs', 'Biology practical identification', 'Syllabus coverage completion'],
    actionItems: [
      'Provide enrichment homework exercises in physics and STEM.',
      'Recommend enrollment as a peer-tutor for Grade 9 study sessions.',
      'Nominate for the school regional Science Olympiad representational group.',
    ],
    homeReviewGuide: `Excellent academic standing. W/ro/Ato ${student.parentName}, please continue fostering your child's natural affinity for Mathematics and Science by encouraging their participation in STEM group projects.`,
  };
};

// AI Service Wrapper with Server-Side Shared Caching
class AIService {
  // Use local Next.js API routes that have server-side caching
  private apiUrl = '/api/ai';
  private primeAiUrl = process.env.NEXT_PUBLIC_PRIME_AI_API_URL || 'https://prime-ai-bndr.onrender.com';
  private useFallback = process.env.NEXT_PUBLIC_AI_FALLBACK_MODE === 'true';
  private useLocalCache = true; // Client-side cache as secondary layer
  private cache: Map<string, any> = new Map();
  private readonly CACHE_STORAGE_KEY = 'prime_ai_cache';

  constructor() {
    // Load cache from localStorage on initialization (secondary cache)
    this.loadCacheFromStorage();
    
    // Debug log on initialization
    console.log('🤖 AI Service Initialized:');
    console.log('   API Mode: Server-side cached (shared across all users)');
    console.log('   Prime AI URL:', this.primeAiUrl);
    console.log('   Fallback Mode:', this.useFallback ? '⚠️ ENABLED (using templates)' : '✅ DISABLED (using real AI)');
    console.log(`   Client cache loaded: ${this.cache.size} items`);
  }

  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    try {
      const stored = localStorage.getItem(this.CACHE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(Object.entries(parsed));
        console.log(`💾 Loaded ${this.cache.size} cached responses from localStorage`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cache from storage:', error);
    }
  }

  private saveCacheToStorage(): void {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    try {
      const cacheObj = Object.fromEntries(this.cache);
      localStorage.setItem(this.CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('⚠️ Failed to save cache to storage:', error);
    }
  }

  private getCacheKey(endpoint: string, payload: any): string {
    return `${endpoint}:${JSON.stringify(payload)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached) {
      console.log('✅ Using cached AI response (permanent cache)');
      return cached;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.saveCacheToStorage(); // Persist to localStorage
    console.log(`💾 Cached AI response permanently (Total cached: ${this.cache.size})`);
  }

  private async callPrimeAI(endpoint: string, payload: any): Promise<any> {
    if (this.useFallback) {
      console.warn('⚠️ AI Fallback Mode is enabled. Using template generation.');
      throw new Error('Fallback mode enabled');
    }

    // Check client-side cache first (secondary layer)
    if (this.useLocalCache) {
      const cacheKey = this.getCacheKey(endpoint, payload);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error(
        'Offline — AI generation needs a connection (cached responses for the same request still work).',
      );
    }

    try {
      // Call local Next.js API route (has server-side cache)
      const localEndpoint = `${this.apiUrl}${endpoint}`;
      console.log(`🚀 Calling cached API: ${localEndpoint}`);
      
      const response = await fetch(localEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (${response.status}):`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Log cache status
      if (result.cached) {
        console.log(`✅ [SERVER CACHE HIT] Response from shared server cache (age: ${result.cacheAge} min)`);
      } else {
        console.log(`✅ [NEW] Fresh response from Prime AI, now cached for all users`);
      }
      
      // Store in client-side cache as well (secondary layer)
      if (this.useLocalCache) {
        const cacheKey = this.getCacheKey(endpoint, payload);
        this.setCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Prime AI API call failed:', error);
      throw error;
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_STORAGE_KEY);
    }
    console.log('🗑️ AI cache cleared from memory and storage');
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  async generateRealLifeExamples(topic: string, contextCountry: string = 'Ethiopia'): Promise<{ content: string }> {
    try {
      console.log('🌍 generateRealLifeExamples called for topic:', topic);
      
      // Use the correct /real-life-examples endpoint
      const result = await this.callPrimeAI('/real-life-examples', {
        topic,
        context_country: contextCountry,
      });
      
      console.log('✅ Prime AI returned real-life examples');
      return { content: result.content || JSON.stringify(result) };
    } catch (error) {
      console.error('❌ generateRealLifeExamples failed, using fallback:', error);
      
      await delay(1000);
      
      return {
        content: `# Real-Life Applications of ${topic}

## Ethiopian Context

Understanding ${topic} is essential for many practical applications in Ethiopia:

### 1. Agriculture and Farming
- **Application:** Farmers use ${topic} concepts to calculate optimal planting patterns, irrigation schedules, and crop yields.
- **Example:** Determining the best arrangement of crops in a field to maximize production.

### 2. Construction and Architecture
- **Application:** Ethiopian builders apply ${topic} when designing traditional tukuls or modern buildings.
- **Example:** Calculating angles, measurements, and structural stability.

### 3. Business and Trade
- **Application:** Market traders use ${topic} for pricing, profit calculations, and inventory management.
- **Example:** Computing fair prices, bulk discounts, and profit margins in Addis Ababa's Merkato.

### 4. Technology and Innovation
- **Application:** Ethiopian tech startups use ${topic} in software development, data analysis, and system design.
- **Example:** Creating algorithms, analyzing user data, and optimizing performance.

### 5. Healthcare and Medicine
- **Application:** Medical professionals apply ${topic} in dosage calculations, statistical analysis, and medical imaging.
- **Example:** Determining medication dosages based on body weight and condition severity.

---

## Practice Activity

**Challenge:** Identify one more real-life application of ${topic} in your community. How do people use these concepts in their daily lives? Share your observations with your classmates.`,
      };
    }
  }

  async getAvailableTopics(): Promise<string[]> {
    try {
      console.log('📚 Fetching available topics from Prime AI');
      
      // Use GET request for /topics endpoint
      const response = await fetch(`${this.apiUrl}/topics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Topics fetched:', result.topics);
      return result.topics || [];
    } catch (error) {
      console.error('❌ Failed to fetch topics:', error);
      
      // Fallback topics for Grade 11 Mathematics
      return [
        'Relations and Functions',
        'Polynomial Functions',
        'Rational Functions',
        'Exponential and Logarithmic Functions',
        'Trigonometric Functions',
        'Sequences and Series',
        'Limits and Continuity',
        'Differentiation',
        'Integration',
        'Vectors',
        'Statistics and Probability',
      ];
    }
  }

  async chatWithTextbook(prompt: string): Promise<{ content: string }> {
    try {
      console.log('📝 chatWithTextbook called with prompt:', prompt.substring(0, 100) + '...');
      
      // Use the correct /chat endpoint with the proper request format
      const result = await this.callPrimeAI('/chat', {
        query: prompt,
        history: [],
      });
      
      console.log('✅ Prime AI API returned result');
      return { content: result.content || result.response || JSON.stringify(result) };
    } catch (error) {
      console.error('❌ chatWithTextbook failed, using fallback:', error);
      console.warn('⚠️ Using fallback assessment generation');
      
      // Fallback to template generation
      await delay(1800);
      
      // Extract parameters from prompt
      const typeMatch = prompt.match(/type:\s*(\w+)/i);
      const topicMatch = prompt.match(/topic:\s*([^\n]+)/i);
      const gradeMatch = prompt.match(/grade:\s*([^\n]+)/i);
      const subjectMatch = prompt.match(/subject:\s*(\w+)/i);
      const difficultyMatch = prompt.match(/difficulty:\s*(\w+)/i);
      
      const type = typeMatch ? typeMatch[1] : 'Quiz';
      const topic = topicMatch ? topicMatch[1].trim() : 'General Review';
      const grade = gradeMatch ? gradeMatch[1].trim() : 'Grade 9';
      const subject = subjectMatch ? subjectMatch[1] : 'Mathematics';
      const difficulty = difficultyMatch ? difficultyMatch[1] : 'Medium';
      
      // Generate assessment content based on subject
      if (subject.toLowerCase().includes('math')) {
        return {
          content: `# ${type} on ${topic}

**Grade: ${grade}**  
**Subject: ${subject}**  
**Difficulty: ${difficulty}**  
**Total Marks: 50**

---

## Instructions
- Answer all questions
- Show all your working
- Time allowed: 45 minutes

---

## Section A: Multiple Choice Questions (20 marks)

1. If f(x) = 2x + 3, what is f(5)?
   - A) 8
   - B) 10
   - C) 13
   - D) 15

2. Solve for x: 3x - 7 = 14
   - A) x = 5
   - B) x = 7
   - C) x = 21
   - D) x = 3

3. What is the value of √144?
   - A) 10
   - B) 11
   - C) 12
   - D) 14

4. Simplify: (4x + 8) / 4
   - A) x + 2
   - B) x + 8
   - C) 4x + 2
   - D) x + 4

---

## Section B: Short Answer Questions (30 marks)

5. Factorize completely: x² - 5x + 6  
   (5 marks)

6. Solve the quadratic equation: x² - 3x - 10 = 0  
   (7 marks)

7. In a class of 40 students, the ratio of boys to girls is 3:2. How many boys are in the class?  
   (6 marks)

8. Calculate the area of a circle with radius 7cm. Use π = 22/7  
   (6 marks)

9. Solve the simultaneous equations:  
   2x + y = 10  
   x - y = 2  
   (6 marks)

---

## Answer Key

### Section A:
- C) 13
- B) x = 7
- C) 12
- A) x + 2

### Section B:
5. (x - 2)(x - 3)
6. x = 5 or x = -2
7. 24 boys
8. Area = 154 cm²
9. x = 4, y = 2

---

**Marking Scheme:**
- Section A: 5 marks each (4 questions = 20 marks)
- Section B: As indicated per question (Total 30 marks)
- **Grand Total: 50 marks**`,
        };
      }
      
      // Biology assessment
      return {
        content: `# ${type} on ${topic}

**Grade: ${grade}**  
**Subject: ${subject}**  
**Difficulty: ${difficulty}**  
**Total Marks: 50**

---

## Instructions
- Answer all questions
- Draw clear, labeled diagrams where required
- Time allowed: 45 minutes

---

## Section A: Multiple Choice Questions (20 marks)

1. Which organelle is responsible for photosynthesis in plant cells?
   - A) Mitochondria
   - B) Chloroplast
   - C) Nucleus
   - D) Ribosome

2. What is the primary function of red blood cells?
   - A) Fight infection
   - B) Transport oxygen
   - C) Clot blood
   - D) Produce hormones

3. The process by which plants lose water through their leaves is called:
   - A) Respiration
   - B) Transpiration
   - C) Photosynthesis
   - D) Digestion

4. Which of these is NOT a characteristic of living organisms?
   - A) Growth
   - B) Reproduction
   - C) Crystallization
   - D) Movement

---

## Section B: Structured Questions (30 marks)

5. Define the term "ecosystem" and give two examples from Ethiopia.  
   (5 marks)

6. Describe the process of cellular respiration and state where it occurs in the cell.  
   (8 marks)

7. Draw and label a diagram of a plant cell showing the cell wall, cell membrane, nucleus, cytoplasm, and chloroplast.  
   (8 marks)

8. Explain the difference between aerobic and anaerobic respiration. Give one example of each.  
   (6 marks)

9. What role do decomposers play in the nutrient cycle?  
   (3 marks)

---

## Answer Key

### Section A:
- B) Chloroplast
- B) Transport oxygen
- B) Transpiration
- C) Crystallization

### Section B:
5. Ecosystem = community of living organisms interacting with their environment. Examples: Bale Mountains, Simien Mountains
6. Cellular respiration converts glucose to energy (ATP). Occurs in mitochondria.
7. [Diagram should show labeled plant cell structures]
8. Aerobic needs oxygen (e.g., human respiration), Anaerobic doesn't (e.g., yeast fermentation)
9. Break down dead matter, return nutrients to soil

---

**Marking Scheme:**
- Section A: 5 marks each (4 questions = 20 marks)
- Section B: As indicated per question (Total 30 marks)
- **Grand Total: 50 marks**`,
      };
    }
  }

  async generateDetailedLessonPlan(params: {
    plan_type: 'yearly' | 'monthly' | 'weekly';
    grade: string;
    subject: string;
    topic?: string;
    subtopic?: string;
    student_level?: 'differentiated' | 'beginner' | 'intermediate' | 'advanced';
    periods_per_week?: number;
    session_duration?: number;
    learning_days_per_year?: number;
    days_per_week?: number;
    /** Scaffolded teaching weeks from the disseminated school calendar */
    calendar_weeks?: {
      id: string;
      semester: string;
      month: string;
      week: string;
      date: string;
      periodsAvailable: number;
      teachingDays?: number;
      minutesAvailable?: number;
      isTeachingWeek?: boolean;
      note?: string;
    }[];
    /** Full-year calendar weeks for map-based unit/page allocation across batches */
    year_calendar_weeks?: {
      id: string;
      semester: string;
      month: string;
      week: string;
      date: string;
      periodsAvailable: number;
      teachingDays?: number;
      minutesAvailable?: number;
      isTeachingWeek?: boolean;
      note?: string;
    }[];
    non_teaching_windows?: string[];
    /** Aids the teacher actually has — plan must only use these */
    teaching_aids?: string[];
    teacher_name?: string;
    school_name?: string;
    academic_year?: string;
    reference_materials?: string;
    /** Pacing/continuity instructions for this batch of a multi-batch annual plan. Kept
     * separate from `topic` — `topic` is embedded as the retrieval query on the backend, and
     * a paragraph of scheduling instructions there degrades retrieval relevance. */
    continuation_notes?: string;
    /** 0-based index of this batch and the total batch count, for a multi-batch annual plan —
     * lets the backend hand back a distinct slice of source material per batch instead of
     * every batch retrieving the same top-K chunks. */
    batch_index?: number;
    total_batches?: number;
  }): Promise<{ plan: AIDetailedLessonPlanResult; sources: { page?: number; topic?: string }[] }> {
    const result = await this.callPrimeAI('/detailed-lesson-plan', {
      plan_type: params.plan_type,
      grade: params.grade,
      subject: params.subject,
      topic: params.topic ?? '',
      subtopic: params.subtopic ?? '',
      student_level: params.student_level ?? 'differentiated',
      periods_per_week: params.periods_per_week ?? 3,
      session_duration: params.session_duration ?? 45,
      learning_days_per_year: params.learning_days_per_year ?? 180,
      days_per_week: params.days_per_week ?? 5,
      calendar_weeks: params.calendar_weeks ?? [],
      year_calendar_weeks: params.year_calendar_weeks ?? [],
      non_teaching_windows: params.non_teaching_windows ?? [],
      teaching_aids: params.teaching_aids ?? [],
      teacher_name: params.teacher_name ?? '',
      school_name: params.school_name ?? '',
      academic_year: params.academic_year ?? '',
      reference_materials: params.reference_materials ?? 'TEXT BOOK',
      continuation_notes: params.continuation_notes ?? '',
      batch_index: params.batch_index ?? 0,
      total_batches: params.total_batches ?? 1,
    });

    const plan = (result.plan ?? result) as AIDetailedLessonPlanResult;
    const sources = (result.sources ?? []) as { page?: number; topic?: string }[];
    const isYearly = params.plan_type === 'yearly';

    return {
      plan: {
        ...plan,
        subTopic: plan.subTopic ?? (plan as { subtopic?: string }).subtopic ?? '',
        sources: isYearly ? sources : sources,
        units: plan.units ?? (plan as { units?: AnnualPlanUnit[] }).units,
        weeks: plan.weeks,
        meta: plan.meta,
      },
      sources,
    };
  }

  async generateLessonPlan(prompt: string): Promise<{ content: string }> {
    try {
      console.log('📚 generateLessonPlan called');
      
      // Extract parameters from prompt
      const topicMatch = prompt.match(/topic:\s*([^\n]+)/i);
      const durationMatch = prompt.match(/duration[_\s]?minutes:\s*(\d+)/i);
      
      const topic = topicMatch ? topicMatch[1].trim() : 'General Mathematics';
      const duration_minutes = durationMatch ? parseInt(durationMatch[1]) : 80;
      
      // Use the correct /lesson-plan endpoint
      const result = await this.callPrimeAI('/lesson-plan', {
        topic,
        duration_minutes,
      });
      
      console.log('✅ Prime AI returned lesson plan');
      return { content: result.content || JSON.stringify(result) };
    } catch (error) {
      // Previously fell back to a hardcoded mock lesson plan (fake page numbers, fake
      // exercises) indistinguishable from a real textbook-grounded response. Surface the
      // real failure instead so the caller shows an actual error rather than fabricated
      // content presented as if it were generated from the textbook.
      console.error('❌ generateLessonPlan failed:', error);
      throw error;
    }
  }

  async generateTeachingNotes(params: {
    topic: string;
    subtopic?: string;
    grade?: string;
    subject?: string;
    language?: string;
    sessionContext?: string;
    studentLevel?: string;
    /** "Explain more": ask for one thorough deep-dive on the concept instead of a
     * full objectives/practice/wrap-up note. */
    deepDive?: boolean;
  } | string): Promise<{ content: string }> {
    const normalized =
      typeof params === 'string'
        ? {
            topic:
              params.match(/topic:\s*([^\n]+)/i)?.[1]?.trim() ?? 'General Mathematics',
            subtopic: params.match(/subtopic:\s*([^\n]+)/i)?.[1]?.trim() ?? '',
            grade: params.match(/grade:\s*([^\n]+)/i)?.[1]?.trim() ?? 'Grade 9',
            subject: params.match(/subject:\s*([^\n]+)/i)?.[1]?.trim() ?? 'Biology',
            language: params.match(/language:\s*([^\n]+)/i)?.[1]?.trim() ?? 'English',
            sessionContext:
              params.match(/session_context:\s*([\s\S]+)/i)?.[1]?.trim() ?? '',
            studentLevel: 'differentiated',
            deepDive: false,
          }
        : params;

    const {
      topic,
      subtopic = '',
      grade = 'Grade 9',
      subject = 'Biology',
      language = 'English',
      sessionContext = '',
      studentLevel = 'differentiated',
      deepDive = false,
    } = normalized;

    try {
      console.log('📖 generateTeachingNotes called');
      console.log('   Topic:', topic);

      const result = await this.callPrimeAI('/lesson-notes', {
        topic,
        subtopic,
        session_context: sessionContext,
        student_level: studentLevel,
        grade,
        subject,
        deep_dive: deepDive,
      });

      console.log('✅ Prime AI returned teaching notes');
      return { content: result.content || JSON.stringify(result) };
    } catch (error) {
      // Previously fell back to a hardcoded mock (generic content unrelated to the
      // requested topic/textbook) presented as a real generation. Surface the real
      // failure instead so the caller shows an actual error.
      console.error('❌ generateTeachingNotes failed:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();

/** Maps UI question format labels to Prime AI backend keys. */
export function normalizeQuestionFormat(format: string): string {
  const key = format.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
  const aliases: Record<string, string> = {
    multiple_choice: 'multiple_choice',
    writing: 'writing',
    fill_the_blank: 'fill_in_the_blank',
    fill_in_the_blank: 'fill_in_the_blank',
    matching: 'matching',
    true_false: 'true_false',
    mixed: 'mixed',
    mcq: 'multiple_choice',
    short_answer: 'writing',
  };
  return aliases[key] ?? key;
}

export function parseAnnualPlanDetail(plan: LessonPlan): AnnualLessonPlanResult | null {
  if (!plan.planDetail) return null;
  try {
    const parsed = JSON.parse(plan.planDetail) as AnnualLessonPlanResult;
    if (parsed?.weeks?.length) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function parseWeeklyPlanDetail(plan: LessonPlan): AIDetailedLessonPlanResult | null {
  if (!plan.planDetail) return null;
  try {
    const parsed = JSON.parse(plan.planDetail) as AIDetailedLessonPlanResult;
    if (parsed?.type === 'weekly' || parsed?.sessions?.length) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function getAnnualMonthOptions(annual: AnnualLessonPlanResult): string[] {
  const months: string[] = [];
  for (const w of annual.weeks || []) {
    if (w.month && !months.includes(w.month)) months.push(w.month);
  }
  return months;
}

/** Unique topic options from a published annual lesson plan (units + weekly contents). */
export function getAnnualPlanTopicOptions(plan: LessonPlan): {
  value: string;
  label: string;
  topic: string;
}[] {
  const annual = parseAnnualPlanDetail(plan);
  if (!annual?.weeks?.length) return [];

  const seen = new Set<string>();
  const options: { value: string; label: string; topic: string }[] = [];

  const push = (raw: string, kind: 'unit' | 'content') => {
    const topic = raw.replace(/\s+/g, ' ').trim();
    if (!topic || topic === '—' || topic === '-') return;
    const key = topic.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      value: `${kind}:${key}`,
      label: kind === 'unit' ? `Unit: ${topic}` : topic,
      topic,
    });
  };

  for (const week of annual.weeks) {
    if (week.unit) push(week.unit, 'unit');
    for (const content of week.contents || []) {
      push(content, 'content');
    }
  }

  return options;
}

export function getAnnualWeeksForMonth(annual: AnnualLessonPlanResult, month: string) {
  return (annual.weeks || []).filter((w) => w.month === month);
}

/** Session topic options from a weekly detailed plan (for teaching notes). */
export function getWeeklyPlanSessionTopicOptions(plan: LessonPlan) {
  const weekly = parseWeeklyPlanDetail(plan);
  const planObjectives = (plan.objectives || []).filter(Boolean);
  const weeklyObjectives = (weekly?.objectives || []).filter(Boolean);
  const allObjectives = [...new Set([...planObjectives, ...weeklyObjectives])];

  if (weekly?.sessions?.length) {
    const sessionOptions = weekly.sessions.map((s) => ({
      value: String(s.sessionNumber),
      label: `Session ${s.sessionNumber}: ${s.subTopic || s.mainTopic}${
        s.textbookPages ? ` (${s.textbookPages})` : ''
      }`,
      topic: s.subTopic || s.mainTopic || plan.title,
      subtopic: s.textbookPages || '',
      context: [
        `Weekly lesson plan: ${plan.title}`,
        `Focus: Session ${s.sessionNumber} — ${s.subTopic || s.mainTopic}`,
        s.textbookPages ? `Textbook pages: ${s.textbookPages}` : '',
        `Assessment topic (use ONLY this): ${s.subTopic || s.mainTopic || plan.title}`,
        allObjectives.length
          ? `Lesson plan objectives:\n${allObjectives.map((o) => `- ${o}`).join('\n')}`
          : '',
        (s.objectives || []).length
          ? `Session objectives:\n${(s.objectives || []).map((o) => `- ${o}`).join('\n')}`
          : '',
        ...(s.procedures || []).map(
          (p) => `${p.stage}: ${p.lessonContents} [${p.reference}]`,
        ),
      ]
        .filter(Boolean)
        .join('\n'),
    }));

    const allSessionsTopic =
      weekly.mainTopic ||
      weekly.sessions.map((s) => s.subTopic || s.mainTopic).filter(Boolean).join('; ') ||
      plan.title;

    const allPages = [
      ...new Set(
        weekly.sessions.map((s) => s.textbookPages).filter((p): p is string => Boolean(p?.trim())),
      ),
    ].join('; ');

    const allSessionsContext = [
      `Weekly lesson plan: ${plan.title}`,
      `Focus: ALL ${weekly.sessions.length} sessions this week`,
      weekly.mainTopic ? `Main topic: ${weekly.mainTopic}` : '',
      weekly.subTopic ? `Subtopic: ${weekly.subTopic}` : '',
      allPages ? `Textbook pages: ${allPages}` : '',
      `Assessment topic (use ONLY this): ${allSessionsTopic}`,
      allObjectives.length
        ? `Lesson plan objectives:\n${allObjectives.map((o) => `- ${o}`).join('\n')}`
        : '',
      '',
      'Sessions:',
      ...weekly.sessions.flatMap((s) => [
        `Session ${s.sessionNumber}: ${s.subTopic || s.mainTopic}${
          s.textbookPages ? ` (${s.textbookPages})` : ''
        }`,
        ...((s.objectives || []).map((o) => `  - ${o}`)),
      ]),
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    return [
      {
        value: 'all',
        label: `All sessions (${weekly.sessions.length})`,
        topic: allSessionsTopic,
        subtopic: allPages || weekly.subTopic || '',
        context: allSessionsContext,
      },
      ...sessionOptions,
    ];
  }

  return getLessonPlanSessionOptions(plan).map((o) => ({
    ...o,
    topic:
      o.value === 'all'
        ? plan.title
        : plan.activities.find((a) => String(a.session) === o.value)?.activity || plan.title,
    subtopic: o.value === 'all' ? '' : o.label,
    context:
      o.value === 'all'
        ? buildLessonPlanContext(plan)
        : [
            `Lesson plan: ${plan.title}`,
            `Focus: ${o.label}`,
            planObjectives.length
              ? `Lesson plan objectives:\n${planObjectives.map((obj) => `- ${obj}`).join('\n')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
  }));
}

export function getLessonPlanSessionOptions(plan: LessonPlan) {
  const sessionOptions =
    plan.activities.length > 0
      ? plan.activities.map((a) => ({
          value: String(a.session),
          label: `Session ${a.session}: ${a.activity} (${a.duration})`,
        }))
      : Array.from({ length: plan.sessions }, (_, i) => ({
          value: String(i + 1),
          label: `Session ${i + 1}`,
        }));

  return [
    {
      value: 'all',
      label: `Whole lesson plan (${plan.sessions} session${plan.sessions === 1 ? '' : 's'})`,
    },
    ...sessionOptions,
  ];
}

export function resolveSessionScope(plan: LessonPlan, scope: string) {
  if (scope === 'all') {
    return {
      topic: plan.title,
      subtopic: plan.objectives[0] ?? '',
      sessionContext: buildLessonPlanContext(plan),
      label: `All sessions — ${plan.title}`,
    };
  }

  const sessionNum = Number(scope);
  const activity = plan.activities.find((a) => a.session === sessionNum);
  const activityLine = activity
    ? `Activity: ${activity.activity} (${activity.duration})`
    : '';

  return {
    topic: plan.title,
    subtopic: activity?.activity ?? `Session ${sessionNum}`,
    sessionContext: [
      `Lesson plan: ${plan.title}`,
      `Focus: Session ${sessionNum}`,
      activityLine,
      plan.objectives.length
        ? `Objectives:\n${plan.objectives.map((o) => `- ${o}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    label: activity
      ? `Session ${sessionNum}: ${activity.activity}`
      : `Session ${sessionNum}`,
  };
}

export function buildLessonPlanContext(plan: LessonPlan): string {
  const lines = [
    `Title: ${plan.title}`,
    `Grade: ${plan.grade} | Subject: ${plan.subject} | Sessions: ${plan.sessions}`,
    '',
    'Learning Objectives:',
    ...plan.objectives.map((o) => `- ${o}`),
    '',
    'Session Activities:',
    ...plan.activities.map((a) => `- Session ${a.session}: ${a.activity} (${a.duration})`),
  ];
  if (plan.homework) {
    lines.push('', `Homework: ${plan.homework}`);
  }
  if (plan.assessments.length > 0) {
    lines.push('', 'Planned Assessments:', ...plan.assessments.map((a) => `- ${a}`));
  }
  return lines.join('\n');
}

export type AssessmentQuestionLimits = {
  min: number;
  max: number;
  default: number;
};

/** Sensible question counts by assessment type (aligned with Prime AI caps). */
export function questionLimitsForAssessmentType(
  type: string,
): AssessmentQuestionLimits {
  switch (type) {
    case 'Final Exam':
      return { min: 15, max: 50, default: 40 };
    case 'Mid Exam':
      return { min: 10, max: 40, default: 25 };
    case 'Quiz':
      return { min: 3, max: 15, default: 10 };
    case 'Baseline':
      return { min: 5, max: 40, default: 15 };
    case 'Assignment':
    case 'Practical':
      return { min: 5, max: 25, default: 10 };
    default:
      return { min: 5, max: 40, default: 15 };
  }
}

export const generateAssessmentWithAI = async (
  type: string,
  topic: string,
  grade: string,
  subject: string,
  difficulty: string,
  numQuestions: number = 10,
  questionFormat: string = 'Mixed',
  lessonPlanContext?: string,
  studentLevel: string = 'differentiated',
  /** 0-100 = % of questions grounded only in the official Minimum Learning
   * Competencies; the rest are grounded in advanced/enrichment content.
   * Omit for today's unfiltered behavior. */
  mlcPercent?: number,
): Promise<string> => {
  try {
    const payload: Record<string, unknown> = {
      topic,
      difficulty: difficulty.toLowerCase(),
      // Up to 60 for mid/final; Prime AI batches large sets server-side
      num_questions: Math.min(60, Math.max(3, Number(numQuestions) || 10)),
      question_type: normalizeQuestionFormat(questionFormat),
      student_level: studentLevel,
      subject,
      grade,
    };
    if (lessonPlanContext?.trim()) {
      payload.lesson_plan_context = lessonPlanContext.trim();
    }
    if (typeof mlcPercent === 'number' && Number.isFinite(mlcPercent)) {
      payload.mlc_percent = Math.min(100, Math.max(0, Math.round(mlcPercent)));
    }

    const cacheKey = aiService['getCacheKey']('/quiz', payload);
    const cached = aiService['getFromCache'](cacheKey);
    if (cached) {
      return cached.content || JSON.stringify(cached);
    }

    const result = await aiService['callPrimeAI']('/quiz', payload);

    return result.content || JSON.stringify(result);
  } catch (error) {
    console.error('AI Service failed for assessment generation, using fallback:', error);

    const formatLabel = questionFormat === 'Mixed'
      ? 'a mix of multiple choice, true/false, fill-in-the-blank, matching, and writing questions'
      : `${questionFormat.toLowerCase()} questions`;

    return `# ${type} on ${topic}

**Grade:** ${grade}  
**Subject:** ${subject}  
**Difficulty:** ${difficulty}  
**Question format:** ${questionFormat}  
**Number of questions:** ${numQuestions}

---

Generate ${numQuestions} ${formatLabel} on **${topic}** for ${grade} ${subject}.

---

## Instructions
- Answer all questions
- Show all working where required
- Time allowed: 45 minutes

---

## Questions

1. [Sample ${questionFormat.toLowerCase()} question related to ${topic}]

---

**Total: ${numQuestions} questions**`;
  }
};

export type BaselineSemesterTiming = 'semester_1_start' | 'semester_2_start';

export function derivePreviousGrade(grade: string): string {
  const match = grade.match(/(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n > 1) return `Grade ${n - 1}`;
  }
  return 'Previous Grade';
}

export function baselineScopeLabel(
  grade: string,
  subject: string,
  timing: BaselineSemesterTiming,
  focusTopic?: string,
): string {
  const prev = derivePreviousGrade(grade);
  if (timing === 'semester_1_start') {
    return focusTopic?.trim()
      ? `${prev} prerequisites — ${focusTopic.trim()}`
      : `${prev} ${subject} prerequisites for ${grade}`;
  }
  return focusTopic?.trim()
    ? `Semester 1 review — ${focusTopic.trim()}`
    : `${grade} ${subject} — Semester 1 review`;
}

export function baselineTimingLabel(timing: BaselineSemesterTiming, grade: string): string {
  if (timing === 'semester_1_start') {
    return `Semester 1 Start (${derivePreviousGrade(grade)} prerequisites)`;
  }
  return 'Semester 2 Start (Semester 1 review)';
}

export const generateBaselineAssessmentWithAI = async (
  grade: string,
  subject: string,
  semesterTiming: BaselineSemesterTiming,
  focusTopic: string,
  difficulty: string,
  numQuestions: number = 10,
  questionFormat: string = 'Mixed',
  studentLevel: string = 'differentiated',
  /** 0-100 = % of questions grounded only in the official Minimum Learning
   * Competencies; the rest are grounded in advanced/enrichment content.
   * Omit for today's unfiltered behavior. */
  mlcPercent?: number,
): Promise<string> => {
  try {
    const payload: Record<string, unknown> = {
      grade,
      subject,
      semester_timing: semesterTiming,
      focus_topic: focusTopic.trim(),
      difficulty: difficulty.toLowerCase(),
      num_questions: Math.min(40, Math.max(5, Number(numQuestions) || 10)),
      question_type: normalizeQuestionFormat(questionFormat),
      student_level: studentLevel,
    };
    if (typeof mlcPercent === 'number' && Number.isFinite(mlcPercent)) {
      payload.mlc_percent = Math.min(100, Math.max(0, Math.round(mlcPercent)));
    }

    const cacheKey = aiService['getCacheKey']('/baseline-assessment', payload);
    const cached = aiService['getFromCache'](cacheKey);
    if (cached) {
      return cached.content || JSON.stringify(cached);
    }

    const result = await aiService['callPrimeAI']('/baseline-assessment', payload);
    return result.content || JSON.stringify(result);
  } catch (error) {
    console.error('AI Service failed for baseline assessment, using fallback:', error);

    const scope = baselineScopeLabel(grade, subject, semesterTiming, focusTopic);
    const timing = baselineTimingLabel(semesterTiming, grade);

    return `# Baseline Assessment — ${grade} ${subject}

**Timing:** ${timing}  
**Scope:** ${scope}  
**Difficulty:** ${difficulty}  
**Questions:** ${numQuestions}  
**Format:** ${questionFormat}

---

## Baseline Assessment Overview

This diagnostic assessment checks student readiness before new instruction begins.
Administer at the **${timing.toLowerCase()}**.

**Skill areas probed:**
- Core prerequisite concepts inferred from the ${grade} textbook
- Foundational skills needed for upcoming units

---

## Instructions for Students

- Answer all questions to the best of your ability
- Show all working for calculation questions
- This is a diagnostic — it helps your teacher identify areas for review

---

## Questions

${Array.from({ length: Math.min(numQuestions, 5) }, (_, i) => (
  `**Skill Area:** Prerequisite concept ${i + 1}\n\nQ${i + 1}: [Sample ${questionFormat.toLowerCase()} question for ${scope}]`
)).join('\n\n')}

---

## Answer Key

[Teacher answer key with gap analysis per skill area]

---

## Gap Analysis Guide

- Missed algebra items → review ${derivePreviousGrade(grade)} equation solving
- Missed geometry items → review prior grade angle and shape properties
- Recommend targeted remediation before proceeding with new content`;
  }
};
