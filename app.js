import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYnE8lpKjgJ8_i7zRUmCNVqGp4rDObbSA",
  authDomain: "codingstudio-649b9.firebaseapp.com",
  projectId: "codingstudio-649b9",
  storageBucket: "codingstudio-649b9.firebasestorage.app",
  messagingSenderId: "1021003322702",
  appId: "1:1021003322702:web:1bb89baf1f02213b683a1f",
  measurementId: "G-EF14TLYVRC"
};

const isConfigured = !Object.values(firebaseConfig).some((value) => value.includes("YOUR_"));
const adminEmail = "siddhu@gmail.com";
const storageKey = "campus-resolve-complaints";
const sampleComplaints = [
  { id: "sample-1", name: "Jordan Lee", studentId: "STU-1042", email: "jordan@campus.edu", category: "Facilities", location: "North Library", subject: "Study room air conditioning", description: "The AC in study room 3 has not been working since Monday.", status: "In progress", createdAt: { seconds: Date.now() / 1000 - 3600 * 7 } },
  { id: "sample-2", name: "Maya Patel", studentId: "STU-1188", email: "maya@campus.edu", category: "Technology", location: "Engineering Block", subject: "Wi-Fi access point offline", description: "The connection drops repeatedly near the second floor labs.", status: "Submitted", createdAt: { seconds: Date.now() / 1000 - 3600 * 25 } },
  { id: "sample-3", name: "Sam Wilson", studentId: "STU-0974", email: "sam@campus.edu", category: "Safety", location: "East Residence", subject: "Broken corridor light", description: "The light outside room 204 is flickering and needs replacement.", status: "Resolved", createdAt: { seconds: Date.now() / 1000 - 3600 * 50 } }
];

let db;
let auth;
let unsubscribeComplaints;
let complaints = [];
let activeCategory = "all";
const $ = (selector) => document.querySelector(selector);
const complaintCollection = () => collection(db, "complaints");

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3500);
}

function setConnection(connected, text) {
  $("#connectionDot").classList.toggle("connected", connected);
  $("#connectionText").textContent = text;
}

function setAdminSession(user) {
  document.body.classList.remove("auth-pending");
  const dashboard = $("#admin");
  const liveQueue = $("#complaints");
  const loginButton = $("#adminLoginButton");
  const admin = user?.email?.toLowerCase() === adminEmail;
  document.querySelectorAll(".student-only").forEach((section) => { section.hidden = admin; });
  document.querySelectorAll(".admin-only").forEach((section) => { section.hidden = !admin; });
  dashboard.hidden = !admin;
  liveQueue.hidden = !admin;
  loginButton.textContent = admin ? "Log out" : "Admin login";
  $("#adminTools").hidden = !admin;
  $("#adminToggle").hidden = admin;
  if (admin) { render(); dashboard.scrollIntoView({ behavior: "smooth", block: "start" }); }
}

function timestampValue(item) {
  return item.createdAt?.seconds ? item.createdAt.seconds * 1000 : item.createdAt || 0;
}

