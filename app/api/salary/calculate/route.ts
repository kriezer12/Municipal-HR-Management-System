import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      basic_salary: 13000,
      net_pay: 12500,
      deductions: 500
    }
  })
}
