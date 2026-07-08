# 🎬 Quick Video URL Update Reference

## Your Videos to Upload

Based on your file structure, here are the videos you need to upload:

### ✅ Videos Found in Your Folders:

1. **Module 1 (Continuous Development):**
   - `classroom_communication_enhancing_student_learning.mp4`
   - Location: `c:\Users\HP845\Desktop\PRIME\`

2. **Module 2 (Student Engagement):**
   - `how_student_engagement_improves_learning_outcomes.mp4`
   - `W8Y5AWRBAQO9WGL6.mp4`
   - Location: `c:\Users\HP845\Desktop\PRIME\module-2\`

3. **Module 3 (Assessment/Feedback):**
   - `how_feedback_improves_student_performance.mp4`
   - Location: `c:\Users\HP845\Desktop\PRIME\module-3\`

4. **Module 4 (Classroom Management):**
   - `classroom_management_creating_a_positive_learning_.mp4`
   - Location: `c:\Users\HP845\Desktop\PRIME\module-4\`

5. **Module 5 (Student Motivation):**
   - `inspiring_student_motivation_in_the_classroom.mp4`
   - Location: `c:\Users\HP845\Desktop\PRIME\module-5\`

6. **Module 6 (Parent Communication):**
   - `accountability_and_parent_communication_in_educati (1).mp4`
   - Location: `c:\Users\HP845\Desktop\PRIME\module-6\`

---

## 📝 URL Template

After uploading to Cloudinary, your URLs will follow this pattern:

```
https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/training/FOLDER/FILENAME.mp4
```

### Example:
If your Cloud Name is `my-school-videos`, the URL for Module 1 would be:
```
https://res.cloudinary.com/my-school-videos/video/upload/v1/training/continuous-development/classroom_communication_enhancing_student_learning.mp4
```

---

## 🎯 Code Changes Needed

### Only 1 File to Update:
`src/lib/continuousDevelopmentModules.ts`

### Search and Replace:

**Module 1 - Line ~200:**
```typescript
// FIND:
url: '/videos/training/module-1/classroom_communication_enhancing_student_learning.mp4',

// REPLACE WITH:
url: 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/training/continuous-development/classroom_communication_enhancing_student_learning.mp4',
```

**Module 2 Video 1 - Line ~350:**
```typescript
// FIND:
url: '/videos/training/module-2/how_student_engagement_improves_learning_outcomes.mp4',

// REPLACE WITH:
url: 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/training/module-2/how_student_engagement_improves_learning_outcomes.mp4',
```

**Module 2 Video 2 - Line ~360:**
```typescript
// FIND:
url: '/videos/training/module-2/W8Y5AWRBAQO9WGL6.mp4',

// REPLACE WITH:
url: 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/training/module-2/W8Y5AWRBAQO9WGL6.mp4',
```

**Module 3 - Line ~450:**
```typescript
// FIND:
url: '/videos/training/module-3/how_feedback_improves_student_performance.mp4',

// REPLACE WITH:
url: 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/training/module-3/how_feedback_improves_student_performance.mp4',
```

**Module 4 - Line ~550:**
```typescript
// FIND:
url: '/videos/training/module-4/classroom_management_creating_a_positive_learning_.mp4',

// REPLACE WITH:
url: 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/training/module-4/classroom_management_creating_a_positive_learning_.mp4',
```

---

## 🚀 Quick Start Checklist

### Part 1: Cloudinary Setup (10 min)
- [ ] Go to cloudinary.com/users/register_free
- [ ] Sign up (free account)
- [ ] Copy your Cloud Name: `__________________`

### Part 2: Upload Videos (20 min)
- [ ] Upload Module 1 video → folder: `training/continuous-development`
- [ ] Upload Module 2 video 1 → folder: `training/module-2`
- [ ] Upload Module 2 video 2 → folder: `training/module-2`
- [ ] Upload Module 3 video → folder: `training/module-3`
- [ ] Upload Module 4 video → folder: `training/module-4`
- [ ] Upload Module 5 video → folder: `training/module-5`
- [ ] Upload Module 6 video → folder: `training/module-6`

### Part 3: Update Code (5 min)
- [ ] Open `src/lib/continuousDevelopmentModules.ts`
- [ ] Replace all video URLs (6 replacements)
- [ ] Replace `YOUR_CLOUD_NAME` with your actual cloud name
- [ ] Save file

### Part 4: Test (5 min)
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Login as teacher
- [ ] Go to Teacher Training → Continuous Development
- [ ] Click on Module 1
- [ ] Click "Watch Video"
- [ ] Video should play!

### Part 5: Deploy
- [ ] `git add .`
- [ ] `git commit -m "feat: add Cloudinary video hosting"`
- [ ] `git push`

---

## 💡 Pro Tips

1. **Keep original filenames** when uploading to Cloudinary - makes URL mapping easier
2. **Upload videos one by one** - easier to track and verify
3. **Test each video** after upload by clicking on it in Cloudinary Media Library
4. **Copy URLs immediately** after each upload - save them in a text file
5. **Use Find & Replace** in VS Code for quick URL updates

---

## ❓ Common Questions

**Q: Do I need to delete local videos after uploading?**
A: Not immediately. Test first, then delete to save space.

**Q: What if I add more videos later?**
A: Just upload to Cloudinary and add the URL to the videos array. No other changes needed.

**Q: Can I use different cloud storage?**
A: Yes, but Cloudinary is optimized for video delivery with CDN.

**Q: Will this work with the existing VideoPlayer?**
A: Yes! No changes needed to VideoPlayer component.

---

## 📞 Need Help?

Check if:
1. ✅ Cloud Name is correct (no typos)
2. ✅ Folder structure in Cloudinary matches URLs
3. ✅ Videos are marked as "Public" in Cloudinary
4. ✅ URLs start with `https://res.cloudinary.com/`

Still stuck? Check browser console (F12) for error messages.
