import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

// Correct CORS setup according to Perplexity recommendations
function getCorsHeaders(origin?: string | null) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://gulmaran.com',
    'https://www.gulmaran.com',
    'https://mallbrf1.vercel.app',
    'https://stage.gulmaran.com',
    'https://www.stage.gulmaran.com'
  ];
  
  const requestOrigin = origin || '';
  
  // Only allow known origins - no wildcard
  if (!allowedOrigins.includes(requestOrigin)) {
    return {
      'Access-Control-Allow-Origin': 'http://localhost:3000', // fallback
      'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      // NO Access-Control-Allow-Credentials since we don't use cookies
    };
  }
  
  return {
    'Access-Control-Allow-Origin': requestOrigin, // Reflect the exact origin
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    // NO Access-Control-Allow-Credentials since we don't use cookies
  };
}

interface HSBReportItem {
  apartmentNumber: string;
  resident: string;
  email: string;
  phone: string;
  period: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface ResidentData {
  apartmentNumber: string;
  resident: string;
  phone: string;
  email: string;
  parkingSpace: string;
  storageSpace: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'excel';
    const sendEmail = url.searchParams.get('sendEmail') === 'true';
    const month = parseInt(url.searchParams.get('month') || '7'); // Default till juli
    const year = parseInt(url.searchParams.get('year') || '2025'); // Default till 2025
    const reporterName = url.searchParams.get('reporterName') || 'Kristina Utas'; // Fallback till Kristina Utas

    console.log('HSB Form request:', { format, sendEmail, month, year, reporterName, origin });

    // Check for authorization headers - if missing, provide helpful error
    const authHeader = req.headers.get('authorization');
    const apiKeyHeader = req.headers.get('apikey');
    
    console.log('Auth header present:', !!authHeader);
    console.log('API key header present:', !!apiKeyHeader);
    
    // For direct testing without frontend, provide helpful response
    if (!authHeader && !apiKeyHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing authorization header',
          message: 'This endpoint requires authentication. Use with proper headers from the frontend app.',
          testUrl: 'For testing: Use the frontend app or add headers: Authorization: Bearer [anon_key] and apikey: [anon_key]'
        }),
        { 
          status: 401, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use dynamic month and year from request parameters
    const selectedMonth = month;
    const selectedYear = year;
    
    // Calculate next month for date range (handle year rollover)
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    
    console.log(`Fetching bookings for ${selectedYear}-${String(selectedMonth).padStart(2, '0')}`);
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('startdate', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`)
      .lt('startdate', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`)
      .order('startdate', { ascending: true });

    if (error) {
      console.error('Database error:', error);
    }

    console.log(`Found ${bookings?.length || 0} bookings for current month`);

    // Transform real bookings to HSB format
    const hsbData: HSBReportItem[] = [];
    await transformBookingsToHSB(bookings || [], hsbData, selectedMonth, supabase);
    
    // Demo data removed - only real database data will be used
    console.log(`Generated ${hsbData.length} HSB items from real database data only`);

    const residentData = await getResidentDirectory(supabase);

    if (format === 'preview') {
      return new Response(
        JSON.stringify({
          hsbData,
          residentData,
          summary: {
            totalAmount: hsbData.reduce((sum, item) => sum + item.totalAmount, 0),
            totalItems: hsbData.length,
            month: selectedMonth,
            year: selectedYear
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'content-type': 'application/json' 
          } 
        }
      );
    }

    // Generate report based on format
    if (format === 'pdf') {
      const pdfBytes = await generatePDFReport(hsbData, residentData, selectedMonth, selectedYear, reporterName);
      const filename = `HSB-rapport-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`;
      
      if (sendEmail) {
        await sendEmailWithAttachment(pdfBytes, filename, 'application/pdf', selectedMonth, selectedYear, reporterName);
        return new Response(
          JSON.stringify({ success: true, message: 'HSB rapport skickad via e-post' }),
          { headers: corsHeaders }
        );
      }
      
      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else {
      // Default to Excel (CSV format)
      const csvContent = generateCSVReport(hsbData, residentData, selectedMonth, selectedYear, reporterName);
      const filename = `HSB-rapport-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`;
      
      if (sendEmail) {
        await sendEmailWithAttachment(csvContent, filename, 'text/csv', selectedMonth, selectedYear, reporterName);
        return new Response(
          JSON.stringify({ success: true, message: 'HSB rapport skickad via e-post' }),
          { headers: corsHeaders }
        );
      }
      
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

  } catch (error) {
    console.error('Error in HSB form handler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...getCorsHeaders(req.headers.get('origin')), 
          'content-type': 'application/json' 
        } 
      }
    );
  }
});

