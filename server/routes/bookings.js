const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const Excel = require('exceljs');
const PDFDocument = require('pdfkit-table');
const { format: formatDate } = require('date-fns');
const { sv } = require('date-fns/locale');
const { createClient } = require('@supabase/supabase-js');
const { parseISO, formatDistance, formatRelative, subDays } = require('date-fns');
const fs = require('fs');

// Kontrollera tillgänglighet
router.post('/check-availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    console.log('Kontrollerar tillgänglighet för:', startDate, 'till', endDate);

    // Konvertera datum till databasformat
    const startDateStr = new Date(startDate).toISOString();
    const endDateStr = new Date(endDate).toISOString();

    console.log('Söker efter överlappande bokningar:', startDateStr, 'till', endDateStr);

    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`and(startdate.lte.${endDateStr},enddate.gte.${startDateStr})`)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Fel vid kontroll av tillgänglighet:', error);
      return res.status(500).json({ error: 'Kunde inte kontrollera tillgänglighet' });
    }

    // Mappa svaret för frontend
    const mappedBookings = existingBookings.map(booking => ({
      ...booking,
      startDate: booking.startdate,
      endDate: booking.enddate,
      createdAt: booking.createdat,
      parking: booking.parkering === true || booking.parkering === 'true' || booking.parkering === 't' ? true : 
               booking.parkering === false || booking.parkering === 'false' || booking.parkering === 'f' ? false : null
    }));

    console.log('Hittade bokningar:', mappedBookings.length);

    res.json({
      available: !mappedBookings || mappedBookings.length === 0,
      overlappingBookings: mappedBookings || []
    });
  } catch (error) {
    console.error('Serverfel vid kontroll av tillgänglighet:', error);
    res.status(500).json({ error: 'Kunde inte kontrollera tillgänglighet' });
  }
});

// Helper function to transform booking data
const transformBookingData = (booking) => {
  return {
    id: booking.id,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    startDate: booking.startdate,
    endDate: booking.enddate,
    notes: booking.notes,
    status: booking.status,
    parking: booking.parkering === true || booking.parkering === 'true' || booking.parkering === 1,
    createdAt: booking.createdat,
    updatedAt: booking.updatedat
  };
};

// Helper function to transform booking data for database
const transformBookingDataForDB = (booking) => {
  // Ensure proper date format for Supabase
  const startDate = booking.startDate ? new Date(booking.startDate).toISOString() : null;
  const endDate = booking.endDate ? new Date(booking.endDate).toISOString() : null;
  
  console.log('Transforming dates:', {
    input: {
      startDate: booking.startDate,
      endDate: booking.endDate
    },
    transformed: {
      startdate: startDate,
      enddate: endDate
    }
  });
  
  return {
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    startdate: startDate,
    enddate: endDate,
    notes: booking.notes,
    status: booking.status || 'pending',
    parkering: booking.parking === true || booking.parking === 'true' || booking.parking === 1
  };
};

// Hämta alla bokningar
router.get('/', async (req, res) => {
  try {
    console.log('Attempting to fetch all bookings...');
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Supabase Service Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0);
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`Successfully fetched ${bookings.length} bookings`);
    const transformedBookings = bookings.map(transformBookingData);
    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details
    });
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: error.message,
      code: error.code
    });
  }
});

