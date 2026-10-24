const fs = require('fs');
const path = require('path');
const supabase = require('../db');

/**
 * ProjectRepository
 * Implements the Repository Pattern for Projects, Members, Targets, and Tasks.
 * Provides seamless primary persistence via Supabase PostgreSQL tables,
 * with automatic resilient file-based storage fallback if database schema is pending.
 */
class ProjectRepository {
  constructor() {
    this.fallbackDir = path.resolve(__dirname, '../data');
    this.fallbackFile = path.resolve(this.fallbackDir, 'projects_store.json');
    this.useFallback = false;
    this.initFallbackStore();
  }

  initFallbackStore() {
    if (!fs.existsSync(this.fallbackDir)) {
      fs.mkdirSync(this.fallbackDir, { recursive: true });
    }
    if (!fs.existsSync(this.fallbackFile)) {
      const initialData = {
        projects: [
          {
            id: 1,
            name: 'Helan POS Security & Barcode System',
            code: 'PRJ-POS-01',
            client_name: 'Helans Retail',
            description: 'Assess security vulnerabilities in Helan POS, fix barcode printing issues, and update bill receipt formats to meet Zoho parameters.',
            project_manager_id: 8, // Dimath Jayasinghe
            status: 'In Progress',
            priority: 'High',
            start_date: '2026-09-20',
            target_date: '2026-11-15',
            created_by: 5,
            created_at: '2026-09-20T08:00:00.000Z',
            updated_at: '2026-09-25T10:00:00.000Z',
            members: [8, 16, 24]
          },
          {
            id: 2,
            name: 'Wycherley International School GRN Module',
            code: 'PRJ-WIS-02',
            client_name: 'Wycherley International',
            description: 'Implement Good Received Note (Purchase Receive) module in Zoho Creator with custom Deluge workflows and student grade promotion function.',
            project_manager_id: 10, // Pasindu Sadeep Randula
            status: 'In Progress',
            priority: 'Medium',
            start_date: '2026-09-22',
            target_date: '2026-11-30',
            created_by: 5,
            created_at: '2026-09-22T08:00:00.000Z',
            updated_at: '2026-09-26T09:00:00.000Z',
            members: [10, 14, 26]
          }
        ],
        targets: [
          {
            id: 1,
            project_id: 1,
            title: 'Fix Barcode Printing and Template Alignment',
            description: 'Ensure zebra barcode printers output crisp readable codes with current POS templates.',
            target_date: '2026-10-25',
            is_completed: true,
            completed_at: '2026-09-28T12:00:00.000Z'
          },
          {
            id: 2,
            project_id: 1,
            title: 'Complete POS Vulnerability Assessment',
            description: 'Analyze authentication endpoints and SQL injection vectors in the POS backend.',
            target_date: '2026-11-05',
            is_completed: false,
            completed_at: null
          },
          {
            id: 3,
            project_id: 2,
            title: 'Deploy GRN Signature Workflow in Deluge',
            description: 'Add Prepared By, Checked By, and Authorized By signoff triggers on goods receipt note.',
            target_date: '2026-11-10',
            is_completed: false,
            completed_at: null
          }
        ],
        tasks: [
          {
            id: 1,
            project_id: 1,
            target_id: 1,
            title: 'Debug Barcode ESC/POS commands',
            description: 'Investigate character misalignment on ESC/POS thermal printer.',
            assigned_to: 16, // L K Prasandu Yasith
            created_by: 8,
            status: 'Completed',
            priority: 'High',
            due_date: '2026-09-28',
            completed_at: '2026-09-28T10:00:00.000Z',
            created_at: '2026-09-24T04:00:00.000Z',
            updated_at: '2026-09-28T10:00:00.000Z'
          },
          {
            id: 2,
            project_id: 1,
            target_id: 2,
            title: 'Audit Helan POS API token validation',
            description: 'Check session expiration and brute-force protection on manager login override.',
            assigned_to: 8, // Dimath Jayasinghe
            created_by: 8,
            status: 'In Progress',
            priority: 'High',
            due_date: '2026-10-28',
            completed_at: null,
            created_at: '2026-09-24T05:00:00.000Z',
            updated_at: '2026-09-28T09:00:00.000Z'
          },
          {
            id: 3,
            project_id: 1,
            target_id: 2,
            title: 'Test POS checkout offline mode',
            description: 'Simulate network disconnection and verify local SQLite sync queues.',
            assigned_to: 24, // Dulaksha Sandeepa
            created_by: 8,
            status: 'Pending',
            priority: 'Medium',
            due_date: '2026-11-02',
            completed_at: null,
            created_at: '2026-09-25T08:00:00.000Z',
            updated_at: '2026-09-25T08:00:00.000Z'
          },
          {
            id: 4,
            project_id: 2,
            target_id: 3,
            title: 'Draft Wycherley GRN Zoho Creator Form',
            description: 'Build master-detail form layout for Purchase Orders and GRN line items.',
            assigned_to: 10, // Pasindu Sadeep Randula
            created_by: 10,
            status: 'In Progress',
            priority: 'High',
            due_date: '2026-10-30',
            completed_at: null,
            created_at: '2026-09-24T10:00:00.000Z',
            updated_at: '2026-09-25T09:00:00.000Z'
          },
          {
            id: 5,
            project_id: 2,
            target_id: 3,
            title: 'Write Student Grade Promotion Deluge Script',
            description: 'Automate student advancement to the next academic year upon annual exam result confirmation.',
            assigned_to: 26, // Chathura Janaka
            created_by: 10,
            status: 'Pending',
            priority: 'Medium',
            due_date: '2026-11-12',
            completed_at: null,
            created_at: '2026-09-24T11:00:00.000Z',
            updated_at: '2026-09-24T11:00:00.000Z'
          }
        ]
      };
      fs.writeFileSync(this.fallbackFile, JSON.stringify(initialData, null, 2), 'utf8');
    }
  }

