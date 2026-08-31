# 🎓 University Timetable Generator & Conflict Resolver

Welcome to the **University Timetable Generator**! Creating a university class schedule without overlapping lectures or lab clashes can be a huge headache for both students and administration. 

This project solves that exact problem. It provides an intuitive, interactive timetable builder for students to pick their courses, detect scheduling clashes automatically, find smart section recommendations, and generate a final downloadable PDF schedule. For administrators, it includes a robust Django portal to manage sections, import timetables from raw JSON/PDF files, handle student feedback, and publish updates safely.

---

## 🌟 Key Features

### For Students & Guests
* 🗓️ **Interactive Timetable Builder**: Browse available courses by semester, search by course name/code, and select your preferred lecture and lab sections.
* ⚡ **Real-Time Clash Detection**: Instant visual alerts whenever two selected sections conflict in day/time slots.
* 💡 **Smart Section Recommendations**: Get automated suggestions for alternative non-clashing sections.
* 📄 **One-Click PDF Export**: Download your final conflict-free schedule in a clean, printable PDF format.
* 📢 **Announcement Banner**: Stay up to date with official timetable announcements and administrative updates.
* 🚩 **Problem Reporting**: Submit feedback or report timetable errors directly to university admins.

### For Administrators
* 📊 **Admin Dashboard**: Manage course sections, adjust timings, rooms, and instructor assignments on the fly.
* 📁 **PDF & JSON Parser / Importer**: Upload raw PDF or JSON timetable files directly into the system database.
* 🔄 **Atomic Version Control & Rollbacks**: Preview changes before publishing live to students, with full version history and rollback capabilities.
* 📬 **Student Reports Inbox**: Review, reply to, and resolve issues reported by students.

---

## 🏗️ Project Architecture

The application is built using a modern decoupled architecture:

```text
               ┌──────────────────────────────────────────┐
               │    React + Vite + Tailwind CSS Frontend  │
               │        (Interactive Web Workspace)       │
               └────────────────────┬─────────────────────┘
                                    │  JSON REST API / JWT
                                    ▼
               ┌──────────────────────────────────────────┐
               │         Django REST Framework API        │
               │    (Auth, Timetable Engine, Reports)     │
               └────────────────────┬─────────────────────┘
                                    │
                                    ▼
               ┌──────────────────────────────────────────┐
               │             SQLite Database              │
               │     (Timetables, Users, Reports, etc.)   │
               └──────────────────────────────────────────┘
```

* **Frontend**: React (TypeScript), Vite, Tailwind CSS, Lucide Icons, html2canvas/jspdf.
* **Backend**: Django 5.x, Django REST Framework, `dj-rest-auth`, `pdfplumber` (PDF extraction).

---

## 💻 How to Set Up & Run on Your PC

Follow these simple step-by-step instructions to get the project running locally on your computer.

### 📋 1. Prerequisites

Before you start, make sure you have the following installed on your machine:
* **Python**: `v3.10` or higher ([Download Python](https://www.python.org/downloads/))
* **Node.js**: `v18` or higher ([Download Node.js](https://nodejs.org/))
* **Git**: ([Download Git](https://git-scm.com/))

---

### ⚙️ 2. Backend Setup (Django API)

1. **Open your terminal** and clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/itxkillerking/Univeristy-time-table-generator.git
   cd Univeristy-time-table-generator
   ```

2. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

3. **Create and activate a Python Virtual Environment**:
   * *Windows (PowerShell)*:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * *macOS / Linux*:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

4. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up Environment Variables**:
   Create a `.env` file inside the `backend/` folder (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   *(The default settings work out-of-the-box for local development!)*

6. **Run Database Migrations**:
   ```bash
   python manage.py migrate
   ```

7. **Create User Groups & Admin User**:
   Run our custom setup command to initialize user roles:
   ```bash
   python manage.py setup_auth
   ```
   *(Optional: You can also create a superuser manually via `python manage.py createsuperuser`)*

8. **Start the Django Development Server**:
   ```bash
   python manage.py runserver
   ```
   The backend API will start running at `http://localhost:8000/`.

---

### 🎨 3. Frontend Setup (React + Vite)

1. Open a **new terminal tab/window** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file inside the `frontend/` folder:
   ```bash
   cp .env.example .env
   ```
   Ensure it points to your Django server:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Start the Vite Frontend Development Server**:
   ```bash
   npm run dev
   ```
   The frontend will start running at `http://localhost:5173/`.

---

## 🚀 Usage Guide

1. Open your browser and head to `http://localhost:5173/`.
2. **Explore the Hero Video & Features**: Watch the entrance flow and check out core capabilities.
3. **Build a Timetable**: Click **"Build My Timetable"**, choose your semester, select your courses, pick sections, and verify there are no clashes.
4. **Report an Issue**: If you spot an error, click **"Report a Problem"**. You can register a free student account or login to post a report and track admin replies.
5. **Admin Dashboard**: Log in with your admin credentials to access `/admin` to edit sections, publish timetable updates, and post announcements.

---

## 🛠️ Project Directory Structure

```text
Univeristy-time-table-generator/
├── backend/                  # Django REST API
│   ├── accounts/             # Authentication & user registration
│   ├── announcements/        # Public/Admin announcements
│   ├── config/               # Django project settings & URLs
│   ├── core/                 # Core utilities & health check
│   ├── reports/              # Student problem reporting module
│   ├── timetable/            # Timetable engine, PDF parser & admin tools
│   ├── manage.py
│   └── requirements.txt
├── frontend/                 # React + Vite Application
│   ├── public/               # Static assets & videos
│   ├── src/
│   │   ├── components/       # UI Components (Admin, Builder, Home, Layout)
│   │   ├── context/          # Auth Context
│   │   ├── pages/            # App Pages (Home, Builder, Login, Register, Report, Admin)
│   │   ├── types/            # TypeScript Interface definitions
│   │   └── lib/              # API clients, clash detector, PDF generator
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/itxkillerking/Univeristy-time-table-generator/issues).

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more details.
