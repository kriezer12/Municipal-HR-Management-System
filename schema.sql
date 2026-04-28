-- SQLite Database Schema for Municipal HR System

-- Users table
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

-- Employee records
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

-- Attendance records
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

-- Leave records
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

-- Leave balance/credits
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

-- Travel requests
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

-- Travel expenses
CREATE TABLE IF NOT EXISTS travel_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    travel_id INTEGER NOT NULL,
    expense_type TEXT,
    amount DECIMAL(10, 2),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (travel_id) REFERENCES travel_requests(id)
);

-- Payslip records
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

-- Benefits
CREATE TABLE IF NOT EXISTS benefits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Employee benefits mapping
CREATE TABLE IF NOT EXISTS employee_benefits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    benefit_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id),
    FOREIGN KEY (benefit_id) REFERENCES benefits(id)
);

-- Attendance corrections
CREATE TABLE IF NOT EXISTS attendance_corrections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date_corrected DATE NOT NULL,
    reason TEXT,
    corrected_time_in TIME,
    corrected_time_out TIME,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    document_type TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id)
);

-- Contact tickets/Helpdesk
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

-- Certificate of Employment requests
CREATE TABLE IF NOT EXISTS coe_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id)
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    head_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (head_id) REFERENCES employee_records(id)
);

-- Employment types
CREATE TABLE IF NOT EXISTS employment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Salary grades
CREATE TABLE IF NOT EXISTS salary_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade TEXT NOT NULL UNIQUE,
    step INTEGER,
    salary DECIMAL(10, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date_in);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_status ON leaves(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_travel_requests_employee ON travel_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_month ON payslips(employee_id, month, year);
CREATE INDEX IF NOT EXISTS idx_employee_records_department ON employee_records(department);
