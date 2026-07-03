# Quick Module Reference Card

## 📋 At a Glance

| Category | File | Count | Has Videos? | Purpose |
|----------|------|-------|-------------|---------|
| **Subject Matter** | `trainingModules.ts` | 2 | No | Math-specific pedagogy |
| **Continuous Development** | `continuousDevelopmentModules.ts` | 6 | Yes (8 videos) | General teaching skills |

## 🔍 Quick Lookup

### Where is module X defined?

| Module Name | File | ID |
|-------------|------|-----|
| Problem-solving based math instruction | trainingModules.ts | `module-1` |
| Relations & functions | trainingModules.ts | `module-2` |
| Classroom Delivery Skills | continuousDevelopmentModules.ts | `cpd-module-1` |
| Active Learning | continuousDevelopmentModules.ts | `cpd-module-2` |
| Assessment | continuousDevelopmentModules.ts | `cpd-module-3` |
| Classroom Management | continuousDevelopmentModules.ts | `cpd-module-4` |
| Student Motivation | continuousDevelopmentModules.ts | `cpd-module-5` |
| Parent Communication | continuousDevelopmentModules.ts | `cpd-module-6` |

## 🎯 Common Tasks

### Add a new math module
1. Edit: `src/lib/trainingModules.ts`
2. Add module with ID: `module-3`
3. Category: `MATH · SECONDARY` or similar

### Add a new teaching skills module
1. Edit: `src/lib/continuousDevelopmentModules.ts`
2. Add module with ID: `cpd-module-7`
3. Category: `TEACHING SKILLS`

### Add videos to a module
1. Place video in: `public/videos/training/module-X/`
2. Update module's `videos` array
3. Update module's `videoCount`
4. Clear cache: `rmdir /s /q .next`

### Check which modules are where
```bash
# Subject matter (should show 2)
type src\lib\trainingModules.ts | findstr /C:"id: 'module-"

# Continuous development (should show 6)
type src\lib\continuousDevelopmentModules.ts | findstr /C:"id: 'cpd-module-"
```

### Verify video configuration
```bash
powershell -ExecutionPolicy Bypass -File check-video-status.ps1
```

## 🚀 Testing Checklist

After making changes:

- [ ] No TypeScript errors: Run `npm run build` or check editor
- [ ] Dev server runs: `npm run dev`
- [ ] Subject Matter tab shows correct modules
- [ ] Continuous Development tab shows correct modules
- [ ] Videos play correctly (if modified)
- [ ] Module count is correct in both tabs
- [ ] No console errors in browser (F12)

## 📞 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Module not showing | Check file path and export name |
| Old modules still showing | Clear cache: `rmdir /s /q .next` then restart |
| Videos not playing | Check file location in `public/videos/training/` |
| Wrong tab showing wrong modules | Check `activeTabType` prop in page.tsx |
| TypeScript errors | Check imports match file exports |

## 📚 Documentation Files

- `MODULE_REORGANIZATION_SUMMARY.md` - Complete overview
- `MODULE_STRUCTURE_DIAGRAM.md` - Visual diagrams
- `VIDEO_STATUS_SUMMARY.md` - Video configuration status
- `TROUBLESHOOTING_VIDEO_UPDATES.md` - Video troubleshooting
- `ADD_MORE_VIDEOS_GUIDE.md` - How to add videos
- `QUICK_MODULE_REFERENCE.md` - This file!
