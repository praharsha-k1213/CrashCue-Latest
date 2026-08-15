/* global __dirname */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../data/crashcue.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        password_hash TEXT,
        firebase_uid TEXT UNIQUE,
        auth_provider TEXT DEFAULT 'local',
        profile_picture TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Training data table
      db.run(`CREATE TABLE IF NOT EXISTS training_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        input TEXT NOT NULL,
        output TEXT NOT NULL,
        category TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Conversations table
      db.run(`CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        category TEXT NOT NULL,
        confidence REAL NOT NULL,
        processing_time INTEGER,
        user_ip TEXT,
        user_agent TEXT,
        context TEXT,
        rating INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // AI stats table
      db.run(`CREATE TABLE IF NOT EXISTS ai_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stat_name TEXT UNIQUE NOT NULL,
        stat_value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Feedback table
      db.run(`CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        conversation_id INTEGER,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
      )`);

      console.log('✅ Database initialized successfully');
      resolve();
    });
  });
};

// --- USER MANAGEMENT ---

// Create user
const createUser = (userData) => {
  return new Promise((resolve, reject) => {
    const { username, email, passwordHash, fullName } = userData;
    db.run(
      `INSERT INTO users (username, email, full_name, password_hash) VALUES (?, ?, ?, ?)`,
      [username, email, fullName, passwordHash],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username, email, fullName });
        }
      }
    );
  });
};

// Find user by username
const findUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE username = ? OR email = ?`,
      [username, username],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
};

// Find user by email
const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE email = ?`,
      [email],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
};

// Get all users
const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, username, email, created_at FROM users`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Save training data
const saveTrainingData = (data) => {
  return new Promise((resolve, reject) => {
    const { input, output, category, confidence, userId } = data;

    db.run(
      `INSERT INTO training_data (user_id, input, output, category, confidence) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, input, output, category, confidence],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...data });
        }
      }
    );
  });
};

// Get training data
const getTrainingData = (options = {}) => {
  return new Promise((resolve, reject) => {
    const { userId, category, limit = 50, offset = 0 } = options;

    let query = `SELECT * FROM training_data WHERE user_id = ?`;
    let params = [userId];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM training_data WHERE user_id = ?`;
        let countParams = [userId];

        if (category) {
          countQuery += ` AND category = ?`;
          countParams.push(category);
        }

        db.get(countQuery, countParams, (err, countRow) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              data: rows,
              total: countRow.total
            });
          }
        });
      }
    });
  });
};

// Save conversation
const saveConversation = (data) => {
  return new Promise((resolve, reject) => {
    const {
      userMessage,
      aiResponse,
      category,
      confidence,
      processingTime,
      userIP,
      userAgent,
      context,
      userId = null
    } = data;

    db.run(
      `INSERT INTO conversations 
       (user_id, user_message, ai_response, category, confidence, processing_time, user_ip, user_agent, context) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, userMessage, aiResponse, category, confidence, processingTime, userIP, userAgent, context],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...data });
        }
      }
    );
  });
};

// Get conversations
const getConversations = (options = {}) => {
  return new Promise((resolve, reject) => {
    const { userId, limit = 50, offset = 0, category } = options;

    let query = `SELECT * FROM conversations WHERE user_id = ?`;
    let params = [userId];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM conversations WHERE user_id = ?`;
        let countParams = [userId];

        if (category) {
          countQuery += ` AND category = ?`;
          countParams.push(category);
        }

        db.get(countQuery, countParams, (err, countRow) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              data: rows,
              total: countRow.total
            });
          }
        });
      }
    });
  });
};

// Delete training data
const deleteTrainingData = (id, userId) => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM training_data WHERE id = ? AND user_id = ?`,
      [id, userId],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      }
    );
  });
};

// Save feedback
const saveFeedback = (data) => {
  return new Promise((resolve, reject) => {
    const { userId, conversationId, rating, comment } = data;

    db.run(
      `INSERT INTO feedback (user_id, conversation_id, rating, comment) 
       VALUES (?, ?, ?, ?)`,
      [userId, conversationId, rating, comment],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...data });
        }
      }
    );
  });
};

// Get AI statistics
const getAIStats = () => {
  return new Promise((resolve, reject) => {
    const stats = {};

    // Get total conversations
    db.get(`SELECT COUNT(*) as total FROM conversations`, (err, row) => {
      if (err) {
        reject(err);
      } else {
        stats.totalConversations = row.total;

        // Get total training data
        db.get(`SELECT COUNT(*) as total FROM training_data`, (err, row) => {
          if (err) {
            reject(err);
          } else {
            stats.totalTrainingData = row.total;

            // Get average rating
            db.get(`SELECT AVG(rating) as avg_rating FROM feedback`, (err, row) => {
              if (err) {
                reject(err);
              } else {
                stats.averageRating = row.avg_rating || 0;

                // Get category distribution
                db.all(`SELECT category, COUNT(*) as count FROM conversations GROUP BY category`, (err, rows) => {
                  if (err) {
                    reject(err);
                  } else {
                    stats.categoryDistribution = rows;
                    resolve(stats);
                  }
                });
              }
            });
          }
        });
      }
    });
  });
};

// Update AI stats
const updateAIStats = (statName, statValue) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO ai_stats (stat_name, stat_value, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [statName, statValue],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, statName, statValue });
        }
      }
    );
  });
};

// Initialize database on startup
initializeDatabase().catch(console.error);
const findUserByFirebaseUid = (firebaseUid) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE firebase_uid = ?`,
      [firebaseUid],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
};
const createOrUpdateOAuthUser = (userData) => {
  return new Promise((resolve, reject) => {
    const { firebaseUid, email, fullName, profilePicture, authProvider } = userData;
    db.get(
      `SELECT * FROM users WHERE firebase_uid = ? OR email = ?`,
      [firebaseUid, email],
      (err, existingUser) => {
        if (err) {
          reject(err);
          return;
        }
        if (existingUser) {
          db.run(
            `UPDATE users 
             SET firebase_uid = ?, full_name = ?, profile_picture = ?, 
                 auth_provider = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [firebaseUid, fullName, profilePicture, authProvider, existingUser.id],
            function (err) {
              if (err) {
                reject(err);
              } else {
                resolve({
                  id: existingUser.id,
                  username: existingUser.username,
                  email: existingUser.email,
                  fullName,
                  profilePicture,
                  authProvider
                });
              }
            }
          );
        } else {
          const username = email.split('@')[0] + '_' + Date.now();
          db.run(
            `INSERT INTO users (username, email, full_name, firebase_uid, auth_provider, profile_picture) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [username, email, fullName, firebaseUid, authProvider, profilePicture],
            function (err) {
              if (err) {
                reject(err);
              } else {
                resolve({
                  id: this.lastID,
                  username,
                  email,
                  fullName,
                  profilePicture,
                  authProvider
                });
              }
            }
          );
        }
      }
    );
  });
};

module.exports = {
  saveTrainingData,
  getTrainingData,
  saveConversation,
  getConversations,
  deleteTrainingData,
  saveFeedback,
  getAIStats,
  updateAIStats,
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserByFirebaseUid,
  createOrUpdateOAuthUser,
  getAllUsers
};
