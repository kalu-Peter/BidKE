# Windows Task Scheduler Setup Guide for BidKE Auction Finalizer

## 🚀 Automatic Setup (Recommended)

### Option 1: Run PowerShell Script (Easiest)

1. **Right-click** on PowerShell and select **"Run as Administrator"**
2. Navigate to the tools directory:
   ```powershell
   cd "C:\Users\ROOT\Desktop\Warp\BidKE\tools"
   ```
3. Run the setup script:
   ```powershell
   .\setup_task_scheduler.ps1
   ```
4. The script will automatically create and configure the task!

---

## 🔧 Manual Setup (If automatic fails)

### Step-by-Step Instructions:

1. **Open Task Scheduler**

   - Press `Win + R`, type `taskschd.msc`, press Enter
   - OR Search "Task Scheduler" in Start Menu

2. **Create Basic Task**

   - Click **"Create Basic Task..."** in the Actions panel
   - Name: `BidKE-Auction-Finalizer`
   - Description: `Automatically finalizes expired BidKE auctions`

3. **Set Trigger**

   - Choose: **"Daily"**
   - Start date: Today
   - Start time: Current time
   - Click **"Next"**

4. **Set Repetition**

   - Check **"Repeat task every"**
   - Choose: **2 minutes** (or 1-5 minutes as preferred)
   - For duration: **Indefinitely**
   - Click **"Next"**

5. **Set Action**

   - Choose: **"Start a program"**
   - Program/script: `C:\Users\ROOT\Desktop\Warp\BidKE\tools\auction_finalize_cron.bat`
   - Click **"Next"** then **"Finish"**

6. **Advanced Settings** (Optional but recommended)
   - Right-click the created task → **"Properties"**
   - **Security options**: Check "Run whether user is logged on or not"
   - **Settings tab**:
     - ✅ Allow task to be run on demand
     - ✅ Run task as soon as possible after scheduled start is missed
     - ✅ If the task fails, restart every: 1 minute (Attempt to restart up to: 3 times)

---

## ✅ Verification Steps

### 1. Test the Task

- In Task Scheduler, right-click your task → **"Run"**
- Check if it completes successfully

### 2. Check Logs

- Open: `C:\Users\ROOT\Desktop\Warp\BidKE\api\logs\finalize_cron.log`
- Should show execution timestamps and results

### 3. Monitor Dashboard

- Visit: `http://localhost:8000/tools/auction_monitor.php`
- Should show "✅ No expired auctions found"

### 4. Verify Task Properties

- Task should show status: **"Ready"** or **"Running"**
- Next run time should be within 2 minutes

---

## 🔍 Troubleshooting

### Common Issues:

**❌ "Access Denied"**

- Ensure you're running as Administrator
- Check that the batch file path is correct

**❌ "File not found"**

- Verify PHP is installed and in system PATH
- Check that the BidKE project is in the correct location

**❌ "Task runs but no logs"**

- Ensure the `api/logs` directory exists and is writable
- Check the batch file syntax

**❌ "PHP command not recognized"**

- Add PHP to system PATH, or use full path in batch file:
  ```batch
  "C:\xampp\php\php.exe" finalize.php
  ```

### Manual Test Commands:

```batch
# Test the batch file directly
cd "C:\Users\ROOT\Desktop\Warp\BidKE\tools"
auction_finalize_cron.bat

# Test PHP finalize script directly
cd "C:\Users\ROOT\Desktop\Warp\BidKE\api\auctions"
php finalize.php
```

---

## 📊 Monitoring & Maintenance

### Regular Checks:

- **Daily**: Check auction monitor dashboard
- **Weekly**: Review finalize_cron.log for any errors
- **Monthly**: Verify task is still active and running

### Log Files:

- **Execution logs**: `api/logs/finalize_cron.log`
- **Detailed logs**: `api/logs/auto_finalize.log`
- **Setup logs**: `api/logs/task_scheduler_setup.log`

### Performance Notes:

- **Every 1 minute**: Maximum responsiveness, higher server load
- **Every 2 minutes**: Good balance (recommended)
- **Every 5 minutes**: Lower load, acceptable for most use cases

Choose the frequency based on your auction timing requirements and server resources.

---

## 🎯 Success Indicators

✅ Task appears in Task Scheduler with "Ready" status  
✅ Logs show regular execution timestamps  
✅ No expired active auctions in monitor dashboard  
✅ Recent finalizations appear in dashboard  
✅ No error messages in log files

Once set up, your auction system will automatically close expired auctions and record winners seamlessly!