  readFallback() {
    try {
      const raw = fs.readFileSync(this.fallbackFile, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return { projects: [], targets: [], tasks: [] };
    }
  }

  writeFallback(data) {
    try {
      fs.writeFileSync(this.fallbackFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing projects fallback store:', e);
    }
  }

  isSchemaMissing(error) {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    const code = error.code || '';
    return code === 'PGRST205' || code === '42P01' || msg.includes('does not exist') || msg.includes('schema cache');
  }

  // --- PROJECTS ---

  async findAllProjects() {
    if (!this.useFallback) {
      try {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) {
          if (this.isSchemaMissing(error)) {
            this.useFallback = true;
          } else {
            throw error;
          }
        } else if (data) {
          // Fetch members for each project
          const projectIds = data.map(p => p.id);
          const { data: memberRows } = await supabase.from('project_members').select('*').in('project_id', projectIds);
          const membersMap = {};
          (memberRows || []).forEach(m => {
            if (!membersMap[m.project_id]) membersMap[m.project_id] = [];
            membersMap[m.project_id].push(m.user_id);
          });
          return data.map(p => ({
            ...p,
            members: membersMap[p.id] || []
          }));
        }
      } catch (err) {
        if (this.isSchemaMissing(err)) {
          this.useFallback = true;
        } else {
          console.warn('findAllProjects fallback triggered:', err.message);
          this.useFallback = true;
        }
      }
    }

    // Fallback store
    const store = this.readFallback();
    return store.projects || [];
  }

  async findProjectById(id) {
    const numId = parseInt(id, 10);
    const projects = await this.findAllProjects();
    return projects.find(p => p.id === numId) || null;
  }

  async createProject(projectData, memberUserIds = []) {
    const cleanedMemberIds = Array.from(new Set(memberUserIds.map(m => parseInt(m, 10)).filter(Boolean)));
    const pmId = projectData.project_manager_id ? parseInt(projectData.project_manager_id, 10) : null;
    
    // Ensure PM is also in members list if specified
    if (pmId && !cleanedMemberIds.includes(pmId)) {
      cleanedMemberIds.push(pmId);
    }

    if (!this.useFallback) {
      try {
        const insertPayload = {
          name: projectData.name,
          code: projectData.code || `PRJ-${Date.now().toString().slice(-4)}`,
          client_name: projectData.client_name || null,
          description: projectData.description || '',
          project_manager_id: pmId,
          status: projectData.status || 'In Progress',
          priority: projectData.priority || 'Medium',
          start_date: projectData.start_date || new Date().toISOString().split('T')[0],
          target_date: projectData.target_date || null,
          created_by: projectData.created_by || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('projects').insert([insertPayload]).select();
        if (error) {
          if (this.isSchemaMissing(error)) {
            this.useFallback = true;
          } else {
            throw error;
          }
        } else if (data && data[0]) {
          const newProj = data[0];
          // Insert members
          if (cleanedMemberIds.length > 0) {
            const memberInserts = cleanedMemberIds.map(uid => ({
              project_id: newProj.id,
              user_id: uid
            }));
            await supabase.from('project_members').insert(memberInserts);
          }
          return { ...newProj, members: cleanedMemberIds };
        }
      } catch (err) {
        if (this.isSchemaMissing(err)) {
          this.useFallback = true;
        } else {
          console.warn('createProject fallback triggered:', err.message);
          this.useFallback = true;
        }
      }
    }

    // Fallback store
    const store = this.readFallback();
    const newId = store.projects.length > 0 ? Math.max(...store.projects.map(p => p.id)) + 1 : 1;
    const newProject = {
      id: newId,
      name: projectData.name,
      code: projectData.code || `PRJ-${String(newId).padStart(3, '0')}`,
      client_name: projectData.client_name || null,
      description: projectData.description || '',
      project_manager_id: pmId,
      status: projectData.status || 'In Progress',
      priority: projectData.priority || 'Medium',
      start_date: projectData.start_date || new Date().toISOString().split('T')[0],
      target_date: projectData.target_date || null,
      created_by: projectData.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: cleanedMemberIds
    };
    store.projects.unshift(newProject);
    this.writeFallback(store);
    return newProject;
  }

  async updateProject(id, updateData, memberUserIds = null) {
    const numId = parseInt(id, 10);
    const pmId = updateData.project_manager_id !== undefined ? (updateData.project_manager_id ? parseInt(updateData.project_manager_id, 10) : null) : undefined;

    let cleanedMemberIds = null;
    if (memberUserIds !== null && memberUserIds !== undefined) {
      cleanedMemberIds = Array.from(new Set(memberUserIds.map(m => parseInt(m, 10)).filter(Boolean)));
      if (pmId && !cleanedMemberIds.includes(pmId)) {
        cleanedMemberIds.push(pmId);
      }
    }

    if (!this.useFallback) {
      try {
        const payload = {
          ...updateData,
          updated_at: new Date().toISOString()
        };
        if (pmId !== undefined) payload.project_manager_id = pmId;

        const { data, error } = await supabase.from('projects').update(payload).eq('id', numId).select();
        if (error) {
          if (this.isSchemaMissing(error)) {
            this.useFallback = true;
          } else {
            throw error;
          }
        } else if (data && data[0]) {
          const updated = data[0];
          if (cleanedMemberIds !== null) {
            await supabase.from('project_members').delete().eq('project_id', numId);
            if (cleanedMemberIds.length > 0) {
              const memberInserts = cleanedMemberIds.map(uid => ({
                project_id: numId,
                user_id: uid
              }));
              await supabase.from('project_members').insert(memberInserts);
            }
            updated.members = cleanedMemberIds;
          }
          return updated;
        }
      } catch (err) {
        if (this.isSchemaMissing(err)) {
          this.useFallback = true;
        } else {
          console.warn('updateProject fallback triggered:', err.message);
          this.useFallback = true;
        }
      }
    }

    // Fallback store
    const store = this.readFallback();
    const idx = store.projects.findIndex(p => p.id === numId);
    if (idx === -1) throw new Error('Project not found');

    const curr = store.projects[idx];
    const updated = {
      ...curr,
      ...updateData,
      updated_at: new Date().toISOString()
    };
    if (pmId !== undefined) updated.project_manager_id = pmId;
    if (cleanedMemberIds !== null) {
      updated.members = cleanedMemberIds;
    }
    store.projects[idx] = updated;
    this.writeFallback(store);
    return updated;
  }

  async deleteProject(id) {
    const numId = parseInt(id, 10);
    if (!this.useFallback) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', numId);
        if (error && !this.isSchemaMissing(error)) throw error;
      } catch (err) {
        if (!this.isSchemaMissing(err)) throw err;
      }
    }

    const store = this.readFallback();
    store.projects = store.projects.filter(p => p.id !== numId);
    store.targets = store.targets.filter(t => t.project_id !== numId);
    store.tasks = store.tasks.filter(t => t.project_id !== numId);
    this.writeFallback(store);
    return true;
  }

