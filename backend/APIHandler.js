const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.js');
const ProjectDAO = require('./DAO/projectDAO.js');
const AuthDAO = require('./DAO/AuthDAO.js');
const jwt = require('jsonwebtoken');

const dbPath = '../ganttifyApp.db';
const projectDAO = new ProjectDAO(dbPath);
const authDAO = new AuthDAO(dbPath);

const secretKey = 'my_secret_key';

// Register a new user
router.post('/register', (req, res) => {
    const { email, name, surname, password } = req.body;
    authDAO.register(email, name, surname, password, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const token = jwt.sign({ id: user.user_id, email: user.email }, secretKey, { expiresIn: '24h' });
        res.status(201).json(token);
    });
});

// Login a user
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    authDAO.login(email, password, (err, user) => {
        if (err) {
            return res.status(401).json({ error: err.message });
        }
        const token = jwt.sign({ id: user.user_id, email: user.email }, secretKey, { expiresIn: '24h' });
        res.status(200).json({ token, user });
    });
});

// Reset password
router.post('/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    authDAO.resetPassword(email, newPassword, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(result);
    });
});

// Get all projects for a user
router.get('/projects', authenticateToken, (req, res) => {
    const userId = req.user.id;
    projectDAO.getAllProjectsForUser(userId, (err, projects) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(projects);
    });
});

router.get('/projects/:projectId/workers', authenticateToken, (req, res) => {
    const projectId = req.params.projectId;
    projectDAO.getAllWorkersForProject(projectId, (err, workers) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(workers);
    });
});

// Get all tasks for a project
router.get('/projects/:projectId/tasks', authenticateToken, (req, res) => {
    const projectId = req.params.projectId;
    projectDAO.getAllTasksForProject(projectId, (err, tasks) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(tasks);
    });
});

// Create and save a new project
router.post('/projects', authenticateToken, (req, res) => {
    const { projectName, projectDescription } = req.body;
    const userId = req.user.id;
    projectDAO.createAndSaveNewProject(projectName, projectDescription, userId, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json(result);
    });
});

// Update a project (with all tasks updated)
router.put('/projects/:projectId', authenticateToken, (req, res) => {
    const projectId = req.params.projectId;
    const { project_name: projectName, project_description: projectDescription, tasks, workers } = req.body;
    projectDAO.updateProject(projectId, projectName, projectDescription, tasks, workers, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Project and tasks updated successfully' });
    });
});

router.put('/projects/:projectId/changeName', authenticateToken, (req, res) => {
    const projectId = req.params.projectId;
    const { project_name: projectName } = req.body;
    projectDAO.changeProjectName(projectId, projectName, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Project name updated successfully' });
    });
});

// Delete a project (with all tasks deleted)
router.delete('/projects/:projectId', authenticateToken, (req, res) => {
    const projectId = req.params.projectId;
    projectDAO.deleteProject(projectId, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Project and tasks deleted successfully' });
    });
});

module.exports = router;