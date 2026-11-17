export type TankId = 'T-2303' | 'T-2208' | 'T-2209';

export type MaintenanceType = 'Preventivo' | 'Correctivo';

export type MaintenanceStatus =
  | 'Programado'
  | 'En Ejecución'
  | 'Inspección QA/QC'
  | 'Completado'
  | 'Observación Crítica';

export type PriorityLevel = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export type WorkPermitType =
  | 'Trabajo en Frío'
  | 'Trabajo en Caliente'
  | 'Espacio Confinado'
  | 'Trabajo en Altura';

export type PhaseId = '1.0' | '2.0' | '3.0' | '4.0' | '5.0' | '6.0';

export interface PhaseDefinition {
  id: PhaseId;
  code: string;
  title: string;
  shortTitle: string;
  days: number;
  predecessor: string;
  standard: string;
  crewSummary: string;
  estimatedHH: number;
  colorHex: string;
  accentBgClass: string;
  accentTextClass: string;
  accentBorderClass: string;
  barClass: string;
  procedures: string[];
  materials: string[];
  equipment: {
    equipos: string;
    herramientas: string;
    instrumentos: string;
  };
  specializedEppKey:
    | 'limpieza'
    | 'inspeccion'
    | 'soldadura'
    | 'altura'
    | 'sandblasting'
    | 'pintura'
    | 'cierre';
}

export interface EdtActivity {
  edt: string;
  phaseId: PhaseId;
  name: string;
  days: number;
  predecessor: string;
  standard: string;
  crew: string;
  estimatedHH: number;
  recommendedType: MaintenanceType;
}

export interface SpecialtyConsolidated {
  id: string;
  role: string;
  hhDirectas: number;
  hhPermObra: number;
  totalHH: number;
  notes: string;
}

export interface AtmosphericReadings {
  o2: number; // Safe: 19.5 - 23.5 %
  lel: number; // Safe: 0 %
  h2s: number; // Safe: < 10 ppm
  co: number; // Safe: < 25 ppm
}

export interface SiahoChecklist {
  permisoTipo: WorkPermitType;
  permisoNumero: string;
  artVerificado: boolean;
  vigiaExterior: boolean;
  eppBasicoCompleto: boolean;
  eppEspecializadoCompleto: boolean;
  readings: AtmosphericReadings;
}

export interface QaQcMeasurements {
  metodoNdt: string;
  espesorMinimoMils?: string;
  perfilAnclajeMils?: string;
  dftSecoMils?: string;
  presionPruebaPsi?: string;
  holidayTest: 'N/A' | 'Aprobado' | 'Reproceso Requerido';
  vacuumBoxTest: 'N/A' | 'Aprobado (5-8 PSI)' | 'Fuga Detectada';
}

export interface MaintenanceRecord {
  id: string;
  codigoOrden: string;
  fecha: string;
  turno: 'Diurno (07:00-15:00)' | 'Extendido (07:00-19:00)';
  tanque: TankId;
  tipo: MaintenanceType;
  estado: MaintenanceStatus;
  prioridad: PriorityLevel;
  phaseId: PhaseId;
  edt: string;
  actividadNombre: string;
  normaAplicable: string;
  responsableCuadrilla: string;
  especialidad: string;
  personalCantidad: number;
  horasHombre: number;
  componenteAfectado: string;
  descripcionTecnica: string;
  hallazgoCorrectivo: string;
  materialesUsados: string;
  equiposInstrumentos: string;
  siaho: SiahoChecklist;
  qaqc: QaQcMeasurements;
  observaciones: string;
  syncedToSheets: boolean;
  updatedAt: string;
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface ConnectedSpreadsheet {
  spreadsheetId: string;
  title: string;
  url: string;
  tabs: SheetTabInfo[];
  selectedTab: string;
  lastSyncedAt: string | null;
}

export type AppView = 'resumen' | 'registro' | 'atlas' | 'edt' | 'siaho' | 'sheets';
