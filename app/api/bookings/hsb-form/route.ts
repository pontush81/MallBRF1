import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response('ok', { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';
    
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform bookings for HSB format
    const hsbData = transformBookingsForHSB(bookings || []);
    
    if (format === 'excel') {
      // Generate Excel file (CSV format)
      const excelBuffer = generateExcelFile(hsbData);
      
      return new Response(excelBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="hsb-underlag-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else if (format === 'pdf') {
      // Generate PDF file (text format for now)
      const pdfBuffer = generatePDFFile(hsbData);
      
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="hsb-underlag-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use excel or pdf' },
        { status: 400, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Error generating HSB form:', error);
    return NextResponse.json(
      { error: 'Failed to generate HSB form', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

function transformBookingsForHSB(bookings: any[]) {
  // Transform booking data for HSB reporting format
  return bookings.map(booking => ({
    apartment: booking.apartment || booking.flat || '',
    resident: booking.name || '',
    email: booking.email || '',
    phone: booking.phone || '',
    booking_date: booking.date || booking.created_at,
    start_time: booking.start_time || '',
    end_time: booking.end_time || '',
    type: booking.type || 'laundry',
    status: booking.status || 'pending',
    amount: calculateBookingAmount(booking),
  }));
}

function calculateBookingAmount(booking: any): number {
  // Calculate booking amount based on type and duration
  const basePrice = booking.type === 'laundry' ? 50 : 100;
  return basePrice;
}

function generateExcelFile(data: any[]): Buffer {
  // Generate CSV format (Excel can open CSV files)
  const headers = ['Lägenhet', 'Namn', 'E-post', 'Telefon', 'Datum', 'Starttid', 'Sluttid', 'Typ', 'Status', 'Belopp'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      `"${row.apartment}"`,
      `"${row.resident}"`,
      `"${row.email}"`,
      `"${row.phone}"`,
      `"${row.booking_date}"`,
      `"${row.start_time}"`,
      `"${row.end_time}"`,
      `"${row.type}"`,
      `"${row.status}"`,
      `"${row.amount}"`
    ].join(','))
  ].join('\n');
  
  return Buffer.from('\ufeff' + csvContent, 'utf-8'); // Add BOM for proper Swedish characters
}

function generatePDFFile(data: any[]): Buffer {
  // Generate text format (can be opened as text file)
  const content = `HSB Underlag - Bokningsrapport
Genererad: ${new Date().toLocaleDateString('sv-SE')}
Antal bokningar: ${data.length}

${'='.repeat(50)}

${data.map((row, index) => 
    `Bokning ${index + 1}:
Lägenhet: ${row.apartment}
Namn: ${row.resident}
E-post: ${row.email}
Telefon: ${row.phone}
Datum: ${row.booking_date}
Tid: ${row.start_time} - ${row.end_time}
Typ: ${row.type}
Status: ${row.status}
Belopp: ${row.amount} kr
${'-'.repeat(30)}`
  ).join('\n\n')}

${'='.repeat(50)}
Totalt antal bokningar: ${data.length}
Total summa: ${data.reduce((sum, row) => sum + row.amount, 0)} kr
`;
  
  return Buffer.from(content, 'utf-8');
} 