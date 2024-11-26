const sqlite3 = require('sqlite3').verbose();

class ProjectDAO {
    constructor(dbPath) {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log(`Failed to connect to database: ${err.message}`);
            } else {
                console.log('Connected to the database.');
            }
        });
    }

    getAllProjectsForUser(userId, callback) {
        const sql = `SELECT * FROM project WHERE user_id = ?`;
        this.db.all(sql, [userId], (err, rows) => {
            if (err) {
                return callback(err);
            }
            callback(null, rows);
        });
    }

    getAllTasksForProject(projectId, callback) {
        const sql = `SELECT * FROM task WHERE project_id = ?`;
        this.db.all(sql, [projectId], (err, rows) => {
            if (err) {
                return callback(err);
            }
            callback(null, rows);
        });
    }

    createAndSaveNewProject(projectName, projectDescription, userId, callback) {
        const sql = `INSERT INTO project (project_name, project_description, user_id) VALUES (?, ?, ?)`;
        this.db.run(sql, [projectName, projectDescription, userId], function(err) {
            if (err) {
                return callback(err);
            }
            callback(null, { project_id: this.lastID });
        });
    }

    updateProject(projectId, projectName, projectDescription, tasks, callback) {
        const sql = `UPDATE project SET project_name = ?, project_description = ? WHERE project_id = ?`;
        this.db.run(sql, [projectName, projectDescription, projectId], (err) => {
            if (err) {
                return callback(err);
            }
            const taskSql = `UPDATE task SET task_index = ?, name = ?, days = ?, start_date = ?, end_date = ?, hours = ?, worker = ?, parent = ?, previous = ? WHERE task_id = ?`;
            tasks.forEach(task => {
                this.db.run(taskSql, [task.task_index, task.name, task.days, task.start_date, task.end_date, task.hours, task.worker, task.parent, task.previous, task.task_id], (err) => {
                    if (err) {
                        return callback(err);
                    }
                });
            });
            callback(null);
        });
    }

    deleteProject(projectId, callback) {
        const deleteTasksSql = `DELETE FROM task WHERE project_id = ?`;
        this.db.run(deleteTasksSql, [projectId], (err) => {
            if (err) {
                return callback(err);
            }
            const deleteProjectSql = `DELETE FROM project WHERE project_id = ?`;
            this.db.run(deleteProjectSql, [projectId], (err) => {
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    }
}

module.exports = ProjectDAO;