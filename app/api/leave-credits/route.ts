import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      vacation_leave: 15,
      sick_leave: 15,
      emergency_leave: 5,
      vacation_used: 0,
      sick_used: 0,
      emergency_used: 0
    }
  })
}
