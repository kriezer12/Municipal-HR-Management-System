import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    data: [
      { id: 1, grade: '1', step1: 13000, step2: 13100, step3: 13200, step4: 13300, step5: 13400, step6: 13500, step7: 13600, step8: 13700 }
    ]
  })
}
