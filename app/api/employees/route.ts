import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const db = getDB()
    const rawEmployees = db.prepare('SELECT * FROM employee_records ORDER BY id DESC').all()
    
    const employees = rawEmployees.map((emp: any) => ({
      ...emp,
      fullName: `${emp.first_name} ${emp.last_name}`,
      employment: emp.employment_type,
      // Ensure other fields are present if needed by frontend
      name: `${emp.first_name} ${emp.last_name}`
    }))
    
    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching employee data' },
      { status: 500 }
    )
  }
}
