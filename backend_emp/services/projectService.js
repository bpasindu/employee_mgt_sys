const projectRepository = require('../repositories/projectRepository');
const ProjectPolicy = require('../policies/projectPolicy');
const supabase = require('../db');

class ProjectService {
  /**
   * Helper: Get user details map from Supabase users table
   */
  async getUserMap(userIds = []) {
    const uniqueIds = Array.from(new Set(userIds.map(id => parseInt(id, 10)).filter(Boolean)));
    if (uniqueIds.length === 0) return {};

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, department, initials, photo_url, role')
        .in('id', uniqueIds);

      if (!error && data) {
        const map = {};
        data.forEach(u => { map[u.id] = u; });
        return map;
      }
    } catch (e) {
      console.warn('getUserMap error:', e.message);
    }
    return {};
  }

  /**
   * List all projects visible to the requesting user
   */
  async getProjectsForUser(user, scope = null) {
    if (!user) throw new Error('Authentication required');

    const allProjects = await projectRepository.findAllProjects();
    const visibleProjects = allProjects.filter(p => ProjectPolicy.canViewProject(user, p, scope));

    // Gather all PM and member IDs to fetch details in a single query
    const userIdsToFetch = [];
    visibleProjects.forEach(p => {
      if (p.project_manager_id) userIdsToFetch.push(p.project_manager_id);
      if (Array.isArray(p.project_manager_ids)) userIdsToFetch.push(...p.project_manager_ids);
      if (Array.isArray(p.members)) userIdsToFetch.push(...p.members);
      if (p.created_by) userIdsToFetch.push(p.created_by);
    });
    const userMap = await this.getUserMap(userIdsToFetch);

    // Enrich projects with task stats and user objects
    const enriched = await Promise.all(visibleProjects.map(async (project) => {
      const tasks = await projectRepository.findTasksByProjectId(project.id);
      const targets = await projectRepository.findTargetsByProjectId(project.id);

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const totalTargets = targets.length;
      const completedTargets = targets.filter(t => t.is_completed).length;

      const pmIds = Array.isArray(project.project_manager_ids) && project.project_manager_ids.length > 0
        ? project.project_manager_ids
        : (project.project_manager_id ? [project.project_manager_id] : []);
      const pms = pmIds.map(id => userMap[id]).filter(Boolean);
      const primaryPm = pms[0] || (project.project_manager_id ? userMap[project.project_manager_id] || null : null);
      const members = (project.members || []).map(mId => userMap[mId] || { id: mId, name: `Employee #${mId}` });

      const isManager = ProjectPolicy.isProjectManager(user.id, project);
      const isAdmin = user.role === 'Admin' && scope !== 'employee';
      const canManage = isManager || isAdmin;

      return {
        ...project,
        project_manager_ids: pmIds,
        project_manager_id: pmIds[0] || project.project_manager_id || null,
        project_managers: pms,
        project_manager: primaryPm,
        team_members: members,
        stats: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          pending_tasks: totalTasks - completedTasks,
          progress_percent: progressPercent,
          total_targets: totalTargets,
          completed_targets: completedTargets
        },
        permissions: {
          can_manage: canManage,
          is_manager: isManager,
          is_admin: user.role === 'Admin'
        }
      };
    }));

    return enriched;
  }

  /**
   * Get single project with complete targets, tasks, and member lists
   */
  async getProjectDetails(projectId, user, scope = null) {
    const project = await projectRepository.findProjectById(projectId);
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    if (!ProjectPolicy.canViewProject(user, project, scope)) {
      const err = new Error('Access denied: You are not assigned to this project');
      err.status = 403;
      throw err;
    }

    const tasks = await projectRepository.findTasksByProjectId(project.id);
    const targets = await projectRepository.findTargetsByProjectId(project.id);

    // Collect all involved user IDs
    const userIds = [];
    if (project.project_manager_id) userIds.push(project.project_manager_id);
    if (Array.isArray(project.project_manager_ids)) userIds.push(...project.project_manager_ids);
    if (Array.isArray(project.members)) userIds.push(...project.members);
    if (project.created_by) userIds.push(project.created_by);
    tasks.forEach(t => {
      if (t.assigned_to) userIds.push(t.assigned_to);
      if (t.created_by) userIds.push(t.created_by);
    });

    const userMap = await this.getUserMap(userIds);

    const pmIds = Array.isArray(project.project_manager_ids) && project.project_manager_ids.length > 0
      ? project.project_manager_ids
      : (project.project_manager_id ? [project.project_manager_id] : []);
    const pms = pmIds.map(id => userMap[id]).filter(Boolean);
    const primaryPm = pms[0] || (project.project_manager_id ? userMap[project.project_manager_id] || null : null);
    const members = (project.members || []).map(mId => userMap[mId] || { id: mId, name: `Employee #${mId}` });

    // Enrich tasks with assignee user details
    const enrichedTasks = tasks.map(t => ({
      ...t,
      assignee: t.assigned_to ? userMap[t.assigned_to] || { id: t.assigned_to, name: `Employee #${t.assigned_to}` } : null,
      target: targets.find(tg => tg.id === t.target_id) || null
    }));

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const isManager = ProjectPolicy.isProjectManager(user.id, project);
    const isAdmin = user.role === 'Admin' && scope !== 'employee';
    const canManage = isManager || isAdmin;

    return {
      ...project,
      project_manager_ids: pmIds,
      project_manager_id: pmIds[0] || project.project_manager_id || null,
      project_managers: pms,
      project_manager: primaryPm,
      team_members: members,
      targets,
      tasks: enrichedTasks,
      stats: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: totalTasks - completedTasks,
        progress_percent: progressPercent,
        total_targets: targets.length,
        completed_targets: targets.filter(t => t.is_completed).length
      },
      permissions: {
        can_manage: canManage,
        is_manager: isManager,
        is_admin: user.role === 'Admin'
      }
    };
  }

  /**
   * Create a new project (Admin Only)
   */
  async createProject(projectData, memberUserIds = [], user) {
    if (!ProjectPolicy.canCreateProject(user)) {
      const err = new Error('Access denied: Only system administrators can create projects');
      err.status = 403;
      throw err;
    }

    if (!projectData.name || !projectData.name.trim()) {
      const err = new Error('Project name is required');
      err.status = 400;
      throw err;
    }

    const created = await projectRepository.createProject({
      ...projectData,
      created_by: user.id
    }, memberUserIds);

    return this.getProjectDetails(created.id, user);
  }

  /**
   * Update project details (Admin or designated Project Manager)
   */
  async updateProject(projectId, updateData, memberUserIds = null, user) {
    const project = await projectRepository.findProjectById(projectId);
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    if (!ProjectPolicy.canManageProject(user, project)) {
      const err = new Error('Access denied: Only Project Managers or Admins can edit this project');
      err.status = 403;
      throw err;
    }

    // Only Admin can change the Project Manager or reassign members, unless user is Admin
    const isGlobalAdmin = user.role === 'Admin';
    const safeUpdateData = { ...updateData };
    if (!isGlobalAdmin && updateData.project_manager_id !== undefined) {
      delete safeUpdateData.project_manager_id; // PM cannot replace themselves unless Admin
    }

    const updated = await projectRepository.updateProject(projectId, safeUpdateData, memberUserIds);
    return this.getProjectDetails(updated.id, user);
  }

  /**
   * Delete a project (Admin Only)
   */
  async deleteProject(projectId, user) {
    if (!ProjectPolicy.canDeleteProject(user)) {
      const err = new Error('Access denied: Only administrators can delete projects');
      err.status = 403;
      throw err;
    }

    return projectRepository.deleteProject(projectId);
  }

  // --- TARGETS ---

  async addTarget(projectId, targetData, user) {
    const project = await projectRepository.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    if (!ProjectPolicy.canManageProject(user, project)) {
      const err = new Error('Access denied: Only Project Managers or Admins can add project targets');
      err.status = 403;
      throw err;
    }

    if (!targetData.title || !targetData.title.trim()) {
      const err = new Error('Target title is required');
      err.status = 400;
      throw err;
    }

    return projectRepository.createTarget(projectId, targetData);
  }

  async updateTarget(projectId, targetId, updateData, user) {
    const project = await projectRepository.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    if (!ProjectPolicy.canManageProject(user, project)) {
      const err = new Error('Access denied: Only Project Managers or Admins can edit targets');
      err.status = 403;
      throw err;
    }

    return projectRepository.updateTarget(targetId, updateData);
  }

  async deleteTarget(projectId, targetId, user) {
    const project = await projectRepository.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    if (!ProjectPolicy.canManageProject(user, project)) {
      const err = new Error('Access denied: Only Project Managers or Admins can delete targets');
      err.status = 403;
      throw err;
    }

    return projectRepository.deleteTarget(targetId);
  }

  // --- TASKS ---

  async createTask(projectId, taskData, user, scope = null) {
    const project = await projectRepository.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    if (!ProjectPolicy.canManageTasks(user, project, scope)) {
      const err = new Error('Access denied: Only Project Managers can create tasks for this project');
      err.status = 403;
      throw err;
    }

    if (!taskData.title || !taskData.title.trim()) {
      const err = new Error('Task title is required');
      err.status = 400;
      throw err;
    }

    const created = await projectRepository.createTask({
      ...taskData,
      project_id: projectId,
      created_by: user.id
    });

    const userMap = await this.getUserMap([created.assigned_to]);
    return {
      ...created,
      assignee: created.assigned_to ? userMap[created.assigned_to] || null : null
    };
  }

  async updateTask(projectId, taskId, updateData, user, scope = null) {
    const project = await projectRepository.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    if (!ProjectPolicy.canManageTasks(user, project, scope)) {
      const err = new Error('Access denied: Only Project Managers can edit tasks for this project');
      err.status = 403;
      throw err;
    }

    const updated = await projectRepository.updateTask(taskId, updateData);
    const userMap = await this.getUserMap([updated.assigned_to]);
    return {
      ...updated,
      assignee: updated.assigned_to ? userMap[updated.assigned_to] || null : null
    };
  }

  /**
   * Team Member Status Update
   * Allows assigned team member, PM, or Admin to update task status
   */
  async updateTaskStatus(projectId, taskId, newStatus, user) {
    const project = await projectRepository.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const task = await projectRepository.findTaskById(taskId);
    if (!task) throw new Error('Task not found');

    if (!ProjectPolicy.canUpdateTaskStatus(user, task, project)) {
      const err = new Error('Access denied: You can only update tasks assigned to you');
      err.status = 403;
      throw err;
    }

    const updated = await projectRepository.updateTask(taskId, { status: newStatus });
    const userMap = await this.getUserMap([updated.assigned_to]);
    return {
      ...updated,
      assignee: updated.assigned_to ? userMap[updated.assigned_to] || null : null
    };
  }

  async deleteTask(projectId, taskId, user, scope = null) {
    const project = await projectRepository.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    if (!ProjectPolicy.canManageTasks(user, project, scope)) {
      const err = new Error('Access denied: Only Project Managers can delete tasks');
      err.status = 403;
      throw err;
    }

    return projectRepository.deleteTask(taskId);
  }

  /**
   * Fetch all tasks assigned to the current employee across all their projects
   */
  async getMyAssignedTasks(user) {
    if (!user || !user.id) throw new Error('Authentication required');

    const myTasks = await projectRepository.findTasksByAssignee(user.id);
    const allProjects = await projectRepository.findAllProjects();
    const projectMap = {};
    allProjects.forEach(p => { projectMap[p.id] = p; });

    return myTasks.map(task => ({
      ...task,
      project: projectMap[task.project_id] ? {
        id: projectMap[task.project_id].id,
        name: projectMap[task.project_id].name,
        code: projectMap[task.project_id].code
      } : null
    }));
  }
}

module.exports = new ProjectService();