async function getApartmentNumberByName(bookingName: string, bookingEmail: string, supabase: any): Promise<string> {
  const name = bookingName?.toLowerCase().trim() || '';
  const email = bookingEmail?.toLowerCase().trim() || '';
  
  console.log(`🔍 Looking for apartment for: "${bookingName}" (${bookingEmail})`);
  
  try {
    // Try email match first (most reliable)
    if (email) {
      const { data: emailMatch } = await supabase
        .from('residents')
        .select('apartment_number')
        .eq('primary_email', bookingEmail)
        .eq('is_active', true)
        .single();
      
      if (emailMatch) {
        console.log(`✅ Found by email match: ${emailMatch.apartment_number} for "${email}"`);
        return emailMatch.apartment_number;
      }
    }
    
    // Try name matching against resident names
    if (name) {
      const { data: residents } = await supabase
        .from('residents')
        .select('apartment_number, resident_names')
        .eq('is_active', true);
      
      if (residents) {
        for (const resident of residents) {
          const residentNames = resident.resident_names.toLowerCase();
          // Check if the booking name is contained in the resident names
          if (residentNames.includes(name)) {
            console.log(`✅ Found by name match: ${resident.apartment_number} for "${name}" in "${resident.resident_names}"`);
            return resident.apartment_number;
          }
        }
        
        // Try partial matching for common name variations
        const nameWords = name.split(' ').filter(word => word.length > 2);
        for (const resident of residents) {
          const residentNames = resident.resident_names.toLowerCase();
          for (const word of nameWords) {
            if (residentNames.includes(word)) {
              console.log(`✅ Found by partial name match: ${resident.apartment_number} for word "${word}" in "${resident.resident_names}"`);
              return resident.apartment_number;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in getApartmentNumberByName:', error);
  }
  
  console.log(`❌ No apartment found for: "${bookingName}" (${bookingEmail})`);
  return 'N/A';
}

function formatBookingPeriod(startDate: Date, endDate: Date, month: number): string {
  const monthNames = ['januari', 'februari', 'mars', 'april', 'maj', 'juni',
                      'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
  
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = startDate.getMonth() + 1; // getMonth() returns 0-11
  const endMonth = endDate.getMonth() + 1; // getMonth() returns 0-11
  
  // Check if it's a single day booking (same start and end date)
  if (startDate.toDateString() === endDate.toDateString()) {
    return `${startDay} ${monthNames[startMonth - 1]}`;
  }
  
  // Check if both dates are in the same month
  if (startMonth === endMonth) {
    return `${startDay}-${endDay} ${monthNames[startMonth - 1]}`;
  }
  
  // Multi-month booking - show both months
  return `${startDay} ${monthNames[startMonth - 1]} - ${endDay} ${monthNames[endMonth - 1]}`;
}

async function transformBookingsToHSB(bookings: any[], hsbData: HSBReportItem[], month: number, supabase: any) {
  console.log('=== TRANSFORMING BOOKINGS ===');
  console.log(`Input bookings count: ${bookings.length}`);
  console.log('Raw bookings data:', JSON.stringify(bookings, null, 2));
  
  bookings.forEach((booking, index) => {
    console.log(`\n--- Processing booking ${index + 1} ---`);
    console.log('Booking data:', JSON.stringify(booking, null, 2));
    
    if (!booking.startdate || !booking.enddate) {
      console.log('❌ Missing dates, skipping');
      return;
    }
    
    const startDate = new Date(booking.startdate);
    const endDate = new Date(booking.enddate);
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`✅ Valid booking: ${booking.name}, ${nights} nights, parking: ${booking.parkering}`);
    
    if (nights > 0) {
      // Get apartment number by matching name/email to resident directory
      const apartmentNumber = await getApartmentNumberByName(booking.name, booking.email, supabase);
      
      console.log(`🏠 Apartment: ${apartmentNumber} (mapped from name: "${booking.name}")`);
      
      // Calculate week number exactly like frontend (BookingsList.tsx and BookingPage.tsx)
      // This matches the simple week calculation used in the booking page
      const yearStart = new Date(startDate.getFullYear(), 0, 1);
      const pastDaysOfYear = (startDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
      const weekNumber = Math.ceil((pastDaysOfYear + yearStart.getDay() + 1) / 7);
      
      console.log(`📅 Date: ${startDate.toISOString().split('T')[0]} → Week ${weekNumber}`);
      
      let nightlyRate = 400; // Default low season price
      if (weekNumber >= 24 && weekNumber <= 32) {
        // High season (weeks 24-32)
        if (weekNumber >= 28 && weekNumber <= 29) {
          // Tennis weeks (weeks 28-29)
          nightlyRate = 800;
        } else {
          // Regular high season
          nightlyRate = 600;
        }
      }
      
      // No special overrides needed - use standard week-based pricing
      // Tennis weeks are v.28-29 (800 kr/night)
      // High season is v.24-32 except tennis weeks (600 kr/night) 
      // Low season is all other weeks (400 kr/night)
      
      console.log(`💰 Pricing: Week ${weekNumber} → ${nightlyRate} kr/night`);

      // Guest apartment rental
      const period = formatBookingPeriod(startDate, endDate, month);
      const rentalItem = {
        apartmentNumber,
        resident: booking.name || 'Okänd',
        email: booking.email || '',
        phone: booking.phone || '',
        period: period,
        description: 'Hyra gästlägenhet',
        quantity: nights,
        unitPrice: nightlyRate,
        totalAmount: nights * nightlyRate
      };
      
      console.log('📝 Adding rental item:', JSON.stringify(rentalItem, null, 2));
      hsbData.push(rentalItem);
      
      // Add parking if included (check both string and boolean values)
      const hasParking = booking.parkering === 'true' || booking.parkering === true;
      console.log(`🚗 Parking check: ${booking.parkering} → ${hasParking}`);
      
      if (hasParking) {
        const parkingItem = {
          apartmentNumber,
          resident: booking.name || 'Okänd',
          email: booking.email || '',
          phone: booking.phone || '',
          period: period,
          description: 'Parkering',
          quantity: nights,
          unitPrice: 75.00,
          totalAmount: nights * 75.00
        };
        
        console.log('🚗 Adding parking item:', JSON.stringify(parkingItem, null, 2));
        hsbData.push(parkingItem);
      }
    }
  });
  
  console.log(`\n=== TRANSFORMATION COMPLETE ===`);
  console.log(`Final HSB data count: ${hsbData.length}`);
  console.log('Final HSB data:', JSON.stringify(hsbData, null, 2));
}

async function getResidentDirectory(supabase: any): Promise<ResidentData[]> {
  try {
    const { data: residents, error } = await supabase
      .from('residents')
      .select('*')
      .eq('is_active', true)
      .order('apartment_number');

    if (error) {
      console.error('Error fetching residents:', error);
      return []; // Return empty array on error
    }

    // Transform database format to expected interface
    return residents.map((resident: any) => ({
      apartmentNumber: `${resident.apartment_number}, ${resident.apartment_code}`,
      resident: resident.resident_names,
      phone: resident.phone || '',
      email: resident.primary_email || '',
      parkingSpace: resident.parking_space || '',
      storageSpace: resident.storage_space || ''
    }));
  } catch (error) {
    console.error('Error in getResidentDirectory:', error);
    return []; // Return empty array on error
  }
}

function generateCSVReport(hsbData: HSBReportItem[], residentData: ResidentData[], month: number, year: number, reporterName: string): Uint8Array {
  console.log('=== GENERATING CSV REPORT ===');
  console.log(`Input HSB data count: ${hsbData.length}`);
  console.log('HSB data for CSV:', JSON.stringify(hsbData, null, 2));
  
  const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
  
  let content = `HSB DEBITERINGSUNDERLAG - ${monthNames[month - 1]} ${year}\n`;
  content += `BRF Gulmåran\n`;
  content += `Uppgiftslämnare: ${reporterName}\n`;
  content += `Datum: ${new Date().toLocaleDateString('sv-SE')}\n\n`;
  
  content += `Lgh nr,Namn,Period,Vad avser avgiften,Antal,á pris,Summa\n`;
  
  console.log('CSV header created, adding data...');
  
  hsbData.forEach((item, index) => {
    const line = `${item.apartmentNumber},"${item.resident}","${item.period}","${item.description}",${item.quantity},${item.unitPrice},${item.totalAmount}\n`;
    console.log(`Adding line ${index + 1}: ${line.trim()}`);
    content += line;
  });
  
  const totalAmount = hsbData.reduce((sum, item) => sum + item.totalAmount, 0);
  content += `\nTOTAL SUMMA:,,,,,,${totalAmount}\n\n`;
  
  content += `BOENDEFÖRTECKNING\n`;
  content += `Lägenhet,Namn,P-plats,Förråd\n`;
  
  residentData.forEach(resident => {
    content += `"${resident.apartmentNumber}","${resident.resident}","${resident.parkingSpace}","${resident.storageSpace}"\n`;
  });
  
  console.log(`\n=== CSV CONTENT COMPLETE ===`);
  console.log(`Total content length: ${content.length} characters`);
  console.log('Content preview (first 500 chars):');
  console.log(content.substring(0, 500));
  console.log('Content preview (last 200 chars):');
  console.log(content.substring(Math.max(0, content.length - 200)));
  
  const bytes = new TextEncoder().encode(content);
  console.log(`Encoded to ${bytes.length} bytes`);
  
  return bytes;
}

async function generatePDFReport(hsbData: HSBReportItem[], residentData: ResidentData[], month: number, year: number, reporterName: string): Promise<Uint8Array> {
  console.log('=== GENERATING PDF REPORT ===');
  console.log(`Input HSB data count: ${hsbData.length}`);
  
  const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Add a page
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  let yPosition = height - 50;
  const margin = 50;
  const lineHeight = 14;
  
  // Header
  page.drawText('HSB DEBITERINGSUNDERLAG', {
    x: margin,
    y: yPosition,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 25;
  page.drawText(`${monthNames[month - 1]} ${year}`, {
    x: margin,
    y: yPosition,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 20;
  page.drawText('BRF Gulmåran', {
    x: margin,
    y: yPosition,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 15;
  page.drawText(`Uppgiftslämnare: ${reporterName}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 15;
  page.drawText(`Datum: ${new Date().toLocaleDateString('sv-SE')}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 30;
  
  // Table headers  
  const colWidths = [40, 90, 110, 110, 30, 50, 60];
  const colX = [margin, margin + 40, margin + 130, margin + 240, margin + 350, margin + 380, margin + 430];
  const headers = ['Lgh nr', 'Namn', 'Period', 'Vad avser avgiften', 'Antal', 'à pris', 'Summa'];
  
  // Draw header row
  headers.forEach((header, i) => {
    page.drawText(header, {
      x: colX[i],
      y: yPosition,
      size: 10,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
  });
  
  yPosition -= 18;
  
  // Draw line under headers
  page.drawLine({
    start: { x: margin, y: yPosition + 5 },
    end: { x: width - margin, y: yPosition + 5 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 10;
  
  // Data rows
  hsbData.forEach((item, index) => {
    if (yPosition < 100) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
    }
    
    const rowData = [
      item.apartmentNumber,
      item.resident.length > 13 ? item.resident.substring(0, 10) + '...' : item.resident,
      item.period.length > 20 ? item.period.substring(0, 17) + '...' : item.period,
      item.description.length > 16 ? item.description.substring(0, 13) + '...' : item.description,
      item.quantity.toString(),
      `${item.unitPrice} kr`,
      `${item.totalAmount} kr`
    ];
    
    rowData.forEach((data, i) => {
      page.drawText(data, {
        x: colX[i],
        y: yPosition,
        size: 9,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    });
    
    yPosition -= lineHeight;
  });
  
  yPosition -= 10;
  
  // Total sum
  const totalAmount = hsbData.reduce((sum, item) => sum + item.totalAmount, 0);
  page.drawLine({
    start: { x: margin, y: yPosition + 5 },
    end: { x: width - margin, y: yPosition + 5 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 15;
  page.drawText(`TOTAL SUMMA: ${totalAmount.toLocaleString('sv-SE')} kr`, {
    x: margin + 350,
    y: yPosition,
    size: 12,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 40;
  
  // Boendeförteckning section
  if (yPosition < 200) {
    const newPage = pdfDoc.addPage([595.28, 841.89]);
    yPosition = height - 50;
  }
  
  page.drawText('BOENDEFÖRTECKNING', {
    x: margin,
    y: yPosition,
    size: 16,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 25;
  
  // All resident data (with new page handling if needed)
  residentData.forEach((resident, index) => {
    // Check if we need a new page (need space for resident name + parking/storage info)
    if (yPosition < 80) {
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      page = newPage; // Update current page reference
      yPosition = height - 50;
      
      // Add continuation header on new page
      page.drawText('BOENDEFÖRTECKNING (fortsättning)', {
        x: margin,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
    }
    
    page.drawText(`${resident.apartmentNumber} - ${resident.resident}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 12;
    const parkingText = resident.parkingSpace ? `P-plats: ${resident.parkingSpace}` : 'P-plats: -';
    page.drawText(`${parkingText} | Förråd: ${resident.storageSpace}`, {
      x: margin + 20,
      y: yPosition,
      size: 9,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    yPosition -= 15;
  });
  
  // Footer
  page.drawText(`Rapport genererad: ${new Date().toLocaleString('sv-SE')} | BRF Gulmåran Bokningssystem`, {
    x: margin,
    y: 30,
    size: 8,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  console.log(`Generated PDF: ${pdfBytes.length} bytes`);
  
  return pdfBytes;
}

async function sendEmailWithAttachment(
  fileContent: Uint8Array, 
  filename: string, 
  contentType: string,
  month: number,
  year: number,
  reporterName: string
) {
  console.log('Sending email with attachment...');
  
  const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
  
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not found');
    throw new Error('Email service not configured');
  }
  
  const emailData = {
    from: 'BRF Gulmåran <noreply@brf-gulmaran.se>',
    to: ['hsb@example.com', 'gulmaranbrf@gmail.com'],
    subject: `HSB Debiteringsunderlag - BRF Gulmåran - ${monthNames[month - 1]} ${year}`,
    html: `
      <h2>HSB Debiteringsunderlag</h2>
      <p><strong>Bostadsrättsförening:</strong> BRF Gulmåran</p>
      <p><strong>Period:</strong> ${monthNames[month - 1]} ${year}</p>
      <p><strong>Uppgiftslämnare:</strong> ${reporterName}</p>
      <p><strong>Datum:</strong> ${new Date().toLocaleDateString('sv-SE')}</p>
      
      <p>Se bifogad fil för komplett debiteringsunderlag och boendeförteckning.</p>
      
      <p>Med vänliga hälsningar,<br>
      BRF Gulmåran Bokningssystem</p>
    `,
    attachments: [
      {
        filename: filename,
        content: Array.from(fileContent)
      }
    ]
  };
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', error);
      throw new Error('Failed to send email');
    }
    
    const result = await response.json();
    console.log('Email sent successfully:', result.id);
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}



 