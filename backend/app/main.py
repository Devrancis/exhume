from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uuid
import json
import io
import os
from app.models.scan import ScanRequest
from app.scanner.engine import run_scan_job, r
# ReportLab core modules for clean tabular structure
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

app = FastAPI(title="Exhume API")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/scan")
async def start_scan(req: ScanRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    initial_state = {"job_id": job_id, "status": "queued", "progress": {"current_step": "Queued", "percent": 0, "files_scanned": 0, "commits_traversed": 0}}
    r.set(f"job:{job_id}", json.dumps(initial_state))
    background_tasks.add_task(run_scan_job, job_id, str(req.repo_url), req.scan_history, req.github_token)
    return {"job_id": job_id, "status": "queued"}

@app.get("/api/scan/{job_id}")
async def get_scan_status(job_id: str):
    data = r.get(f"job:{job_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    return json.loads(data)

@app.get("/api/report/{job_id}/pdf")
async def get_pdf_report(job_id: str):
    data = r.get(f"job:{job_id}")
    if not data:
         raise HTTPException(status_code=404, detail="Job not found")
    state = json.loads(data)
    if state["status"] != "completed":
         raise HTTPException(status_code=400, detail="Scan not completed yet")
    
    buffer = io.BytesIO()
    
    # Establish document borders and container bounds (Total printable width = 540pt)
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=40, bottomMargin=40)
    story = []
    styles = getSampleStyleSheet()
    
    # Typographic configurations
    title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=22, leading=26, textColor=colors.HexColor("#0F172A"))
    subtitle_style = ParagraphStyle('DocSub', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor("#64748B"))
    cell_style = ParagraphStyle('TableCell', parent=styles['Normal'], fontSize=8.5, leading=11)
    header_cell_style = ParagraphStyle('TableHeader', parent=styles['Normal'], fontSize=9.5, leading=12, textColor=colors.white, fontName="Helvetica-Bold")

    # Header section
    story.append(Paragraph("Exhume Security Audit Report", title_style))
    story.append(Paragraph(f"Job Identifier: {job_id} | Security Verification Engine", subtitle_style))
    story.append(Spacer(1, 15))
    
    findings = state.get("findings", [])
    if not findings:
        story.append(Paragraph("<b>Clean Audit:</b> No critical exposed credentials or configuration assets detected in this repository.", styles['Normal']))
    else:
        # Table Schema initialization
        table_data = [[
            Paragraph("Target File Path", header_cell_style),
            Paragraph("Line", header_cell_style),
            Paragraph("Exposure Category", header_cell_style),
            Paragraph("Evidence", header_cell_style),
            Paragraph("Severity", header_cell_style)
        ]]
        
        # Populate table data dynamically mapping values safely from the Pydantic schema
        for item in findings:
            table_data.append([
                Paragraph(item.get("file_path", "N/A"), cell_style),
                Paragraph(str(item.get("line_number", "0")), cell_style),
                Paragraph(item.get("secret_type", "Unknown Secret"), cell_style),
                Paragraph(f"<code>{item.get('redacted_value', 'Confidential')}</code>", cell_style),
                Paragraph(f"<b>{item.get('severity', 'CRITICAL')}</b>", cell_style)
            ])
            
        # Precise grid allocation matching available document width bounds
        report_table = Table(table_data, colWidths=[175, 35, 115, 140, 75])
        report_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ]))
        story.append(report_table)

    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=exhume_report_{job_id}.pdf"})

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "redis": r.ping()}