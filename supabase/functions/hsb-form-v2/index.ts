import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

// CORS setup
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
  
  if (!allowedOrigins.includes(requestOrigin)) {
    return {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
  }
  
  return {
    'Access-Control-Allow-Origin': requestOrigin,
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
  email: string;
  parkingSpace: string;
  storageSpace: string;
}

// Get month name in Swedish
function getMonthName(month: number): string {
  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];
  return monthNames[month - 1] || 'Okänd';
}

// Get ISO week number (same logic as booking system)
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// Helper function to get apartment number from booking data
async function getApartmentNumberByName(name: string, email: string, supabase: any): Promise<string> {
  try {
    console.log(`🔍 Looking up apartment for: "${name}" (${email})`);
    
    // Get all residents to search through
    const { data: residents, error: residentError } = await supabase
      .from('residents')
      .select('apartment_number, resident_names, primary_email');
    
    if (residentError) {
      console.error('❌ Error fetching residents:', residentError);
      return '0';
    }
    
    // Clean up the name for comparison (remove extra spaces, normalize)
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, ' '); // Normalize multiple spaces
    const cleanEmail = email?.trim().toLowerCase() || '';
    
    console.log(`🔍 Searching for: "${cleanName}" or "${cleanEmail}"`);
    
    // Search through residents
    for (const resident of residents || []) {
      const residentNames = (resident.resident_names || '').toLowerCase().replace(/\s+/g, ' ');
      const residentEmail = (resident.primary_email || '').toLowerCase();
      
      // Check individual names (split by comma)
      const individualNames = residentNames.split(',').map(n => n.trim());
      for (const individualName of individualNames) {
        if (individualName) {
          // Exact match after normalization
          if (cleanName === individualName) {
            console.log(`✅ Found exact match: "${cleanName}" -> Apartment ${resident.apartment_number}`);
            return resident.apartment_number;
          }
          
          // Partial match (both directions)
          if (individualName.includes(cleanName) || cleanName.includes(individualName)) {
            console.log(`✅ Found partial match: "${cleanName}" <-> "${individualName}" -> Apartment ${resident.apartment_number}`);
            return resident.apartment_number;
          }
        }
      }
      
      // Check if email matches
      if (cleanEmail && residentEmail && (residentEmail.includes(cleanEmail) || cleanEmail.includes(residentEmail))) {
        console.log(`✅ Found match by email: ${resident.primary_email} -> Apartment ${resident.apartment_number}`);
        return resident.apartment_number;
      }
      
      // Special case for "tina" -> "Tina Utas" 
      if ((cleanName === 'tina' && individualNames.some(n => n.includes('tina'))) ||
          (cleanName.includes('tina') && individualNames.some(n => n.includes('tina')))) {
        console.log(`✅ Found "tina" match: "${cleanName}" -> Apartment ${resident.apartment_number}`);
        return resident.apartment_number;
      }
    }
    
    console.log(`❌ No apartment found for: "${name}" (${email})`);
    
    // If not found in residents, try to extract from booking data
    // Look for patterns like "Lgh 5", "Apt 5", "5" etc.
    const apartmentMatch = name.match(/(?:lgh|apt|lägenhet)\s*(\d+)/i) || name.match(/^(\d+)$/);
    if (apartmentMatch) {
      console.log(`🏠 Extracted apartment from name pattern: ${apartmentMatch[1]}`);
      return apartmentMatch[1];
    }
    
    // Default fallback
    return '0';
  } catch (error) {
    console.error('❌ Error getting apartment number:', error);
    return '0';
  }
}

