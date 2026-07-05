# 🎥 Quick Video Setup

## ✅ What's Already Done

- ✅ Video URLs updated in `src/lib/trainingModules.ts`
- ✅ Code configured to use `/videos/video1.mp4` and `/videos/video2.mp4`

---

## 📋 What You Need to Do

### **Step 1: Create Videos Folder**

```bash
cd MVP
mkdir -p public/videos
```

### **Step 2: Copy Your Videos**

Place your 2 videos in `MVP/public/videos/`:

```
MVP/public/videos/video1.mp4  (your 31 MB video)
MVP/public/videos/video2.mp4  (your 64 MB video)
```

**From Windows:**
- Open File Explorer
- Navigate to `C:\Users\HP845\Desktop\PRIME\MVP\public\videos\`
- Copy your 2 videos there
- Rename them to `video1.mp4` and `video2.mp4`

---

### **Step 3: Commit and Push**

```bash
cd MVP
git add .
git commit -m "Add training videos and update URLs"
git push origin main
```

---

## ⚠️ Important Notes

### **File Size Check:**

Before pushing, verify sizes:
```bash
cd MVP/public/videos
ls -lh
```

Should show:
```
video1.mp4  (31 MB)
video2.mp4  (64 MB)
Total: 95 MB
```

### **GitHub Limits:**

- ✅ Individual file limit: 100 MB (both videos OK)
- ⚠️ Total: 95 MB (close to recommended limit)
- ⚠️ This will work but is not ideal long-term

---

## 🧪 Testing

### **Test Locally:**

1. Start dev server:
```bash
cd MVP
npm run dev
```

2. Open: `http://localhost:3000/videos/video1.mp4`

3. Should download/play video

4. Check in app:
   - Go to Teacher Dashboard
   - Click "Teacher Training"
   - Select a module
   - Click video - should play

---

### **Test After Deployment:**

1. After pushing, wait for Vercel deployment (2-3 min)

2. Go to your live site

3. Navigate to Teacher Training → Videos

4. Videos should play

---

## 🎯 Expected Results

### **What Will Work:**

✅ Videos will be served from your domain:
```
https://your-app.vercel.app/videos/video1.mp4
https://your-app.vercel.app/videos/video2.mp4
```

✅ Video player component will load them

✅ No external CDN needed (for now)

---

### **What to Watch:**

⚠️ **Deployment Time:**
- With videos: ~3-5 minutes
- Without videos: ~1-2 minutes

⚠️ **Git Repository Size:**
- Current: ~20 MB
- After videos: ~115 MB

⚠️ **Clone Time:**
- New clones will download 95 MB of videos

---

## 🔄 Future Migration (Recommended)

When you have time, migrate to Cloudinary:

### **Why Migrate:**

❌ **Current (Git):**
- Slow clones/pulls
- Bloated history
- No CDN optimization
- No video compression

✅ **Future (Cloudinary):**
- Fast delivery (CDN)
- Video optimization
- Multiple quality options
- Clean Git repo
- Thumbnails auto-generated

### **Migration Steps (Later):**

1. Create Cloudinary account (free)
2. Upload your 2 videos
3. Get CDN URLs
4. Update URLs in `trainingModules.ts`
5. Remove videos from `public/videos/`
6. Commit and push

**Time:** 15 minutes  
**Cost:** Free (25 GB storage)

---

## 📊 Current Configuration

### **Videos in Use:**

| Module | Video Slot | File | Size |
|--------|-----------|------|------|
| Module 1 - Video 1 | Introduction | video1.mp4 | 31 MB |
| Module 1 - Video 2 | Designing Tasks | video2.mp4 | 64 MB |
| Module 1 - Video 3 | Lesson Demo | video1.mp4 | (reused) |
| Module 2 - Video 1 | Relations | video1.mp4 | (reused) |
| Module 2 - Video 2 | Function Notation | video2.mp4 | (reused) |
| Module 2 - Video 3 | Composition | video1.mp4 | (reused) |
| Module 2 - Video 4 | GeoGebra | video2.mp4 | (reused) |

**Note:** Videos are reused across modules (saves storage)

---

## ✅ Checklist

Before pushing:

- [ ] Created `MVP/public/videos/` folder
- [ ] Copied `video1.mp4` (31 MB) to folder
- [ ] Copied `video2.mp4` (64 MB) to folder
- [ ] Verified files are named correctly
- [ ] Tested locally (videos play)
- [ ] Ready to commit and push

After pushing:

- [ ] Vercel deployment successful
- [ ] Videos accessible on live site
- [ ] Video player works in Teacher Training
- [ ] No 404 errors for videos

---

## 🆘 Troubleshooting

### **Videos not playing locally:**

```bash
# Check files exist
ls MVP/public/videos/

# Should show:
# video1.mp4
# video2.mp4
```

### **404 errors:**

- Verify file names match exactly: `video1.mp4` (not `Video1.mp4`)
- Check they're in `public/videos/` not `public/video/`
- Restart dev server: `npm run dev`

### **Push rejected (file too large):**

If GitHub rejects push:
- Use GitHub Releases instead (see `VIDEO_SETUP_GUIDE.md`)
- Or use Cloudinary immediately

---

## 📞 Summary

**What to do RIGHT NOW:**

1. Copy your 2 videos to `MVP/public/videos/`
2. Rename to `video1.mp4` and `video2.mp4`
3. Test locally
4. Commit and push
5. Done! ✅

**What to do LATER:**

- Migrate to Cloudinary for better performance
- Set up proper video CDN
- Add video thumbnails
- Optimize video sizes

---

**Estimated Time:** 5 minutes  
**Cost:** $0  
**Works:** ✅ Yes (temporary solution)

Let me know when videos are copied and I'll help you test!
