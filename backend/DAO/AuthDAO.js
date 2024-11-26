const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

class AuthDAO {
    constructor(dbPath) {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log(`Failed to connect to database: ${err.message}`);
            } else {
                console.log('Connected to the database.');
            }
        });
    }

    register(email, name, surname, password, callback) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const sql = `INSERT INTO user (email, name, surname, password) VALUES (?, ?, ?, ?)`;
        this.db.run(sql, [email, name, surname, hashedPassword], function(err) {
            if (err) {
                return callback(err);
            }
            callback(null, { user_id: this.lastID });
        });
    }

    login(email, password, callback) {
        const sql = `SELECT * FROM user WHERE email = ?`;
        this.db.get(sql, [email], (err, row) => {
            if (err) {
                return callback(err);
            }
            if (row && bcrypt.compareSync(password, row.password)) {
                callback(null, row);
            } else {
                callback(new Error('Invalid email or password'));
            }
        });
    }

    resetPassword(email, newPassword, callback) {
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const sql = `UPDATE user SET password = ? WHERE email = ?`;
        this.db.run(sql, [hashedPassword, email], function(err) {
            if (err) {
                return callback(err);
            }
            callback(null, { changes: this.changes });
        });
    }
}

module.exports = AuthDAO;