// Transform bookings to HSB format
async function transformBookingsToHSB(bookings: any[], month: number, year: number, supabase: any): Promise<HSBReportItem[]> {
  console.log(`🔄 Transforming ${bookings.length} bookings to HSB format for ${month}/${year}`);
  
  const hsbData: HSBReportItem[] = [];
  
  for (const [index, booking] of bookings.entries()) {
    console.log(`📝 Processing booking ${index + 1}:`, {
      id: booking.id,
      name: booking.name,
      email: booking.email,
      startdate: booking.startdate,
      enddate: booking.enddate,
      notes: booking.notes
    });
    
    if (!booking.startdate || !booking.enddate) {
      console.log('❌ Missing dates, skipping');
      continue;
    }
    
    // Get apartment number
    const apartmentNumber = await getApartmentNumberByName(booking.name, booking.email, supabase);
    
    // Format period
    const startDate = new Date(booking.startdate);
    const endDate = new Date(booking.enddate);
    const period = `${startDate.getDate()}-${endDate.getDate()} ${getMonthName(startDate.getMonth() + 1).toLowerCase()}`;
    
    // Simple approach: Use booking system's exact calculation
    let description = 'Hyra gästlägenhet';
    
    // Calculate nights (same as booking system)
    const diffTime = endDate.getTime() - startDate.getTime();
    const nights = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Get week number for pricing
    const weekNumber = getISOWeek(startDate);
    
    // Exact same pricing as booking system
    let nightlyRate = 400; // Lågsäsong
    if (weekNumber >= 24 && weekNumber <= 32) {
      nightlyRate = (weekNumber >= 28 && weekNumber <= 29) ? 800 : 600; // Tennis eller högsäsong
    }
    
    // Calculate accommodation cost
    const accommodationAmount = nights * nightlyRate;
    
    // Add parking if applicable
    let parkingAmount = 0;
    if (booking.parkering === 'true' || booking.parkering === true || booking.parking === true) {
      parkingAmount = nights * 75;
      console.log(`🚗 Added parking: ${nights} × 75 kr = ${parkingAmount} kr`);
    }
    
    const finalAmount = accommodationAmount + parkingAmount;
    
    console.log(`💰 ${booking.name}: ${nights} nights × ${nightlyRate} kr = ${finalAmount} kr (week ${weekNumber})`);
    
    // HSB format: nights as quantity, nightly rate as unit price
    const hsbQuantity = nights;
    const hsbUnitPrice = nightlyRate;
    
    // Create accommodation item
    const accommodationItem: HSBReportItem = {
      apartmentNumber,
      resident: booking.name,
      email: booking.email,
      phone: booking.phone || '',
      period,
      description: `Hyra gästlägenhet (Lgh ${apartmentNumber})`,
      quantity: nights,
      unitPrice: nightlyRate,
      totalAmount: accommodationAmount
    };
    
    console.log('✅ Created accommodation item:', accommodationItem);
    hsbData.push(accommodationItem);
    
    // Add separate parking item if applicable
    if (parkingAmount > 0) {
      const parkingItem: HSBReportItem = {
        apartmentNumber,
        resident: booking.name,
        email: booking.email,
        phone: booking.phone || '',
        period,
        description: `Parkering (Lgh ${apartmentNumber})`,
        quantity: nights,
        unitPrice: 75,
        totalAmount: parkingAmount
      };
      
      console.log('✅ Created parking item:', parkingItem);
      hsbData.push(parkingItem);
    }
  }
  
  console.log(`✅ Transformation complete: ${hsbData.length} HSB items created`);
  
  // Group by apartment for better UX
  const groupedData = groupByApartment(hsbData);
  console.log(`📊 Grouped into ${Object.keys(groupedData).length} apartments`);
  
  return hsbData; // Return original format for now, frontend can group if needed
}

// Group HSB data by apartment number
function groupByApartment(hsbData: HSBReportItem[]): Record<string, HSBReportItem[]> {
  const grouped: Record<string, HSBReportItem[]> = {};
  
  hsbData.forEach(item => {
    const apt = item.apartmentNumber || '0';
    if (!grouped[apt]) {
      grouped[apt] = [];
    }
    grouped[apt].push(item);
  });
  
  // Sort apartments numerically
  const sortedGrouped: Record<string, HSBReportItem[]> = {};
  Object.keys(grouped)
    .sort((a, b) => {
      const numA = parseInt(a) || 999;
      const numB = parseInt(b) || 999;
      return numA - numB;
    })
    .forEach(key => {
      sortedGrouped[key] = grouped[key];
    });
  
  return sortedGrouped;
}

