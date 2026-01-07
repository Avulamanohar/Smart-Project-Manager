---
description: Auto-complete project logic
---

# Auto-complete Project Workflow

This workflow describes the automatic completion of projects when all tasks are marked as finished.

## Logic
1.  **Trigger**: Task status update (`updateTask` in `taskController.js`).
2.  **Condition**: 
    -   Fetch all tasks for the project.
    -   Count `totalTasks` and `completedTasks` (status = 'done').
    -   If `totalTasks > 0` AND `totalTasks === completedTasks`, the project is considered 100% complete.
3.  **Action**:
    -   Update `Project.status` to `'completed'` in MongoDB.
    -   Emit `project_updated` socket event with the new project data (including calculated progress).
4.  **Reversion**:
    -   If a project was `'completed'` but task update makes `completedTasks < totalTasks`, revert `Project.status` to `'active'`.

## UI Changes
-   **Dashboard**: Removed the manual "Complete Project" button. It is replaced by a progress indicator for active projects.
