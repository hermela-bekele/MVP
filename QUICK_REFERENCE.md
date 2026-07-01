# 🚀 Quick Reference: Teacher Training Module

## For Future Development and Maintenance

---

## 📁 File Locations

### Core Files
```
src/
├── components/dashboard/teacher/
│   └── TeacherTrainingTab.tsx          # Main component
├── lib/
│   ├── trainingModules.ts              # Data structure & helpers
│   └── pdfUtils.ts                     # PDF generation
└── app/dashboard/teacher/
    └── page.tsx                        # Integration point
```

### Documentation
```
MVP/
├── TEACHER_TRAINING_COMPLETE.md        # Full implementation docs
├── IMPLEMENTATION_SUMMARY.md           # Summary & testing
├── BEFORE_AFTER_COMPARISON.md          # Visual comparison
├── QUICK_REFERENCE.md                  # This file
└── TRAINING_MODULE_UPDATE_NEEDED.md    # Original requirements
```

---

## 🔧 Key Functions

### Calculate Progress
```typescript
import { calculateModuleProgress } from '@/lib/trainingModules';

const progress = calculateModuleProgress(module);
// Returns: 67 (for 2 of 3 sessions complete)
```

### Check Assessment Lock
```typescript
import { isAssessmentUnlocked } from '@/lib/trainingModules';

const unlocked = isAssessmentUnlocked(module);
// Returns: false if any session incomplete
```

### Mark Session Complete
```typescript
const handleMarkComplete = (sessionId: string) => {
  const updatedSessions = selectedModule.sessions.map(s => 
    s.id === sessionId ? { ...s, completed: !s.completed } : s
  );
  setSelectedModule({ ...selectedModule, sessions: updatedSessions });
};
```

### Download PDF
```typescript
import { generatePDFFromMarkdown } from '@/lib/pdfUtils';

await generatePDFFromMarkdown(
  content,          // Markdown string
  'filename.pdf',   // Output filename
  'Document Title'  // Optional title
);
```

---

## 📊 Data Structure

### TrainingModule
```typescript
{
  id: 'module-1',
  title: 'Unit 1 — Problem-solving based mathematics',
  category: 'MATH · SECONDARY',
  description: 'MOE Mathematics Module · 5 hrs',
  duration: '5 Hours',
  sessionsCount: 3,
  target: 'Secondary School Mathematics Teachers',
  
  overview: '...',
  objectives: ['...', '...'],
  sessions: [
    {
      id: 'session-1-1',
      number: '1.1',
      title: 'Why and How',
      duration: '1.5 hours',
      completed: true,
      content: '# Session 1.1...'
    }
  ],
  
  assessmentContent: '# MODULE ASSESSMENT...',
  assessmentQuestions: [...],
  passingScore: 70,
  completed: false,
  videoCount: 3,
  videos: [...]
}
```

---

## 🎯 Common Tasks

### Add a New Module
1. Edit `src/lib/trainingModules.ts`
2. Add new object to `TRAINING_MODULES` array
3. Follow the structure above
4. Define sessions with content
5. Create assessment content

### Add a New Session to Existing Module
1. Find module in `trainingModules.ts`
2. Add to `sessions` array:
```typescript
{
  id: 'session-1-4',
  number: '1.4',
  title: 'New Session',
  duration: '2 hours',
  completed: false,
  content: `# Session 1.4 — New Session\n\n...`
}
```

### Change Session Completion State
```typescript
// In TeacherTrainingTab.tsx
handleMarkComplete(sessionId);
// This toggles the completion status
```

### Update Assessment Unlock Logic
```typescript
// In trainingModules.ts
export function isAssessmentUnlocked(module: TrainingModule): boolean {
  // Current: all sessions must be complete
  return module.sessions.every(s => s.completed);
  
  // Alternative: unlock after 80% complete
  // const completed = module.sessions.filter(s => s.completed).length;
  // return (completed / module.sessions.length) >= 0.8;
}
```

---

## 🎨 Styling Guide

### Color Scheme
```typescript
// Primary actions
className="bg-primary text-white"

// Success/Completed
className="bg-green-500 text-white"
className="text-green-700"

// Locked/Disabled
className="opacity-50 cursor-not-allowed"

// Active/Selected
className="bg-primary/10 text-primary"

