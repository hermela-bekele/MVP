# Module Structure Visual Diagram

## 📊 Complete Module Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEACHER DASHBOARD                            │
│                    /dashboard/teacher                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    TRAINING     │
                    │    (Sidebar)    │
                    └────────┬────────┘
                             │
                ┌────────────┴─────────────┐
                │                          │
                ▼                          ▼
    ┌────────────────────┐    ┌──────────────────────┐
    │  SUBJECT MATTER    │    │    CONTINUOUS        │
    │     TRAINING       │    │    DEVELOPMENT       │
    └────────┬───────────┘    └──────────┬───────────┘
             │                           │
             ▼                           ▼
    ╔═══════════════════╗    ╔══════════════════════╗
    ║ trainingModules.ts║    ║ continuousDevelopment║
    ║                   ║    ║     Modules.ts       ║
    ╚═══════════════════╝    ╚══════════════════════╝
             │                           │
             ▼                           ▼
    
┌──────────────────────┐    ┌────────────────────────┐
│  📚 MATH MODULES     │    │  👨‍🏫 TEACHING SKILLS  │
│  (2 modules)         │    │  (6 modules + videos)  │
├──────────────────────┤    ├────────────────────────┤
│                      │    │                        │
│ 1. Problem-solving   │    │ 1. Delivery Skills     │
│    based math        │    │    📹 2 videos         │
│    instruction       │    │                        │
│    • 5 hours         │    │ 2. Active Learning     │
│    • 3 sessions      │    │    📹 2 videos         │
│    ✅ Full content   │    │                        │
│                      │    │ 3. Assessment          │
│ 2. Relations &       │    │    📹 1 video          │
│    Functions         │    │                        │
│    • 11 hours        │    │ 4. Classroom Mgmt      │
│    • 5 sessions      │    │    📹 1 video          │
│    🚧 In dev         │    │                        │
│                      │    │ 5. Motivation          │
│                      │    │    📹 1 video          │
│                      │    │                        │
│                      │    │ 6. Parent Comm.        │
│                      │    │    📹 1 video          │
│                      │    │                        │
│                      │    │ 📹 Total: 8 videos     │
└──────────────────────┘    └────────────────────────┘
```

## 🔄 How It Works

### User Navigation Flow:

1. **Teacher logs in** → Sees Teacher Dashboard
2. **Clicks "Training"** in sidebar → Sees 2 sub-options:
   - "Subject Matter Training"
   - "Continuous Development"
3. **Clicks "Subject Matter Training"**:
   - Component: `TeacherTrainingTab` with `activeTabType='training-subject-matter'`
   - Shows: 2 math modules from `trainingModules.ts`
4. **Clicks "Continuous Development"**:
   - Component: `TeacherTrainingTab` with `activeTabType='training-continuous'`
   - Shows: 6 teaching skills modules from `continuousDevelopmentModules.ts`

### Code Flow:

```typescript
// page.tsx decides which tab is active
const [activeTab, setActiveTab] = useState("dashboard");

// Passes activeTab to component
<TeacherTrainingTab 
  typeFilter={trainingTypeFilter} 
  activeTabType={activeTab}  // 👈 This determines module source
/>

// TeacherTrainingTab.tsx switches module source
const ALL_MODULES = activeTabType === 'training-subject-matter' 
  ? TRAINING_MODULES              // 👈 From trainingModules.ts (2 modules)
  : CONTINUOUS_DEVELOPMENT_MODULES // 👈 From continuousDevelopmentModules.ts (6 modules)
```

## 📁 File Organization

```
src/lib/
├── trainingModules.ts
│   └── TRAINING_MODULES (Array)
│       ├── module-1 (Problem-solving math)
│       └── module-2 (Relations & functions)
│
└── continuousDevelopmentModules.ts
    └── CONTINUOUS_DEVELOPMENT_MODULES (Array)
        ├── cpd-module-1 (Delivery Skills) + 2 videos
        ├── cpd-module-2 (Active Learning) + 2 videos
        ├── cpd-module-3 (Assessment) + 1 video
        ├── cpd-module-4 (Classroom Mgmt) + 1 video
        ├── cpd-module-5 (Motivation) + 1 video
        └── cpd-module-6 (Parent Comm.) + 1 video

public/videos/training/
├── module-1/
│   ├── classroom_communication_enhancing_student_learning.mp4
│   └── why_simple_explanations_improve_student_understand.mp4
├── module-2/
│   ├── how_student_engagement_improves_learning_outcomes.mp4
│   └── W8Y5AWRBAQO9WGL6.mp4
├── module-3/
│   └── how_feedback_improves_student_performance.mp4
├── module-4/
│   └── classroom_management_creating_a_positive_learning_.mp4
├── module-5/
│   └── inspiring_student_motivation_in_the_classroom.mp4
└── module-6/
    └── accountability_and_parent_communication_in_educati (1).mp4
```

## 🎯 Key Points

### Separation of Concerns:
- **Subject Matter**: Content-specific pedagogy (e.g., how to teach math)
- **Continuous Development**: General teaching skills (works for any subject)

### Module IDs:
- Subject matter: `module-1`, `module-2`, etc.
- Continuous development: `cpd-module-1`, `cpd-module-2`, etc.
- No ID conflicts!

### Videos:
- Only in Continuous Development modules
- 8 videos total across 6 modules
- Stored in `public/videos/training/module-X/`

### Flexibility:
- Easy to add more subject matter modules (add to trainingModules.ts)
- Easy to add more teaching skills modules (add to continuousDevelopmentModules.ts)
- Each module type managed independently
