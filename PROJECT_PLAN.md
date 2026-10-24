# Project Management System Feature - Comprehensive Architecture & Implementation Plan

**Branch:** `feature/project-management`  
**Target Repository:** Employee Management System (P W Holdings)  
**Date:** October 2026  
**Status:** In Progress / Plan Approved for Execution  

---

## 1. Executive Summary & Context

This document outlines the architectural analysis of the existing codebase and the comprehensive engineering plan to introduce a **Project & Task Management System with Role-Based Scoped Permissions**. 

The feature empowers:
1. **System Administrators**: Create new projects, set deadlines and targets, assign team members from the employee roster, and designate one team member as the **Project Manager (PM)**.
2. **Project Managers**: Gain scoped administrative control over their designated project to update details/descriptions, define milestones/targets, create tasks, assign tasks to project team members, and monitor progress.
3. **Team Members**: View their assigned projects, view their individual tasks and target deadlines, and update task progress (mark as Completed / In Progress / Pending).

---

## 2. Current State of the Project

### 2.1 Architecture Overview
The application is structured as a full-stack web application:
- **Frontend (`frontend_emp/`)**:
  - React 19 SPA bundled with Vite 8.
  - Styling with Tailwind CSS v4 and Lucide React icons.
  - State-driven view rendering (`login`, `admin`, `employee`) managed centrally in [App.jsx](file:///home/dimathrj/Documents/intern+projects/Pasiya_Project/employee_mgt_sys/frontend_emp/src/App.jsx).
  - Navigation handled through tab switching (`activeTab`) rather than heavy multi-route page loads.
  - Centralized Axios instance with base URL configuration in [api.js](file:///home/dimathrj/Documents/intern+projects/Pasiya_Project/employee_mgt_sys/frontend_emp/src/api.js).
- **Backend (`backend_emp/`)**:
  - Node.js running Express 5.
  - Supabase client integration ([db.js](file:///home/dimathrj/Documents/intern+projects/Pasiya_Project/employee_mgt_sys/backend_emp/db.js)) connected to a cloud PostgreSQL instance using a service role key.
  - Monolithic service pattern in [backendService.js](file:///home/dimathrj/Documents/intern+projects/Pasiya_Project/employee_mgt_sys/backend_emp/services/backendService.js) encompassing authentication, dashboard summaries, leave workflows, and employee profiles.
  - Auxiliary background crons for automated database backups and employee birthday reminders.
  - Zoho CRM/Books sync integration in [zohoService.js](file:///home/dimathrj/Documents/intern+projects/Pasiya_Project/employee_mgt_sys/backend_emp/services/zohoService.js).
- **Existing Database Schema (Supabase PostgreSQL)**:
  - `users`: Employee records, login credentials, initials, roles (`Admin` or `Employee`), personal details, profile picture URL, department.
  - `leave_requests`: Leave applications, start/end dates, approval status, session types (half-day, study leave, power cut, casual).
  - `daily_work_entries`: Daily work logging submitted by employees.
  - `leave_balances`: User leave quotas and utilization.
  - `employee_documents`: Document attachments per user.

### 2.2 Git Workflow & Isolation
- A dedicated feature branch `feature/project-management` has been created and checked out from `main`.
- All development will occur strictly within this branch without merging into `development` or `main`.

---

## 3. Design Patterns & Engineering Principles

To ensure high maintainability, testability, and clean code separation, the new feature will be built using established design patterns rather than extending the existing monolith:

### 3.1 Repository Pattern with Fallback (Data Access Layer)
- **Problem**: In cloud-hosted databases, schema caching or migration timing can cause temporary availability issues.
- **Solution**: Decouple data access behind a `ProjectRepository` and `TaskRepository`. 
- **Implementation**: The repository attempts Supabase table operations first; if the table schema cache is pending or in local development mode, it gracefully operates with resilient persistent file-based fallback storage (`backend_emp/data/projects.json`, `tasks.json`). When the PostgreSQL migration is executed in Supabase, the repository automatically reads and writes directly from Supabase tables without code modifications.

### 3.2 Policy / Scoped RBAC Pattern (Authorization Engine)
- **Problem**: Project Managers are regular employees (`role: 'Employee'`) globally, but must have administrative capabilities *strictly within their assigned project*.
- **Solution**: A dedicated `ProjectPolicy` class implementing granular permission checks:
  - `canViewProject(user, project)`: `Admin`, project's `project_manager_id === user.id`, or user is in `project.members`.
  - `canManageProject(user, project)`: `Admin` or project's `project_manager_id === user.id`.
  - `canManageTasks(user, project)`: `Admin` or project's `project_manager_id === user.id`.
  - `canUpdateTaskStatus(user, task, project)`: `Admin`, project's PM, or `task.assigned_to === user.id`.

### 3.3 Service Layer Pattern (Business Logic)
- **`ProjectService`**: Handles project creation, validation, member assignment, manager assignment, and target tracking.
- **`TaskService`**: Handles task creation, assignment to team members, status transitions (Pending ⇄ In Progress ⇄ Completed), and target completion rate calculation.

### 3.4 Modular Component Pattern (Frontend Architecture)
- Reusable, self-contained UI components adhering to Single Responsibility Principle:
  - `ProjectCard`: Overview card with progress bar, manager badge, and deadline indicator.
  - `ProjectDetailsModal` / `ProjectDetailView`: Comprehensive project workspace with target tracking, member list, and task board.
  - `TaskBoard` & `TaskItem`: Task cards with one-click completion toggle for assignees, priority pills, and due dates.
  - `CreateProjectModal`: Admin modal with interactive multi-member selector and Project Manager assignment.
  - `CreateTaskModal`: Project Manager / Admin modal to add tasks and targets.

---

## 4. Database Schema Design & Migration

A clean SQL migration script (`backend_emp/migrations/001_create_projects_and_tasks.sql`) will be added to the repository:

```sql
-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  client_name VARCHAR(255),
  project_manager_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'In Progress', -- 'Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'
  priority VARCHAR(50) DEFAULT 'Medium',    -- 'Low', 'Medium', 'High', 'Urgent'
  start_date DATE,
  target_date DATE,
  created_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Project Members Pivot Table (Assigning team members to projects)
CREATE TABLE IF NOT EXISTS public.project_members (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 3. Project Targets / Milestones Table
CREATE TABLE IF NOT EXISTS public.project_targets (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  target_id BIGINT REFERENCES public.project_targets(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed'
  priority VARCHAR(50) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. API Design & Endpoints Specification

All endpoints are registered under `/api/projects`:

### 5.1 Project Endpoints
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `GET` | `/api/projects` | All Authenticated | Fetch projects visible to current user (Admins get all; Employees get projects where they are member or PM). |
| `GET` | `/api/projects/:id` | Member, PM, Admin | Fetch complete project details, including team members, targets, and task breakdown. |
| `POST` | `/api/projects` | Admin Only | Create a new project, assign members, and designate the Project Manager. |
| `PUT` | `/api/projects/:id` | Project PM, Admin | Update project details, description, status, target date, or change members/manager. |
| `DELETE` | `/api/projects/:id` | Admin Only | Delete project and associated tasks. |

### 5.2 Targets & Milestones Endpoints
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/projects/:id/targets` | Project PM, Admin | Add a target/milestone to the project. |
| `PATCH` | `/api/projects/:id/targets/:targetId` | Project PM, Admin | Toggle or edit a project target. |
| `DELETE` | `/api/projects/:id/targets/:targetId` | Project PM, Admin | Remove a project target. |

### 5.3 Tasks Endpoints
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `GET` | `/api/projects/:id/tasks` | Member, PM, Admin | Get tasks for a given project. |
| `GET` | `/api/projects/my-tasks` | All Authenticated | Get all tasks assigned to the current employee across all their projects. |
| `POST` | `/api/projects/:id/tasks` | Project PM, Admin | Create a new task and assign to a project team member. |
| `PUT` | `/api/projects/:id/tasks/:taskId` | Project PM, Admin | Edit task title, description, priority, due date, assignee. |
| `PATCH` | `/api/projects/:id/tasks/:taskId/status` | Assignee, PM, Admin | Toggle or update task status (`Completed`, `In Progress`, `Pending`). |
| `DELETE` | `/api/projects/:id/tasks/:taskId` | Project PM, Admin | Delete a task. |

---

## 6. Frontend User Experience & UI Integration

### 6.1 Admin View
1. **Sidebar Navigation**:
   - Add new `Projects` tab in [AdminSidebar.jsx](file:///home/dimathrj/Documents/intern+projects/Pasiya_Project/employee_mgt_sys/frontend_emp/src/components/admin/AdminSidebar.jsx) with Folder/Briefcase icon.
2. **Admin Projects Dashboard**:
   - Summary metric cards: Total Projects, In Progress, Completed, Overdue Targets.
   - Primary Action: `+ New Project` button launching `CreateProjectModal`.
   - Grid/List of projects showing Project Manager avatar, team members avatars, progress percentage, and target date.
   - Clicking a project opens the full project management workspace.

### 6.2 Employee View
1. **Sidebar Navigation**:
   - Add new `Projects & Tasks` tab in [Sidebar.jsx](file:///home/dimathrj/Documents/intern+projects/Pasiya_Project/employee_mgt_sys/frontend_emp/src/components/Sidebar.jsx).
2. **Employee Projects & Tasks Dashboard**:
   - **"My Tasks" View**: Immediate list of personal tasks across all assigned projects, categorized by Today / Upcoming / Completed, with one-click checkboxes to toggle completion.
   - **"My Projects" View**: Projects the user is a member of.
   - **Project Manager Mode**: If the logged-in user is the Project Manager of a project, the UI displays a distinctive **"⭐ You are the Project Manager"** banner with full scoped admin controls:
     - `Edit Project Details`
     - `Add Task` & `Assign Member`
     - `Add Target / Milestone`
     - Task Management board

---

## 7. Implementation Roadmap & Execution Steps

1. **Step 1: Database & Persistence Layer**
   - Create SQL migration file `backend_emp/migrations/001_create_projects_and_tasks.sql`.
   - Implement `backend_emp/repositories/projectRepository.js` using the Repository Pattern with Supabase integration and automatic resilient fallback.
2. **Step 2: Business Logic & Authorization Engine**
   - Implement `backend_emp/policies/projectPolicy.js` (Scoped RBAC).
   - Implement `backend_emp/services/projectService.js`.
   - Implement `backend_emp/routes/projectRoutes.js` and mount into `backend_emp/index.js`.
3. **Step 3: Frontend Project Components**
   - Create `ProjectManagementView.jsx` in `frontend_emp/src/components/projects/`.
   - Create `CreateProjectModal.jsx`, `CreateTaskModal.jsx`, `ProjectDetailModal.jsx`.
   - Create `TaskCard.jsx` with instant status toggle.
4. **Step 4: Integration with Main Application**
   - Update `App.jsx` to support the new `projects` active tab for both Admin and Employee dashboards.
   - Update `Sidebar.jsx` and `AdminSidebar.jsx` with navigation links and active state styling.
5. **Step 5: Testing & Verification**
   - Verify project creation by Admin.
   - Verify PM assignment and scoped permissions (PM can edit details, add tasks, assign members).
   - Verify regular team member access (can see assigned project, can view and complete their tasks, cannot edit project details).
   - Run end-to-end build verification with `npm run build`.
