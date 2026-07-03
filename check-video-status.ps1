# Video Configuration Status Checker
# This script verifies that all videos are properly configured and accessible

Write-Host "=== VIDEO CONFIGURATION STATUS CHECK ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check if video files exist
Write-Host "1. Checking video files on disk..." -ForegroundColor Yellow
$videoPath = "public\videos\training"
$videoFiles = Get-ChildItem -Path $videoPath -Filter "*.mp4" -Recurse

Write-Host "   Found $($videoFiles.Count) video files:" -ForegroundColor Green
foreach ($file in $videoFiles) {
    $moduleName = Split-Path -Leaf (Split-Path -Parent $file.FullName)
    Write-Host "   OK $moduleName/$($file.Name)" -ForegroundColor Green
}
Write-Host ""

# 2. Check module configuration
Write-Host "2. Checking module configuration..." -ForegroundColor Yellow
$configFile = "src\lib\continuousDevelopmentModules.ts"
$content = Get-Content $configFile -Raw

# Count videoCount declarations
$videoCounts = [regex]::Matches($content, "videoCount:\s*(\d+)")
$totalConfiguredVideos = 0
$moduleNum = 1

Write-Host "   Module video counts in code:" -ForegroundColor Green
foreach ($match in $videoCounts) {
    $count = [int]$match.Groups[1].Value
    $totalConfiguredVideos += $count
    Write-Host "   OK Module $moduleNum`: $count videos" -ForegroundColor Green
    $moduleNum++
}
Write-Host "   Total configured: $totalConfiguredVideos videos" -ForegroundColor Cyan
Write-Host ""

# 3. Verify match
Write-Host "3. Verification:" -ForegroundColor Yellow
if ($videoFiles.Count -eq $totalConfiguredVideos) {
    Write-Host "   SUCCESS: Video files match configuration ($($videoFiles.Count) = $totalConfiguredVideos)" -ForegroundColor Green
} else {
    Write-Host "   MISMATCH: Found $($videoFiles.Count) files but configured $totalConfiguredVideos" -ForegroundColor Red
}
Write-Host ""

# 4. Check for .next cache
Write-Host "4. Checking for cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Write-Host "   Warning: .next cache folder exists - consider deleting for fresh build" -ForegroundColor Yellow
    Write-Host "   Run: rmdir /s /q .next" -ForegroundColor Gray
} else {
    Write-Host "   OK: No .next cache found" -ForegroundColor Green
}
Write-Host ""

# 5. Recommendations
Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If videos are not appearing in the UI, try these steps IN ORDER:" -ForegroundColor White
Write-Host "1. Stop dev server (Ctrl+C)" -ForegroundColor Gray
Write-Host "2. Clear cache: rmdir /s /q .next" -ForegroundColor Gray
Write-Host "3. Restart dev: npm run dev" -ForegroundColor Gray
Write-Host "4. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor Gray
Write-Host "5. Hard refresh browser (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host ""
Write-Host "See TROUBLESHOOTING_VIDEO_UPDATES.md for details" -ForegroundColor Cyan
Write-Host ""
