import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  evaluateAtmosphericSafety,
  PHASES,
  PROJECT_METADATA,
} from '../data/api653MasterData';
import { MaintenanceRecord, TankId, WorkPermitType } from '../types/maintenance';

export interface PdfExportOptions {
  includeSummary: boolean;
  includeSiahoVisual: boolean;
  includeOrdersTable: boolean;
  includeSignatures: boolean;
}

function drawCompanyLogoVector(doc: jsPDF, x: number, y: number, scale = 1) {
  const s = scale;
  // Shield / badge background
  doc.setFillColor(15, 41, 66);
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, 16 * s, 16 * s, 2.5 * s, 2.5 * s, 'FD');

  // Tank dome
  doc.setFillColor(2, 132, 199);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.triangle(
    x + 3 * s,
    y + 6.2 * s,
    x + 8 * s,
    y + 3.6 * s,
    x + 13 * s,
    y + 6.2 * s,
    'FD'
  );

  // Tank shell
  doc.setFillColor(30, 58, 95);
  doc.rect(x + 3.5 * s, y + 6.2 * s, 9 * s, 5.8 * s, 'FD');

  // Shell course lines
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.25);
  doc.line(x + 3.5 * s, y + 8.2 * s, x + 12.5 * s, y + 8.2 * s);
  doc.line(x + 3.5 * s, y + 10.1 * s, x + 12.5 * s, y + 10.1 * s);

  // Amber annular ring base
  doc.setFillColor(217, 119, 6);
  doc.rect(x + 2.5 * s, y + 12 * s, 11 * s, 1.3 * s, 'F');

  // Emerald QA/QC check badge
  doc.setFillColor(5, 150, 105);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.circle(x + 12.6 * s, y + 12.2 * s, 2.2 * s, 'FD');
}

