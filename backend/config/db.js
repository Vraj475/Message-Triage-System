const mongoose = require('mongoose');

/**
 * Masks credentials in a MongoDB URI for safe logging.
 * Turns mongodb://user:pass@host/db into mongodb://***:***@host/db
 */
function maskUri(uri) {
  if (!uri) return '(not set)';
  try {
    const url = new URL(uri);
    if (url.username) url.username = '***';
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    // If URL parsing fails, just show the host part
    return uri.replace(/\/\/.*@/, '//***:***@');
  }
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in environment variables');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    const dbName = conn.connection.db.databaseName;
    console.log(`MongoDB connected: ${maskUri(uri)} (database: ${dbName})`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
