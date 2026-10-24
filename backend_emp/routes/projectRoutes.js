const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');
const { authenticateToken } = require('../middleware/authMiddleware');
const supabase = require('../db');

// Middleware to resolve authentic user identity
async function resolveUser(req, res, next) {
  let user = req.user;

  // 1. Check explicit user header or query parameter from client
  const fallbackId = req.headers['x-user-id'] || req.query.user_id || req.body?.user_id;
  if (fallbackId) {
    const numId = parseInt(fallbackId, 10);
    if (!isNaN(numId)) {
      try {
        const { data } = await supabase.from('users').select('id, name, email, role').eq('id', numId).limit(1);
        if (data && data[0]) {
          req.user = data[0];
          return next();
        }
      } catch (e) {}
    }
  }

  // 2. Check if token verification provided valid user
  if (user && user.id) {
    const numId = parseInt(user.id, 10);
    if (!isNaN(numId)) {
      try {
        const { data } = await supabase.from('users').select('id, name, email, role').eq('id', numId).limit(1);
        if (data && data[0]) {
          req.user = { ...user, ...data[0] };
          return next();
        }
      } catch (e) {}
    }
    return next();
  }

  // If no user found, fallback to employee
  req.user = user || { id: 0, role: 'Employee', name: 'Anonymous' };
  next();
}

router.use(authenticateToken);
router.use(resolveUser);

// GET /api/projects/meta/employees - List active employees for member assignment
router.get('/meta/employees', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, department, initials, photo_url, role')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.warn('Fetch meta/employees error:', err.message);
    res.json([]);
  }
});

// GET /api/projects - List projects visible to user
router.get('/', async (req, res) => {
  try {
    const scope = req.query.scope || req.headers['x-view-scope'] || null;
    const projects = await projectService.getProjectsForUser(req.user, scope);
    res.json(projects);
  } catch (err) {
    console.error('Get projects error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch projects' });
  }
});

// GET /api/projects/my-tasks - Tasks assigned to current user across all projects
router.get('/my-tasks', async (req, res) => {
  try {
    const tasks = await projectService.getMyAssignedTasks(req.user);
    res.json(tasks);
  } catch (err) {
    console.error('Get my-tasks error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch your tasks' });
  }
});

// GET /api/projects/:id - Project details with tasks, targets, and members
router.get('/:id', async (req, res) => {
  try {
    const scope = req.query.scope || req.headers['x-view-scope'] || null;
    const project = await projectService.getProjectDetails(req.params.id, req.user, scope);
    res.json(project);
  } catch (err) {
    console.error('Get project details error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch project details' });
  }
});