// Get resident data
async function getResidentData(supabase: any): Promise<ResidentData[]> {
  console.log('👥 Fetching resident data');
  
    const { data: residents, error } = await supabase
      .from('residents')
      .select('*')
    .order('apartment_number', { ascending: true });

    if (error) {
    console.error('❌ Error fetching residents:', error);
    return [];
    }

  const residentData = residents?.map((resident: any) => ({
    apartmentNumber: resident.apartment_number,
      resident: resident.resident_names,
    email: resident.primary_email,
      parkingSpace: resident.parking_space || '',
      storageSpace: resident.storage_space || ''
  })) || [];
  
  // Sort numerically by apartment number
  residentData.sort((a, b) => {
    const numA = parseInt(a.apartmentNumber) || 999;
    const numB = parseInt(b.apartmentNumber) || 999;
    return numA - numB;
  });
  
  console.log(`✅ Found ${residentData.length} residents (sorted numerically)`);
  return residentData;
}

// Generate HSB PDF format
async function generateHSBPDF(hsbData: HSBReportItem[], residentData: ResidentData[], month: number, year: number, reporterName: string): Promise<Uint8Array> {
  console.log('📄 Generating PDF format');
  
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  let yPosition = height - 50;
  const margin = 50;
  
  // Header
  page.drawText('HSB DEBITERINGSUNDERLAG', {
    x: margin,
    y: yPosition,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 25;
  page.drawText(`${getMonthName(month)} ${year}`, {
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
  
  // Table headers - Optimized layout with better spacing and room for all columns
  const colX = [margin, margin + 40, margin + 135, margin + 220, margin + 360, margin + 405, margin + 470];
  const headers = ['Lgh nr', 'Namn', 'Period', 'Beskrivning', 'Antal', 'á pris', 'Summa'];
  
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
  
  // Group data by apartment and create table with subtotals
  const apartmentGroups: { [key: string]: HSBReportItem[] } = {};
  hsbData.forEach(item => {
    if (!apartmentGroups[item.apartmentNumber]) {
      apartmentGroups[item.apartmentNumber] = [];
    }
    apartmentGroups[item.apartmentNumber].push(item);
  });
  
  // Sort apartments numerically
  const sortedApartments = Object.keys(apartmentGroups).sort((a, b) => {
    const numA = parseInt(a) || 999;
    const numB = parseInt(b) || 999;
    return numA - numB;
  });
  
  // Data rows with grouping and subtotals
  for (const apartmentNumber of sortedApartments) {
    const items = apartmentGroups[apartmentNumber];
    let apartmentSubtotal = 0;
    
    // Draw items for this apartment
    for (const item of items) {
    if (yPosition < 100) {
      // Add new page if needed
        page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
    }
    
    const rowData = [
      item.apartmentNumber,
        item.resident, // Full name without truncation
        item.period,   // Full period without truncation
        item.description, // Full description without truncation
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
    
      apartmentSubtotal += item.totalAmount;
      yPosition -= 12;
    }
    
    // Add subtotal row if more than one item for this apartment
    if (items.length > 1) {
      if (yPosition < 100) {
        // Add new page if needed for subtotal
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
      
      // Draw subtotal row with italics style
      page.drawText(`Subtotal ${items[0].resident}`, {
        x: colX[1],
        y: yPosition,
        size: 9,
        font: helveticaBoldFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      page.drawText(`${apartmentSubtotal.toLocaleString('sv-SE')} kr`, {
        x: colX[6],
        y: yPosition,
        size: 9,
        font: helveticaBoldFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      yPosition -= 18; // Extra space after subtotal
    } else {
      yPosition -= 6; // Small space between different apartments
    }
  }
  
  // Total line
  const totalAmount = hsbData.reduce((sum, item) => sum + item.totalAmount, 0);
  yPosition -= 10;
  
  page.drawLine({
    start: { x: margin, y: yPosition + 5 },
    end: { x: width - margin, y: yPosition + 5 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 15;
  page.drawText(`TOTAL SUMMA: ${totalAmount.toLocaleString('sv-SE')} kr`, {
    x: margin + 320, // Adjusted to align with new Summa column position
    y: yPosition,
    size: 12,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 40;
  
  // Boendeförteckning section
  if (yPosition < 200) {
    page = pdfDoc.addPage([595.28, 841.89]);
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
  
  // Add resident data
  residentData.forEach((resident, index) => {
    if (yPosition < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
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
    const parkingText = resident.parkingSpace ? `${resident.parkingSpace}` : '-';
    page.drawText(`${parkingText}`, {
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
  
  console.log('✅ PDF generated');
  return await pdfDoc.save();
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    });
  }
  
  try {
    console.log('🚀 HSB Form v2 function called');
    console.log('📝 Request method:', req.method);
    console.log('🔗 Request URL:', req.url);
    
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'preview';
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));
    const sendEmail = url.searchParams.get('sendEmail') === 'true';
    const reporterName = decodeURIComponent(url.searchParams.get('reporterName') || 'Admin');
    
    console.log('⚙️ Parameters:', { format, month, year, sendEmail, reporterName });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get bookings that start in the selected month (to prevent double billing)
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonthStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    console.log(`📅 Searching for bookings starting in ${monthStart} to ${nextMonthStart}`);
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('startdate', monthStart)
      .lt('startdate', nextMonthStart)
      .order('startdate', { ascending: true });

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log(`📊 Found ${bookings?.length || 0} bookings that start in ${month}/${year}`);

    // Filter bookings to only include those that START in the selected month
    // This prevents double billing for bookings that span multiple months
    const filteredBookings = (bookings || []).filter(booking => {
      if (!booking.startdate || !booking.enddate) return false;
      
      const bookingStart = new Date(booking.startdate);
      const bookingStartMonth = bookingStart.getMonth() + 1; // JavaScript months are 0-indexed
      const bookingStartYear = bookingStart.getFullYear();
      
      // Only include bookings that START in the selected month/year
      const belongsToThisMonth = bookingStartMonth === month && bookingStartYear === year;
      
      if (belongsToThisMonth) {
        console.log(`✅ Booking starts in ${month}/${year}: ${booking.name} (${booking.startdate} to ${booking.enddate})`);
      } else {
        console.log(`❌ Booking starts in ${bookingStartMonth}/${bookingStartYear}, not ${month}/${year}: ${booking.name} (${booking.startdate} to ${booking.enddate})`);
      }
      
      return belongsToThisMonth;
    });

    console.log(`🎯 Found ${filteredBookings.length} bookings that start in ${month}/${year}`);

    // Transform bookings to HSB format
    const hsbData = await transformBookingsToHSB(filteredBookings, month, year, supabase);
    
    // Get resident data
    const residentData = await getResidentData(supabase);
    
    console.log(`📈 Generated ${hsbData.length} HSB items from database`);
    
    // Handle different format requests
    switch (format) {
      case 'preview':
        console.log('👀 Returning preview data');
        return new Response(
          JSON.stringify({ hsbData, residentData }),
          { 
            status: 200,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            }
          }
        );
      
      case 'pdf':
        console.log('📄 Generating PDF format');
        const pdfBytes = await generateHSBPDF(hsbData, residentData, month, year, reporterName);
        
        return new Response(pdfBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="HSB-rapport-${getMonthName(month)}-${year}.pdf"`
          }
        });
      
      default:
        return new Response(
          JSON.stringify({ error: 'Ogiltigt format. Använd: preview eller pdf' }),
          { 
            status: 400,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            }
          }
        );
    }
    
  } catch (error) {
    console.error('❌ Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internt serverfel',
        details: error instanceof Error ? error.message : 'Okänt fel',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});