  // --- TARGETS ---

  async findTargetsByProjectId(projectId) {
    const numProjId = parseInt(projectId, 10);
    if (!this.useFallback) {
      try {
        const { data, error } = await supabase.from('project_targets').select('*').eq('project_id', numProjId).order('created_at', { ascending: true });
        if (error) {
          if (this.isSchemaMissing(error)) {
            this.useFallback = true;
          } else {
            throw error;
          }
        } else if (data) {
          return data;
        }
      } catch (err) {
        this.useFallback = true;
      }
    }

    const store = this.readFallback();
    return store.targets.filter(t => t.project_id === numProjId);
  }

  async createTarget(projectId, targetData) {
    const numProjId = parseInt(projectId, 10);
    const payload = {
      project_id: numProjId,
      title: targetData.title,
      description: targetData.description || '',
      target_date: targetData.target_date || null,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString()
    };

    if (!this.useFallback) {
      try {
        const { data, error } = await supabase.from('project_targets').insert([payload]).select();
        if (error) {
          if (this.isSchemaMissing(error)) this.useFallback = true;
          else throw error;
        } else if (data && data[0]) {
          return data[0];
        }
      } catch (err) {
        this.useFallback = true;
      }
    }

    const store = this.readFallback();
    const newId = store.targets.length > 0 ? Math.max(...store.targets.map(t => t.id)) + 1 : 1;
    const newTarget = { id: newId, ...payload };
    store.targets.push(newTarget);
    this.writeFallback(store);
    return newTarget;
  }