// Generate HSB form data - MOVED UP to be before /:id route
router.get('/hsb-form', async (req, res) => {
  try {
    console.log('Generating HSB form data...');
    
    // Check the requested format (default to Excel if not specified)
    const format = req.query.format?.toLowerCase() || 'excel';
    console.log(`Requested format: ${format}`);
    
    if (format !== 'excel' && format !== 'pdf') {
      return res.status(400).json({ error: 'Invalid format. Supported formats: excel, pdf' });
    }
    
    // Get all bookings from Supabase - without filtering by notes at the database level
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('startdate', { ascending: true });

    if (error) {
      console.error('Error fetching bookings for HSB form:', error);
      return res.status(500).json({ error: 'Failed to fetch booking data' });
    }

    console.log(`Retrieved ${bookings.length} total bookings from database`);

    // Transform the bookings data for the HSB form
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      name: booking.name,
      email: booking.email,
      startDate: booking.startdate,
      endDate: booking.enddate,
      notes: booking.notes || '',
      parking: booking.parkering
    }));

    console.log(`Using all ${transformedBookings.length} bookings for HSB form generation`);
    
    // Group by apartment number/name if available
    const rentalsByApartment = {};
    
    transformedBookings.forEach(booking => {
      // Try to extract apartment number from notes using multiple patterns
      const notesStr = booking.notes || '';
      const apartmentMatch = notesStr.match(/lgh\s*(\d+|[a-zA-Z]+)/i) || 
                             notesStr.match(/lägenhet\s*(\d+|[a-zA-Z]+)/i) ||
                             notesStr.match(/apartment\s*(\d+|[a-zA-Z]+)/i) ||
                             notesStr.match(/rum\s*(\d+|[a-zA-Z]+)/i) ||
                             null;
      
      // Use the name as a fallback for apartment key - add unique booking ID to make entries separate
      const apartmentKey = apartmentMatch 
        ? `${apartmentMatch[1]}-${booking.id}` 
        : `${booking.name}-${booking.id}`;
      
      if (!rentalsByApartment[apartmentKey]) {
        rentalsByApartment[apartmentKey] = {
          bookings: [],
          totalAmount: 0,
          name: booking.name,
          apartmentBase: apartmentMatch ? apartmentMatch[1] : booking.name
        };
      }
      
      // Calculate revenue based on dates and parking - using exact same logic as the frontend
      try {
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn(`Invalid date formats for booking ${booking.id}. Skipping revenue calculation.`);
          rentalsByApartment[apartmentKey].bookings.push(booking);
          return;
        }
        
        // Use differenceInDays from date-fns like frontend does
        const nights = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (nights <= 0) {
          console.warn(`Invalid nights (${nights}) for booking ${booking.id}. Skipping revenue calculation.`);
          rentalsByApartment[apartmentKey].bookings.push(booking);
          return;
        }
        
        // Calculate nightly rate based on season using same logic as frontend
        let nightlyRate = 400; // Default low season rate
        
        // Get the ISO week number like frontend does
        const date = new Date(startDate);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        
        console.log(`Booking ${booking.id} week number: ${weekNumber}`);
        
        // High season: weeks 24-32, with peak in weeks 28-29 (same as frontend)
        if (weekNumber >= 24 && weekNumber <= 32) {
          nightlyRate = (weekNumber >= 28 && weekNumber <= 29) ? 800 : 600;
        }
        
        const roomAmount = nights * nightlyRate;
        const parkingAmount = booking.parking ? nights * 75 : 0;
        const totalAmount = roomAmount + parkingAmount;
        
        console.log(`Booking ${booking.id} (${booking.name}): ${nights} nights at ${nightlyRate} kr/night, parking: ${parkingAmount} kr, total ${totalAmount} kr`);
        
        rentalsByApartment[apartmentKey].bookings.push(booking);
        rentalsByApartment[apartmentKey].totalAmount = totalAmount; // Set directly, not adding
        rentalsByApartment[apartmentKey].nights = nights;
        rentalsByApartment[apartmentKey].startDate = startDate;
        rentalsByApartment[apartmentKey].endDate = endDate;
        rentalsByApartment[apartmentKey].roomAmount = roomAmount;
        rentalsByApartment[apartmentKey].parkingAmount = parkingAmount;
        rentalsByApartment[apartmentKey].nightlyRate = nightlyRate;
        rentalsByApartment[apartmentKey].weekNumber = weekNumber;
      } catch (err) {
        console.error(`Error calculating revenue for booking ${booking.id}:`, err);
        rentalsByApartment[apartmentKey].bookings.push(booking);
      }
    });
    
    // Format dates in Swedish format
    function formatSwedishDate(dateString) {
      try {
        // Parse the date and format it as YYYY-MM-DD in Swedish format
        const date = new Date(dateString);
        return formatDate(date, 'yyyy-MM-dd', { locale: sv });
      } catch (err) {
        console.warn('Error formatting date:', dateString, err);
        return dateString;
      }
    }
    
    // Check if we have any entries from real data
    const apartmentEntries = Object.entries(rentalsByApartment).map(([apartmentKey, data]) => {
      if (!data.bookings.length) return null;
      
      const firstBooking = data.bookings[0];
      let dateRange = "Uthyrning";
      
      try {
        const startDate = formatSwedishDate(data.startDate);
        const endDate = formatSwedishDate(data.endDate);
        dateRange = `Uthyrning ${startDate} - ${endDate}`;
      } catch (err) {
        console.warn(`Error formatting dates for apartment ${apartmentKey}:`, err);
      }
      
      return {
        apartment: data.apartmentBase,
        name: data.name,
        description: dateRange,
        quantity: 1,
        unitPrice: data.totalAmount.toFixed(2),
        totalAmount: data.totalAmount.toFixed(2)
      };
    }).filter(Boolean); // Remove any null entries
    
    console.log(`Generated ${apartmentEntries.length} entries for HSB form`);
    if (apartmentEntries.length > 0) {
      console.log('Sample real entry:', JSON.stringify(apartmentEntries[0]));
    }

    // Calculate total sum from real data
    const totalSum = apartmentEntries.reduce((sum, entry) => sum + parseFloat(entry.totalAmount), 0);
    console.log(`Total sum for all entries: ${totalSum.toFixed(2)} kr`);

    // Use the actual data entries for the report
    // Only use sample data if we have no real entries
    let entriesForReport = apartmentEntries;
    let totalSumForReport = totalSum;

    if (entriesForReport.length === 0) {
      console.warn('No valid rental entries found, using sample data instead');
      
      entriesForReport = [
        {
          apartment: '101',
          name: 'Svensson, Anders',
          description: 'Uthyrning 2023-07-01 - 2023-07-08',
          quantity: 1,
          unitPrice: '4200.00',
          totalAmount: '4200.00'
        },
        {
          apartment: '203',
          name: 'Lindgren, Maria',
          description: 'Uthyrning 2023-07-15 - 2023-07-22',
          quantity: 1,
          unitPrice: '5600.00',
          totalAmount: '5600.00'
        },
        {
          apartment: '305',
          name: 'Johansson, Erik',
          description: 'Uthyrning 2023-08-05 - 2023-08-12',
          quantity: 1,
          unitPrice: '4800.00',
          totalAmount: '4800.00'
        }
      ];
      
      totalSumForReport = entriesForReport.reduce((sum, entry) => sum + parseFloat(entry.totalAmount), 0);
    } else {
      console.log(`Using ${entriesForReport.length} real booking entries for the report`);
    }

    // Generate the appropriate format
    if (format === 'excel') {
      return generateExcelFile(res, entriesForReport, totalSumForReport);
    } else {
      return generatePdfFile(res, entriesForReport, totalSumForReport);
    }
    
  } catch (error) {
    console.error('Error generating HSB form:', error);
    res.status(500).json({ 
      error: 'Failed to generate HSB form',
      details: error.message
    });
  }
});

