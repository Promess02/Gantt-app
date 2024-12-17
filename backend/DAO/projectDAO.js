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

    getAllWorkersForProject(projectId, callback) {
        const sql = `SELECT * FROM worker WHERE project_id = ?`;
        this.db.all(sql, [projectId], (err, rows) => {
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

    createAndSaveNewProject(projectName, projectDescription, start_date, userId, callback) {
        const getMaxProjectIdSql = `SELECT MAX(project_id) as maxProjectId FROM project`;
        this.db.get(getMaxProjectIdSql, [], (err, row) => {
            if (err) {
                return callback(err);
            }
            const newProjectId = (row.maxProjectId || 0) + 1;
            const sql = `INSERT INTO project (project_id, project_name, project_description, user_id) VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [newProjectId, projectName, projectDescription, userId], function(err) {
                if (err) {
                    return callback(err);
                }
                const insertTaskSql = `INSERT INTO task (task_index, name, days, start_date, end_date, hours, worker, parent, previous, project_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                this.db.run(insertTaskSql, ['1', 'First task', 0, start_date, start_date, 0, '', '', '', newProjectId, ''], (err) => {
                    if (err) {
                        console.log(err);
                        return callback(err);
                    } else {
                        console.log('Task inserted: First task');
                    }
                });
                callback(null, {project_id: newProjectId});
            }.bind(this));
        });
    }

    updateProject(projectId, projectName, projectDescription, tasks, workers, callback) {
        const sql = `UPDATE project SET project_name = ?, project_description = ? WHERE project_id = ?`;
        const deleteTasksSql = `DELETE FROM task WHERE project_id = ?`;

        this.db.run(sql, [projectName, projectDescription, projectId], (err) => {
            if (err) {
                return callback(err);
            }

            const selectWorkersSql = `SELECT worker_id FROM worker WHERE project_id = ?`;
            this.db.all(selectWorkersSql, [projectId], (err, rows) => {
                if (err) {
                    return callback(err);
                }

                const existingWorkerIds = rows.map(row => row.worker_id);
                const requestWorkerIds = workers.map(worker => worker.worker_id);

                // Update existing workers
                const updateWorkerSql = `UPDATE worker SET name = ?, surname = ?, job = ?, pay = ? WHERE worker_id = ? AND project_id = ?`;
                workers.forEach(worker => {
                    if (existingWorkerIds.includes(worker.worker_id)) {
                        this.db.run(updateWorkerSql, [worker.name, worker.surname, worker.job, worker.pay, worker.worker_id, projectId], (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Worker updated:' + worker);
                            }
                        });
                    }
                });

                // Insert new workers
                const insertWorkerSql = `INSERT INTO worker (project_id, name, surname, job, pay) VALUES (?, ?, ?, ?, ?)`;
                workers.forEach(worker => {
                    if (!existingWorkerIds.includes(worker.worker_id)) {
                        this.db.run(insertWorkerSql, [projectId, worker.name, worker.surname, worker.job, worker.pay], (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Worker inserted:' + worker);
                            }
                        });
                    }
                });

                // Delete workers not in the request
                const deleteWorkerSql = `DELETE FROM worker WHERE worker_id = ? AND project_id = ?`;
                existingWorkerIds.forEach(workerId => {
                    if (!requestWorkerIds.includes(workerId)) {
                        this.db.run(deleteWorkerSql, [workerId, projectId], (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Worker deleted with id:' + workerId);
                            }
                        });
                    }
                });

                callback(null);
            });

            this.db.run(deleteTasksSql, [projectId], (err) => {
                if (err) {
                    return callback(err);
                }

                const insertTaskSql = `INSERT INTO task (task_index, name, days, start_date, end_date, hours, worker, parent, previous, project_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                tasks.forEach(task => {
                    this.db.run(insertTaskSql, [task.task_index, task.name, task.days, task.start_date, task.end_date, task.hours, task.worker, task.parent, task.previous, projectId, task.description], (err) => {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        } else {
                            console.log('Task inserted:' + task);
                        }
                    });
                });

                // callback(null);
            });
        });

    }

    changeProjectName(projectId, projectName, callback) {
        const sql = `UPDATE project SET project_name = ? WHERE project_id = ?`;
        this.db.run(sql, [projectName, projectId], (err) => {
            if (err) {
                return callback(err);
            }
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