  async updateTarget(targetId, updateData) {
    const numId = parseInt(targetId, 10);
    if (!this.useFallback) {
      try {
        const { data, error } = await supabase.from('project_targets').update(updateData).eq('id', numId).select();
        if (error) {
          if (this.isSchemaMissing(error)) this.useFallback = true;
          else throw error;
        } else if (data && data[0]) {
          return data[0];
        }
      } catch (err) {
        this.useFallback = true;
      }
    }

    const store = this.readFallback();
    const idx = store.targets.findIndex(t => t.id === numId);
    if (idx === -1) throw new Error('Target not found');
    store.targets[idx] = { ...store.targets[idx], ...updateData };
    this.writeFallback(store);
    return store.targets[idx];
  }

  async deleteTarget(targetId) {
    const numId = parseInt(targetId, 10);
    if (!this.useFallback) {
      try {
        await supabase.from('project_targets').delete().eq('id', numId);
      } catch (err) {}
    }
    const store = this.readFallback();
    store.targets = store.targets.filter(t => t.id !== numId);
    // Unlink from tasks
    store.tasks.forEach(task => {
      if (task.target_id === numId) task.target_id = null;
    });
    this.writeFallback(store);
    return true;
  }

  // --- TASKS ---

  async findTasksByProjectId(projectId) {
    const numProjId = parseInt(projectId, 10);
    if (!this.useFallback) {
      try {
        const { data, error } = await supabase.from('tasks').select('*').eq('project_id', numProjId).order('created_at', { ascending: false });
        if (error) {
          if (this.isSchemaMissing(error)) this.useFallback = true;
          else throw error;
        } else if (data) {
          return data;
        }
      } catch (err) {
        this.useFallback = true;
      }
    }

    const store = this.readFallback();
    return store.tasks.filter(t => t.project_id === numProjId);
  }

