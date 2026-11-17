import * as XLSX from 'xlsx';
import {
  EDT_ACTIVITIES,
  EPP_BASICO,
  EPP_ESPECIALIZADO,
  evaluateAtmosphericSafety,
  PHASES,
  PROJECT_METADATA,
  SPECIALTIES,
} from '../data/api653MasterData';
import { MaintenanceRecord, TankId } from '../types/maintenance';

function autoFitColumns(rows: (string | number | boolean | null | undefined)[][]) {
  if (rows.length === 0) return [];
  const colCount = Math.max(...rows.map((r) => r.length));
  const widths: XLSX.ColInfo[] = [];

  for (let c = 0; c < colCount; c++) {
    let maxLen = 10;
    for (let r = 0; r < rows.length; r++) {
      const val = rows[r]?.[c];
      const len = val !== null && val !== undefined ? String(val).length : 0;
      if (len > maxLen) maxLen = len;
    }
    widths.push({ wch: Math.min(maxLen + 4, 52) });
  }
  return widths;
}

export function exportCompleteMaintenanceExcel(
  allRecords: MaintenanceRecord[],
  scopeTank: TankId | 'Todos' = 'Todos'
): string {
  const scopedRecords =
    scopeTank === 'Todos'
      ? allRecords
      : allRecords.filter((r) => r.tanque === scopeTank);

  const wb = XLSX.utils.book_new();
  const exportDate = new Date().toISOString().slice(0, 10);

  // =========================================================================
  // HOJA 1: Resumen_Ejecutivo
  // =========================================================================
  const tankList: TankId[] =
    scopeTank === 'Todos' ? PROJECT_METADATA.tanques : [scopeTank];

  const tankSummaryRows = tankList.map((tank) => {
    const tRecs = scopedRecords.filter((r) => r.tanque === tank);
    const prevCount = tRecs.filter((r) => r.tipo === 'Preventivo').length;
    const corrCount = tRecs.filter((r) => r.tipo === 'Correctivo').length;
    const prevHH = tRecs
      .filter((r) => r.tipo === 'Preventivo')
      .reduce((s, r) => s + r.horasHombre, 0);
    const corrHH = tRecs
      .filter((r) => r.tipo === 'Correctivo')
      .reduce((s, r) => s + r.horasHombre, 0);
    const totalHH = prevHH + corrHH;
    const completed = tRecs.filter((r) => r.estado === 'Completado').length;
    const safeSiaho = tRecs.filter(
      (r) => r.siaho.artVerificado && evaluateAtmosphericSafety(r.siaho.readings).allSafe
    ).length;

    return [
      tank,
      PROJECT_METADATA.hhDirectasTanque,
      prevCount,
      corrCount,
      tRecs.length,
      prevHH,
      corrHH,
      totalHH,
      Number(((totalHH / PROJECT_METADATA.hhDirectasTanque) * 100).toFixed(1)),
      completed,
      `${safeSiaho}/${tRecs.length}`,
    ];
  });

  const totalPrevCount = scopedRecords.filter((r) => r.tipo === 'Preventivo').length;
  const totalCorrCount = scopedRecords.filter((r) => r.tipo === 'Correctivo').length;
  const totalPrevHH = scopedRecords
    .filter((r) => r.tipo === 'Preventivo')
    .reduce((s, r) => s + r.horasHombre, 0);
  const totalCorrHH = scopedRecords
    .filter((r) => r.tipo === 'Correctivo')
    .reduce((s, r) => s + r.horasHombre, 0);
  const totalAllHH = totalPrevHH + totalCorrHH;
  const totalPlanHH = PROJECT_METADATA.hhDirectasTanque * tankList.length;

  const phaseSummaryRows = PHASES.map((phase) => {
    const pRecs = scopedRecords.filter((r) => r.phaseId === phase.id);
    const hhReg = pRecs.reduce((s, r) => s + r.horasHombre, 0);
    const hhPlan = phase.estimatedHH * tankList.length;
    return [
      phase.id,
      phase.code,
      phase.title,
      phase.days,
      phase.standard,
      pRecs.length,
      hhPlan,
      hhReg,
      Number(((hhReg / Math.max(1, hhPlan)) * 100).toFixed(1)),
    ];
  });

  const resumenData: (string | number)[][] = [
    ['REPORTE COMPLETO DE MANTENIMIENTO PREVENTIVO Y CORRECTIVO — NORMATIVA API 653'],
    ['Empresa Ejecutora:', PROJECT_METADATA.empresaEjecutora, 'Ingeniero Residente:', PROJECT_METADATA.ingenieroResidente],
    ['Normativa Rectora:', PROJECT_METADATA.normativaRectora, 'Normas Auxiliares:', PROJECT_METADATA.normasAuxiliares],
    ['Alcance Exportado:', scopeTank === 'Todos' ? 'Todos los Tanques (T-2303, T-2208, T-2209)' : `Tanque ${scopeTank}`, 'Fecha de Exportación:', exportDate],
    [],
    ['1. CONSOLIDADO POR TANQUE / ACTIVO'],
    [
      'Tanque',
      'HH Plan Directas',
      'Órdenes Preventivas',
      'Órdenes Correctivas',
      'Total Órdenes',
      'HH Preventivas',
      'HH Correctivas',
      'Total HH Registradas',
      '% Avance Directo',
      'Órdenes Completadas',
      'Cumplimiento SIAHO',
    ],
    ...tankSummaryRows,
    [
      'TOTAL CONSOLIDADO',
      totalPlanHH,
      totalPrevCount,
      totalCorrCount,
      scopedRecords.length,
      totalPrevHH,
      totalCorrHH,
      totalAllHH,
      Number(((totalAllHH / Math.max(1, totalPlanHH)) * 100).toFixed(1)),
      scopedRecords.filter((r) => r.estado === 'Completado').length,
      `${scopedRecords.filter((r) => r.siaho.artVerificado && evaluateAtmosphericSafety(r.siaho.readings).allSafe).length}/${scopedRecords.length}`,
    ],
    [],
    ['2. AVANCE POR FASE DEL PLAN MAESTRO (EDT 1.0 – 6.0)'],
    [
      'ID Fase',
      'Código',
      'Descripción de la Fase',
      'Días Plan',
      'Norma Aplicable',
      'N° Órdenes',
      'HH Planificadas',
      'HH Registradas',
      '% Ejecución',
    ],
    ...phaseSummaryRows,
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = autoFitColumns(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen_Ejecutivo');

  // =========================================================================
  // HOJA 2: Registros_Mantenimiento
  // =========================================================================
  const regHeaders = [
    'Código OT',
    'Fecha',
    'Turno',
    'Tanque',
    'Tipo Mantenimiento',
    'Estado',
    'Prioridad',
    'Fase',
    'EDT',
    'Actividad Técnica',
    'Norma Aplicable',
    'Especialidad',
    'Conformación Cuadrilla',
    'Personal (Cant.)',
    'Horas-Hombre (HH)',
    'Componente Afectado',
    'Descripción Técnica',
    'Hallazgo Correctivo / Desviación',
    'Materiales e Insumos Usados',
    'Equipos e Instrumentos',
    'Tipo Permiso SIAHO',
    'N° Permiso',
    'ART Verificado',
    'Vigía Exterior',
    'EPP Básico',
    'EPP Especializado',
    'O2 (%)',
    'LEL (%)',
    'H2S (ppm)',
    'CO (ppm)',
    'Dictamen Atmosférico',
    'Método NDT / QA-QC',
    'Espesor Mínimo (mils)',
    'Perfil Anclaje (mils)',
    'DFT Seco (mils)',
    'Presión Prueba (PSI)',
    'Prueba Holiday',
    'Caja de Vacío',
    'Observaciones',
    'Sincronizado Google Sheets',
    'Última Actualización',
  ];

  const regRows = scopedRecords.map((r) => {
    const atm = evaluateAtmosphericSafety(r.siaho.readings);
    return [
      r.codigoOrden,
      r.fecha,
      r.turno,
      r.tanque,
      r.tipo,
      r.estado,
      r.prioridad,
      r.phaseId,
      r.edt,
      r.actividadNombre,
      r.normaAplicable,
      r.especialidad,
      r.responsableCuadrilla,
      r.personalCantidad,
      r.horasHombre,
      r.componenteAfectado,
      r.descripcionTecnica,
      r.hallazgoCorrectivo || '—',
      r.materialesUsados,
      r.equiposInstrumentos,
      r.siaho.permisoTipo,
      r.siaho.permisoNumero,
      r.siaho.artVerificado ? 'Sí' : 'No',
      r.siaho.vigiaExterior ? 'Sí' : 'No',
      r.siaho.eppBasicoCompleto ? 'Completo' : 'Pendiente',
      r.siaho.eppEspecializadoCompleto ? 'Completo' : 'Pendiente',
      r.siaho.readings.o2,
      r.siaho.readings.lel,
      r.siaho.readings.h2s,
      r.siaho.readings.co,
      atm.allSafe ? 'APTO (API 2015)' : 'FUERA DE RANGO CRÍTICO',
      r.qaqc.metodoNdt,
      r.qaqc.espesorMinimoMils || '—',
      r.qaqc.perfilAnclajeMils || '—',
      r.qaqc.dftSecoMils || '—',
      r.qaqc.presionPruebaPsi || '—',
      r.qaqc.holidayTest,
      r.qaqc.vacuumBoxTest,
      r.observaciones || '—',
      r.syncedToSheets ? 'Sí' : 'Pendiente',
      r.updatedAt,
    ];
  });

  const regSheetData = [regHeaders, ...regRows];
  const wsRegistros = XLSX.utils.aoa_to_sheet(regSheetData);
  wsRegistros['!cols'] = autoFitColumns(regSheetData);
  wsRegistros['!autofilter'] = {
    ref: `A1:${XLSX.utils.encode_col(regHeaders.length - 1)}${Math.max(1, regSheetData.length)}`,
  };
  XLSX.utils.book_append_sheet(wb, wsRegistros, 'Registros_Mantenimiento');

  // =========================================================================
  // HOJA 3: EDT_Cronograma
  // =========================================================================
  const edtHeaders = [
    'EDT',
    'Fase',
    'Actividad Técnica',
    'Enfoque Típico',
    'Días Plan',
    'Predecesora',
    'Norma Aplicable',
    'Conformación de Cuadrilla',
    'HH Estimadas (1 Tanque)',
    'HH Registradas (Filtro)',
    'Órdenes Vinculadas',
  ];

  const edtRows = EDT_ACTIVITIES.map((act) => {
    const linked = scopedRecords.filter((r) => r.edt === act.edt);
    const hhLogged = linked.reduce((s, r) => s + r.horasHombre, 0);
    return [
      act.edt,
      act.phaseId,
      act.name,
      act.recommendedType,
      act.days,
      act.predecessor,
      act.standard,
      act.crew,
      act.estimatedHH,
      hhLogged,
      linked.length,
    ];
  });

  const edtSheetData = [edtHeaders, ...edtRows];
  const wsEdt = XLSX.utils.aoa_to_sheet(edtSheetData);
  wsEdt['!cols'] = autoFitColumns(edtSheetData);
  wsEdt['!autofilter'] = {
    ref: `A1:${XLSX.utils.encode_col(edtHeaders.length - 1)}${edtSheetData.length}`,
  };
  XLSX.utils.book_append_sheet(wb, wsEdt, 'EDT_Cronograma');

  // =========================================================================
  // HOJA 4: Especialidades_HH
  // =========================================================================
  const specHeaders = [
    'Especialidad / Cargo Técnico',
    'HH Directas (1 Tanque)',
    'HH Perm. Obra (1 Tanque)',
    'Total 1 Tanque (HH)',
    'Proyección 3 Tanques (HH)',
    'HH Registradas en Bitácora',
    'Notas de Asignación y Escalamiento',
  ];

  const specRows = SPECIALTIES.map((sp) => {
    const logged = scopedRecords
      .filter((r) => r.especialidad === sp.role)
      .reduce((s, r) => s + r.horasHombre, 0);
    return [
      sp.role,
      sp.hhDirectas,
      sp.hhPermObra,
      sp.totalHH,
      sp.totalHH * 3,
      logged,
      sp.notes,
    ];
  });

  specRows.push([
    'TOTAL GENERAL',
    PROJECT_METADATA.hhDirectasTanque,
    PROJECT_METADATA.hhPermObraTanque,
    PROJECT_METADATA.hhTotalTanque,
    PROJECT_METADATA.hhProyeccionTresTanques,
    totalAllHH,
    'Fast-Tracking cada 14 días (T-2303, T-2208, T-2209)',
  ]);

  const specSheetData = [specHeaders, ...specRows];
  const wsSpec = XLSX.utils.aoa_to_sheet(specSheetData);
  wsSpec['!cols'] = autoFitColumns(specSheetData);
  XLSX.utils.book_append_sheet(wb, wsSpec, 'Especialidades_HH');

  // =========================================================================
  // HOJA 5: SIAHO_y_EPP
  // =========================================================================
  const siahoSheetData: (string | number)[][] = [
    ['AUDITORÍA DE PERMISOS DE TRABAJO Y MONITOREO ATMOSFÉRICO (API 2015)'],
    [
      'Código OT',
      'Tanque',
      'Fecha',
      'Permiso de Trabajo',
      'N° Permiso',
      'ART Verificado',
      'Vigía Exterior',
      'O2 (%) [19.5-23.5]',
      'LEL (%) [0%]',
      'H2S (ppm) [<10]',
      'CO (ppm) [<25]',
      'Dictamen SIAHO',
    ],
    ...scopedRecords.map((r) => {
      const ev = evaluateAtmosphericSafety(r.siaho.readings);
      return [
        r.codigoOrden,
        r.tanque,
        r.fecha,
        r.siaho.permisoTipo,
        r.siaho.permisoNumero,
        r.siaho.artVerificado ? 'Sí' : 'No',
        r.siaho.vigiaExterior ? 'Sí' : 'No',
        r.siaho.readings.o2,
        r.siaho.readings.lel,
        r.siaho.readings.h2s,
        r.siaho.readings.co,
        ev.allSafe ? 'APTO PARA INGRESO' : 'FUERA DE RANGO CRÍTICO',
      ];
    }),
    [],
    ['EPP BÁSICO OBLIGATORIO (TODO EL PERSONAL)'],
    ['Zona Corporal', 'Especificación Técnica SIAHO'],
    ...EPP_BASICO.map((e) => [e.zona, e.spec]),
    [],
    ['EPP ESPECIALIZADO POR ACTIVIDAD CRÍTICA'],
    ['Actividad Crítica', 'Equipamiento Especializado Requerido'],
    ...EPP_ESPECIALIZADO.map((e) => [e.actividad, e.detalle]),
  ];

  const wsSiaho = XLSX.utils.aoa_to_sheet(siahoSheetData);
  wsSiaho['!cols'] = autoFitColumns(siahoSheetData);
  XLSX.utils.book_append_sheet(wb, wsSiaho, 'SIAHO_y_EPP');

  const tankSuffix = scopeTank === 'Todos' ? 'Todos_Tanques' : scopeTank;
  const filename = `Reporte_Completo_Mantenimiento_API653_${tankSuffix}_${exportDate}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}
