# User Guide — Social Media Scheduler

## Getting Started

### 1. Sign In
1. Go to the app URL
2. Click **Sign In** (top-right)
3. Sign in with your email (Supabase Auth)

### 2. Connect a Social Account
1. Go to **Accounts** page
2. Click **Connect Facebook** or **Connect Instagram**
3. You'll be redirected to Meta to authorize the app
4. After authorizing, you'll be redirected back — your account appears in the list

> **Note:** The Meta App must be set up by the admin first. See `META_APP_SETUP.md`.

### 3. Create a Post
1. Go to **Composer**
2. Select which connected account to post from
3. Write your caption (max 2200 characters)
4. Optionally attach media (images/videos, max 10 files)
5. Choose **Publish Now** or **Schedule for Later**
6. Click **Post** or **Schedule**

### 4. Schedule Posts
1. In the Composer, select **Schedule for Later**
2. Pick a date and time (must be in the future)
3. Click **Schedule**
4. The post appears in your scheduled queue

### 5. View Published Posts
- Go to **Dashboard** to see your recent activity and stats
- Published posts show status and engagement metrics when available

### 6. Cancel a Scheduled Post
1. Go to **Dashboard**
2. Find the scheduled post in the activity feed
3. Click **Cancel** (only available for scheduled posts)

## Tips
- **Image formats:** JPG, PNG, GIF, WebP — max 10MB per file
- **Video formats:** MP4, MOV — max 100MB per file
- **Caption limit:** 2200 characters (Facebook/Instagram)
- **Scheduling:** Times are in your local timezone
- **Reconnecting:** If an account expires, click **Reconnect** on the Accounts page

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No accounts connected" | Go to Accounts and connect Facebook/Instagram |
| Post fails to publish | Check the post has at least one valid target account |
| Media upload fails | Check file size/type limits above |
| Login loop | Clear cookies and sign in again |
| "App not configured" | Ask the admin to set up the Meta App |

## Account Limits
- Connect up to 5 Facebook pages
- Connect up to 5 Instagram business accounts
- Schedule up to 50 posts per account
