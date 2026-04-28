import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let dbInstance: Database.Database | null = null

export function getDB(): Database.Database {
  if (!dbInstance) {
    let dbPath = path.join(process.cwd(), 'data', 'hrms.db')
    
    // In Vercel (production), the root file system is read-only.
    // We move the database to /tmp so we can write to it if needed.
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      const tmpPath = path.join('/tmp', 'hrms.db')
      if (!fs.existsSync(tmpPath)) {
        // Copy the seeded database from the project root to /tmp
        if (fs.existsSync(dbPath)) {
          fs.copyFileSync(dbPath, tmpPath)
        }
      }
      dbPath = tmpPath
    } else {
      const dataDir = path.dirname(dbPath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
    }
    
    dbInstance = new Database(dbPath)
    
    // Initialize schema if needed
    initializeDatabase(dbInstance)
  }
  
  return dbInstance
}

export function initializeDatabase(db: Database.Database) {
  db.pragma('journal_mode = WAL')
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
      password_reset_required BOOLEAN DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      middle_name TEXT,
      position TEXT,
      department TEXT,
      employment_type TEXT,
      date_hired DATE,
      date_of_birth DATE,
      phone TEXT,
      address TEXT,
      civil_status TEXT,
      gender TEXT,
      salary_grade TEXT,
      base_salary DECIMAL(10, 2),
      status TEXT DEFAULT 'active',
      photo_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date_in DATE NOT NULL,
      time_in TIME,
      time_out TIME,
      hours_worked DECIMAL(5, 2),
      status TEXT CHECK (status IN ('present', 'absent', 'late', 'half-day')),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employee_records(id),
      UNIQUE(employee_id, date_in)
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL,
      date_from DATE NOT NULL,
      date_to DATE NOT NULL,
      days DECIMAL(5, 2),
      reason TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      approved_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employee_records(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leave_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL UNIQUE,
      vacation_leave DECIMAL(5, 2) DEFAULT 15,
      sick_leave DECIMAL(5, 2) DEFAULT 15,
      emergency_leave DECIMAL(5, 2) DEFAULT 5,
      vacation_used DECIMAL(5, 2) DEFAULT 0,
      sick_used DECIMAL(5, 2) DEFAULT 0,
      emergency_used DECIMAL(5, 2) DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employee_records(id)
    );

    CREATE TABLE IF NOT EXISTS travel_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      destination TEXT NOT NULL,
      purpose TEXT,
      date_from DATE NOT NULL,
      date_to DATE NOT NULL,
      days INTEGER,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      approved_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employee_records(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contact_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      message TEXT,
      category TEXT,
      status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'closed')),
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employee_records(id)
    );

    CREATE TABLE IF NOT EXISTS payslips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      basic_salary DECIMAL(10, 2),
      allowances DECIMAL(10, 2),
      deductions DECIMAL(10, 2),
      net_pay DECIMAL(10, 2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employee_records(id),
      UNIQUE(employee_id, month, year)
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date_in);
    CREATE INDEX IF NOT EXISTS idx_leaves_employee_status ON leaves(employee_id, status);
    CREATE INDEX IF NOT EXISTS idx_travel_requests_employee ON travel_requests(employee_id);
    CREATE INDEX IF NOT EXISTS idx_payslips_employee_month ON payslips(employee_id, month, year);
    CREATE INDEX IF NOT EXISTS idx_employee_records_department ON employee_records(department);
  `)
}