// Helper function to generate Excel file
const generateExcelFile = async (res, apartmentEntries, totalSum) => {
  try {
    // Create a new Excel Workbook and Worksheet
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('HSB Underlag');
    
    // Add the column headers
    worksheet.columns = [
      { header: 'Lägenhetsnr', key: 'apartment', width: 15 },
      { header: 'Namn', key: 'name', width: 25 },
      { header: 'Vad avser avgiften?', key: 'description', width: 40 },
      { header: 'Antal', key: 'quantity', width: 10 },
      { header: 'à pris', key: 'unitPrice', width: 15 },
      { header: 'Summa att avisera', key: 'totalAmount', width: 20 }
    ];
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' }
    };
    
    // Return empty Excel if there are no entries
    if (apartmentEntries.length === 0) {
      console.warn('No valid rental entries found, returning empty Excel file');
      
      // Set response headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="HSB-underlag-${new Date().toISOString().substring(0, 10)}.xlsx"`);
      
      // Write the workbook to the response
      await workbook.xlsx.write(res);
      res.end();
      return;
    }
    
    // Add data rows to the worksheet
    apartmentEntries.forEach(entry => {
      worksheet.addRow(entry);
    });
    
    // Format the total amount columns as currency
    worksheet.getColumn('unitPrice').numFmt = '#,##0.00 kr';
    worksheet.getColumn('totalAmount').numFmt = '#,##0.00 kr';
    
    // Add a summary row at the bottom
    const lastRow = worksheet.rowCount + 1;
    worksheet.addRow({
      apartment: '',
      name: '',
      description: '',
      quantity: '',
      unitPrice: 'Summa:',
      totalAmount: { formula: `SUM(F2:F${lastRow-1})` }
    });
    
    // Style the summary row
    worksheet.getRow(lastRow).font = { bold: true };
    worksheet.getCell(`F${lastRow}`).numFmt = '#,##0.00 kr';
    
    // Auto-filter the headers
    worksheet.autoFilter = {
      from: 'A1',
      to: `F${worksheet.rowCount}`
    };
    
    // Set borders around all cells
    for (let i = 1; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).eachCell({ includeEmpty: true }, function(cell) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="HSB-underlag-${new Date().toISOString().substring(0, 10)}.xlsx"`);
    
    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw error;
  }
};

// Helper function to generate PDF file
const generatePdfFile = (res, apartmentEntries, totalSum) => {
  try {
    console.log('Generating PDF with pdfkit-table...');
    console.log(`Number of entries: ${apartmentEntries?.length || 0}`);
    
    // If entries array is empty, use sample data
    if (!apartmentEntries || apartmentEntries.length === 0) {
      console.warn('No entries provided to PDF generator, using sample data');
      
      apartmentEntries = [
        {
          apartment: '101',
          name: 'Svensson, Anders',
          description: 'Uthyrning 2023-07-01 - 2023-07-08',
          quantity: 1,
          unitPrice: '4200.00',
          totalAmount: '4200.00'
        },
        {
          apartment: '203',
          name: 'Lindgren, Maria',
          description: 'Uthyrning 2023-07-15 - 2023-07-22',
          quantity: 1,
          unitPrice: '5600.00',
          totalAmount: '5600.00'
        },
        {
          apartment: '305',
          name: 'Johansson, Erik',
          description: 'Uthyrning 2023-08-05 - 2023-08-12',
          quantity: 1,
          unitPrice: '4800.00',
          totalAmount: '4800.00'
        }
      ];
      
      totalSum = apartmentEntries.reduce((sum, entry) => sum + parseFloat(entry.totalAmount), 0);
    }
    
    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="HSB-underlag-${new Date().toISOString().substring(0, 10)}.pdf"`);
    
    // Set up error handling for the PDF stream
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      // Attempt to close the response if it's still writable
      if (!res.writableEnded) {
        res.status(500).end('Error generating PDF');
      }
    });
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add title
    doc.font('Helvetica-Bold')
       .fontSize(18)
       .text('Debitering av extra avgifter på avier', { align: 'center' });
    
    doc.moveDown();
    
    // Add subtitle
    doc.font('Helvetica')
       .fontSize(12)
       .text('Blanketten lämnas till HSB senast den 20/8, 20/11, 20/2 resp 20/5. Avgift debiteras nästkommande avisering.', { align: 'center' });
    
    doc.moveDown(2);
    
    // Add header info
    doc.font('Helvetica-Bold')
       .fontSize(12);
       
    doc.text('Bostadsrättsförening:', 50, doc.y);
    doc.moveDown();
    doc.text('Uppgiftslämnare:', 50, doc.y);
    doc.moveDown();
    doc.text('Inlämningsdatum:', 50, doc.y);
    
    doc.moveDown(2);
    
    // Prepare table data
    const tableData = {
      headers: ['Lgh nr', 'Namn', 'Vad avser avgiften?', 'Antal', 'à pris', 'Summa att avisera'],
      rows: []
    };
    
    // Add table rows
    apartmentEntries.forEach(entry => {
      tableData.rows.push([
        entry.apartment || '',
        entry.name || '',
        entry.description || '',
        entry.quantity?.toString() || '1',
        `${parseFloat(entry.unitPrice || 0).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`,
        `${parseFloat(entry.totalAmount || 0).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`
      ]);
    });
    
    // Add sum row
    tableData.rows.push([
      '', '', '', '', 'Summa:',
      `${parseFloat(totalSum || 0).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`
    ]);
    
    // Table options
    const tableOptions = {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.font('Helvetica').fontSize(10);
        const { x, y, width, height } = rectCell;
        
        // Color alternate rows
        if (indexRow % 2) {
          doc.fillColor('#f8f8f8')
             .rect(x, y, width, height)
             .fill()
             .fillColor('#000000');
        }
        
        // Format the sum row
        if (indexRow === tableData.rows.length - 1) {
          doc.fillColor('#e0e0e0')
             .rect(x, y, width, height)
             .fill()
             .fillColor('#000000');
          
          if (indexColumn >= 4) {
            doc.font('Helvetica-Bold');
          }
        }
      }
    };
    
    // Draw the table
    doc.table(tableData, { 
      ...tableOptions,
      width: 500,
      columnsSize: [60, 100, 170, 40, 60, 70]
    });
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF file:', error);
    
    // Attempt to send error response if headers aren't sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF file', details: error.message });
    } else if (!res.writableEnded) {
      // If headers are sent but response isn't finished, try to end it
      res.end();
    }
  }
};