// Dark mode support (always include)
className="bg-white dark:bg-gray-800"
className="text-ais-on-surface dark:text-gray-100"
```

### Icons
```typescript
import { 
  CheckCircle,    // Completed
  Lock,           // Locked
  Download,       // Download
  BookOpen,       // Content
  PlayCircle,     // Videos
  ChevronLeft,    // Previous
  ChevronRight,   // Next
  ArrowLeft       // Back
} from 'lucide-react';
```

---

## 🐛 Common Issues & Solutions

### Issue: Progress Not Updating
**Solution**: Ensure you're calling `calculateModuleProgress()` after state updates
```typescript
const progress = calculateModuleProgress(selectedModule);
// Don't use: selectedModule.progress (static)
```

### Issue: PDF Not Downloading
**Solution**: Check async/await and error handling
```typescript
try {
  await generatePDFFromMarkdown(content, filename, title);
} catch (error) {
  console.error('PDF generation failed:', error);
}
```

### Issue: Session Not Auto-Selecting
**Solution**: Check useEffect dependency
```typescript
useEffect(() => {
  if (selectedModule && selectedModule.sessions.length > 0) {
    setSelectedSession(selectedModule.sessions[0]);
  }
}, [selectedModule]); // ✅ Dependency required
```

### Issue: Assessment Still Locked
**Solution**: Verify all sessions are marked complete
```typescript
console.log(selectedModule.sessions.map(s => ({
  id: s.id,
  completed: s.completed
})));
// All must be true
```

---

## 🔌 API Integration (Future)

### Save Progress to Backend
```typescript
const saveProgress = async (moduleId: string, sessionId: string, completed: boolean) => {
  await fetch('/api/training/progress', {
    method: 'POST',
    body: JSON.stringify({
      userId: currentUser.id,
      moduleId,
      sessionId,
      completed,
      timestamp: new Date().toISOString()
    })
  });
};
```

### Load Progress from Backend
```typescript
const loadProgress = async (userId: string, moduleId: string) => {
  const response = await fetch(`/api/training/progress/${userId}/${moduleId}`);
  const data = await response.json();
  
  // Update local state with saved progress
  const updatedSessions = module.sessions.map(s => ({
    ...s,
    completed: data.completedSessions.includes(s.id)
  }));
  
  setSelectedModule({ ...module, sessions: updatedSessions });
};
```

---

## 📈 Analytics to Track (Future)

```typescript
// Time spent per session
trackTime('session-1-1', startTime, endTime);

// Completion rate
trackCompletion(moduleId, sessionId, completed);

// PDF downloads
trackDownload(moduleId, sessionId, 'pdf');

// Assessment scores
trackAssessment(moduleId, score, passed);

// Drop-off points
trackDropoff(moduleId, lastSession);
```

---

## 🧪 Testing Scenarios

### Happy Path
1. Open Teacher Training tab
2. Click Module 1
3. Session 1.1 auto-selected
4. Read content
5. Mark complete
6. Navigate to 1.2
7. Mark complete
8. Navigate to 1.3
9. Mark complete
10. Assessment unlocks
11. View assessment
12. Download PDFs

### Edge Cases
- Empty module (no sessions)
- All sessions already complete
- Incomplete session marked complete
- Session in middle uncompleted
- PDF generation fails
- Slow network

### Error Cases
- Module data missing
- Session content empty
- Invalid markdown syntax
- PDF library fails to load

---

## 🔐 Security Considerations

### Current (Client-Side Only)
- ⚠️ Progress stored in component state
- ⚠️ Resets on page refresh
- ⚠️ No authentication check

### Future (With Backend)
- ✅ Store progress in database
- ✅ Verify user authentication
- ✅ Validate session completion
- ✅ Prevent tampering with completion status
- ✅ Rate limit API calls

---

## 🚀 Performance Optimization

### Current Optimizations
```typescript
// Only calculate progress when needed
const progress = useMemo(
  () => calculateModuleProgress(selectedModule),
  [selectedModule]
);

// Lazy load PDF library
const generatePDF = async () => {
  const { generatePDFFromMarkdown } = await import('@/lib/pdfUtils');
  await generatePDFFromMarkdown(content, filename, title);
};
```

### Future Optimizations
- Code split training modules
- Virtual scrolling for long content
- Cache rendered markdown
- Preload next session
- Service worker for offline access

---

## 📚 Learning Resources

### Libraries Used
- **jsPDF**: PDF generation - https://github.com/parallax/jsPDF
- **html2canvas**: HTML to canvas - https://html2canvas.hertzen.com/
- **react-markdown**: Markdown rendering - https://github.com/remarkjs/react-markdown
- **lucide-react**: Icons - https://lucide.dev/

### Related Concepts
- React state management
- TypeScript interfaces
- PDF generation techniques
- Markdown parsing
- Dark mode implementation

---

## 🎯 Quick Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint code
npm run lint

# Check specific file
npx tsc --noEmit src/components/dashboard/teacher/TeacherTrainingTab.tsx
```

---

## 📞 Support

### Where to Look
1. **TEACHER_TRAINING_COMPLETE.md** - Full documentation
2. **IMPLEMENTATION_SUMMARY.md** - Testing checklist
3. **BEFORE_AFTER_COMPARISON.md** - Visual changes
4. **This file** - Quick reference

### Common Questions
- **Q**: How do I add a new module?
- **A**: Edit `trainingModules.ts`, add to `TRAINING_MODULES` array

- **Q**: How do I change unlock logic?
- **A**: Edit `isAssessmentUnlocked()` in `trainingModules.ts`

- **Q**: How do I customize PDF styling?
- **A**: Edit `pdfUtils.ts`, modify CSS in container styles

- **Q**: How do I persist progress?
- **A**: Implement API endpoints, see "API Integration" section

---

**Last Updated**: July 1, 2026
**Maintainer**: Development Team
**Status**: Production Ready ✅
