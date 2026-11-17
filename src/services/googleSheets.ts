import { EDT_ACTIVITIES, PROJECT_METADATA } from '../data/api653MasterData';
import {
  ConnectedSpreadsheet,
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  PhaseId,
  PriorityLevel,
  SheetTabInfo,
  TankId,
  WorkPermitType,
} from '../types/maintenance';

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export const SHEET_HEADERS = [
  'ID Registro',
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
  'Cuadrilla',
  'Cant. Personal',
  'Horas-Hombre (HH)',
  'Componente Afectado',
  'Descripción Técnica',
  'Hallazgo Correctivo',
  'Materiales Usados',
  'Equipos e Instrumentos',
  'Permiso Trabajo',
  'N° Permiso',
  'ART Verificado',
  'Vigía Exterior',
  'EPP Completo',
  'O2 (%)',
  'LEL (%)',
  'H2S (ppm)',
  'CO (ppm)',
  'Método NDT',
  'Espesor Mín (mils)',
  'Perfil Anclaje (mils)',
  'DFT Seco (mils)',
  'Presión Prueba (PSI)',
  'Prueba Holiday',
  'Caja de Vacío',
  'Observaciones',
  'Última Actualización',
];

export function parseSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch?.[1]) return urlMatch[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

async function sheetsFetch<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Error ${res.status} al comunicarse con Google Sheets`;
    try {
      const errData = await res.json();
      if (errData?.error?.message) {
        message = errData.error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<ConnectedSpreadsheet> {
  const data = await sheetsFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
    sheets: Array<{
      properties: {
        sheetId: number;
        title: string;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
    }>;
  }>(
    `${SHEETS_BASE_URL}/${spreadsheetId}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties`,
    accessToken
  );

  const tabs: SheetTabInfo[] = (data.sheets || []).map((s) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    rowCount: s.properties.gridProperties?.rowCount ?? 1000,
    columnCount: s.properties.gridProperties?.columnCount ?? 40,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Hoja de Cálculo API 653',
    url: data.spreadsheetUrl,
    tabs,
    selectedTab: tabs[0]?.title || '',
    lastSyncedAt: null,
  };
}

export function recordToSheetRow(r: MaintenanceRecord): (string | number)[] {
  return [
    r.id,
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
    r.hallazgoCorrectivo,
    r.materialesUsados,
    r.equiposInstrumentos,
    r.siaho.permisoTipo,
    r.siaho.permisoNumero,
    r.siaho.artVerificado ? 'Sí' : 'No',
    r.siaho.vigiaExterior ? 'Sí' : 'No',
    r.siaho.eppBasicoCompleto && r.siaho.eppEspecializadoCompleto ? 'Completo' : 'Parcial',
    r.siaho.readings.o2,
    r.siaho.readings.lel,
    r.siaho.readings.h2s,
    r.siaho.readings.co,
    r.qaqc.metodoNdt,
    r.qaqc.espesorMinimoMils || '',
    r.qaqc.perfilAnclajeMils || '',
    r.qaqc.dftSecoMils || '',
    r.qaqc.presionPruebaPsi || '',
    r.qaqc.holidayTest,
    r.qaqc.vacuumBoxTest,
    r.observaciones,
    r.updatedAt,
  ];
}

export function sheetRowToRecord(row: string[], idx: number): MaintenanceRecord {
  const get = (i: number, fallback = '') => (row[i] !== undefined ? String(row[i]).trim() : fallback);
  const num = (i: number, fallback = 0) => {
    const parsed = Number(row[i]);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const tankRaw = get(4, 'T-2303');
  const tanque: TankId =
    tankRaw === 'T-2208' || tankRaw === 'T-2209' ? tankRaw : 'T-2303';

  const tipoRaw = get(5, 'Preventivo');
  const tipo: MaintenanceType = tipoRaw === 'Correctivo' ? 'Correctivo' : 'Preventivo';

  const validStatuses: MaintenanceStatus[] = [
    'Programado',
    'En Ejecución',
    'Inspección QA/QC',
    'Completado',
    'Observación Crítica',
  ];
  const estadoRaw = get(6, 'Programado') as MaintenanceStatus;
  const estado = validStatuses.includes(estadoRaw) ? estadoRaw : 'Programado';

  const validPriorities: PriorityLevel[] = ['Baja', 'Media', 'Alta', 'Crítica'];
  const prioridadRaw = get(7, 'Media') as PriorityLevel;
  const prioridad = validPriorities.includes(prioridadRaw) ? prioridadRaw : 'Media';

  const validPhases: PhaseId[] = ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0'];
  const phaseRaw = get(8, '1.0') as PhaseId;
  const phaseId = validPhases.includes(phaseRaw) ? phaseRaw : '1.0';

  const validPermits: WorkPermitType[] = [
    'Trabajo en Frío',
    'Trabajo en Caliente',
    'Espacio Confinado',
    'Trabajo en Altura',
  ];
  const permitRaw = get(21, 'Trabajo en Frío') as WorkPermitType;
  const permisoTipo = validPermits.includes(permitRaw) ? permitRaw : 'Trabajo en Frío';

  return {
    id: get(0, `sheet-row-${idx}-${Date.now()}`),
    codigoOrden: get(1, `OT-${tanque.replace('T-', '')}-${idx + 1}`),
    fecha: get(2, new Date().toISOString().slice(0, 10)),
    turno:
      get(3) === 'Extendido (07:00-19:00)'
        ? 'Extendido (07:00-19:00)'
        : 'Diurno (07:00-15:00)',
    tanque,
    tipo,
    estado,
    prioridad,
    phaseId,
    edt: get(9, '1.1'),
    actividadNombre: get(10, 'Actividad importada desde Google Sheets'),
    normaAplicable: get(11, 'API 653'),
    responsableCuadrilla: get(13, 'Cuadrilla Asignada'),
    especialidad: get(12, 'General'),
    personalCantidad: num(14, 2),
    horasHombre: num(15, 8),
    componenteAfectado: get(16, 'Tanque Estándar'),
    descripcionTecnica: get(17, ''),
    hallazgoCorrectivo: get(18, ''),
    materialesUsados: get(19, ''),
    equiposInstrumentos: get(20, ''),
    siaho: {
      permisoTipo,
      permisoNumero: get(22, 'PT-000'),
      artVerificado: get(23).toLowerCase() === 'sí' || get(23).toLowerCase() === 'si',
      vigiaExterior: get(24).toLowerCase() === 'sí' || get(24).toLowerCase() === 'si',
      eppBasicoCompleto: get(25) === 'Completo',
      eppEspecializadoCompleto: get(25) === 'Completo',
      readings: {
        o2: num(26, 20.9),
        lel: num(27, 0),
        h2s: num(28, 0),
        co: num(29, 0),
      },
    },
    qaqc: {
      metodoNdt: get(30, 'Inspección Visual'),
      espesorMinimoMils: get(31),
      perfilAnclajeMils: get(32),
      dftSecoMils: get(33),
      presionPruebaPsi: get(34),
      holidayTest:
        get(35) === 'Aprobado' || get(35) === 'Reproceso Requerido'
          ? (get(35) as 'Aprobado' | 'Reproceso Requerido')
          : 'N/A',
      vacuumBoxTest:
        get(36) === 'Aprobado (5-8 PSI)' || get(36) === 'Fuga Detectada'
          ? (get(36) as 'Aprobado (5-8 PSI)' | 'Fuga Detectada')
          : 'N/A',
    },
    observaciones: get(37, ''),
    syncedToSheets: true,
    updatedAt: get(38, new Date().toISOString()),
  };
}

export async function createMasterSpreadsheet(
  accessToken: string,
  title: string,
  records: MaintenanceRecord[]
): Promise<ConnectedSpreadsheet> {
  const created = await sheetsFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
    sheets: Array<{
      properties: {
        sheetId: number;
        title: string;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
    }>;
  }>(SHEETS_BASE_URL, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        title: title || `SGM API 653 — ${PROJECT_METADATA.empresaEjecutora}`,
        locale: 'es_ES',
      },
      sheets: [
        { properties: { title: 'Registros_Mantenimiento', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'EDT_Plan_Maestro', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Resumen_Tanques', gridProperties: { frozenRowCount: 1 } } },
      ],
    }),
  });

  const regSheetId = created.sheets[0].properties.sheetId;
  const edtSheetId = created.sheets[1].properties.sheetId;
  const sumSheetId = created.sheets[2].properties.sheetId;

  // Populate data into all 3 tabs
  const regValues = [SHEET_HEADERS, ...records.map(recordToSheetRow)];
  const edtValues = [
    ['EDT', 'Fase', 'Actividad Técnica', 'Días', 'Predecesora', 'Norma Aplicable', 'Conformación de Cuadrilla', 'HH Estimadas', 'Tipo Sugerido'],
    ...EDT_ACTIVITIES.map((a) => [
      a.edt,
      a.phaseId,
      a.name,
      a.days,
      a.predecessor,
      a.standard,
      a.crew,
      a.estimatedHH,
      a.recommendedType,
    ]),
  ];

  const tankRows = (['T-2303', 'T-2208', 'T-2209'] as TankId[]).map((tank) => {
    const tRecs = records.filter((r) => r.tanque === tank);
    const prev = tRecs.filter((r) => r.tipo === 'Preventivo').length;
    const corr = tRecs.filter((r) => r.tipo === 'Correctivo').length;
    const hh = tRecs.reduce((acc, r) => acc + r.horasHombre, 0);
    return [
      tank,
      PROJECT_METADATA.hhDirectasTanque,
      hh,
      Number(((hh / PROJECT_METADATA.hhDirectasTanque) * 100).toFixed(1)),
      prev,
      corr,
      tRecs.length,
    ];
  });
  const sumValues = [
    [
      'Tanque / Activo',
      'HH Directas Plan',
      'HH Registradas',
      '% Avance Directo',
      'Registros Preventivos',
      'Registros Correctivos',
      'Total Órdenes',
    ],
    ...tankRows,
  ];

  await sheetsFetch(
    `${SHEETS_BASE_URL}/${created.spreadsheetId}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Registros_Mantenimiento!A1', values: regValues },
          { range: 'EDT_Plan_Maestro!A1', values: edtValues },
          { range: 'Resumen_Tanques!A1', values: sumValues },
        ],
      }),
    }
  );

  // Style header rows with Navy #0F2942 background and white bold text
  const styleHeaderRequest = (sheetId: number, colCount: number) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.059, green: 0.161, blue: 0.259 },
          textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 10 },
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
    },
  });

  await sheetsFetch(`${SHEETS_BASE_URL}/${created.spreadsheetId}:batchUpdate`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        styleHeaderRequest(regSheetId, SHEET_HEADERS.length),
        styleHeaderRequest(edtSheetId, 9),
        styleHeaderRequest(sumSheetId, 7),
      ],
    }),
  });

  return {
    spreadsheetId: created.spreadsheetId,
    title: created.properties.title,
    url: created.spreadsheetUrl,
    tabs: created.sheets.map((s) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      rowCount: s.properties.gridProperties?.rowCount ?? 1000,
      columnCount: s.properties.gridProperties?.columnCount ?? 40,
    })),
    selectedTab: 'Registros_Mantenimiento',
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function syncRecordsToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  records: MaintenanceRecord[]
): Promise<void> {
  const safeRange = `'${sheetTitle.replace(/'/g, "''")}'!A1:AM`;
  await sheetsFetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(safeRange)}:clear`,
    accessToken,
    { method: 'POST' }
  );

  const values = [SHEET_HEADERS, ...records.map(recordToSheetRow)];
  const updateRange = `'${sheetTitle.replace(/'/g, "''")}'!A1`;

  await sheetsFetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(
      updateRange
    )}?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ values }),
    }
  );
}

export async function readRecordsFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<{ headers: string[]; rawRows: string[][]; mappedRecords: MaintenanceRecord[] }> {
  const range = `'${sheetTitle.replace(/'/g, "''")}'!A1:AM500`;
  const data = await sheetsFetch<{ values?: string[][] }>(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    accessToken
  );

  const values = data.values || [];
  if (values.length === 0) {
    return { headers: [], rawRows: [], mappedRecords: [] };
  }

  const headers = values[0];
  const rawRows = values.slice(1).filter((r) => r.some((cell) => String(cell).trim() !== ''));
  const mappedRecords = rawRows.map((row, idx) => sheetRowToRecord(row, idx));

  return { headers, rawRows, mappedRecords };
}
