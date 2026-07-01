# 🔄 Teacher Training Module - Updates Needed

## ✅ What's Already Done

1. **Data Structure Updated** (`src/lib/trainingModules.ts`)
   - ✅ Split content into individual sessions
   - ✅ Each session has its own content
   - ✅ Session completion tracking
   - ✅ Progress calculation based on completed sessions
   - ✅ Assessment unlocks when ALL sessions completed

2. **Module 1 Content Split**
   - ✅ Session 1.1: Why and How (completed: true)
   - ✅ Session 1.2: Task Design (completed: true)
   - ✅ Session 1.3: Lesson Structure (completed: false)
   - ✅ Assessment locked until session 1.3 complete

---

## 🔨 What Needs To Be Updated

### Update `TeacherTrainingTab.tsx`

The component needs these changes:

#### 1. Add Session State
```typescript
const [selectedSession, setSelectedSession] = useState<SessionContent | null>(null);
```

#### 2. Update Sidebar to Show Sessions Instead of Generic "Content"

**Replace the current sidebar with:**

```typescript
<div className="space-y-2">
  {selectedModule.sessions.map((session) => (
    <button
      key={session.id}
      onClick={() => {
        setSelectedSession(session);
        setContentTab('content');
      }}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
        selectedSession?.id === session.id
          ? 'bg-primary/10 text-primary'
          : 'text-ais-on-surface hover:bg-ais-surface-container-low'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold">{session.number}</span>
        <span className="font-medium text-sm">{session.title}</span>
      </div>
      {session.completed && (
        <CheckCircle className="w-4 h-4 text-green-500" />
      )}
    </button>
  ))}
  
  {/* Separator */}
  <div className="border-t border-ais-card-border my-2" />
  
  {/* Assessment Button */}
  <button
    onClick={() => setContentTab('assessment')}
    disabled={!isAssessmentUnlocked(selectedModule)}
    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left ${
      contentTab === 'assessment'
        ? 'bg-primary/10 text-primary'
        : isAssessmentUnlocked(selectedModule)
        ? 'text-ais-on-surface hover:bg-ais-surface-container-low'
        : 'text-ais-on-surface-variant cursor-not-allowed'
    }`}
  >
    <div className="flex items-center gap-3">
      {isAssessmentUnlocked(selectedModule) ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <Lock className="w-5 h-5" />
      )}
      <span className="font-medium">Assessment</span>
    </div>
  </button>
</div>
```

#### 3. Initialize Selected Session
```typescript
// When module is selected, set first session as active
useEffect(() => {
  if (selectedModule && selectedModule.sessions.length > 0) {
    setSelectedSession(selectedModule.sessions[0]);
  }
}, [selectedModule]);
```

#### 4. Update Content Display
```typescript
{contentTab === 'content' && selectedSession ? (
  <>
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-bold text-primary">
            Session {selectedSession.number}
          </span>
          {selectedSession.completed && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Completed
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-ais-on-surface">
          {selectedSession.title}
        </h2>
        <p className="text-sm text-ais-on-surface-variant mt-1">
          Duration: {selectedSession.duration}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            // Mark session as complete
            // This would update the module data
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Mark Complete
        </button>
        <button
          onClick={() => {
            const blob = new Blob([selectedSession.content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Session-${selectedSession.number}.md`;
            a.click();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
    </div>
    <MarkdownRenderer content={selectedSession.content} />
  </>
) : null}
```

#### 5. Update Module List Progress Calculation
```typescript
// In the module card
const progress = calculateModuleProgress(module);

// Display sessions with completion status
<div className="flex flex-wrap gap-2 mb-4">
  {module.sessions.map((session) => (
    <span
      key={session.id}
      className={`px-2 py-1 text-xs rounded-lg ${
        session.completed
          ? 'bg-green-100 text-green-700'
          : 'bg-ais-surface-container-low text-ais-on-surface'
      }`}
    >
      {session.number} {session.title}
      {session.completed && ' ✓'}
    </span>
  ))}
</div>
```

---

## 📊 Expected Behavior

### Module List View
- Progress bar shows: 67% (2 of 3 sessions complete)
- Session tags show checkmarks for completed sessions

### Module Content View - Sidebar
```
Navigation
├─ Session 1.1 Why and How ✓
├─ Session 1.2 Task Design ✓  
├─ Session 1.3 Lesson Structure
├─ ─────────────────
└─ 🔒 Assessment (Complete all sessions to unlock)
```

### Session Content
- Shows session number and title
- Duration display
- "Mark Complete" button
- Download PDF for current session
- Beautiful markdown rendering

### Progress Tracking
- Module 1: 2/3 sessions → 67% progress
- Assessment locks until 3/3 sessions
- When session 1.3 marked complete → Assessment unlocks

---

## 🎨 Visual Improvements Needed

### 1. Session Sidebar
- Active session highlighted with primary color
- Completed sessions show green checkmark
- Incomplete sessions show no icon
- Assessment always at bottom with lock/unlock icon

### 2. Progress Indicator
Add visual progress in module header:
```
Module 1: Problem-Solving Based Mathematics
Progress: ●●○ (2 of 3 sessions)  67%
```

### 3. Session Navigation
Add next/previous buttons:
```
[← Previous Session]  Session 1.2  [Next Session →]
```

---

## 💾 State Management (Future)

Currently progress is hardcoded. For production:

```typescript
interface UserModuleProgress {
  userId: string;
  moduleId: string;
  completedSessions: string[]; // Array of session IDs
  assessmentScore?: number;
  completedAt?: Date;
}

// Update session completion
function markSessionComplete(moduleId: string, sessionId: string) {
  // Save to database/context
  // Recalculate module progress
  // Check if assessment should unlock
}
```

---

## 🚀 Quick Implementation Steps

1. **Update TeacherTrainingTab.tsx:**
   - Add `selectedSession` state
   - Replace sidebar with session list
   - Update content display to show selected session
   - Add "Mark Complete" button

2. **Test Flow:**
   - Click Module 1
   - See Session 1.1 selected by default
   - Navigate between sessions in sidebar
   - Try to click Assessment (should be locked)
   - Mark Session 1.3 complete
   - Assessment should unlock

3. **Polish:**
   - Add session navigation buttons
   - Improve visual feedback
   - Add confirmation for "Mark Complete"
   - Add progress animation

---

## 📝 Summary

**Current State:**
- ✅ Data structure supports per-session content
- ✅ Progress calculation works
- ✅ Assessment locking logic works
- ❌ UI still shows all content at once
- ❌ No per-session navigation

**Needed:**
- Update TeacherTrainingTab to show sessions in sidebar
- Display one session at a time
- Add "Mark Complete" button
- Show progress per session
- Visual feedback for completed sessions

The data layer is ready - just need to update the UI component!

