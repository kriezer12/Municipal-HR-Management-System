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
    const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(decoded.id) as any

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    let employee = null
    if (user.role === 'employee' || user.role === 'admin') {
       employee = db.prepare('SELECT * FROM employee_records WHERE email = ?').get(user.email)
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        employee
      }
    })
  } catch (error) {
    console.error('Error fetching user info:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching user info' },
      { status: 500 }
    )
  }
}
