# Daily Rise - Habit Tracking Application

## Overview
Daily Rise is a mobile-first React application designed to help users build and maintain daily habits. It offers a comprehensive suite of features including progress tracking, calendar views, weekly summaries, customizable reminders with audio alarms, user profile management, gamified badges, community groups for accountability, and goal setting. The project's vision is to make habit-building an engaging, social, and motivational journey, empowering users to "Level up their life, every single day."

## User Preferences
I prefer iterative development with clear, concise communication. Please provide detailed explanations for complex solutions and ask for confirmation before implementing major architectural changes. I value clean, readable code and well-documented functions. I prefer modern JavaScript features and functional components in React.

## System Architecture
Daily Rise is built with React 19.2.0, utilizing Tailwind CSS 3.4.18 for styling and React Router DOM for navigation. The application follows a component-based architecture, with reusable UI components, dedicated contexts for state management (e.g., AuthContext), and custom hooks for shared logic.

**UI/UX Decisions:**
- **Mobile-first design:** Ensures optimal experience on smaller screens.
- **Color Scheme:** Primary (#043915 - Dark Green), Dark (#000000 - Black), Light (#ffffff - White).
- **Typography:** Poppins for headings, Roboto for body text.
- **Navigation:** A consistent bottom navigation bar with 5 key items: Home, Progress, Logs, Alerts, and Rewards.
- **Notifications:** SweetAlert2 is used for user notifications and validations.

**Technical Implementations:**
- **Authentication:** Custom user authentication handled via Supabase, including login, registration, and password recovery.
- **Gamification:** Automated badge awarding system based on habit completion milestones, and a points system for completing reminders and challenges.
- **Reminders:** Web Audio API for customizable alarm sounds with a 60-second countdown modal.
- **Community & Challenges:** Real-time challenge system with dynamic UI updates and dual-user point rewards, leveraging Supabase Realtime channels.
- **Image Handling:** Profile image uploads with preview functionality.
- **Database Schema:** Structured to support users, habits, logs, goals, badges, community groups, challenges, and user points.
- **RLS Policies:** Simplified Row-Level Security for custom authentication integration.

**Feature Specifications:**
- **Home Dashboard:** Displays daily progress, badges earned, points, and communities joined, along with clickable highlights for Gamified Progress, Goal Setting, Smart Insights, and Community Accountability.
- **Progress Tracking:** Calendar view, weekly summaries with visual progress bars, streak counters, and success rates.
- **Goals:** CRUD operations for goal creation, linking to habits, and progress tracking.
- **Badges:** Auto-awarded badges based on habit consistency, displayed with progress counters.
- **Community:** Create/join communities, a real-time leaderboard, and a challenge system where users can challenge others with habits, earning points collaboratively.
- **Rewards:** Point-based system for earning badges and claiming physical reward items.
- **Profile:** Account settings, password change, and image upload.

## External Dependencies
- **Supabase:** Backend as a Service (BaaS) for database, authentication, and real-time functionalities.
- **React Router DOM:** For client-side routing.
- **SweetAlert2:** For custom, attractive alert and notification modals.
- **Web Audio API:** Used for generating and managing custom alarm sounds.