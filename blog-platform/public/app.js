const API = "/api";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let activePostId = null;
let allPosts = [];

// ---------- TOASTS ----------
function toast(message, isError = false) {
  const box = document.getElementById("toastBox");
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---------- MODAL HELPERS ----------
function openModal(id) {
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById(id).classList.remove("hidden");
}
function closeModals() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  document.getElementById("overlay").classList.add("hidden");
}
function showLogin() { closeModals(); openModal("loginForm"); }
function showRegister() { closeModals(); openModal("registerForm"); }

function showNewPost() {
  document.getElementById("postFormTitle").textContent = "New Transmission";
  document.getElementById("postFormEyebrow").textContent = "// compose";
  document.getElementById("postTitle").value = "";
  document.getElementById("postTags").value = "";
  document.getElementById("postContent").value = "";
  document.getElementById("editingPostId").value = "";
  closeModals();
  openModal("postForm");
}

function showEditPost(post) {
  document.getElementById("postFormTitle").textContent = "Edit Transmission";
  document.getElementById("postFormEyebrow").textContent = "// revise";
  document.getElementById("postTitle").value = post.title;
  document.getElementById("postTags").value = (post.tags || []).join(", ");
  document.getElementById("postContent").value = post.content;
  document.getElementById("editingPostId").value = post._id;
  closeModals();
  openModal("postForm");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ---------- AUTH UI ----------
function updateAuthUI() {
  const greet = document.getElementById("userGreeting");
  if (currentUser) {
    greet.classList.remove("hidden");
    greet.textContent = `> ${currentUser.name}`;
    document.getElementById("loginBtn").classList.add("hidden");
    document.getElementById("registerBtn").classList.add("hidden");
    document.getElementById("logoutBtn").classList.remove("hidden");
    document.getElementById("newPostBtn").classList.remove("hidden");
  } else {
    greet.classList.add("hidden");
    document.getElementById("loginBtn").classList.remove("hidden");
    document.getElementById("registerBtn").classList.remove("hidden");
    document.getElementById("logoutBtn").classList.add("hidden");
    document.getElementById("newPostBtn").classList.add("hidden");
  }
}

async function register() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!name || !email || !password) return toast("Fill in every field", true);

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);

  toast("Identity created — sign in now");
  closeModals();
  showLogin();
}

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);

  token = data.token;
  currentUser = data.user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(currentUser));
  closeModals();
  updateAuthUI();
  toast(`Welcome back, ${currentUser.name}`);
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  updateAuthUI();
  toast("Signed out");
}

// ---------- POSTS ----------
async function loadPosts() {
  const list = document.getElementById("postList");
  const res = await fetch(`${API}/posts`);
  allPosts = await res.json();

  if (allPosts.length === 0) {
    list.innerHTML = `<div class="empty-state">No transmissions yet — be the first to broadcast.</div>`;
    return;
  }

  list.innerHTML = "";
  allPosts.forEach(p => {
    const card = document.createElement("div");
    card.className = "post-card";
    card.onclick = () => openPost(p._id);
    const tags = (p.tags || []).map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join("");
    card.innerHTML = `
      <h3>${escapeHtml(p.title)}</h3>
      <p class="excerpt">${escapeHtml(p.content)}</p>
      <div>${tags}</div>
      <div class="meta">
        <span>${escapeHtml(p.authorName)}</span>
        <span>${timeAgo(p.createdAt)}</span>
      </div>
    `;
    list.appendChild(card);
  });
}

async function submitPost() {
  const title = document.getElementById("postTitle").value.trim();
  const content = document.getElementById("postContent").value.trim();
  const tagsRaw = document.getElementById("postTags").value.trim();
  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
  const editingId = document.getElementById("editingPostId").value;

  if (!title || !content) return toast("Title and content are required", true);

  const url = editingId ? `${API}/posts/${editingId}` : `${API}/posts`;
  const method = editingId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, content, tags })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);

  toast(editingId ? "Post updated" : "Transmission sent");
  closeModals();
  loadPosts();
  if (editingId) openPost(editingId);
}

async function deletePost(id) {
  if (!confirm("Delete this post permanently?")) return;
  const res = await fetch(`${API}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);
  toast("Post deleted");
  closePostView();
  loadPosts();
}

// ---------- SINGLE POST VIEW ----------
async function openPost(id) {
  activePostId = id;
  const res = await fetch(`${API}/posts/${id}`);
  if (!res.ok) return toast("Post not found", true);
  const post = await res.json();

  const tags = (post.tags || []).map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join("");
  const isOwner = currentUser && currentUser.id === post.author;

  document.getElementById("postViewContent").innerHTML = `
    <div>${tags}</div>
    <h2>${escapeHtml(post.title)}</h2>
    <div class="meta-line">by ${escapeHtml(post.authorName)} · ${timeAgo(post.createdAt)}</div>
    <div class="body-text">${escapeHtml(post.content)}</div>
    ${isOwner ? `
      <div class="post-actions">
        <button class="btn btn-ghost" onclick='showEditPost(${JSON.stringify(post).replace(/'/g, "&apos;")})'>Edit</button>
        <button class="btn btn-danger" onclick="deletePost('${post._id}')">Delete</button>
      </div>` : ""}
  `;

  document.getElementById("commentComposer").classList.toggle("hidden", !currentUser);
  document.getElementById("commentText").value = "";

  document.getElementById("postView").classList.remove("hidden");
  loadComments(id);
}

function closePostView() {
  document.getElementById("postView").classList.add("hidden");
  activePostId = null;
}

// ---------- COMMENTS ----------
async function loadComments(postId) {
  const res = await fetch(`${API}/comments/${postId}`);
  const comments = await res.json();
  const list = document.getElementById("commentList");

  if (comments.length === 0) {
    list.innerHTML = `<p style="color:var(--text-dim); font-size:13.5px;">No comments yet — start the discussion.</p>`;
    return;
  }

  list.innerHTML = "";
  comments.forEach(c => {
    const isOwner = currentUser && currentUser.id === c.author;
    const item = document.createElement("div");
    item.className = "comment-item";
    item.innerHTML = `
      <div class="comment-head">
        <span class="comment-author">${escapeHtml(c.authorName)}</span>
        <span class="comment-time">
          ${timeAgo(c.createdAt)}
          ${isOwner ? `<button class="remove-x" onclick="deleteComment('${c._id}')">remove</button>` : ""}
        </span>
      </div>
      <p>${escapeHtml(c.text)}</p>
    `;
    list.appendChild(item);
  });
}

async function submitComment() {
  if (!token) return toast("Sign in to comment", true);
  const text = document.getElementById("commentText").value.trim();
  if (!text) return toast("Comment can't be empty", true);

  const res = await fetch(`${API}/comments/${activePostId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);

  document.getElementById("commentText").value = "";
  loadComments(activePostId);
}

async function deleteComment(id) {
  const res = await fetch(`${API}/comments/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);
  loadComments(activePostId);
}

// ---------- INIT ----------
updateAuthUI();
loadPosts();