export function generateTechnicalPdfReport(
  allRecords: MaintenanceRecord[],
  scopeTank: TankId | 'Todos' = 'Todos',
  options: PdfExportOptions = {
    includeSummary: true,
    includeSiahoVisual: true,
    includeOrdersTable: true,
    includeSignatures: true,
  }
): string {
  const scoped =
    scopeTank === 'Todos'
      ? allRecords
      : allRecords.filter((r) => r.tanque === scopeTank);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const exportDate = new Date().toISOString().slice(0, 10);

  // =========================================================================
  // ENCABEZADO CORPORATIVO CON LOGO VECTORIAL
  // =========================================================================
  doc.setFillColor(15, 41, 66);
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Accent top stripe
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 34, pageWidth, 1.4, 'F');

  drawCompanyLogoVector(doc, marginX, 7, 1.22);

  const textStartX = marginX + 24;
  doc.setTextColor(186, 230, 253);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(PROJECT_METADATA.empresaEjecutora.toUpperCase(), textStartX, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('REPORTE TÉCNICO DE MANTENIMIENTO PREVENTIVO Y CORRECTIVO', textStartX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `Normativa: ${PROJECT_METADATA.normativaRectora}  |  Residente: ${PROJECT_METADATA.ingenieroResidente}`,
    textStartX,
    24.5
  );
  doc.text(
    `Alcance: ${
      scopeTank === 'Todos'
        ? 'Tanques T-2303, T-2208 y T-2209'
        : `Tanque ${scopeTank}`
    }  |  Emisión: ${exportDate}`,
    textStartX,
    29.5
  );

  let cursorY = 42;

  // =========================================================================
  // 1. RESUMEN EJECUTIVO Y KPIs
  // =========================================================================
  const prevRecords = scoped.filter((r) => r.tipo === 'Preventivo');
  const corrRecords = scoped.filter((r) => r.tipo === 'Correctivo');
  const totalHH = scoped.reduce((s, r) => s + r.horasHombre, 0);
  const completedCount = scoped.filter((r) => r.estado === 'Completado').length;
  const baselineHH =
    scopeTank === 'Todos'
      ? PROJECT_METADATA.hhDirectasTanque * 3
      : PROJECT_METADATA.hhDirectasTanque;
  const pctAdvance = Math.min(100, Math.round((totalHH / baselineHH) * 100));

  if (options.includeSummary) {
    doc.setTextColor(15, 41, 66);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('1. RESUMEN EJECUTIVO DE EJECUCIÓN Y HORAS-HOMBRE', marginX, cursorY);
    cursorY += 3.5;

    const cardWidth = (contentWidth - 9) / 4;
    const kpis = [
      {
        label: 'ÓRDENES TOTALES',
        value: `${scoped.length}`,
        sub: `${prevRecords.length} Prev. / ${corrRecords.length} Corr.`,
        color: [15, 41, 66] as [number, number, number],
      },
      {
        label: 'HH REGISTRADAS',
        value: `${totalHH.toLocaleString()} HH`,
        sub: `${pctAdvance}% de ${baselineHH.toLocaleString()} HH`,
        color: [2, 132, 199] as [number, number, number],
      },
      {
        label: 'ÓRDENES COMPLETADAS',
        value: `${completedCount}`,
        sub: `${scoped.length > 0 ? Math.round((completedCount / scoped.length) * 100) : 0}% cierre`,
        color: [5, 150, 105] as [number, number, number],
      },
      {
        label: 'CORRECTIVOS ACTIVOS',
        value: `${corrRecords.length}`,
        sub: `${corrRecords.reduce((s, r) => s + r.horasHombre, 0)} HH correctivas`,
        color: [217, 119, 6] as [number, number, number],
      },
    ];

    kpis.forEach((k, idx) => {
      const cx = marginX + idx * (cardWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, cursorY, cardWidth, 18, 2, 2, 'FD');

      doc.setFillColor(...k.color);
      doc.rect(cx, cursorY, cardWidth, 1.4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(k.label, cx + 3, cursorY + 5.5);

      doc.setFontSize(12);
      doc.setTextColor(...k.color);
      doc.text(k.value, cx + 3, cursorY + 11.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(k.sub, cx + 3, cursorY + 15.8);
    });

    cursorY += 23;

    // Mini tabla por fases
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['Fase EDT', 'Descripción', 'Norma', 'Órdenes', 'HH Plan', 'HH Reg.', '% Avance']],
      body: PHASES.map((p) => {
        const pRecs = scoped.filter((r) => r.phaseId === p.id);
        const hhReg = pRecs.reduce((s, r) => s + r.horasHombre, 0);
        const hhPlan = p.estimatedHH * (scopeTank === 'Todos' ? 3 : 1);
        const pct = Math.min(100, Math.round((hhReg / hhPlan) * 100));
        return [
          `${p.code} (${p.id})`,
          p.shortTitle,
          p.standard,
          String(pRecs.length),
          `${hhPlan}`,
          `${hhReg}`,
          `${pct}%`,
        ];
      }),
      styles: { fontSize: 7.5, cellPadding: 2, textColor: [15, 23, 42] },
      headStyles: { fillColor: [15, 41, 66], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // =========================================================================
  // 2. SECCIÓN VISUAL DE RESUMEN DE SEGURIDAD SIAHO (API 2015)
  // =========================================================================
  if (options.includeSiahoVisual) {
    if (cursorY > pageHeight - 78) {
      doc.addPage();
      cursorY = 16;
    }

    doc.setTextColor(15, 41, 66);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(
      '2. RESUMEN VISUAL DE SEGURIDAD INDUSTRIAL (SIAHO) Y CONTROL ATMOSFÉRICO',
      marginX,
      cursorY
    );
    cursorY += 3.5;

    const totalCount = Math.max(1, scoped.length);
    const atmSafeCount = scoped.filter(
      (r) => evaluateAtmosphericSafety(r.siaho.readings).allSafe
    ).length;
    const artCount = scoped.filter((r) => r.siaho.artVerificado).length;
    const vigiaCount = scoped.filter((r) => r.siaho.vigiaExterior).length;
    const eppCount = scoped.filter(
      (r) => r.siaho.eppBasicoCompleto && r.siaho.eppEspecializadoCompleto
    ).length;

    const atmPct = Math.round((atmSafeCount / totalCount) * 100);
    const artPct = Math.round((artCount / totalCount) * 100);
    const vigiaPct = Math.round((vigiaCount / totalCount) * 100);
    const eppPct = Math.round((eppCount / totalCount) * 100);

    // Contenedor visual SIAHO
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(marginX, cursorY, contentWidth, 56, 2.5, 2.5, 'FD');

    // Columna izquierda: 4 Barras visuales de cumplimiento SIAHO
    const colLeftX = marginX + 5;
    const barMaxW = 54;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 41, 66);
    doc.text('Cumplimiento Protocolo Crítico', colLeftX, cursorY + 7);

    const siahoBars = [
      { label: 'Atmósfera Segura (API 2015)', pct: atmPct, color: [5, 150, 105] as [number, number, number] },
      { label: 'ART Validado en Sitio', pct: artPct, color: [2, 132, 199] as [number, number, number] },
      { label: 'Vigía Exterior Asignado', pct: vigiaPct, color: [79, 70, 229] as [number, number, number] },
      { label: 'EPP Básico y Especializado', pct: eppPct, color: [217, 119, 6] as [number, number, number] },
    ];

    siahoBars.forEach((b, i) => {
      const by = cursorY + 13 + i * 10.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      doc.text(b.label, colLeftX, by);

      doc.setFont('helvetica', 'bold');
      doc.text(`${b.pct}%`, colLeftX + barMaxW + 2, by + 3.8);

      // Track
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(colLeftX, by + 1.5, barMaxW, 2.8, 1, 1, 'F');

      // Fill
      doc.setFillColor(...b.color);
      doc.roundedRect(
        colLeftX,
        by + 1.5,
        Math.max(2, (b.pct / 100) * barMaxW),
        2.8,
        1,
        1,
        'F'
      );
    });

    // Columna central: Medición Multigas Promedio vs Umbrales API 2015
    const colMidX = marginX + 74;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 41, 66);
    doc.text('Promedios Multigas vs. Límites API 2015', colMidX, cursorY + 7);

    const avgO2 =
      scoped.length > 0
        ? (scoped.reduce((s, r) => s + r.siaho.readings.o2, 0) / scoped.length).toFixed(1)
        : '20.9';
    const maxLel =
      scoped.length > 0 ? Math.max(...scoped.map((r) => r.siaho.readings.lel)) : 0;
    const maxH2s =
      scoped.length > 0 ? Math.max(...scoped.map((r) => r.siaho.readings.h2s)) : 0;
    const maxCo =
      scoped.length > 0 ? Math.max(...scoped.map((r) => r.siaho.readings.co)) : 0;

    const gases = [
      {
        name: 'O2 Prom.',
        val: `${avgO2}%`,
        limit: '19.5-23.5%',
        ok: Number(avgO2) >= 19.5 && Number(avgO2) <= 23.5,
      },
      { name: 'LEL Máx.', val: `${maxLel}%`, limit: 'Meta: 0%', ok: maxLel === 0 },
      { name: 'H2S Máx.', val: `${maxH2s} ppm`, limit: '< 10 ppm', ok: maxH2s < 10 },
      { name: 'CO Máx.', val: `${maxCo} ppm`, limit: '< 25 ppm', ok: maxCo < 25 },
    ];

    gases.forEach((g, i) => {
      const gx = colMidX + (i % 2) * 29;
      const gy = cursorY + 11.5 + Math.floor(i / 2) * 20;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(g.ok ? 167 : 253, g.ok ? 243 : 164, g.ok ? 208 : 175);
      doc.roundedRect(gx, gy, 26.5, 17, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(g.name, gx + 2.5, gy + 4.5);

      doc.setFontSize(10);
      if (g.ok) {
        doc.setTextColor(5, 150, 105);
      } else {
        doc.setTextColor(225, 29, 72);
      }
      doc.text(g.val, gx + 2.5, gy + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.3);
      doc.setTextColor(100, 116, 139);
      doc.text(`${g.limit}`, gx + 2.5, gy + 14.8);
    });

    // Columna derecha: Distribución por Tipo de Permiso de Trabajo
    const colRightX = marginX + 135;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 41, 66);
    doc.text('Permisos Emitidos por Riesgo', colRightX, cursorY + 7);

    const permitTypes: { type: WorkPermitType; short: string; color: [number, number, number] }[] = [
      { type: 'Espacio Confinado', short: 'Espacio Confinado', color: [2, 132, 199] },
      { type: 'Trabajo en Caliente', short: 'Trabajo en Caliente', color: [217, 119, 6] },
      { type: 'Trabajo en Frío', short: 'Trabajo en Frío', color: [13, 148, 136] },
      { type: 'Trabajo en Altura', short: 'Trabajo en Altura', color: [225, 29, 72] },
    ];

    permitTypes.forEach((pt, i) => {
      const cnt = scoped.filter((r) => r.siaho.permisoTipo === pt.type).length;
      const py = cursorY + 13 + i * 10.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      doc.text(`${pt.short} (${cnt})`, colRightX, py);

      const barW = 44;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(colRightX, py + 1.5, barW, 2.8, 1, 1, 'F');
      if (cnt > 0) {
        doc.setFillColor(...pt.color);
        doc.roundedRect(
          colRightX,
          py + 1.5,
          Math.max(3, (cnt / totalCount) * barW),
          2.8,
          1,
          1,
          'F'
        );
      }
    });

    cursorY += 64;
  }

  // =========================================================================
  // 3. DETALLE TÉCNICO DE ÓRDENES DE MANTENIMIENTO
  // =========================================================================
  if (options.includeOrdersTable) {
    if (cursorY > pageHeight - 45) {
      doc.addPage();
      cursorY = 16;
    }

    doc.setTextColor(15, 41, 66);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(
      `3. REGISTRO DETALLADO DE ÓRDENES DE MANTENIMIENTO (${scoped.length})`,
      marginX,
      cursorY
    );
    cursorY += 3.5;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [
        [
          'OT / Fecha',
          'Tanque · EDT',
          'Tipo / Estado',
          'Actividad y Componente Afectado',
          'QA/QC · NDT',
          'SIAHO',
          'HH',
        ],
      ],
      body: scoped.map((r) => {
        const atm = evaluateAtmosphericSafety(r.siaho.readings);
        return [
          `${r.codigoOrden}\n${r.fecha}`,
          `${r.tanque}\nEDT ${r.edt}`,
          `${r.tipo}\n${r.estado}`,
          `${r.actividadNombre}\nComp.: ${r.componenteAfectado}${
            r.hallazgoCorrectivo ? `\nHallazgo: ${r.hallazgoCorrectivo}` : ''
          }`,
          `${r.qaqc.metodoNdt}${
            r.qaqc.dftSecoMils ? `\nDFT: ${r.qaqc.dftSecoMils}` : ''
          }${r.qaqc.espesorMinimoMils ? `\nEsp.: ${r.qaqc.espesorMinimoMils}` : ''}`,
          `${r.siaho.permisoNumero}\n${atm.allSafe ? 'Apto API 2015' : 'Alerta Gases'}`,
          `${r.horasHombre}`,
        ];
      }),
      styles: {
        fontSize: 7,
        cellPadding: 2.2,
        textColor: [15, 23, 42],
        valign: 'top',
      },
      headStyles: {
        fillColor: [15, 41, 66],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.3,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 20, fontStyle: 'bold' },
        2: { cellWidth: 23 },
        3: { cellWidth: 66 },
        4: { cellWidth: 27 },
        5: { cellWidth: 22 },
        6: { cellWidth: 10, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const val = String(data.cell.raw || '');
          if (val.startsWith('Correctivo')) {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [3, 105, 161];
          }
        }
        if (data.section === 'body' && data.column.index === 5) {
          const val = String(data.cell.raw || '');
          if (val.includes('Alerta')) {
            data.cell.styles.textColor = [190, 18, 60];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [4, 120, 87];
          }
        }
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // =========================================================================
  // 4. BLOQUE DE FIRMAS Y VALIDACIÓN TÉCNICA
  // =========================================================================
  if (options.includeSignatures) {
    if (cursorY > pageHeight - 36) {
      doc.addPage();
      cursorY = 20;
    }

    const sigW = (contentWidth - 12) / 3;
    const signers = [
      { title: PROJECT_METADATA.ingenieroResidente, role: 'Ingeniero Residente de Obra' },
      { title: 'Supervisor SIAHO', role: 'Control Atmosférico y Permisología' },
      { title: 'Inspector QA/QC', role: 'Certificación API 653 / NDT Nivel II-III' },
    ];

    signers.forEach((s, i) => {
      const sx = marginX + i * (sigW + 6);
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.35);
      doc.line(sx, cursorY + 14, sx + sigW, cursorY + 14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 41, 66);
      doc.text(s.title, sx + sigW / 2, cursorY + 18.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(s.role, sx + sigW / 2, cursorY + 22.5, { align: 'center' });
    });
  }

  // Numeración de páginas y pie técnico
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${PROJECT_METADATA.empresaEjecutora} · Plan Maestro API 653 / ASME · ${PROJECT_METADATA.ingenieroResidente}`,
      marginX,
      pageHeight - 7.5
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 7.5, {
      align: 'right',
    });
  }

  const tankSuffix = scopeTank === 'Todos' ? 'Todos_Tanques' : scopeTank;
  const filename = `Reporte_Tecnico_API653_${tankSuffix}_${exportDate}.pdf`;
  doc.save(filename);
  return filename;
}