// POST /api/projects - Create project (Admin Only)
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      code, 
      client_name, 
      description, 
      project_manager_id, 
      project_manager_ids, 
      status, 
      priority, 
      start_date, 
      target_date, 
      members 
    } = req.body;

    const pmIds = Array.isArray(project_manager_ids) 
      ? project_manager_ids.map(Number).filter(Boolean)
      : (project_manager_id ? [parseInt(project_manager_id, 10)].filter(Boolean) : []);

    const projectData = {
      name,
      code,
      client_name,
      description,
      project_manager_id: pmIds[0] || null,
      project_manager_ids: pmIds,
      status,
      priority,
      start_date,
      target_date
    };
    const created = await projectService.createProject(projectData, members || [], req.user);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create project error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project details (Project Manager or Admin)
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, 
      code, 
      client_name, 
      description, 
      project_manager_id, 
      project_manager_ids, 
      status, 
      priority, 
      start_date, 
      target_date, 
      members 
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (client_name !== undefined) updateData.client_name = client_name;
    if (description !== undefined) updateData.description = description;

    if (project_manager_ids !== undefined) {
      const pmIds = Array.isArray(project_manager_ids) ? project_manager_ids.map(Number).filter(Boolean) : [];
      updateData.project_manager_ids = pmIds;
      updateData.project_manager_id = pmIds[0] || null;
    } else if (project_manager_id !== undefined) {
      updateData.project_manager_id = project_manager_id ? parseInt(project_manager_id, 10) : null;
      updateData.project_manager_ids = project_manager_id ? [parseInt(project_manager_id, 10)] : [];
    }

    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (target_date !== undefined) updateData.target_date = target_date;

    const updated = await projectService.updateProject(req.params.id, updateData, members, req.user);
    res.json(updated);
  } catch (err) {
    console.error('Update project error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project (Admin Only)
router.delete('/:id', async (req, res) => {
  try {
    await projectService.deleteProject(req.params.id, req.user);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to delete project' });
  }
});

// --- TARGETS ---

// POST /api/projects/:id/targets - Add target/milestone (PM or Admin)
router.post('/:id/targets', async (req, res) => {
  try {
    const { title, description, target_date } = req.body;
    const target = await projectService.addTarget(req.params.id, { title, description, target_date }, req.user);
    res.status(201).json(target);
  } catch (err) {
    console.error('Add target error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to add target' });
  }
});

// PATCH /api/projects/:id/targets/:targetId - Update or toggle target (PM or Admin)
router.patch('/:id/targets/:targetId', async (req, res) => {
  try {
    const { title, description, target_date, is_completed } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (target_date !== undefined) updateData.target_date = target_date;
    if (is_completed !== undefined) {
      updateData.is_completed = Boolean(is_completed);
      updateData.completed_at = is_completed ? new Date().toISOString() : null;
    }

    const updated = await projectService.updateTarget(req.params.id, req.params.targetId, updateData, req.user);
    res.json(updated);
  } catch (err) {
    console.error('Update target error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to update target' });
  }
});

// DELETE /api/projects/:id/targets/:targetId - Delete target (PM or Admin)
router.delete('/:id/targets/:targetId', async (req, res) => {
  try {
    await projectService.deleteTarget(req.params.id, req.params.targetId, req.user);
    res.json({ message: 'Target deleted successfully' });
  } catch (err) {
    console.error('Delete target error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to delete target' });
  }
});

// --- TASKS ---

// POST /api/projects/:id/tasks - Create and assign task (PM or Admin)
router.post('/:id/tasks', async (req, res) => {
  try {
    const scope = req.query.scope || req.headers['x-view-scope'] || null;
    const { title, description, assigned_to, priority, due_date, target_id, status } = req.body;
    const task = await projectService.createTask(req.params.id, {
      title,
      description,
      assigned_to,
      priority,
      due_date,
      target_id,
      status
    }, req.user, scope);
    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to create task' });
  }
});

// PUT /api/projects/:id/tasks/:taskId - Edit task (PM or Admin)
router.put('/:id/tasks/:taskId', async (req, res) => {
  try {
    const scope = req.query.scope || req.headers['x-view-scope'] || null;
    const { title, description, assigned_to, priority, due_date, target_id, status } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (target_id !== undefined) updateData.target_id = target_id;
    if (status !== undefined) updateData.status = status;

    const updated = await projectService.updateTask(req.params.id, req.params.taskId, updateData, req.user, scope);
    res.json(updated);
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to update task' });
  }
});

// PATCH /api/projects/:id/tasks/:taskId/status - Update task status (Team member, PM, Admin)
router.patch('/:id/tasks/:taskId/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const updated = await projectService.updateTaskStatus(req.params.id, req.params.taskId, status, req.user);
    res.json(updated);
  } catch (err) {
    console.error('Update task status error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to update task status' });
  }
});

// DELETE /api/projects/:id/tasks/:taskId - Delete task (PM or Admin)
router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    const scope = req.query.scope || req.headers['x-view-scope'] || null;
    await projectService.deleteTask(req.params.id, req.params.taskId, req.user, scope);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(err.status || 400).json({ error: err.message || 'Failed to delete task' });
  }
});

module.exports = router;