function statusClass(status) {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function filteredComplaints() {
  const search = $("#searchInput").value.toLowerCase().trim();
  const status = $("#statusFilter").value;
  return complaints.filter((item) => {
    const matchesSearch = !search || [item.subject, item.description, item.location, item.name, item.category].some((value) => value?.toLowerCase().includes(search));
    return matchesSearch && (status === "all" || item.status === status) && (activeCategory === "all" || item.category === activeCategory);
  });
}

function renderStats() {
  $("#totalCount").textContent = complaints.length;
  $("#pendingCount").textContent = complaints.filter((item) => item.status !== "Resolved").length;
  $("#resolvedCount").textContent = complaints.filter((item) => item.status === "Resolved").length;
}

function renderComplaints() {
  const list = $("#complaintList");
  const visible = filteredComplaints();
  list.innerHTML = visible.length ? visible.map((item) => `
    <article class="complaint-card">
      <span class="status-badge ${statusClass(item.status)}">${item.status}</span>
      <h3>${escapeHtml(item.subject)}</h3>
      <div class="complaint-meta"><span>${escapeHtml(item.category)}</span><span>·</span><span>${escapeHtml(item.location)}</span><span>·</span><span>${formatDate(item.createdAt)}</span></div>
      <p class="complaint-description">${escapeHtml(item.description)}</p>
    </article>`).join("") : '<div class="empty-state">No complaints match your filters.</div>';
}

function renderAdminTable() {
  const status = $("#adminStatusFilter").value;
  const visible = complaints.filter((item) => status === "all" || item.status === status);
  $("#adminCount").textContent = visible.length;
  $("#adminTableBody").innerHTML = visible.map((item) => `<tr>
    <td>${escapeHtml(item.subject)}</td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(item.name)}</td>
    <td><span class="status-badge ${statusClass(item.status)}">${item.status}</span></td>
    <td><div class="table-actions"><button class="table-button" data-edit="${item.id}">Edit</button><button class="table-button danger" data-delete="${item.id}">Delete</button></div></td>
  </tr>`).join("") || '<tr><td colspan="5">No complaints in this view.</td></tr>';
}

function render() { renderStats(); renderComplaints(); renderAdminTable(); }
function escapeHtml(value = "") { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
function formatDate(createdAt) { const date = new Date(timestampValue({ createdAt })); return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function firebaseErrorMessage(error) {
  if (error.code === "permission-denied") return "Firebase rejected this write. Check your Firestore Rules.";
  if (error.code === "failed-precondition") return "Firestore is not ready. Create the database in Firebase Console first.";
  if (error.code === "unavailable") return "Firebase is temporarily unavailable. Check your internet connection.";
  return error.message || "Unknown Firebase error.";
}

function setupDataSource() {
  if (!isConfigured) {
    complaints = JSON.parse(localStorage.getItem(storageKey) || "null") || sampleComplaints;
    localStorage.setItem(storageKey, JSON.stringify(complaints));
    setConnection(false, "Demo mode · add Firebase config");
    render();
    return;
  }
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    onAuthStateChanged(auth, (user) => {
      setAdminSession(user);
      if (unsubscribeComplaints) unsubscribeComplaints();
      const admin = user?.email?.toLowerCase() === adminEmail;
      const complaintsQuery = query(complaintCollection(), orderBy("createdAt", "desc"));
      unsubscribeComplaints = onSnapshot(complaintsQuery, (snapshot) => {
        complaints = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => timestampValue(b) - timestampValue(a));
        setConnection(true, "Firestore connected");
        render();
      }, (error) => {
        complaints = [];
        render();
        const message = error.code === "permission-denied" ? "Sign in is required to view complaints." : firebaseErrorMessage(error);
        setConnection(false, `Firebase error · ${message}`);
        showToast(message);
      });
    });
  } catch (error) {
    setConnection(false, "Firebase setup error");
    showToast(firebaseErrorMessage(error));
  }
}

async function createComplaint(data) {
  const complaint = { ...data, status: "Submitted", createdAt: isConfigured ? serverTimestamp() : Date.now() };
  if (isConfigured) return (await addDoc(complaintCollection(), complaint)).id;
  const id = crypto.randomUUID();
  complaints.unshift({ ...complaint, id }); localStorage.setItem(storageKey, JSON.stringify(complaints)); render();
  return id;
}

async function updateComplaint(id, data) {
  if (isConfigured) await updateDoc(doc(db, "complaints", id), data);
  else { complaints = complaints.map((item) => item.id === id ? { ...item, ...data } : item); localStorage.setItem(storageKey, JSON.stringify(complaints)); render(); }
}

async function removeComplaint(id) {
  if (isConfigured) await deleteDoc(doc(db, "complaints", id));
  else { complaints = complaints.filter((item) => item.id !== id); localStorage.setItem(storageKey, JSON.stringify(complaints)); render(); }
}

$("#complaintForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#submitButton");
  button.disabled = true;
  try { const id = await createComplaint(Object.fromEntries(new FormData(event.currentTarget))); event.currentTarget.reset(); showToast(`Saved to Firebase. Complaint ID: ${id}`); }
  catch (error) { showToast(`Could not save to Firebase: ${firebaseErrorMessage(error)}`); }
  finally { button.disabled = false; }
});

$("#searchInput").addEventListener("input", renderComplaints);
$("#statusFilter").addEventListener("change", renderComplaints);
$("#adminStatusFilter").addEventListener("change", renderAdminTable);
$("#categoryFilters").addEventListener("click", (event) => { const button = event.target.closest("[data-category]"); if (!button) return; activeCategory = button.dataset.category; document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button)); renderComplaints(); });
$("#adminToggle").addEventListener("click", () => { const tools = $("#adminTools"); tools.hidden = !tools.hidden; $("#adminToggle").innerHTML = tools.hidden ? "Open admin tools <span>→</span>" : "Close admin tools <span>↑</span>"; if (!tools.hidden) $("#admin").scrollIntoView({ behavior: "smooth", block: "start" }); });
$("#themeButton").addEventListener("click", () => document.body.classList.toggle("dark"));
$("#adminLoginButton").addEventListener("click", async () => {
  if (auth?.currentUser) { await signOut(auth); showToast("You have been logged out."); return; }
  $("#loginDialog").showModal();
});

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $("#loginButton");
  button.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, form.elements.email.value, form.elements.password.value);
    form.reset(); $("#loginDialog").close(); showToast("Admin dashboard unlocked.");
  } catch (error) {
    showToast(error.code === "auth/invalid-credential" ? "Incorrect admin email or password." : `Login failed: ${error.message}`);
  } finally { button.disabled = false; }
});

$("#adminTableBody").addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const item = complaints.find((complaint) => complaint.id === editButton.dataset.edit);
    if (!item) return;
    const form = $("#editForm"); form.elements.id.value = item.id; form.elements.subject.value = item.subject; form.elements.status.value = item.status; form.elements.adminNote.value = item.adminNote || ""; $("#editDialog").showModal();
  }
  if (deleteButton && window.confirm("Delete this complaint permanently?")) { try { await removeComplaint(deleteButton.dataset.delete); showToast("Complaint deleted."); } catch (error) { showToast(`Delete failed: ${error.message}`); } }
});

$("#editForm").addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; try { await updateComplaint(form.elements.id.value, { subject: form.elements.subject.value, status: form.elements.status.value, adminNote: form.elements.adminNote.value }); $("#editDialog").close(); showToast("Complaint updated."); } catch (error) { showToast(`Update failed: ${error.message}`); } });
setupDataSource();
