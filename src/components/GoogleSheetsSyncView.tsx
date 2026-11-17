import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  LogOut,
  Plus,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import {
  createMasterSpreadsheet,
  getSpreadsheetMetadata,
  parseSpreadsheetId,
  readRecordsFromSheet,
  syncRecordsToSheet,
} from '../services/googleSheets';
import { ConnectedSpreadsheet, MaintenanceRecord } from '../types/maintenance';
import { ConfirmDialog } from './ConfirmDialog';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleSheetsSyncViewProps {
  user: User | null;
  accessToken: string | null;
  isLoggingIn: boolean;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  records: MaintenanceRecord[];
  connectedSheet: ConnectedSpreadsheet | null;
  onUpdateConnectedSheet: (sheet: ConnectedSpreadsheet | null) => void;
  onImportRecords: (imported: MaintenanceRecord[], mode: 'replace' | 'merge') => void;
  onMarkAllSynced: () => void;
}

export const GoogleSheetsSyncView: React.FC<GoogleSheetsSyncViewProps> = ({
  user,
  accessToken,
  isLoggingIn,
  onLogin,
  onLogout,
  records,
  connectedSheet,
  onUpdateConnectedSheet,
  onImportRecords,
  onMarkAllSynced,
}) => {
  const [newSheetTitle, setNewSheetTitle] = useState(
    'SGM Tanques API 653 — Mantenimiento T-2303 / T-2208 / T-2209'
  );
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: string[][];
    mapped: MaintenanceRecord[];
  } | null>(null);

  // Confirmation modals for mutating/destructive operations
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState<'replace' | 'merge' | null>(
    null
  );

  const needsAuth = !accessToken;

  const handleCreateNewSheet = async () => {
    if (!accessToken) return;
    setBusyAction('create');
    setFeedback(null);
    try {
      const sheet = await createMasterSpreadsheet(
        accessToken,
        newSheetTitle,
        records
      );
      onUpdateConnectedSheet(sheet);
      onMarkAllSynced();
      setFeedback({
        type: 'success',
        text: `Hoja de cálculo "${sheet.title}" creada con 3 pestañas y ${records.length} registros sincronizados.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'No se pudo crear la hoja en Google Sheets.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const id = parseSpreadsheetId(sheetUrlInput);
    if (!id) {
      setFeedback({
        type: 'error',
        text: 'Ingresa un enlace válido de Google Sheets o el ID de la hoja de cálculo.',
      });
      return;
    }

    setBusyAction('connect');
    setFeedback(null);
    try {
      const meta = await getSpreadsheetMetadata(accessToken, id);
      onUpdateConnectedSheet(meta);
      setPreviewData(null);
      setFeedback({
        type: 'success',
        text: `Conectado a "${meta.title}" (${meta.tabs.length} pestañas detectadas).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Error al leer metadatos de la hoja de cálculo.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleReadPreview = async () => {
    if (!accessToken || !connectedSheet || !connectedSheet.selectedTab) return;
    setBusyAction('read');
    setFeedback(null);
    try {
      const res = await readRecordsFromSheet(
        accessToken,
        connectedSheet.spreadsheetId,
        connectedSheet.selectedTab
      );
      setPreviewData({
        headers: res.headers,
        rows: res.rawRows,
        mapped: res.mappedRecords,
      });
      setFeedback({
        type: 'success',
        text: `Leídas ${res.rawRows.length} filas desde la pestaña "${connectedSheet.selectedTab}".`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'No se pudieron leer las filas de la pestaña seleccionada.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const executeConfirmedSync = async () => {
    if (!accessToken || !connectedSheet || !connectedSheet.selectedTab) return;
    setBusyAction('sync');
    setFeedback(null);
    try {
      await syncRecordsToSheet(
        accessToken,
        connectedSheet.spreadsheetId,
        connectedSheet.selectedTab,
        records
      );
      onUpdateConnectedSheet({
        ...connectedSheet,
        lastSyncedAt: new Date().toISOString(),
      });
      onMarkAllSynced();
      setConfirmSyncOpen(false);
      setFeedback({
        type: 'success',
        text: `Sincronización completada: ${records.length} registros escritos en "${connectedSheet.selectedTab}".`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Error al escribir en Google Sheets.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const executeConfirmedImport = () => {
    if (!previewData || !confirmImportOpen) return;
    onImportRecords(previewData.mapped, confirmImportOpen);
    setConfirmImportOpen(null);
    setFeedback({
      type: 'success',
      text: `Importados ${previewData.mapped.length} registros desde "${connectedSheet?.selectedTab}".`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Estado de Autenticación Google */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Integración en Vivo con Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Crea hojas de cálculo estructuradas o sincroniza tus órdenes de mantenimiento preventivas y correctivas en tiempo real.
              </p>
            </div>
          </div>

          {needsAuth ? (
            <GoogleSignInButton
              onClick={onLogin}
              disabled={isLoggingIn}
              label={isLoggingIn ? 'Conectando...' : 'Sign in with Google'}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">
                  {user?.displayName || 'Cuenta Conectada'}
                </p>
                <p className="font-mono text-[11px] text-emerald-700">
                  {user?.email || 'Sesión activa con Google Sheets'}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Desconectar</span>
              </button>
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-xs font-medium ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </section>

      {needsAuth ? (
        <section className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-900">
            Conecta tu cuenta de Google para habilitar la sincronización
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
            Podrás generar automáticamente un libro de Google Sheets con las 3 pestañas del
            Plan Maestro API 653 o vincular una hoja existente mediante su URL.
          </p>
          <div className="mt-5 flex justify-center">
            <GoogleSignInButton
              onClick={onLogin}
              disabled={isLoggingIn}
              label={isLoggingIn ? 'Conectando...' : 'Sign in with Google'}
            />
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Columna Izquierda: Crear o Vincular */}
          <div className="space-y-6 lg:col-span-5">
            {/* Opción A: Crear Libro Maestro Nuevo */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  1. Crear Nueva Hoja Maestra API 653
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Genera automáticamente un libro en Google Sheets con encabezados estilizados
                  y pestañas para Registros, EDT y Resumen por Tanque.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nombre del Documento en Google Sheets
                </label>
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={busyAction !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-sky-900 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                <span>
                  {busyAction === 'create'
                    ? 'Creando Hoja en Google Sheets...'
                    : `Crear Hoja con ${records.length} Registros`}
                </span>
              </button>
            </div>

            {/* Opción B: Conectar Hoja Existente */}
            <form
              onSubmit={handleConnectExisting}
              className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  2. Conectar Hoja de Cálculo Existente
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pega la URL o el ID de cualquier hoja de Google Sheets para listar sus
                  pestañas reales y sincronizar datos.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  URL o ID de Google Spreadsheet
                </label>
                <input
                  type="text"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={busyAction !== null || !sheetUrlInput.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                <Link2 className="h-4 w-4" />
                <span>
                  {busyAction === 'connect' ? 'Conectando...' : 'Detectar Pestañas y Conectar'}
                </span>
              </button>
            </form>
          </div>

          {/* Columna Derecha: Panel de Sincronización Activa */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 space-y-5">
            {!connectedSheet ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                <UploadCloud className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Ninguna hoja de cálculo vinculada todavía
                </p>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  Crea una nueva hoja maestra a la izquierda o conecta una existente por su enlace.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Hoja Vinculada Activa</span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      {connectedSheet.title}
                    </h3>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                      ID: {connectedSheet.spreadsheetId}
                      {connectedSheet.lastSyncedAt &&
                        ` · Última sinc.: ${new Date(
                          connectedSheet.lastSyncedAt
                        ).toLocaleTimeString()}`}
                    </p>
                  </div>

                  <a
                    href={connectedSheet.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <span>Abrir en Google Sheets</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Selector dinámico de pestaña */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Pestaña Destino / Origen
                    </label>
                    <select
                      value={connectedSheet.selectedTab}
                      onChange={(e) =>
                        onUpdateConnectedSheet({
                          ...connectedSheet,
                          selectedTab: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      {connectedSheet.tabs.map((tab) => (
                        <option key={tab.sheetId} value={tab.title}>
                          {tab.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={handleReadPreview}
                      disabled={busyAction !== null}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Leer Datos de Pestaña</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmSyncOpen(true)}
                      disabled={busyAction !== null || records.length === 0}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Sincronizar ({records.length})</span>
                    </button>
                  </div>
                </div>

                {/* Vista previa de datos leídos */}
                {previewData && (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800">
                        Vista Previa de &quot;{connectedSheet.selectedTab}&quot; (
                        {previewData.rows.length} filas)
                      </p>
                      {previewData.mapped.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmImportOpen('merge')}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-800 hover:bg-sky-100"
                          >
                            <Download className="h-3 w-3" />
                            <span>Combinar al Registro Local</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmImportOpen('replace')}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
                          >
                            <span>Reemplazar Registro Local</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {previewData.rows.length === 0 ? (
                      <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                        La pestaña está vacía o solo contiene encabezados.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
                        <table className="w-full border-collapse text-left text-[11px]">
                          <thead className="sticky top-0 bg-slate-100 font-semibold text-slate-700">
                            <tr>
                              {previewData.headers.slice(0, 8).map((h, i) => (
                                <th key={i} className="px-3 py-2 whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {previewData.rows.slice(0, 10).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50">
                                {previewData.headers.slice(0, 8).map((_, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="max-w-[160px] truncate px-3 py-2 text-slate-700"
                                  >
                                    {row[cIdx] || '—'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Diálogo Confirmación Obligatoria antes de modificar Google Sheets */}
      <ConfirmDialog
        open={confirmSyncOpen}
        title="Confirmar actualización en Google Sheets"
        description="Esta acción sobrescribirá el contenido de la pestaña seleccionada en Google Sheets con los registros actuales del sistema."
        details={[
          `Documento: ${connectedSheet?.title || ''}`,
          `Pestaña afectada: ${connectedSheet?.selectedTab || ''}`,
          `Total de registros a escribir: ${records.length} órdenes de mantenimiento`,
        ]}
        confirmLabel="Confirmar y Sincronizar"
        cancelLabel="Cancelar"
        isLoading={busyAction === 'sync'}
        onConfirm={executeConfirmedSync}
        onCancel={() => setConfirmSyncOpen(false)}
      />

      {/* Diálogo Confirmación Importación */}
      <ConfirmDialog
        open={confirmImportOpen !== null}
        title={
          confirmImportOpen === 'replace'
            ? 'Reemplazar registros locales con Google Sheets'
            : 'Combinar registros de Google Sheets'
        }
        description={
          confirmImportOpen === 'replace'
            ? 'Se reemplazarán tus registros locales actuales por las filas importadas desde Google Sheets.'
            : 'Se agregarán los registros nuevos de Google Sheets a tu bitácora local actual.'
        }
        details={[
          `Origen: ${connectedSheet?.title} (${connectedSheet?.selectedTab})`,
          `Registros detectados: ${previewData?.mapped.length ?? 0}`,
        ]}
        confirmLabel="Confirmar Importación"
        cancelLabel="Cancelar"
        onConfirm={executeConfirmedImport}
        onCancel={() => setConfirmImportOpen(null)}
      />
    </div>
  );
};
