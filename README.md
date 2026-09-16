# Campus Resolve

Campus Resolve is a campus complaint and resolution system for students to report issues and for admins to manage and resolve them efficiently.

## Live demo

- Website: https://codingstudio-649b9.web.app
- GitHub repository: https://github.com/Siddhu-Srinivas/Campus-Complaint-Resolution-System

## Features

- Student complaint submission form with required details
- Complaint tracking with status updates
- Search and filter by category and status
- Admin-only dashboard for managing complaints
- Create, read, update, and delete operations using Firebase Firestore
- Responsive design with a clean dark mode and black theme
- Real-time data updates through Firebase listeners

## Tech stack

- HTML, CSS, JavaScript
- Firebase Authentication
- Firebase Firestore
- Firebase Hosting

## Local setup

Because this app uses ES modules, run it from a local HTTP server:

```bash
npx serve .
```

Then open the local URL displayed in the terminal, usually:

```text
http://localhost:3000
```

## Firebase setup

The app is already configured for the Firebase project `codingstudio-649b9` in `app.js`.

1. Open https://console.firebase.google.com/
2. Create or select your Firebase project
3. Enable Authentication → Sign-in method → Email/Password
4. Create the admin user account in Firebase Authentication
5. Create a Firestore database if it does not exist yet
6. Update Firestore rules to allow public complaint creation and admin editing

Use these Firestore rules for development:

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

> This allows students to read and submit complaints while only signed-in admins can update or delete entries.

## Admin login

Use the Admin login button in the top navigation.

The app currently recognizes this admin email:

```text
siddhu@gmail.com
```

Create that account in Firebase Authentication before logging in.

## Deployment

To deploy the site to Firebase Hosting:

```powershell
firebase login
firebase deploy --only hosting
```

## GitHub push

```powershell
git add .
git commit -m "Update Campus Resolve app and README"
git push origin main
```

## Project structure

```text
.
├── app.js
├── index.html
├── styles.css
├── README.md
├── firebase.json
├── .firebaserc
└── .gitignore
```

## Notes

This version is designed for a simple campus environment and supports the required complaint submission, status tracking, and admin management flow.
