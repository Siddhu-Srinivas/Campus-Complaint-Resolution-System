# Campus Resolve

A simple Campus Complaint & Resolution System built with HTML, CSS, JavaScript, and Firebase Firestore.

## Run locally

Because the app uses ES modules, serve this folder from a local HTTP server. For example:

```bash
npx serve .
```

Then open the URL shown in the terminal.

## Connect Firebase

1. Create a Firebase project at https://console.firebase.google.com/.
2. Create a Web App and copy its configuration object.
3. Open `app.js` and replace the `YOUR_*` values in `firebaseConfig`.
4. Create a Firestore database.
5. Add a `complaints` collection. The app will create documents automatically when a complaint is submitted.
6. In **Authentication → Sign-in method**, enable **Email/Password**.
7. In **Authentication → Users**, click **Add user** and create the admin email and password.

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

All visitors can read and submit complaints. Only signed-in Firebase users can update or delete complaints.

For a prototype, the app runs in demo mode with sample complaints and persists changes in browser local storage until the Firebase configuration is added.

## Firestore security

Before production, configure Firebase Authentication and Firestore Security Rules. The current interface intentionally keeps the admin dashboard simple for demonstration; it does not implement admin authentication.