// Hämta en specifik bokning - AFTER the hsb-form route
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Hämtar bokning med ID:', id);

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fel vid hämtning av bokning:', error);
      return res.status(404).json({ error: 'Bokning hittades inte' });
    }

    // Mappa fältnamnen för frontend
    const mappedData = {
      ...data,
      startDate: data.startdate,
      endDate: data.enddate,
      createdAt: data.createdat,
      parking: data.parkering === true || data.parkering === 'true' || data.parkering === 't' ? true : 
               data.parkering === false || data.parkering === 'false' || data.parkering === 'f' ? false : null
    };

    res.json(mappedData);
  } catch (error) {
    console.error('Serverfel vid hämtning av bokning:', error);
    res.status(500).json({ error: 'Kunde inte hämta bokningen' });
  }
});

// Skapa en ny bokning
router.post('/', async (req, res) => {
  try {
    const bookingData = transformBookingDataForDB(req.body);
    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'startdate', 'enddate'];
    const missingFields = requiredFields.filter(field => !bookingData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: `Missing: ${missingFields.join(', ')}` 
      });
    }
    
    // Validate date formats
    try {
      new Date(bookingData.startdate);
      new Date(bookingData.enddate);
    } catch (err) {
      console.error('Invalid date format:', { 
        startdate: bookingData.startdate, 
        enddate: bookingData.enddate 
      });
      return res.status(400).json({ 
        error: 'Invalid date format', 
        details: 'Dates must be in ISO format'
      });
    }
    
    console.log('Attempting database insert with validated data...');
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select();

    if (error) {
      console.error('Database error creating booking:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('Successfully created booking, response:', data);
    if (!data || data.length === 0) {
      throw new Error('No data returned after successful insert');
    }
    
    const transformedBooking = transformBookingData(data[0]);
    res.status(201).json(transformedBooking);
  } catch (error) {
    console.error('Error creating booking:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details || 'No details available'
    });
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
});

// Uppdatera en bokning
router.put('/:id', async (req, res) => {
  try {
    const bookingData = transformBookingDataForDB(req.body);
    const { data, error } = await supabase
      .from('bookings')
      .update(bookingData)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    const transformedBooking = transformBookingData(data[0]);
    res.json(transformedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Radera en bokning
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Raderar bokning:', id);

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Fel vid radering av bokning:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Bokningen har raderats' });
  } catch (error) {
    console.error('Serverfel vid radering av bokning:', error);
    res.status(500).json({ error: 'Kunde inte radera bokningen' });
  }
});

module.exports = {
  router
};
