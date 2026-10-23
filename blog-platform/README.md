# NEBULA — Blog Platform with Comments (Thiranex Task #4)

A full-stack blog platform: user registration/login, create/edit/delete posts, comment threads, RESTful API + MongoDB. Dark, glassmorphic, neon-accented UI.

## Setup (same pattern as your last project)

1. **Install dependencies**
   ```
   npm install
   ```

2. **MongoDB** — either reuse your existing Atlas cluster (just point to a new database name, e.g. `blogplatform`) or spin up a fresh free cluster at https://cloud.mongodb.com.

3. **Create `.env`**
   - Copy `.env.example` → rename to `.env`
   - Paste your real connection string:
     ```
     MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/blogplatform?retryWrites=true&w=majority
     JWT_SECRET=anyrandomstring123
     PORT=5000
     ```

4. **Run it**
   ```
   npm start
   ```
   Look for `MongoDB connected` and `Server running on http://localhost:5000`.

5. **Open** `http://localhost:5000`

## How it works

- **Join Nebula** → creates an account
- **Sign in** → unlocks "+ New Post"
- Click any post card → opens the full post + comment thread
- Only the post's author sees Edit/Delete buttons on that post
- Only a comment's author sees the "remove" option on that comment
- Anyone signed in can comment on any post

## Folder structure

```
blog-platform/
├── server.js
├── models/            # User, Post, Comment
├── routes/            # auth, posts, comments
├── middleware/auth.js # JWT protect
└── public/            # HTML/CSS/JS frontend
```

## API endpoints

| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/posts | Public |
| GET | /api/posts/:id | Public |
| POST | /api/posts | Logged-in user |
| PUT | /api/posts/:id | Post author only |
| DELETE | /api/posts/:id | Post author only |
| GET | /api/comments/:postId | Public |
| POST | /api/comments/:postId | Logged-in user |
| DELETE | /api/comments/:id | Comment author only |

Same deploy steps apply as your e-commerce project — GitHub push, then Render web service with the same three env vars.