  async findTasksByAssignee(userId) {
    const numUserId = parseInt(userId, 10);
    if (!this.useFallback) {
      try {
        const { data, error } = await supabase.from('tasks').select('*').eq('assigned_to', numUserId).order('created_at', { ascending: false });
        if (error) {
          if (this.isSchemaMissing(error)) this.useFallback = true;
          else throw error;
        } else if (data) {
          return data;
        }
      } catch (err) {
        this.useFallback = true;
      }
    }

    const store = this.readFallback();
    return store.tasks.filter(t => t.assigned_to === numUserId);
  }

  async findTaskById(taskId) {
    const numId = parseInt(taskId, 10);
    if (!this.useFallback) {
      try {
        const { data, error } = await supabase.from('tasks').select('*').eq('id', numId);
        if (error) {
          if (this.isSchemaMissing(error)) this.useFallback = true;
          else throw error;
        } else if (data && data[0]) {
          return data[0];
        }
      } catch (err) {
        this.useFallback = true;
      }
    }

    const store = this.readFallback();
    return store.tasks.find(t => t.id === numId) || null;
  }

  async createTask(taskData) {
    const payload = {
      project_id: parseInt(taskData.project_id, 10),
      target_id: taskData.target_id ? parseInt(taskData.target_id, 10) : null,
      title: taskData.title,
      description: taskData.description || '',
      assigned_to: taskData.assigned_to ? parseInt(taskData.assigned_to, 10) : null,
      created_by: taskData.created_by ? parseInt(taskData.created_by, 10) : null,
      status: taskData.status || 'Pending',
      priority: taskData.priority || 'Medium',
      due_date: taskData.due_date || null,
      completed_at: taskData.status === 'Completed' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!this.useFallback) {
      try {
        const { data, error } = await supabase.from('tasks').insert([payload]).select();
        if (error) {
          if (this.isSchemaMissing(error)) this.useFallback = true;
          else throw error;
        } else if (data && data[0]) {
          return data[0];
        }
      } catch (err) {
        this.useFallback = true;
      }
    }

    const store = this.readFallback();
    const newId = store.tasks.length > 0 ? Math.max(...store.tasks.map(t => t.id)) + 1 : 1;
    const newTask = { id: newId, ...payload };
    store.tasks.unshift(newTask);
    this.writeFallback(store);
    return newTask;
  }

  async updateTask(taskId, updateData) {
    const numId = parseInt(taskId, 10);
    const payload = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    if (updateData.status === 'Completed' && !updateData.completed_at) {
      payload.completed_at = new Date().toISOString();
    } else if (updateData.status && updateData.status !== 'Completed') {
      payload.completed_at = null;
    }

    if (!this.useFallback) {
      try {
        const { data, error } = await supabase.from('tasks').update(payload).eq('id', numId).select();
        if (error) {
          if (this.isSchemaMissing(error)) this.useFallback = true;
          else throw error;
        } else if (data && data[0]) {
          return data[0];
        }
      } catch (err) {
        this.useFallback = true;
      }
    }

    const store = this.readFallback();
    const idx = store.tasks.findIndex(t => t.id === numId);
    if (idx === -1) throw new Error('Task not found');
    store.tasks[idx] = { ...store.tasks[idx], ...payload };
    this.writeFallback(store);
    return store.tasks[idx];
  }

  async deleteTask(taskId) {
    const numId = parseInt(taskId, 10);
    if (!this.useFallback) {
      try {
        await supabase.from('tasks').delete().eq('id', numId);
      } catch (err) {}
    }
    const store = this.readFallback();
    store.tasks = store.tasks.filter(t => t.id !== numId);
    this.writeFallback(store);
    return true;
  }
}

module.exports = new ProjectRepository();
