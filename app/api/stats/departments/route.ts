import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const db = getDB()
    const stats = db.prepare(`
      SELECT department, COUNT(*) as count 
      FROM employee_records 
      WHERE department IS NOT NULL 
      GROUP BY department 
      ORDER BY count DESC
    `).all()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching department stats:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching department data' },
      { status: 500 }
    )
  }
}
