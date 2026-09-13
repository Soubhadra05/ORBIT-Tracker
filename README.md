# ORBIT Tracker

# ◉ ORBIT Tracker

> A modern productivity workspace for tasks, projects, schedules, focus sessions, and real-world routines.

ORBIT Tracker is a responsive React/Vite productivity application designed to keep planning simple and calm. It is intentionally neutral: use it for school, college, work, projects, personal goals, or anything else you want to organize.


## ⭐ Why ORBIT Stands Out

Most task trackers are built around a simple loop: **create a task → check it off**.  
ORBIT is designed around the bigger picture: **what you need to do, when you need to do it, when you actually focused, and what your real-world schedule looks like**.

Instead of forcing everything into a generic to-do list, ORBIT brings **tasks + calendar + timetable + focus tracking + recurring classes + cloud sync** into one workspace.

### What makes ORBIT different

| Capability | ORBIT Tracker | Typical task tracker |
|---|---|---|
| Tasks | Full task lifecycle with editing, priorities, tags, scheduling and completion | Usually task-first |
| Scheduling | Start/end dates and times, including overnight tasks | Often deadline-focused |
| Calendar | Built-in calendar views + Google Calendar sync | Often separate or limited |
| Class timetable | Import a school/college timetable and generate recurring classes | Rarely included |
| Timetable OCR | Detect classes from timetable images and let you review them before import | Usually unavailable |
| Flexible class ranges | Different start/end dates for individual classes | Usually unavailable |
| Last-minute cancellation | Cancel one class occurrence without deleting the entire series | Rare |
| Series management | Update or delete future occurrences together | Often requires manual changes |
| Focus tracking | Pomodoro timer + manual sessions + actual start/end history | Varies |
| Activity history | Inspect logged study sessions for a selected day | Often basic totals only |
| Local-first usage | Core workspace can work without an account | Often account-first |
| Privacy-friendly OCR | Timetable image OCR runs in the browser | Often cloud-dependent |
| Cloud sync | Supabase-backed personal workspace | Depends on the app |
| Google Calendar | Timed and all-day task/class synchronization | Varies |
| Subjects / projects | Dedicated progress, targets, notes and task views | Often secondary |
| Customization | Themes, density, categories, accent colors and focus preferences | Varies |

### The standout workflow

**1. Import your real schedule**  
Upload a timetable image or CSV instead of manually entering every class.

**2. Review before committing**  
OCR-detected classes are presented for editing and selection, so you remain in control of what gets added.

**3. Generate the semester schedule**  
Set term dates and individual class date ranges. ORBIT creates the recurring occurrences for you.

**4. Keep reality in sync**  
If a class is cancelled at the last minute, cancel that occurrence without destroying the rest of the series.

**5. Plan your work around your classes**  
Tasks can have start/end dates and times, including schedules that cross midnight such as **11:00 PM → 1:00 AM**.

**6. Track what actually happened**  
Focus sessions record the time you really spent working. Manual sessions can use explicit start/end times, and the activity history lets you inspect a selected day's sessions.

**7. Keep your external calendar updated**  
Tasks and scheduled classes can be synchronized with Google Calendar so your planning does not stay trapped inside ORBIT.

### Built for real schedules, not just checklists

ORBIT is especially useful when your day changes frequently. A task tracker tells you **what** needs to happen; ORBIT also helps answer:

- **When is it happening?**
- **Does it conflict with my class?**
- **How long is it scheduled for?**
- **What did I actually study today?**
- **Which class was cancelled?**
- **What happens to the rest of a recurring class series if the schedule changes?**
- **Can my Google Calendar stay in sync with my workspace?**

That combination is the core idea behind ORBIT: **one workspace that connects planning, scheduling, execution, and reflection.**


## ✨ Features

### 📊 Dashboard
- Task progress and completion statistics
- Due-today overview
- Time logged and productivity momentum
- Quick navigation to tasks, projects, calendar, and focus

### ✅ Tasks
- Create a task with only a name — every other field is optional
- Subjects/projects, priorities, descriptions, tags, and minutes
- Start date, end date, start time, and end time
- Automatic duration calculation from a complete date/time range
- Cross-midnight scheduling, e.g. 11:00 PM → 1:00 AM
- Search, filtering, inline editing, completion, and deletion
- Google Calendar synchronization

### 🗓️ Timetable Import
Upload a class, school, or college timetable and ORBIT can turn it into scheduled class occurrences.

Supported input:
- PNG
- JPG/JPEG
- WEBP
- CSV

For images, ORBIT uses browser-side OCR to detect weekday, time range, and class names. Detected rows are shown for review before they are added. CSV is the most reliable option for structured timetables.

When imported, recurring classes are generated for the selected term range. Each occurrence can be managed independently.

### 🚫 Last-minute class cancellation
If a class is cancelled, open Timetable and choose **Cancel class** for that specific occurrence.

