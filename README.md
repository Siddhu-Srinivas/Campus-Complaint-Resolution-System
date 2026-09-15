# Campus Resolve

Campus Resolve is a simple Campus Complaint & Resolution System built with HTML, CSS, JavaScript, Firebase Authentication, and Cloud Firestore.

## Features

- Submit complaints with student, category, location, and description details.
- View complaints with live status updates.
- Search and filter by text, category, and status.
- Admin login with edit, update, and delete tools.
- Real-time Firebase Firestore storage.
- Responsive layout with light and pure-black dark themes.

## Run locally

Because the app uses ES modules, serve this folder from a local HTTP server. For example:

```bash
npx serve .
```

Then open the URL shown in the terminal.

## Firebase setup

The app is configured for Firebase project `codingstudio-649b9` in `app.js`.

1. Open https://console.firebase.google.com/.
2. Create a Firestore database.
3. Enable **Authentication → Sign-in method → Email/Password**.
4. In **Authentication → Users**, create the admin account.
5. The app creates the `complaints` collection after the first submission.

For development, open **Firestore Database → Rules**, replace the rules with the following, and click **Publish**:

```text
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /complaints/{complaintId} {
			allow read, create: if true;
			allow update, delete: if request.auth != null;
		}
	}
}
```

All visitors can read and submit complaints. Only signed-in Firebase users can update or delete complaints. Use stricter admin roles or custom claims before production.

## Admin login

Use the **Admin login** button. The current UI recognizes `siddhu@gmail.com` as the admin account, so create that account in Firebase Authentication first.

## Deploy

```powershell
firebase login
firebase deploy --only hosting
```

Live app: https://codingstudio-649b9.web.app

## Push updates to GitHub

```powershell
git add .
git commit -m "Describe your change"
git push origin main
```

Repository: https://github.com/Siddhu-Srinivas/Campus-Complaint-Resolution-System
