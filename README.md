# Geeks Community - Supabase Integration

This project is a React-based student WhatsApp community application that integrates with a Supabase backend database and authentication system.

---

## Getting Started

Follow these steps to set up and run the application locally:

### 1. Create a Supabase Project
* Sign in to [Supabase](https://supabase.com/).
* Click **New Project** and configure your project details.

### 2. Configure the Database Schema
* Navigate to the **SQL Editor** tab in your Supabase dashboard.
* Click **New query**.
* Copy the contents of `supabase/schema.sql` from this codebase and paste them into the SQL Editor.
* Click **Run** to execute the script. This creates the required tables (`profiles`, `community_groups`, `group_join_requests`, `posts`, `ideas`, `featured_students`, `streaks`), installs the necessary triggers/policies, and populates the default community groups.

### 3. Get Project Credentials
* Go to **Project Settings** (gear icon) > **API**.
* Copy the **Project URL** and the **anon public API key**.

### 4. Setup Local Environment Variables
* Create a `.env` file in the root directory of this project (use `.env.example` as a template):
  ```env
  VITE_SUPABASE_URL=your_supabase_project_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```
* Paste your Supabase Project URL and anon key into the corresponding fields.

### 5. Install Dependencies & Start the App
* In your project terminal, install the required packages:
  ```bash
  npm install
  ```
* Launch the development server:
  ```bash
  npm run dev
  ```
* Open the local development URL (typically `http://localhost:5173`) in your browser.

---

## Admin Roles & Setup
By default, all new registered users are signed up with the `student` role. 

### How to Grant Admin Access:
1. Go to your **Supabase Dashboard**.
2. Click on the **Table Editor** in the left sidebar.
3. Open the `profiles` table.
4. Locate the student account you want to make an admin.
5. Double-click their `role` column cell and change `'student'` to `'admin'`.
6. Click **Save**.
7. Refresh your React app. The user will now see and have access to the **Admin Panel** tab in the navigation bar.

---

## Features
* **Supabase Authentication**: Integrated with roll-number-based lookup to find email, followed by secure authentication.
* **Row Level Security (RLS)**: Enforced tables level protection on user profiles, join requests, posts, ideas, group links, and user activity streaks.
* **Database Driven spotlight cards**: Display featured students from the database with default fallback metrics.
* **Streak Management**: Automatically tracks student post metrics, updating activity counters upon posting daily.