ORBIT will:
- Remove the occurrence from the ORBIT calendar
- Remove its linked Google Calendar event
- Keep the cancellation recorded
- Leave future recurring occurrences untouched
- Allow the occurrence to be restored later

### 📅 Calendar
- Today, 3 Days, Month, and Year views
- Scheduled tasks and timetable classes
- Timed and all-day events
- Cross-midnight event support
- Date selection and quick task creation

### 📚 Subjects & Projects
- Custom subjects/projects
- Descriptions and target hours
- Progress tracking
- Custom categories and accent colors
- Per-subject task views
- PDF notes/resources stored locally in IndexedDB

### 🎯 Focus
- 1, 2, or 3 Pomodoro presets
- Custom focus duration
- Completion sound
- Manual session logging
- Time tracking by subject/project

### 🔍 Global Search
Search tasks, notes, tags, subjects, codes, categories, and resources from the main header.

### ⚙️ Settings
- Dark, light, and system themes
- Compact, comfortable, and spacious density
- Notification and focus sound preferences
- Privacy and sync controls
- Google account management

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **UI:** CSS + Geist Sans + Lucide React
- **Authentication:** Supabase Auth + Google OAuth
- **Database:** Supabase PostgreSQL + Row Level Security
- **Calendar:** Google Calendar API
- **Local storage:** localStorage + IndexedDB
- **OCR:** Tesseract.js loaded client-side for timetable image recognition
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- Git

### Install

```bash
git clone https://github.com/Soubhadra05/ORBIT-Tracker.git
cd ORBIT-Tracker
npm install
npm run dev
```

### Production build

```bash
npm run build
npm run preview
```

The Vite production output is generated in `dist/`.

## ☁️ Supabase Setup

ORBIT can run in local/demo mode without a backend. Cloud sync and Google authentication require Supabase.

Create `.env` from `.env.example`:

```env
VITE_PUBLIC_SUPABASE_URL=your_supabase_project_url
VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Then run `supabase.sql` in the Supabase SQL Editor.

The schema includes:
- `subjects`
- `tasks`
- `study_sessions`

Task scheduling and timetable metadata are stored in the `tasks` table. Row Level Security restricts cloud rows to their authenticated owner.

## 🔑 Google Login & Calendar

Google OAuth is handled through Supabase. Google Calendar synchronization uses the `calendar.events` scope.

After changing Google OAuth scopes, users should sign out and sign in again so the new Calendar permission can be granted.

Tasks with only a date become all-day Calendar events. Tasks with a complete start/end date and time range become timed Calendar events.

## 🗓️ Timetable CSV Format

For the most accurate timetable import, use a CSV with these columns:

```csv
Day,Start Time,End Time,Class,Room
Monday,09:00,10:00,Mathematics,Room 201
Monday,10:15,11:15,Physics,Lab 2
Tuesday,11:00,12:00,Computer Science,Room 305
```

The importer lets you review and edit detected rows before generating recurring occurrences.

## 🔒 Privacy & Security

Core local functionality can be used without an account. Timetable image OCR runs in the browser; the application does not need to upload the timetable image to ORBIT's backend for OCR.

Do not commit `.env`, Google OAuth client secrets, or other private credentials. Only browser-safe public configuration belongs in the frontend environment.

## 📁 Project Structure

```text
ORBIT-Tracker/
├── public/
│   └── orbit-logo.png
├── src/
│   ├── main.jsx
│   ├── styles.css
│   └── supabase.js
├── index.html
├── package.json
├── supabase.sql
├── .env.example
└── README.md
```

## 🔄 Development Workflow

```bash
git pull origin main

# make changes
git add .
git commit -m "Describe your changes"
git push origin main

# deploy
npx vercel --prod
```

## 🧪 Timetable Test Checklist

- [ ] Upload a timetable image
- [ ] OCR detects classes
- [ ] Review/edit detected rows
- [ ] Select term start and end dates
- [ ] Import recurring classes
- [ ] Verify classes in Timetable
- [ ] Verify classes in Calendar
- [ ] Verify timed Google Calendar events
- [ ] Cancel one class occurrence
- [ ] Verify its Google Calendar event is removed
- [ ] Verify future occurrences remain
- [ ] Restore a cancelled occurrence

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Commit and push your branch.
5. Open a Pull Request.

## 📜 License

This project is currently intended for personal and educational use. Add an open-source license if you plan to distribute the project under specific terms.

---

### 🌌 ORBIT

**Plan. Focus. Track. Repeat.**

Built with React, Vite, Supabase, Google Calendar, and a little obsession with clean interfaces.


## Recent timetable improvements

- Delete an entire recurring class series at once.
- Linked Google Calendar events are removed when a task/class occurrence or class series is deleted.
- Timetable Calendar syncing runs in small parallel batches so large imports remain responsive.
- Existing tasks are synced without blocking the main timetable UI.
