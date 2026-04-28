import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

async function seedDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'hrms.db')
  const dataDir = path.dirname(dbPath)

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // Initialize schema
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

  // Seed demo data
  const adminPassword = await bcrypt.hash('admin123', 10)
  const employeePassword = await bcrypt.hash('employee123', 10)

  try {
    // Create admin user
    const adminStmt = db.prepare(`
      INSERT INTO users (email, password, role, password_reset_required)
      VALUES (?, ?, ?, ?)
    `)
    const adminResult = adminStmt.run('admin@municipal.gov.ph', adminPassword, 'admin', 0)
    const adminId = adminResult.lastInsertRowid

    // Create employee users
    const employeeStmt = db.prepare(`
      INSERT INTO users (email, password, role, password_reset_required)
      VALUES (?, ?, ?, ?)
    `)

    const employees = [
      { email: 'john.doe@municipal.gov.ph', name: 'John Doe' },
      { email: 'maria.santos@municipal.gov.ph', name: 'Maria Santos' },
      { email: 'pedro.garcia@municipal.gov.ph', name: 'Pedro Garcia' },
    ]

    const empRecordStmt = db.prepare(`
      INSERT INTO employee_records (
        user_id, email, first_name, last_name, position, department,
        employment_type, date_hired, phone, address, gender, salary_grade,
        base_salary, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const leaveCreditsStmt = db.prepare(`
      INSERT INTO leave_credits (employee_id)
      VALUES (?)
    `)

    for (const emp of employees) {
      const [first, last] = emp.name.split(' ')
      const userResult = employeeStmt.run(emp.email, employeePassword, 'employee', 0)
      const userId = userResult.lastInsertRowid

      const empResult = empRecordStmt.run(
        userId,
        emp.email,
        first,
        last,
        'Senior Officer',
        'Human Resources',
        'Permanent',
        '2020-01-15',
        '+63-9123456789',
        'Concepcion, Tarlac',
        'Male',
        'SG-11',
        35000,
        'Active'
      )

      leaveCreditsStmt.run(empResult.lastInsertRowid)
    }

    // Add sample attendance for today
    const today = new Date().toISOString().split('T')[0]
    const attendanceStmt = db.prepare(`
      INSERT OR IGNORE INTO attendance (
        employee_id, date_in, time_in, time_out, hours_worked, status
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    attendanceStmt.run(1, today, '08:00', '17:00', 8, 'present')
    attendanceStmt.run(2, today, '08:15', '17:00', 8, 'late')
    attendanceStmt.run(3, today, '08:00', '12:00', 4, 'half-day')

    // Add sample leave request
    const tomorrowDate = new Date()
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrow = tomorrowDate.toISOString().split('T')[0]

    const leaveStmt = db.prepare(`
      INSERT INTO leaves (
        employee_id, leave_type, date_from, date_to, days, reason, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    leaveStmt.run(1, 'Vacation Leave', tomorrow, tomorrow, 1, 'Personal matters', 'pending')

    console.log('✓ Database seeded successfully!')
    console.log('\nDemo Credentials:')
    console.log('Admin:')
    console.log('  Email: admin@municipal.gov.ph')
    console.log('  Password: admin123')
    console.log('\nEmployee:')
    console.log('  Email: john.doe@municipal.gov.ph')
    console.log('  Password: employee123')
  } catch (error) {
    console.error('Error seeding database:', error)
  }

  db.close()
}

seedDatabase()
