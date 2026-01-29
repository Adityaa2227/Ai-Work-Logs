const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

exports.generatePDF = (logs, res, stream = null) => {
    const doc = new PDFDocument({ margin: 50 });
    const output = stream || res;
    
    if (!stream) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=worklogs.pdf');
    }

    doc.pipe(output);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('Work Logs Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    logs.forEach((log) => {
        // Prevent page break inside a log (approx check)
        if (doc.y > 650) doc.addPage();

        const startY = doc.y;

        // --- Header Block ---
        doc.rect(50, startY, 510, 30).fill('#f1f5f9'); // Light slate bg
        
        // Logs Date (Left)
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold')
           .text(new Date(log.date).toDateString(), 60, startY + 8);
        
        // Project (Middle - only if Available)
        if (log.status === 'Available' && log.project) {
            doc.fontSize(12).font('Helvetica-Bold')
               .text(log.project, 200, startY + 8, { width: 350, align: 'right', height: 15, ellipsis: true });
        } else if (log.status !== 'Available') {
             doc.fontSize(12).font('Helvetica-Oblique').fillColor('#ef4444') // Red for non-work
               .text(log.status, 200, startY + 8, { width: 350, align: 'right' });
        }

        // --- Content Block ---
        doc.y = startY + 40; // Force move down below header
        doc.x = 50;          // RESET X TO MARGIN
        doc.fillColor('black');

        if (log.status !== 'Available') {
            // Handle No Work / Leave
            doc.fontSize(11).font('Helvetica-Bold').text('Reason / Note:', { continued: true });
            doc.font('Helvetica').text(` ${log.noWorkReason || 'No details provided.'}`);
            doc.moveDown();
        } else {
            // Handle Available
            doc.fontSize(11).font('Helvetica-Bold').text('Task: ', { continued: true });
            doc.font('Helvetica').text(log.task || 'N/A');
            doc.moveDown(0.5);

            const printSection = (title, content, isList = false) => {
                if (!content || (Array.isArray(content) && content.length === 0)) return;
                
                // Ensure we are at distinct new line
                doc.x = 50; 
                doc.moveDown(0.3);
                
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(title);
                doc.font('Helvetica').fontSize(10).fillColor('#475569');
                
                if (isList && Array.isArray(content)) {
                    content.forEach(item => {
                        doc.text(`• ${item}`, { indent: 15, width: 480 }); // Explicit width to prevent wrapping weirdly
                    });
                } else {
                    doc.text(content, { indent: 15, width: 480 });
                }
            };

            printSection('Work Done:', log.workDone, true);
            printSection('Challenges:', log.blockers);
            printSection('Learnings:', log.learnings, true);
            printSection('Impact:', log.impact, true);
            printSection('Tech Stack:', log.techStack, true);
            printSection('Files Touched:', log.filesTouched, true);
            printSection('Next Plan:', log.nextPlan);
        }

        // Divider
        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#e2e8f0').stroke();
        doc.moveDown(1.5);
    });

    doc.end();
};

exports.generateExcel = async (logs, res) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Work Logs');

    sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Project', key: 'project', width: 20 },
        { header: 'Task', key: 'task', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Hours', key: 'hours', width: 10 },
        { header: 'Work Done', key: 'workDone', width: 40 },
        { header: 'Challenges', key: 'blockers', width: 30 },
        { header: 'Learnings', key: 'learnings', width: 30 },
        { header: 'Impact', key: 'impact', width: 30 },
        { header: 'Tech Stack', key: 'techStack', width: 20 },
        { header: 'Next Plan', key: 'nextPlan', width: 30 },
    ];

    logs.forEach(log => {
        sheet.addRow({
            date: new Date(log.date).toLocaleDateString(),
            project: log.project,
            task: log.task,
            status: log.status,
            hours: log.hours,
            workDone: log.workDone.join(', '),
            blockers: log.blockers,
            learnings: log.learnings.join(', '),
            impact: log.impact.join(', '),
            techStack: log.techStack.join(', '),
            nextPlan: log.nextPlan
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=worklogs.xlsx');

    await workbook.xlsx.write(res);
    res.end();
};

exports.generateCSV = async (logs, res) => {
    const csvStringifier = require('csv-writer').createObjectCsvStringifier({
        header: [
            { id: 'date', title: 'Date' },
            { id: 'project', title: 'Project' },
            { id: 'task', title: 'Task' },
            { id: 'status', title: 'Status' },
            { id: 'hours', title: 'Hours' },
            { id: 'workDone', title: 'Work Done' },
            { id: 'blockers', title: 'Challenges' },
            { id: 'learnings', title: 'Learnings' },
            { id: 'impact', title: 'Impact' },
            { id: 'techStack', title: 'Tech Stack' },
            { id: 'nextPlan', title: 'Next Plan' }
        ]
    });

    const records = logs.map(log => ({
        date: new Date(log.date).toLocaleDateString(),
        project: log.project,
        task: log.task,
        status: log.status,
        hours: log.hours,
        workDone: log.workDone.join('; '),
        blockers: log.blockers,
        learnings: log.learnings.join('; '),
        impact: log.impact.join('; '),
        techStack: log.techStack.join('; '),
        nextPlan: log.nextPlan
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=worklogs.csv');

    res.write(csvStringifier.getHeaderString());
    res.write(csvStringifier.stringifyRecords(records));
    res.end();
};

exports.generateSummaryPDF = (summaries, type, res, stream = null) => {
    const doc = new PDFDocument({ margin: 50 });
    const output = stream || res;
    
    if (!stream) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-summaries.pdf`);
    }

    doc.pipe(output);

    // Title
    const title = type === 'weekly' ? 'Weekly Summaries Report' : 'Monthly Summaries Report';
    doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    if (summaries.length === 0) {
        doc.fontSize(14).text(`No ${type} summaries found.`, { align: 'center' });
    }

    summaries.forEach((summary) => {
        // Page break check
        if (doc.y > 650) doc.addPage();

        const startY = doc.y;
        doc.rect(50, startY, 510, 30).fill('#e0e7ff'); // Indigo tint

        let headerText = '';
        if (type === 'weekly') {
            headerText = `Week ${summary.weekNumber}, ${summary.year} (${new Date(summary.startDate).toLocaleDateString()} - ${new Date(summary.endDate).toLocaleDateString()})`;
        } else {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            headerText = `${months[summary.month - 1]} ${summary.year}`;
        }

        doc.fillColor('#312e81').fontSize(14).font('Helvetica-Bold')
           .text(headerText, 60, startY + 8);

        doc.moveDown(2);
        
        doc.fillColor('black').fontSize(11).font('Helvetica');
        
        // Sanitize markdown logic slightly if needed, but text() handles basic text.
        // If summary.content is markdown, we might want to strip simple markdown or just print it.
        // For now, printing raw text is what user expects in "Edit" mode, so in PDF it's acceptable fallback
        // or we could bold headers.
        doc.text(summary.content, { align: 'left', width: 500 });
        
        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#e2e8f0').stroke();
        doc.moveDown(2);
    });

    doc.end();
};
