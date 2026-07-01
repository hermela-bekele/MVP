import { LessonPlan, Assessment, Student } from './mockData';

// Simulated latency helper
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AILessonPlanResult {
  title: string;
  objectives: string[];
  activities: { session: number; activity: string; duration: string }[];
  assessments: string[];
  homework: string;
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
  grade: string,
  subject: string,
  difficulty: string,
  type: string
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
      console.error('❌ generateLessonPlan failed, using fallback:', error);
      console.warn('⚠️ Using fallback lesson plan generation');
      
      await delay(1500);
      
      // Extract parameters
      const titleMatch = prompt.match(/title:\s*([^\n]+)/i);
      const gradeMatch = prompt.match(/grade:\s*([^\n]+)/i);
      const subjectMatch = prompt.match(/subject:\s*(\w+)/i);
      const sessionsMatch = prompt.match(/sessions:\s*(\d+)/i);
      const topicMatch = prompt.match(/topic:\s*([^\n]+)/i);
      
      const title = titleMatch ? titleMatch[1].trim() : 'Lesson Plan';
      const grade = gradeMatch ? gradeMatch[1].trim() : 'Grade 9';
      const subject = subjectMatch ? subjectMatch[1] : 'Biology';
      const sessions = sessionsMatch ? parseInt(sessionsMatch[1]) : 4;
      const topic = topicMatch ? topicMatch[1].trim() : subject;
      
      return {
        content: JSON.stringify(await generateLessonPlanAI(grade, subject, topic, sessions))
      };
    }
  }

  async generateTeachingNotes(prompt: string): Promise<{ content: string }> {
    try {
      console.log('📖 generateTeachingNotes called');
      console.log('   Prompt:', prompt.substring(0, 150) + '...');
      
      // Extract parameters from prompt
      const topicMatch = prompt.match(/topic:\s*([^\n]+)/i);
      const subtopicMatch = prompt.match(/subtopic:\s*([^\n]+)/i);
      
      const topic = topicMatch ? topicMatch[1].trim() : 'General Mathematics';
      const subtopic = subtopicMatch ? subtopicMatch[1].trim() : '';
      
      // Use the correct /lesson-notes endpoint
      const result = await this.callPrimeAI('/lesson-notes', {
        topic,
        subtopic,
      });
      
      console.log('✅ Prime AI returned teaching notes');
      return { content: result.content || JSON.stringify(result) };
    } catch (error) {
      console.error('❌ generateTeachingNotes failed, using fallback:', error);
      console.warn('⚠️ Using fallback teaching notes generation');
      
      await delay(1200);
      
      // Extract parameters
      const gradeMatch = prompt.match(/grade:\s*([^\n]+)/i);
      const subjectMatch = prompt.match(/subject:\s*(\w+)/i);
      const topicMatch = prompt.match(/topic:\s*([^\n]+)/i);
      const languageMatch = prompt.match(/language:\s*(\w+)/i);
      
      const grade = gradeMatch ? gradeMatch[1].trim() : 'Grade 9';
      const subject = subjectMatch ? subjectMatch[1] : 'Biology';
      const topic = topicMatch ? topicMatch[1].trim() : subject;
      const language = languageMatch ? languageMatch[1] : 'English';
      
      return {
        content: JSON.stringify(await generateTeachingNotesAI(grade, subject, topic, language))
      };
    }
  }
}

export const aiService = new AIService();

export const generateAssessmentWithAI = async (
  type: string,
  topic: string,
  grade: string,
  subject: string,
  difficulty: string
): Promise<string> => {
  try {
    // Determine the number of questions based on type
    const numQuestions = type.toLowerCase().includes('quiz') ? 5 : 10;
    
    // Use the /quiz endpoint for quiz generation
    const cacheKey = aiService['getCacheKey']('/quiz', { topic, difficulty, num_questions: numQuestions });
    const cached = aiService['getFromCache'](cacheKey);
    if (cached) {
      return cached.content || JSON.stringify(cached);
    }

    const result = await aiService['callPrimeAI']('/quiz', {
      topic,
      difficulty: difficulty.toLowerCase(),
      num_questions: numQuestions,
    });

    return result.content || JSON.stringify(result);
  } catch (error) {
    console.error('AI Service failed for assessment generation, using fallback:', error);
    
    // Fallback template generation
    return `# ${type} on ${topic}

**Grade:** ${grade}  
**Subject:** ${subject}  
**Difficulty:** ${difficulty}

---

## Section A: Multiple Choice (20 marks)

1. Sample question related to ${topic}?
   - A) Option A
   - B) Option B
   - C) Option C
   - D) Option D

---

## Section B: Short Answer (30 marks)

2. Explain the key concepts of ${topic}.  
   (10 marks)

3. Provide examples demonstrating your understanding of ${topic}.  
   (10 marks)

4. Analyze how ${topic} applies to real-world scenarios.  
   (10 marks)

---

**Total: 50 marks**`;
  }
};
