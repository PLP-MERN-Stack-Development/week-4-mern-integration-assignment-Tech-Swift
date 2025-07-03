# MERN Blog App

A full-stack blog application built with MongoDB, Express.js, React, and Node.js (MERN). Features authentication, CRUD for posts, categories, comments, image uploads, and a modern maroon-themed UI.

---

## Project Overview
This is a modern blog platform where users can register, log in, create, edit, and delete posts, comment and reply, and filter/search content. The app uses JWT authentication, robust permissions, and a beautiful UI built with Tailwind CSS and shadcn/ui.

---

## Features Implemented
- User registration and login (JWT auth)
- Create, edit, delete blog posts (with image upload)
- List, filter, and search posts by title, category, or author
- Paginated post lists
- Categories for posts
- Commenting and nested replies (with permissions)
- Only post owners can delete posts/comments/replies
- Responsive, accessible UI with maroon color scheme
- Loading, error, and empty states handled

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone the repository
```
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Environment Variables
- Copy `.env.example` to `.env` in both `server/` and `client/` (see provided templates)
- Fill in your MongoDB URI and JWT secret in `server/.env`

### 3. Install dependencies
```
cd server && npm install
cd ../client && npm install
```

### 4. Start the app
- Start the backend:
```
cd server
npm start
```
- Start the frontend:
```
cd ../client
npm run dev
```
- Visit [http://localhost:5173](http://localhost:5173) (or the port shown)

---

## API Documentation

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT

### Posts
- `GET /api/posts` — List posts (supports pagination, search, filter)
- `GET /api/posts/:id` — Get post detail
- `POST /api/posts` — Create post (auth required)
- `PUT /api/posts/:id` — Edit post (auth, owner only)
- `DELETE /api/posts/:id` — Delete post (auth, owner only)

### Categories
- `GET /api/categories` — List categories

### Comments
- `POST /api/posts/:id/comments` — Add comment
- `DELETE /api/posts/:id/comments/:commentId` — Delete comment (owner only)
- `POST /api/posts/:id/comments/:commentId/replies` — Add reply
- `DELETE /api/posts/:id/comments/:commentId/replies/:replyId` — Delete reply (owner only)

---

## Screenshots

 - `Access the screenshot from this folder images`

---

## License
MIT 