import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const db = getDB()
    const stats = db.prepare(`
      SELECT employment_type AS type, COUNT(*) as count 
      FROM employee_records 
      WHERE employment_type IS NOT NULL 
      GROUP BY employment_type 
      ORDER BY count DESC
    `).all()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching employment type stats:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching employment type data' },
      { status: 500 }
    )
  }
}
