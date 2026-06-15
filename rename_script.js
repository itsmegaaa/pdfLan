const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/src/pages/tools');

const filesToUpdate = {
  'WatermarkPdf.jsx': { search: /filename:\s*'watermarked\.pdf'/g, replace: 'filename: files[0].name' },
  'UnlockPdf.jsx': { search: /filename:\s*filename\s*\|\|\s*'unlocked\.pdf'/g, replace: 'filename: filename || files[0].name' },
  'SplitPdf.jsx': { search: /filename:\s*'split\.pdf'/g, replace: 'filename: files[0].name' },
  // SplitPdf has zip too
  'SignPdf.jsx': { search: /filename:\s*'signed\.pdf'/g, replace: 'filename: files[0].name' },
  'ScanToPdf.jsx': { search: /filename:\s*'scan\.pdf'/g, replace: 'filename: files[0].name.replace(/\\.[^/.]+$/, "") + ".pdf"' },
  'RotatePdf.jsx': { search: /filename:\s*'rotated\.pdf'/g, replace: 'filename: files[0].name' },
  'RepairPdf.jsx': { search: /filename:\s*filename\s*\|\|\s*'repaired\.pdf'/g, replace: 'filename: filename || files[0].name' },
  'RedactPdf.jsx': { search: /filename:\s*'redacted\.pdf'/g, replace: 'filename: files[0].name' },
  'ProtectPdf.jsx': { search: /filename:\s*filename\s*\|\|\s*'protected\.pdf'/g, replace: 'filename: filename || files[0].name' },
  'PdfForms.jsx': { search: /filename:\s*'filled_form\.pdf'/g, replace: 'filename: files[0].name' },
  'PageNumbers.jsx': { search: /filename:\s*'numbered\.pdf'/g, replace: 'filename: files[0].name' },
  'OrganizePdf.jsx': { search: /filename:\s*'organized\.pdf'/g, replace: 'filename: files[0]? files[0].name : "organized.pdf"' }, // organize uses file state? Wait, let's check organizePdf
  'OcrPdf.jsx': { search: /filename:\s*filename\s*\|\|\s*'ocr_result\.pdf'/g, replace: 'filename: filename || files[0].name' },
  'MergePdf.jsx': { search: /filename:\s*'merged\.pdf'/g, replace: 'filename: files[0].name' },
  'JpgToPdf.jsx': { search: /filename:\s*'images\.pdf'/g, replace: 'filename: files[0].name.replace(/\\.[^/.]+$/, "") + ".pdf"' },
  'CropPdf.jsx': { search: /filename:\s*'cropped\.pdf'/g, replace: 'filename: files[0].name' },
  'ComparePdf.jsx': { search: /filename:\s*filename\s*\|\|\s*'comparison\.pdf'/g, replace: 'filename: filename || files[0].name' },
};

for (const [file, info] of Object.entries(filesToUpdate)) {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(info.search, info.replace);
    
    // For SplitPdf.jsx zip
    if (file === 'SplitPdf.jsx') {
      content = content.replace(/filename:\s*'split_pages\.zip'/g, 'filename: files[0].name.replace(/\\.[^/.]+$/, "") + "_split.zip"');
    }
    
    // For OrganizePdf it's file.name
    if (file === 'OrganizePdf.jsx') {
      content = content.replace(/filename:\s*'organized\.pdf'/g, 'filename: file ? file.name : "organized.pdf"');
      content = content.replace(/filename\s*\|\|\s*'organized\.pdf'/g, 'filename || (file ? file.name : "organized.pdf")');
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
