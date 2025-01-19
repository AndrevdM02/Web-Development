import pg from 'pg';
const {Pool} = pg;
import dotenv from 'dotenv';

dotenv.config();
console.log("DEBUG: DB_USER: " + process.env.DB_USER);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 18224,  //Number(process.env.DB_PORT) || 5432,
  
});

// pool.connect((err, client, release) => {
//     if (err) {
//         console.error('Error connecting to the database:', err.stack);
//         return;
//     }
//     console.log('Established connection to database.');
//     release();
//     console.log('Released database connection.')
// });

export default pool;
