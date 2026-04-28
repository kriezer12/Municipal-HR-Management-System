import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import jwt from 'jwt-simple'

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-prod'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.decode(token, SECRET_KEY)
    
    const db = getDB()
    const employee = db.prepare('SELECT id FROM employee_records WHERE user_id = ?').get(decoded.id) as any
    
    if (!employee) {
      return NextResponse.json({ success: true, data: [] })
    }

    const attendance = db.prepare('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date_in DESC').all(employee.id)
    
    return NextResponse.json({
      success: true,
      data: attendance
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching attendance data' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.decode(token, SECRET_KEY)
    
    const db = getDB()
    const employee = db.prepare('SELECT id FROM employee_records WHERE user_id = ?').get(decoded.id) as any
    
    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee record not found' }, { status: 404 })
    }

    const { action } = await req.json()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().split(' ')[0]

    if (action === 'clock-in') {
      db.prepare(`
        INSERT INTO attendance (employee_id, date_in, time_in, status)
        VALUES (?, ?, ?, 'present')
      `).run(employee.id, today, now)
    } else if (action === 'clock-out') {
      db.prepare(`
        UPDATE attendance 
        SET time_out = ?, hours_worked = 8 -- Simplification for demo
        WHERE employee_id = ? AND date_in = ?
      `).run(now, employee.id, today)
    }

    return NextResponse.json({ success: true, message: 'Attendance updated' })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { success: false, message: 'Error updating attendance' },
      { status: 500 }
    )
  }
}
