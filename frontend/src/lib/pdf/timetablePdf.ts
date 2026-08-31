import jsPDF from 'jspdf';
import type { Course, Schedule } from '../../types/timetable';

export interface FlatScheduleBlock {
  id: string;
  course: Course;
  sectionName: string;
  schedule: Schedule;
}

export interface PDFGenerationStats {
  coursesCount: number;
  sectionsCount: number;
  meetingsCount: number;
}

interface LoadedImage {
  data: string;
  width: number;
  height: number;
}

const loadImageData = (url: string): Promise<LoadedImage | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({
            data: canvas.toDataURL('image/png'),
            width: img.width,
            height: img.height
          });
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('Failed to convert image to base64:', e);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn(`Failed to load image from url: ${url}`);
      resolve(null);
    };
    img.src = url;
  });
};

interface CardLayout {
  block: FlatScheduleBlock;
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
  titleLines: string[];
}

export async function generateTimetablePDF(
  semester: string,
  scheduleBlocks: FlatScheduleBlock[],
  stats: PDFGenerationStats
): Promise<void> {
  // 1. Initialize Document (A4 Landscape)
  const PAGE_WIDTH = 841.89; // A4 pt
  const PAGE_HEIGHT = 595.28;
  const MARGIN_X = 30;
  const MARGIN_TOP = 40;
  const MARGIN_BOTTOM = 50;
  const GRID_WIDTH = PAGE_WIDTH - (MARGIN_X * 2);
  const COL_WIDTH = GRID_WIDTH / 6;

  const doc = new jsPDF('landscape', 'pt', 'a4');

  // 2. Load Assets
  const uniLogoUrl = '/images/university-logo.png';
  const companyLogoUrl = '/images/kng_logo_4k_transparent (1) (1)_11zon (2).png';
  
  const [uniLogo, companyLogo] = await Promise.all([
    loadImageData(uniLogoUrl),
    loadImageData(companyLogoUrl)
  ]);

  // 3. Prepare Grid Layout
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Sort blocks by time
  const sortedBlocks = [...scheduleBlocks].sort((a, b) => {
    return a.schedule.startMinutes - b.schedule.startMinutes;
  });

  const allCards: CardLayout[] = [];
  let totalPages = 1;

  // Calculate Header Heights
  let firstPageGridStartY = MARGIN_TOP;
  if (uniLogo) {
    const maxW = 120;
    const maxH = 60;
    const ratio = Math.min(maxW / uniLogo.width, maxH / uniLogo.height);
    firstPageGridStartY += (uniLogo.height * ratio) + 20;
  } else {
    firstPageGridStartY += 20;
  }
  // Add Title (14), Semester (16), Summary (10) and Gap (30)
  firstPageGridStartY += 14 + 16 + 10 + 30;

  const subsequentPageGridStartY = MARGIN_TOP + 20;

  // Layout Engine
  for (let colIdx = 0; colIdx < 6; colIdx++) {
    const day = days[colIdx];
    const dayBlocks = sortedBlocks.filter(b => b.schedule.day === day);
    
    let currentY = firstPageGridStartY + 10; // Add padding so first card doesn't touch header
    let currentPage = 1;
    const colX = MARGIN_X + (colIdx * COL_WIDTH);
    
    for (const block of dayBlocks) {
      const cardW = COL_WIDTH - 12;
      const innerW = cardW - 12;
      
      let titleInnerW = innerW;
      if (block.course.shortName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        const shortNameW = doc.getTextWidth(block.course.shortName) + 8;
        titleInnerW = innerW - shortNameW - 2;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const titleLines = doc.splitTextToSize(block.course.courseName, titleInnerW);
      const titleH = titleLines.length * 10;
      
      // Card Height = topPad(6) + titleH + gap(4) + badges(12) + gap(6) + details(3x9) + botPad(6)
      const cardH = 6 + titleH + 4 + 12 + 6 + 9 + 9 + 9 + 6;
      
      // Page Break detection
      if (currentY + cardH + 10 > PAGE_HEIGHT - MARGIN_BOTTOM) {
        currentPage++;
        if (currentPage > totalPages) totalPages = currentPage;
        currentY = subsequentPageGridStartY + 10; // Add padding on new pages too
      }
      
      allCards.push({
        block,
        x: colX + 6,
        y: currentY,
        w: cardW,
        h: cardH,
        page: currentPage,
        titleLines
      });
      
      currentY += cardH + 10; // margin between cards
    }
  }

  // Helper function to draw badges
  const drawBadge = (text: string, x: number, y: number, bg: number[], fg: number[]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    const textW = doc.getTextWidth(text);
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.roundedRect(x, y - 7, textW + 8, 10, 2, 2, 'F');
    doc.setTextColor(fg[0], fg[1], fg[2]);
    doc.text(text, x + 4, y);
    return x + textW + 12; // return next X
  };

  // 4. Drawing Pages
  for (let p = 1; p <= totalPages; p++) {
    if (p > 1) {
      doc.addPage();
    }

    // A. Draw Header on Page 1
    const gridStartY = p === 1 ? firstPageGridStartY : subsequentPageGridStartY;
    
    if (p === 1) {
      let drawY = MARGIN_TOP;
      
      // Top Center University Logo
      if (uniLogo) {
        const maxW = 120;
        const maxH = 60;
        const ratio = Math.min(maxW / uniLogo.width, maxH / uniLogo.height);
        const w = uniLogo.width * ratio;
        const h = uniLogo.height * ratio;
        doc.addImage(uniLogo.data, 'PNG', (PAGE_WIDTH - w) / 2, drawY, w, h);
        drawY += h + 20;
      } else {
        drawY += 20;
      }

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('FINAL TIMETABLE', PAGE_WIDTH / 2, drawY, { align: 'center' });
      drawY += 14;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`${semester}`, PAGE_WIDTH / 2, drawY, { align: 'center' });
      drawY += 16;

      // Summary Strip
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85); // slate-700
      const statsText = `${stats.coursesCount} Courses   |   ${stats.sectionsCount} Sections   |   ${stats.meetingsCount} Class Meetings`;
      doc.text(statsText, PAGE_WIDTH / 2, drawY + 10, { align: 'center' });
    }

    // B. Compute max Y for grid borders on this page
    let maxGridY = gridStartY + 20; // Default minimum (just headers)
    const pageCards = allCards.filter(c => c.page === p);
    if (pageCards.length > 0) {
      const highestCardBottom = Math.max(...pageCards.map(c => c.y + c.h));
      maxGridY = highestCardBottom + 10;
    }
    
    // Extend grid to fill the page to avoid useless blank space at the bottom
    const minGridY = PAGE_HEIGHT - MARGIN_BOTTOM - 20;
    if (maxGridY < minGridY) {
      maxGridY = minGridY;
    }

    // C. Draw Grid Outline & Day Headers
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    
    // Header background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(MARGIN_X, gridStartY - 25, GRID_WIDTH, 25, 'F');
    
    // Grid Outer Border
    doc.rect(MARGIN_X, gridStartY - 25, GRID_WIDTH, (maxGridY - gridStartY) + 25, 'S');
    
    // Header Bottom Line
    doc.line(MARGIN_X, gridStartY, PAGE_WIDTH - MARGIN_X, gridStartY);

    // Draw Column Headers & Vertical Lines
    for (let colIdx = 0; colIdx < 6; colIdx++) {
      const colX = MARGIN_X + (colIdx * COL_WIDTH);
      
      // Vertical separator
      if (colIdx > 0) {
        doc.line(colX, gridStartY - 25, colX, maxGridY);
      }
      
      // Day Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(days[colIdx].toUpperCase(), colX + (COL_WIDTH / 2), gridStartY - 8, { align: 'center' });
    }

    // D. Draw Cards for this page
    for (const card of pageCards) {
      const block = card.block;
      const isLab = block.schedule.type.toLowerCase() === 'lab';
      
      // Card Background & Border
      if (isLab) {
        doc.setFillColor(254, 252, 232); // yellow-50
        doc.setDrawColor(253, 224, 71); // yellow-300
      } else {
        doc.setFillColor(255, 255, 255); // white
        doc.setDrawColor(226, 232, 240); // slate-200
      }
      
      doc.roundedRect(card.x, card.y, card.w, card.h, 4, 4, 'FD');
      
      // Title
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(card.titleLines, card.x + 6, card.y + 12);
      
      // Short Name Badge (Top Right)
      if (block.course.shortName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        const snW = doc.getTextWidth(block.course.shortName);
        doc.setFillColor(241, 245, 249); // slate-100
        const snX = card.x + card.w - snW - 12;
        doc.roundedRect(snX, card.y + 6, snW + 8, 10, 2, 2, 'F');
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(block.course.shortName, snX + 4, card.y + 13);
      }
      
      // Badges
      const badgeY = card.y + (card.titleLines.length * 10) + 12;
      let badgeX = card.x + 6;
      
      // Section Badge
      badgeX = drawBadge(block.sectionName, badgeX, badgeY, [238, 242, 255], [67, 56, 202]); // indigo
      
      // Type Badge
      const typeBg = isLab ? [254, 243, 199] : [239, 246, 255]; // amber/blue
      const typeFg = isLab ? [146, 64, 14] : [29, 78, 216];
      badgeX = drawBadge(block.schedule.type.toUpperCase(), badgeX, badgeY, typeBg, typeFg);

      // Details (Time, Room, Instructor)
      let detailsY = badgeY + 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105); // slate-600
      
      doc.text(`Time: ${block.schedule.startTime} - ${block.schedule.endTime}`, card.x + 6, detailsY);
      detailsY += 9;
      doc.text(`Room: ${block.schedule.room || 'TBA'}`, card.x + 6, detailsY);
      detailsY += 9;
      
      // Truncate instructor if it's too long
      const instructorRaw = block.schedule.instructor || 'TBA';
      let instrLines = doc.splitTextToSize(`Prof: ${instructorRaw}`, card.w - 12);
      doc.text(instrLines[0] + (instrLines.length > 1 ? '...' : ''), card.x + 6, detailsY);
    }

    // E. Draw Footer
    const footerY = PAGE_HEIGHT - 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    
    // Bottom Center Powered By
    const text1 = "Powered by  ";
    const text2 = "  KNG Logics Solution";
    
    // Calculate precise centering based on text and logo width
    const w1 = doc.getTextWidth(text1);
    const w2 = doc.getTextWidth(text2);
    let logoW = 0;
    let logoH = 12;
    if (companyLogo) {
      logoW = companyLogo.width * (logoH / companyLogo.height);
    }
    
    const totalW = w1 + logoW + w2;
    const startX = (PAGE_WIDTH - totalW) / 2;
    
    doc.text(text1, startX, footerY);
    
    if (companyLogo) {
       doc.addImage(companyLogo.data, 'PNG', startX + w1, footerY - 9, logoW, logoH);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(text2, startX + w1 + logoW, footerY);
    
    // Page Number (Right Aligned)
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${p} of ${totalPages}`, PAGE_WIDTH - MARGIN_X, footerY, { align: 'right' });
  }

  // 5. Trigger Download
  doc.save('Final_Timetable.pdf');
}
