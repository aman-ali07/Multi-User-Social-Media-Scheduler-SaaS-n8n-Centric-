# How to Get Your Meta API Credentials (Line-by-Line Guide)

To allow your application to publish posts to Facebook and Instagram, you need to create an "App" in the Meta Developer Portal. Follow these exact steps, line by line.

## Part 1: Creating the Meta App
1. Go to the [Meta Developer Portal](https://developers.facebook.com/) and log in with your personal Facebook account.
2. Click on **"My Apps"** in the top right corner.
3. Click the green **"Create App"** button.
4. On the "What do you want your app to do?" screen, select **"Other"** and click **Next**.
5. On the "Select an app type" screen, select **"Business"** and click **Next**.
6. Give your app a name (e.g., "My Social Scheduler").
7. Enter your contact email address.
8. (Optional) Select your Business Portfolio if you have one.
9. Click **"Create app"** and enter your Facebook password if prompted.

## Part 2: Gathering Your App ID and Secret
1. You should now be on your App Dashboard. In the left sidebar, click on **App Settings** -> **Basic**.
2. At the top of the page, you will see your **App ID**. Copy this and paste it into your `.env` file as `FACEBOOK_APP_ID`.
3. Right below it, you will see your **App Secret**. Click the "Show" button, copy the hidden string, and paste it into your `.env` file as `FACEBOOK_APP_SECRET`.

## Part 3: Adding Facebook Login for Business
1. In the left sidebar, click on **Add Product** (or go to the Dashboard home).
2. Find the card that says **"Facebook Login for Business"** and click **Set up**.
3. In the left sidebar under "Facebook Login for Business", click **Settings**.
4. Look for the field labeled **"Valid OAuth Redirect URIs"**.
5. Type in your frontend's callback URL exactly as follows:
   `https://your-frontend-domain.com/api/auth/meta/callback`
   *(Note: If you are testing locally, you must put `http://localhost:3000/api/auth/meta/callback` here).*
6. Scroll to the bottom and click **Save Changes**.

## Part 4: Requesting the Right Permissions (Scopes)
1. In the left sidebar, click on **App Review** -> **Permissions and Features**.
2. To publish to Facebook Pages, search for these two permissions and click "Request advanced access":
   - `pages_show_list`
   - `pages_manage_posts`
3. To publish to Instagram, search for these two permissions and click "Request advanced access":
   - `instagram_basic`
   - `instagram_content_publish`
4. *Note: Advanced Access requires your app to go through Meta's Business Verification process if you want anyone other than yourself to use it. While in "Development Mode" (the toggle at the top of the screen), these permissions will only work for your own Facebook account.*

## Part 5: Connecting Instagram to Facebook
1. Open the Facebook website and go to your Facebook Page settings.
2. Go to **Settings** -> **Linked Accounts** -> **Instagram**.
3. Connect your Instagram account.
4. **CRITICAL:** Your Instagram account MUST be converted to a "Professional" or "Business" account in the Instagram mobile app for the API to work. Personal Instagram accounts cannot be published to via the API!

You're done! Your Meta API credentials are now fully configured and ready to be used in the scheduler.
