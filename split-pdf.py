#!/usr/bin/env python3
"""
PDF Splitter för Gulmåran-GPT
Delar upp stora PDF:er i mindre delar som kan laddas upp i systemet
"""

import os
import sys
from pathlib import Path

try:
    from PyPDF2 import PdfReader, PdfWriter
except ImportError:
    print("PyPDF2 krävs. Installera med: pip install PyPDF2")
    sys.exit(1)

def split_pdf(input_path, output_dir, pages_per_chunk=20, max_size_mb=8):
    """
    Delar upp en PDF i mindre delar
    
    Args:
        input_path: Sökväg till original PDF
        output_dir: Mapp där delade filer ska sparas
        pages_per_chunk: Antal sidor per del (standard: 20)
        max_size_mb: Max storlek per del i MB (standard: 8MB)
    """
    
    input_path = Path(input_path)
    output_dir = Path(output_dir)
    
    if not input_path.exists():
        print(f"❌ Filen {input_path} hittades inte!")
        return False
    
    # Skapa output-mapp
    output_dir.mkdir(exist_ok=True)
    
    try:
        # Läs PDF
        print(f"📖 Läser PDF: {input_path.name}")
        reader = PdfReader(str(input_path))
        total_pages = len(reader.pages)
        
        print(f"📄 Total antal sidor: {total_pages}")
        
        # Beräkna antal delar
        chunks_needed = (total_pages + pages_per_chunk - 1) // pages_per_chunk
        print(f"🔢 Delar PDF i {chunks_needed} delar ({pages_per_chunk} sidor per del)")
        
        # Dela upp PDF
        for chunk_num in range(chunks_needed):
            start_page = chunk_num * pages_per_chunk
            end_page = min(start_page + pages_per_chunk, total_pages)
            
            # Skapa ny PDF-writer
            writer = PdfWriter()
            
            # Lägg till sidor
            for page_num in range(start_page, end_page):
                writer.add_page(reader.pages[page_num])
            
            # Skapa filnamn
            base_name = input_path.stem
            output_filename = f"{base_name}_del_{chunk_num + 1}_av_{chunks_needed}_sidor_{start_page + 1}-{end_page}.pdf"
            output_path = output_dir / output_filename
            
            # Spara del
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
            
            # Kontrollera filstorlek
            file_size_mb = output_path.stat().st_size / (1024 * 1024)
            
            if file_size_mb > max_size_mb:
                print(f"⚠️  {output_filename}: {file_size_mb:.1f}MB (över {max_size_mb}MB gräns)")
            else:
                print(f"✅ {output_filename}: {file_size_mb:.1f}MB")
        
        print(f"\n🎉 Klar! {chunks_needed} delar skapade i: {output_dir}")
        print(f"\n📋 Nästa steg:")
        print(f"1. Gå till {output_dir}")
        print(f"2. Ladda upp varje del separat i Gulmåran-GPT")
        print(f"3. Ge beskrivande titlar (t.ex. 'Protokoll Del 1 av {chunks_needed}')")
        
        return True
        
    except Exception as e:
        print(f"❌ Fel vid bearbetning: {e}")
        return False

def main():
    # Sökvägar
    downloads_dir = Path.home() / "Downloads"
    input_file = downloads_dir / "samling_av_pdf.pdf"
    output_dir = downloads_dir / "gulmaran_pdf_delar"
    
    print("🔧 Gulmåran-GPT PDF Splitter")
    print("=" * 40)
    
    # Kontrollera om filen finns
    if not input_file.exists():
        print(f"❌ Filen hittades inte: {input_file}")
        print(f"\n🔍 Letar efter PDF-filer i Downloads...")
        
        # Lista PDF-filer i Downloads
        pdf_files = list(downloads_dir.glob("*.pdf"))
        if pdf_files:
            print(f"\n📁 Hittade dessa PDF-filer:")
            for i, pdf_file in enumerate(pdf_files, 1):
                size_mb = pdf_file.stat().st_size / (1024 * 1024)
                print(f"{i}. {pdf_file.name} ({size_mb:.1f}MB)")
            
            print(f"\n💡 Byt namn på din fil till 'samling_av_pdf.pdf' eller uppdatera scriptet")
        else:
            print(f"❌ Inga PDF-filer hittades i Downloads")
        
        return
    
    # Visa filinfo
    file_size_mb = input_file.stat().st_size / (1024 * 1024)
    print(f"📁 Hittade fil: {input_file.name}")
    print(f"📏 Filstorlek: {file_size_mb:.1f}MB")
    
    # Dela upp PDF
    success = split_pdf(input_file, output_dir, pages_per_chunk=20, max_size_mb=8)
    
    if success:
        print(f"\n🚀 Nu kan du ladda upp delarna i Gulmåran-GPT!")
    else:
        print(f"\n❌ Något gick fel vid uppdelning")

if __name__ == "__main__":
    main()
