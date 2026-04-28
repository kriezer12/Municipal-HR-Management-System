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
    const employee = db.prepare('SELECT * FROM employee_records WHERE user_id = ?').get(decoded.id)
    
    return NextResponse.json({
      success: true,
      data: employee || {}
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error' }, { status: 500 })
  }
}
