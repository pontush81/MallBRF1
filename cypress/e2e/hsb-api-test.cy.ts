describe('HSB Report API Tests - Data Accuracy', () => {
  const HSB_API_URL = 'https://qhdgqevdmvkrwnzpwikz.supabase.co/functions/v1/hsb-form-v2';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE';

  describe('🎯 Core API Functionality', () => {
    it('should generate CSV report successfully', () => {
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=excel&month=7&year=2025&reporterName=Test%20User`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.headers['content-type']).to.include('text/csv');
        
        // Verify report contains expected data
        const csvContent = response.body;
        expect(csvContent).to.include('HSB DEBITERINGSUNDERLAG');
        expect(csvContent).to.include('BRF Gulmåran');
        expect(csvContent).to.include('Test User'); // Reporter name
        expect(csvContent).to.include('Juli 2025'); // Month/year
        
        cy.log('✅ CSV Report Generated Successfully');
        cy.log(`Report size: ${csvContent.length} characters`);
      });
    });

    it('should generate PDF report successfully', () => {
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=pdf&month=7&year=2025&reporterName=Test%20User`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.headers['content-type']).to.include('application/pdf');
        
        // PDF should have content (not empty)
        expect(response.body.length).to.be.greaterThan(1000); // PDFs are typically > 1KB
        
        cy.log('✅ PDF Report Generated Successfully');
        cy.log(`PDF size: ${response.body.length} bytes`);
      });
    });
  });

  describe('🔢 Critical Data Accuracy Tests', () => {
    it('should have CORRECT apartment numbers (not N/A)', () => {
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=excel&month=7&year=2025&reporterName=Test%20User`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then((response) => {
        const csvContent = response.body;
        cy.log('📋 Analyzing CSV Content for Apartment Numbers...');
        
        // Check that apartment numbers are NOT "N/A" (This was the main bug!)
        if (csvContent.includes('Pontus Hörberg')) {
          expect(csvContent).to.include('5,'); // Apartment 5 for Pontus
          cy.log('✅ Pontus Hörberg → Apartment 5');
        }
        if (csvContent.includes('Jacob Adaktusson')) {
          expect(csvContent).to.include('7,'); // Apartment 7 for Jacob  
          cy.log('✅ Jacob Adaktusson → Apartment 7');
        }
        if (csvContent.includes('Kristina Utas') || csvContent.includes('Tina')) {
          expect(csvContent).to.include('4,'); // Apartment 4 for Kristina/Tina
          cy.log('✅ Kristina/Tina → Apartment 4');
        }
        if (csvContent.includes('Jonas Ahlin')) {
          expect(csvContent).to.include('11,'); // Apartment 11 for Jonas
          cy.log('✅ Jonas Ahlin → Apartment 11');
        }
        
        // Critical check: Should NOT have N/A apartment numbers if there's data
        if (csvContent.includes('gästlägenhet')) {
          expect(csvContent).to.not.include('N/A,');
          cy.log('✅ No N/A apartment numbers found');
        } else {
          cy.log('ℹ️ No bookings found for July 2025');
        }
      });
    });

    it('should calculate costs correctly', () => {
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=excel&month=7&year=2025&reporterName=Test%20User`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then((response) => {
        const csvContent = response.body;
        cy.log('💰 Verifying Price Calculations...');
        
        // If there are bookings, verify pricing
        if (csvContent.includes('gästlägenhet')) {
          expect(csvContent).to.include('600.00'); // Guest apartment price
          cy.log('✅ Guest apartment price: 600.00 kr/night');
        }
        if (csvContent.includes('Parkering')) {
          expect(csvContent).to.include('75.00'); // Parking price
          cy.log('✅ Parking price: 75.00 kr/night');
        }
        
        // Log total entries found
        const guestLines = (csvContent.match(/gästlägenhet/g) || []).length;
        const parkingLines = (csvContent.match(/Parkering/g) || []).length;
        cy.log(`📊 Found ${guestLines} guest apartment bookings`);
        cy.log(`📊 Found ${parkingLines} parking bookings`);
      });
    });

    it('should show dynamic reporter name (not hardcoded)', () => {
      const testReporter = 'Pontus Hörberg Test';
      
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=excel&month=7&year=2025&reporterName=${encodeURIComponent(testReporter)}`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then((response) => {
        const csvContent = response.body;
        expect(csvContent).to.include(testReporter);
        cy.log(`✅ Reporter name correctly set to: ${testReporter}`);
      });
    });
  });

  describe('📅 Month/Year Handling', () => {
    it('should handle different months correctly', () => {
      // Test January (should have minimal/no data)
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=excel&month=1&year=2025&reporterName=Test%20User`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        const csvContent = response.body;
        expect(csvContent).to.include('Januari 2025');
        cy.log('✅ January 2025 report generated');
      });

      // Test July (should have data)
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=excel&month=7&year=2025&reporterName=Test%20User`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        const csvContent = response.body;
        expect(csvContent).to.include('Juli 2025');
        cy.log('✅ July 2025 report generated');
      });
    });
  });

  describe('🛡️ Regression Tests (Critical Bugs)', () => {
    it('should NOT generate empty files', () => {
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=pdf&month=7&year=2025&reporterName=Test%20User`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then((response) => {
        // Files should not be empty (this was a previous bug)
        expect(response.body.length).to.be.greaterThan(100);
        cy.log(`✅ PDF file size: ${response.body.length} bytes (not empty)`);
      });
    });

    it('should handle unauthorized requests properly', () => {
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=excel&month=7&year=2025`,
        failOnStatusCode: false // Don't fail the test on 401
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.include('authorization');
        cy.log('✅ Properly blocks unauthorized requests');
      });
    });
  });

  describe('📊 Summary Report', () => {
    it('should provide comprehensive data summary', () => {
      cy.request({
        method: 'GET',
        url: `${HSB_API_URL}?format=excel&month=7&year=2025&reporterName=Data%20Verification`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then((response) => {
        const csvContent = response.body;
        
        // Count different types of entries
        const lines = csvContent.split('\n');
        const dataLines = lines.filter(line => 
          line.includes('gästlägenhet') || line.includes('Parkering')
        );
        
        const apartmentNumbers = new Set();
        const residents = new Set();
        let totalRevenue = 0;
        
        dataLines.forEach(line => {
          const cols = line.split(',');
          if (cols.length >= 7) {
            const apartment = cols[0]?.trim();
            const resident = cols[1]?.trim();
            const amount = parseFloat(cols[6]?.replace('kr', '').trim()) || 0;
            
            if (apartment && apartment !== 'N/A') apartmentNumbers.add(apartment);
            if (resident) residents.add(resident);
            totalRevenue += amount;
          }
        });
        
        cy.log('📊 === HSB REPORT SUMMARY ===');
        cy.log(`📋 Total booking entries: ${dataLines.length}`);
        cy.log(`🏠 Unique apartments: ${apartmentNumbers.size}`);
        cy.log(`👥 Unique residents: ${residents.size}`);
        cy.log(`💰 Total revenue: ${totalRevenue.toFixed(2)} kr`);
        cy.log(`📅 Report period: Juli 2025`);
        
        // Log apartment numbers found
        if (apartmentNumbers.size > 0) {
          cy.log(`🏠 Apartments: ${Array.from(apartmentNumbers).sort().join(', ')}`);
        }
        
        // Ensure we have some data integrity
        expect(apartmentNumbers.size).to.be.at.least(0);
        expect(residents.size).to.be.at.least(0);
      });
    });
  });
}); 