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
   * Only Global Admins can create new projects or delete projects
   */
  static canCreateProject(user) {
    return user && user.role === 'Admin';
  }

  static canDeleteProject(user) {
    return user && user.role === 'Admin';
  }

  /**
   * Determines if a user can view a project and its workspace
   */
  static canViewProject(user, project) {
    if (!user || !project) return false;
    if (user.role === 'Admin') return true;

    // Check if user is the designated Project Manager
    if (this.isSameUser(user.id, project.project_manager_id)) return true;

    // Check if user is an assigned team member
    const members = Array.isArray(project.members) ? project.members : [];
    return members.some(mId => this.isSameUser(mId, user.id));
  }

  /**
   * Scoped Admin Power:
   * Can edit project details, change description, manage targets, and create/assign tasks.
   * Allowed for Global Admins AND the designated Project Manager of THIS project.
   */
  static canManageProject(user, project) {
    if (!user || !project) return false;
    if (user.role === 'Admin') return true;
    return this.isSameUser(user.id, project.project_manager_id);
  }

  /**
   * Can add/edit/delete tasks and milestones
   */
  static canManageTasks(user, project) {
    return this.canManageProject(user, project);
  }

  /**
   * Can update the completion status of a task:
   * Allowed for Global Admin, Project's PM, or the specifically assigned Team Member.
   */
  static canUpdateTaskStatus(user, task, project) {
    if (!user || !task) return false;
    if (user.role === 'Admin') return true;

    // Project Manager has full control
    if (project && this.isSameUser(user.id, project.project_manager_id)) return true;

    // Assigned Team Member can update their own task status
    return this.isSameUser(user.id, task.assigned_to);
  }
}

module.exports = ProjectPolicy;
