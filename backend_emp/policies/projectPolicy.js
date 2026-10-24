/**
 * ProjectPolicy
 * Implements Policy / Scoped Role-Based Access Control (RBAC) Pattern.
 * Enforces permissions for Admins, Project Managers (scoped), and Team Members.
 */
class ProjectPolicy {
  /**
   * Helper to normalize user ID comparison
   */
  static isSameUser(userIdA, userIdB) {
    if (!userIdA || !userIdB) return false;
    return String(userIdA).trim() === String(userIdB).trim();
  }

  /**
   * Check if a user is one of the designated Project Managers for a project
   */
  static isProjectManager(userId, project) {
    if (!userId || !project) return false;
    if (this.isSameUser(userId, project.project_manager_id)) return true;
    if (Array.isArray(project.project_manager_ids)) {
      return project.project_manager_ids.some(id => this.isSameUser(userId, id));
    }
    if (Array.isArray(project.project_managers)) {
      return project.project_managers.some(pm => this.isSameUser(userId, pm.id || pm));
    }
    return false;
  }

  /**
   * Only Global Admins can create new projects or delete projects
   */
  static canCreateProject(user) {
    return user && user.role === 'Admin';
  }

  static canDeleteProject(user) {
    return user && user.role === 'Admin';
  }

  /**
   * Check if a user is assigned to a project as a Project Manager or Team Member
   */
  static isAssignedToProject(userId, project) {
    if (!userId || !project) return false;
    // 1. Designated Project Manager
    if (this.isProjectManager(userId, project)) return true;

    // 2. Assigned Team Member
    const members = Array.isArray(project.members) ? project.members : [];
    if (members.some(mId => this.isSameUser(mId, userId))) return true;

    const teamMembers = Array.isArray(project.team_members) ? project.team_members : [];
    if (teamMembers.some(m => this.isSameUser(m.id || m, userId))) return true;

    return false;
  }

  /**
   * Determines if a user can view a project and its workspace.
   * In employee scope or for regular employees, only assigned projects are visible.
   */
  static canViewProject(user, project, scope = null) {
    if (!user || !project) return false;

    // If explicit employee scope requested, or role is not Admin, strictly check assignment
    if (scope === 'employee' || user.role !== 'Admin') {
      return this.isAssignedToProject(user.id, project);
    }

    // Global Admin in Admin View can view all projects
    return true;
  }

  /**
   * Scoped Admin Power:
   * Can edit project details, change description, manage targets, and create/assign tasks.
   * Allowed for Global Admins AND any designated Project Manager of THIS project.
   */
  static canManageProject(user, project, scope = null) {
    if (!user || !project) return false;
    if (this.isProjectManager(user.id, project)) return true;
    if (user.role === 'Admin' && scope !== 'employee') return true;
    return false;
  }

  /**
   * Can add/edit/delete tasks and milestones.
   * STRICT: Only designated Project Managers (or Admin in admin dashboard) can create/manage tasks.
   */
  static canManageTasks(user, project, scope = null) {
    return this.canManageProject(user, project, scope);
  }

  /**
   * Can update the completion status of a task:
   * Allowed for Global Admin, Project's PMs, or the specifically assigned Team Member.
   */
  static canUpdateTaskStatus(user, task, project) {
    if (!user || !task) return false;
    if (user.role === 'Admin') return true;

    // Any Project Manager has control
    if (project && this.isProjectManager(user.id, project)) return true;

    // Assigned Team Member can update their own task status
    return this.isSameUser(user.id, task.assigned_to);
  }
}

module.exports = ProjectPolicy;
