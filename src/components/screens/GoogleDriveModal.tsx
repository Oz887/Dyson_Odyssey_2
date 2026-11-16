import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckSquare,
  Cloud,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileJson,
  FileText,
  FolderOpen,
  Globe,
  HardDriveUpload,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Share2,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { soundEngine } from '../../engine/audio';
import {
  getAccessToken,
  getCurrentGoogleUser,
  googleSignIn,
  initAuth,
  logout,
} from '../../engine/googleAuth';
import {
  createCloudSave,
  createCloudSaveFromSnapshot,
  deleteDriveFile,
  downloadCloudSave,
  DriveActivityEntry,
  DriveAuthError,
  DriveFileItem,
  enablePublicLinkAccess,
  exportExpeditionReport,
  fetchDriveActivity,
  getDriveFileSharing,
  getPublicPermission,
  getShareableUrl,
  listDriveFiles,
  listSolarCloudSaves,
  overwriteCloudSave,
  overwriteCloudSaveFromSnapshot,
  renameDriveFile,
  revokePublicLinkAccess,
} from '../../engine/googleDrive';
import { GameSnapshot, Language, SaveSlot } from '../../types/game';
import { GoogleSignInButton } from '../GoogleSignInButton';

interface GoogleDriveModalProps {
  language: Language;
  activeSnapshot?: GameSnapshot | null;
  activePosition?: { x: number; y: number };
  localSaves: SaveSlot[];
  onLoadCloudSave: (slot: SaveSlot) => void;
  onNotify: (msg: string) => void;
  onClose: () => void;
}

type DriveTab = 'cloud_saves' | 'explorer';

type PendingConfirmAction =
  | {
      kind: 'delete_files';
      files: DriveFileItem[];
    }
  | {
      kind: 'overwrite_save';
      targetFile: DriveFileItem;
      sourceLabel: string;
      localSlot?: SaveSlot;
    }
  | {
      kind: 'rename_file';
      targetFile: DriveFileItem;
      newName: string;
    }
  | {
      kind: 'enable_public_link';
      targetFile: DriveFileItem;
    }
  | {
      kind: 'revoke_public_link';
      targetFile: DriveFileItem;
      permissionId: string;
    };

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  language,
  activeSnapshot = null,
  activePosition = { x: 180, y: 128 },
  localSaves,
  onLoadCloudSave,
  onNotify,
  onClose,
}) => {
  const es = language === 'es';
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [tab, setTab] = useState<DriveTab>('cloud_saves');
  const [loading, setLoading] = useState(false);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [cloudSaves, setCloudSaves] = useState<DriveFileItem[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [activityEntries, setActivityEntries] = useState<DriveActivityEntry[] | null>(null);
  const [activityTargetLabel, setActivityTargetLabel] = useState<string>('');

  const [renameDraft, setRenameDraft] = useState<{ file: DriveFileItem; value: string } | null>(
    null
  );
  const [shareModalFile, setShareModalFile] = useState<DriveFileItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);

  const loadData = useCallback(
    async (tokenOverride?: string, queryOverride?: string) => {
      const token = tokenOverride ?? (await getAccessToken());
      if (!token) {
        setNeedsAuth(true);
        return;
      }
      setLoading(true);
      setErrorMsg(null);
      try {
        const [savesList, explorerRes] = await Promise.all([
          listSolarCloudSaves(token),
          listDriveFiles(token, queryOverride ?? searchQuery),
        ]);
        setCloudSaves(savesList);
        setDriveFiles(explorerRes.files);
        setNextPageToken(explorerRes.nextPageToken);
        setSelectedIds([]);
      } catch (err) {
        if (err instanceof DriveAuthError) {
          setNeedsAuth(true);
        } else {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load Drive files.');
        }
      } finally {
        setLoading(false);
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setUserEmail(user.email);
        setUserName(user.displayName);
        setNeedsAuth(false);
        void loadData(token);
      },
      () => {
        const existing = getCurrentGoogleUser();
        setUserEmail(existing?.email ?? null);
        setUserName(existing?.displayName ?? null);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, [loadData]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUserEmail(result.user.email);
        setUserName(result.user.displayName);
        setNeedsAuth(false);
        await loadData(result.accessToken);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    soundEngine.playClick();
    await logout();
    setUserEmail(null);
    setUserName(null);
    setCloudSaves([]);
    setDriveFiles([]);
    setActivityEntries(null);
    setNeedsAuth(true);
  };

  const handleUploadActiveSnapshot = async () => {
    if (!activeSnapshot) return;
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setBusyMessage(es ? 'Guardando en Google Drive...' : 'Uploading snapshot to Google Drive...');
    setErrorMsg(null);
    try {
      const created = await createCloudSaveFromSnapshot(token, activeSnapshot, activePosition);
      onNotify(
        es
          ? `Guardado en Drive: ${created.name}`
          : `Saved to Drive: ${created.name}`
      );
      await loadData(token);
    } catch (err) {
      if (err instanceof DriveAuthError) setNeedsAuth(true);
      else setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusyMessage(null);
    }
  };

  const handlePushLocalSlot = async (slot: SaveSlot) => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setBusyMessage(es ? 'Subiendo partida local...' : 'Uploading local save...');
    setErrorMsg(null);
    try {
      const created = await createCloudSave(token, slot);
      onNotify(es ? `Subida: ${created.name}` : `Uploaded: ${created.name}`);
      await loadData(token);
    } catch (err) {
      if (err instanceof DriveAuthError) setNeedsAuth(true);
      else setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusyMessage(null);
    }
  };

  const handleLoadFromDrive = async (file: DriveFileItem) => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setBusyMessage(es ? 'Descargando partida...' : 'Downloading cloud save...');
    setErrorMsg(null);
    try {
      const slot = await downloadCloudSave(token, file.id);
      soundEngine.playClick();
      onLoadCloudSave(slot);
      onNotify(es ? `Cargada desde Drive: ${slot.name}` : `Loaded from Drive: ${slot.name}`);
    } catch (err) {
      if (err instanceof DriveAuthError) setNeedsAuth(true);
      else setErrorMsg(err instanceof Error ? err.message : 'Could not load save.');
    } finally {
      setBusyMessage(null);
    }
  };

  const handleExportReport = async () => {
    if (!activeSnapshot) return;
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setBusyMessage(es ? 'Exportando bitácora...' : 'Exporting expedition log...');
    setErrorMsg(null);
    try {
      const created = await exportExpeditionReport(token, activeSnapshot);
      onNotify(es ? `Bitácora exportada: ${created.name}` : `Log exported: ${created.name}`);
      await loadData(token);
    } catch (err) {
      if (err instanceof DriveAuthError) setNeedsAuth(true);
      else setErrorMsg(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setBusyMessage(null);
    }
  };

  const handleInspectActivity = async (file?: DriveFileItem) => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setBusyMessage(es ? 'Consultando actividad...' : 'Loading Drive activity...');
    setErrorMsg(null);
    try {
      const list = await fetchDriveActivity(token, file?.id);
      setActivityTargetLabel(file ? file.name : es ? 'Todo Google Drive' : 'All Google Drive');
      setActivityEntries(list);
    } catch (err) {
      if (err instanceof DriveAuthError) setNeedsAuth(true);
      else setErrorMsg(err instanceof Error ? err.message : 'Could not fetch activity.');
    } finally {
      setBusyMessage(null);
    }
  };

  const handleLoadMoreFiles = async () => {
    if (!nextPageToken) return;
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setLoading(true);
    try {
      const res = await listDriveFiles(token, searchQuery, nextPageToken);
      setDriveFiles((prev) => [...prev, ...res.files]);
      setNextPageToken(res.nextPageToken);
    } catch (err) {
      if (err instanceof DriveAuthError) setNeedsAuth(true);
      else setErrorMsg(err instanceof Error ? err.message : 'Failed to load next page.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShareModal = async (file: DriveFileItem) => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setCopiedLink(false);
    setShareModalFile(file);
    try {
      const fresh = await getDriveFileSharing(token, file.id);
      setShareModalFile(fresh);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        setShareModalFile(null);
        setNeedsAuth(true);
      } else {
        setErrorMsg(
          err instanceof Error ? err.message : 'Could not inspect sharing permissions.'
        );
      }
    }
  };

  const handleCopyShareLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      soundEngine.playClick();
      onNotify(es ? '¡Enlace público copiado!' : 'Public link copied!');
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setErrorMsg(
        es
          ? 'No se pudo copiar automáticamente; copia el enlace manualmente.'
          : 'Clipboard blocked; please copy the link manually.'
      );
    }
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);

    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setErrorMsg(null);
    try {
      if (action.kind === 'delete_files') {
        setBusyMessage(
          es
            ? `Eliminando ${action.files.length} archivo(s)...`
            : `Deleting ${action.files.length} file(s)...`
        );
        for (const f of action.files) {
          await deleteDriveFile(token, f.id);
        }
        onNotify(
          es
            ? `${action.files.length} archivo(s) eliminado(s) de Google Drive.`
            : `Deleted ${action.files.length} file(s) from Google Drive.`
        );
      } else if (action.kind === 'overwrite_save') {
        setBusyMessage(
          es
            ? `Sobrescribiendo ${action.targetFile.name}...`
            : `Overwriting ${action.targetFile.name}...`
        );
        if (action.localSlot) {
          await overwriteCloudSave(token, action.targetFile.id, action.localSlot);
        } else if (activeSnapshot) {
          await overwriteCloudSaveFromSnapshot(
            token,
            action.targetFile.id,
            activeSnapshot,
            activePosition
          );
        }
        onNotify(
          es
            ? `Archivo actualizado: ${action.targetFile.name}`
            : `Updated file: ${action.targetFile.name}`
        );
      } else if (action.kind === 'rename_file') {
        setBusyMessage(
          es
            ? `Renombrando ${action.targetFile.name}...`
            : `Renaming ${action.targetFile.name}...`
        );
        await renameDriveFile(token, action.targetFile.id, action.newName);
        setRenameDraft(null);
        onNotify(
          es ? `Renombrado a ${action.newName}` : `Renamed to ${action.newName}`
        );
      } else if (action.kind === 'enable_public_link') {
        setBusyMessage(
          es
            ? `Activando enlace público para ${action.targetFile.name}...`
            : `Enabling public link for ${action.targetFile.name}...`
        );
        const updated = await enablePublicLinkAccess(token, action.targetFile.id);
        setShareModalFile(updated);
        setCopiedLink(false);
        onNotify(
          es
            ? `Enlace público activado para ${updated.name}`
            : `Public link enabled for ${updated.name}`
        );
      } else if (action.kind === 'revoke_public_link') {
        setBusyMessage(
          es
            ? `Revocando acceso público de ${action.targetFile.name}...`
            : `Revoking public access for ${action.targetFile.name}...`
        );
        const updated = await revokePublicLinkAccess(
          token,
          action.targetFile.id,
          action.permissionId
        );
        setShareModalFile(updated);
        onNotify(
          es
            ? `Acceso público revocado para ${updated.name}`
            : `Public access revoked for ${updated.name}`
        );
      }

      await loadData(token);
    } catch (err) {
      if (err instanceof DriveAuthError) setNeedsAuth(true);
      else setErrorMsg(err instanceof Error ? err.message : 'Operation failed.');
    } finally {
      setBusyMessage(null);
    }
  };

  const toggleSelectFile = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedFileObjects = driveFiles.filter((f) => selectedIds.includes(f.id));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/88 flex items-center justify-center p-3 sm:p-5">
      <div className="pixel-panel w-full max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-slate-700">
          <div className="flex items-center gap-2.5 min-w-0">
            <Cloud className="w-5 h-5 text-sky-400 shrink-0" />
            <h2 className="font-pixel text-base sm:text-lg text-amber-300 truncate">
              {es ? 'Google Drive · Nube de Misión' : 'Google Drive · Mission Cloud'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!needsAuth && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    void loadData();
                  }}
                  disabled={loading || Boolean(busyMessage)}
                  className="pixel-btn p-2 bg-slate-800 border-2 border-slate-500 text-sky-300 cursor-pointer disabled:opacity-50"
                  title={es ? 'Actualizar' : 'Refresh'}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="pixel-btn flex items-center gap-1.5 px-2.5 py-2 bg-slate-800 border-2 border-slate-500 text-rose-300 font-pixel text-[10px] cursor-pointer"
                  title={es ? 'Cerrar sesión' : 'Sign out'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{es ? 'Salir' : 'Sign Out'}</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                soundEngine.playCloseMenu();
                onClose();
              }}
              className="pixel-btn p-2 bg-slate-800 border-2 border-slate-500 text-slate-200 cursor-pointer"
              aria-label={es ? 'Cerrar' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auth Gate */}
        {needsAuth ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4 space-y-5">
            <div className="w-14 h-14 flex items-center justify-center bg-slate-900 border-2 border-sky-400">
              <Cloud className="w-8 h-8 text-sky-300" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="font-pixel text-base text-white">
                {es ? 'Conecta tu Google Drive' : 'Connect Your Google Drive'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {es
                  ? 'Sincroniza partidas guardadas de Solar Odyssey entre dispositivos, exporta bitácoras de expedición y administra tus archivos en Drive.'
                  : 'Sync Solar Odyssey save snapshots across devices, export expedition telemetry reports, and browse or manage your Google Drive files.'}
              </p>
            </div>

            <GoogleSignInButton
              onClick={handleLogin}
              disabled={isLoggingIn}
              label={
                isLoggingIn
                  ? es
                    ? 'Conectando...'
                    : 'Signing in...'
                  : 'Sign in with Google'
              }
            />

            {authError && (
              <div className="max-w-md px-3 py-2 bg-rose-950 border-2 border-rose-400 text-rose-200 text-xs">
                {authError}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 mt-3 gap-3">
            {/* Account strip + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/90 border-2 border-slate-700 px-3 py-2">
              <div className="text-xs text-slate-300 truncate">
                <span className="font-pixel text-[10px] text-emerald-300 mr-2">
                  {es ? 'CONECTADO:' : 'CONNECTED:'}
                </span>
                <span className="font-medium text-white">{userName ?? 'Explorer'}</span>
                {userEmail && (
                  <span className="text-slate-400 ml-1.5 font-mono-num">({userEmail})</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setTab('cloud_saves');
                  }}
                  className={`pixel-btn px-3 py-1.5 border-2 font-pixel text-[11px] cursor-pointer ${
                    tab === 'cloud_saves'
                      ? 'bg-amber-400 border-amber-100 text-slate-950'
                      : 'bg-slate-800 border-slate-600 text-slate-200'
                  }`}
                >
                  {es ? 'Partidas Nube' : 'Cloud Saves'} ({cloudSaves.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setTab('explorer');
                  }}
                  className={`pixel-btn px-3 py-1.5 border-2 font-pixel text-[11px] cursor-pointer ${
                    tab === 'explorer'
                      ? 'bg-sky-400 border-sky-100 text-slate-950'
                      : 'bg-slate-800 border-slate-600 text-slate-200'
                  }`}
                >
                  {es ? 'Explorador Drive' : 'Drive Explorer'}
                </button>
              </div>
            </div>

            {/* Status / Error banners */}
            {(busyMessage || errorMsg) && (
              <div
                className={`px-3 py-2 border-2 text-xs flex items-center justify-between gap-2 ${
                  errorMsg
                    ? 'bg-rose-950 border-rose-400 text-rose-100'
                    : 'bg-sky-950 border-sky-400 text-sky-100'
                }`}
              >
                <span>{errorMsg ?? busyMessage}</span>
                {errorMsg && (
                  <button
                    type="button"
                    onClick={() => setErrorMsg(null)}
                    className="text-rose-200 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* TAB 1: CLOUD SAVES */}
            {tab === 'cloud_saves' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Upload Action Bar */}
                <div className="bg-slate-900 border-2 border-slate-700 p-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-pixel text-xs text-sky-300">
                      {activeSnapshot
                        ? es
                          ? `Misión Activa · Día ${activeSnapshot.day} (${activeSnapshot.planetPreset.nameEs})`
                          : `Active Mission · Day ${activeSnapshot.day} (${activeSnapshot.planetPreset.nameEn})`
                        : es
                          ? 'Respaldo de Partidas Locales'
                          : 'Local Saves Cloud Backup'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {activeSnapshot
                        ? es
                          ? 'Sube una nueva copia a Drive o sobrescribe una existente.'
                          : 'Upload a fresh snapshot to Drive or overwrite an existing slot.'
                        : es
                          ? 'Sube cualquiera de tus partidas locales o carga una desde Drive.'
                          : 'Upload any local save to Google Drive or load one straight into play.'}
                    </div>
                  </div>

                  {activeSnapshot && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={Boolean(busyMessage)}
                        onClick={handleUploadActiveSnapshot}
                        className="pixel-btn flex items-center gap-1.5 px-3 py-2 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-[11px] cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{es ? 'Guardar Nueva en Drive' : 'Save New to Drive'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busyMessage)}
                        onClick={handleExportReport}
                        className="pixel-btn flex items-center gap-1.5 px-3 py-2 bg-indigo-500 border-2 border-indigo-200 text-white font-pixel text-[11px] cursor-pointer disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{es ? 'Exportar Bitácora' : 'Export Report'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Cloud Saves List */}
                <div className="space-y-2">
                  <div className="font-pixel text-[11px] text-amber-300">
                    {es ? 'PARTIDAS EN GOOGLE DRIVE' : 'SAVES STORED IN GOOGLE DRIVE'}
                  </div>

                  {loading && cloudSaves.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {es ? 'Cargando partidas en la nube...' : 'Loading cloud saves...'}
                    </div>
                  ) : cloudSaves.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 bg-slate-900/60 border-2 border-slate-800">
                      {es
                        ? 'No hay partidas de Solar Odyssey en tu Google Drive aún.'
                        : 'No Solar Odyssey saves found in your Google Drive yet.'}
                    </div>
                  ) : (
                    cloudSaves.map((file) => {
                      const isPublic = Boolean(getPublicPermission(file));
                      return (
                        <div
                          key={file.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-slate-900 border-2 border-slate-700"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <FileJson className="w-4 h-4 text-amber-300 shrink-0" />
                              <span className="font-pixel text-xs text-white truncate">
                                {file.name}
                              </span>
                              {isPublic && (
                                <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-300 font-pixel text-[9px] shrink-0">
                                  {es ? 'PÚBLICO' : 'PUBLIC'}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-400 font-mono-num flex flex-wrap gap-2">
                              {file.description && <span>{file.description}</span>}
                              {file.modifiedTime && (
                                <span>· {new Date(file.modifiedTime).toLocaleString()}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={Boolean(busyMessage)}
                              onClick={() => void handleLoadFromDrive(file)}
                              className="pixel-btn flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-[11px] cursor-pointer disabled:opacity-50"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{es ? 'Cargar' : 'Load'}</span>
                            </button>

                            <button
                              type="button"
                              disabled={Boolean(busyMessage)}
                              onClick={() => void handleOpenShareModal(file)}
                              className={`pixel-btn flex items-center gap-1 px-2.5 py-1.5 border-2 font-pixel text-[10px] cursor-pointer disabled:opacity-50 ${
                                isPublic
                                  ? 'bg-cyan-500 border-cyan-200 text-slate-950'
                                  : 'bg-slate-800 border-slate-500 text-sky-200'
                              }`}
                              title={es ? 'Compartir acceso público por link' : 'Share public link'}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>{es ? 'Link' : 'Share'}</span>
                            </button>

                            {activeSnapshot && (
                              <button
                                type="button"
                                disabled={Boolean(busyMessage)}
                                onClick={() =>
                                  setPendingConfirm({
                                    kind: 'overwrite_save',
                                    targetFile: file,
                                    sourceLabel: es
                                      ? `Misión actual (Día ${activeSnapshot.day})`
                                      : `Current mission (Day ${activeSnapshot.day})`,
                                  })
                                }
                                className="pixel-btn flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 border-2 border-amber-200 text-slate-950 font-pixel text-[10px] cursor-pointer disabled:opacity-50"
                                title={es ? 'Sobrescribir archivo' : 'Overwrite file'}
                              >
                                <HardDriveUpload className="w-3.5 h-3.5" />
                                <span>{es ? 'Sobrescribir' : 'Overwrite'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={Boolean(busyMessage)}
                              onClick={() =>
                                setPendingConfirm({
                                  kind: 'delete_files',
                                  files: [file],
                                })
                              }
                              className="pixel-btn p-1.5 bg-rose-600 border-2 border-rose-300 text-white cursor-pointer disabled:opacity-50"
                              title={es ? 'Eliminar de Drive' : 'Delete from Drive'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Local Saves Quick Push */}
                {localSaves.length > 0 && (
                  <div className="space-y-2 pt-2 border-t-2 border-slate-800">
                    <div className="font-pixel text-[11px] text-sky-300">
                      {es
                        ? 'PARTIDAS LOCALES (SUBIR A DRIVE)'
                        : 'LOCAL SAVES (PUSH TO DRIVE)'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {localSaves.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between gap-2 p-2.5 bg-slate-900/70 border-2 border-slate-700"
                        >
                          <div className="min-w-0">
                            <div className="font-pixel text-[11px] text-white truncate">
                              {slot.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono-num">
                              {es ? 'Día' : 'Day'} {slot.day} · HP {Math.round(slot.stats.health)}%
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={Boolean(busyMessage)}
                            onClick={() => void handlePushLocalSlot(slot)}
                            className="pixel-btn flex items-center gap-1 px-2.5 py-1.5 bg-sky-500 border-2 border-sky-200 text-slate-950 font-pixel text-[10px] cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{es ? 'Subir' : 'Upload'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DRIVE EXPLORER & ACTIVITY */}
            {tab === 'explorer' && (
              <div className="flex-1 flex flex-col min-h-0 gap-2.5">
                {/* Search & Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void loadData();
                    }}
                    className="flex-1 min-w-[200px] flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          es ? 'Buscar archivos en Drive...' : 'Search Google Drive files...'
                        }
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border-2 border-slate-600 text-xs text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="pixel-btn px-3 py-1.5 bg-sky-500 border-2 border-sky-200 text-slate-950 font-pixel text-[11px] cursor-pointer"
                    >
                      {es ? 'Buscar' : 'Search'}
                    </button>
                  </form>

                  <button
                    type="button"
                    disabled={Boolean(busyMessage)}
                    onClick={() => void handleInspectActivity()}
                    className="pixel-btn flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border-2 border-slate-500 text-amber-300 font-pixel text-[10px] cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{es ? 'Actividad Reciente' : 'Recent Activity'}</span>
                  </button>

                  {selectedFileObjects.length > 0 && (
                    <button
                      type="button"
                      disabled={Boolean(busyMessage)}
                      onClick={() =>
                        setPendingConfirm({
                          kind: 'delete_files',
                          files: selectedFileObjects,
                        })
                      }
                      className="pixel-btn flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-600 border-2 border-rose-300 text-white font-pixel text-[10px] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {es
                          ? `Eliminar (${selectedFileObjects.length})`
                          : `Delete (${selectedFileObjects.length})`}
                      </span>
                    </button>
                  )}
                </div>

                {/* Activity Drawer if open */}
                {activityEntries !== null && (
                  <div className="bg-slate-900 border-2 border-amber-400/70 p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[10px] text-amber-300">
                        {es ? 'ACTIVIDAD:' : 'ACTIVITY:'} {activityTargetLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivityEntries(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {activityEntries.length === 0 ? (
                      <div className="text-[11px] text-slate-400">
                        {es ? 'Sin actividad reciente registrada.' : 'No recent activity recorded.'}
                      </div>
                    ) : (
                      activityEntries.map((act, idx) => (
                        <div
                          key={`${act.timestamp}-${idx}`}
                          className="text-[11px] text-slate-300 flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-1"
                        >
                          <span className="truncate">
                            <strong className="text-sky-300">{act.actionSummary}</strong> ·{' '}
                            {act.targetTitle}
                          </span>
                          <span className="text-slate-400 font-mono-num">
                            {new Date(act.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* File List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {driveFiles.length === 0 && !loading ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      {es ? 'No se encontraron archivos.' : 'No Drive files found.'}
                    </div>
                  ) : (
                    driveFiles.map((file) => {
                      const isFolder =
                        file.mimeType === 'application/vnd.google-apps.folder';
                      const isJson =
                        file.mimeType === 'application/json' ||
                        file.name.endsWith('.json');
                      const isSelected = selectedIds.includes(file.id);
                      const isRenaming = renameDraft?.file.id === file.id;
                      const isPublic = Boolean(getPublicPermission(file));

                      return (
                        <div
                          key={file.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-900 border-2 border-slate-700"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => toggleSelectFile(file.id)}
                              className="text-slate-300 hover:text-white cursor-pointer shrink-0"
                              aria-label="Select file"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-sky-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                            {isFolder ? (
                              <FolderOpen className="w-4 h-4 text-amber-300 shrink-0" />
                            ) : isJson ? (
                              <FileJson className="w-4 h-4 text-emerald-300 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-sky-300 shrink-0" />
                            )}

                            <div className="min-w-0 flex-1">
                              {isRenaming ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={renameDraft.value}
                                    onChange={(e) =>
                                      setRenameDraft({
                                        file,
                                        value: e.target.value,
                                      })
                                    }
                                    className="flex-1 px-2 py-1 bg-slate-950 border border-sky-400 text-xs text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const trimmed = renameDraft.value.trim();
                                      if (!trimmed || trimmed === file.name) {
                                        setRenameDraft(null);
                                        return;
                                      }
                                      setPendingConfirm({
                                        kind: 'rename_file',
                                        targetFile: file,
                                        newName: trimmed,
                                      });
                                    }}
                                    className="px-2 py-1 bg-emerald-500 text-slate-950 font-pixel text-[10px] cursor-pointer"
                                  >
                                    OK
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRenameDraft(null)}
                                    className="px-2 py-1 bg-slate-700 text-white font-pixel text-[10px] cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-medium text-white truncate">
                                    {file.name}
                                  </span>
                                  {isPublic && (
                                    <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-300 font-pixel text-[9px] shrink-0">
                                      {es ? 'PÚBLICO' : 'PUBLIC'}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 font-mono-num truncate">
                                {file.modifiedTime
                                  ? new Date(file.modifiedTime).toLocaleDateString()
                                  : ''}
                                {file.size
                                  ? ` · ${Math.max(1, Math.round(Number(file.size) / 1024))} KB`
                                  : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isJson && (
                              <button
                                type="button"
                                disabled={Boolean(busyMessage)}
                                onClick={() => void handleLoadFromDrive(file)}
                                className="pixel-btn px-2 py-1 bg-emerald-500 border border-emerald-200 text-slate-950 font-pixel text-[10px] cursor-pointer"
                                title={es ? 'Cargar si es partida' : 'Load as save'}
                              >
                                {es ? 'Cargar' : 'Load'}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={Boolean(busyMessage)}
                              onClick={() => void handleOpenShareModal(file)}
                              className={`pixel-btn p-1.5 border cursor-pointer ${
                                isPublic
                                  ? 'bg-cyan-500 border-cyan-200 text-slate-950'
                                  : 'bg-slate-800 border-slate-600 text-cyan-300'
                              }`}
                              title={es ? 'Compartir enlace público' : 'Share public link'}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleInspectActivity(file)}
                              className="pixel-btn p-1.5 bg-slate-800 border border-slate-600 text-amber-300 cursor-pointer"
                              title={es ? 'Ver actividad' : 'File activity'}
                            >
                              <Activity className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setRenameDraft({ file, value: file.name })
                              }
                              className="pixel-btn p-1.5 bg-slate-800 border border-slate-600 text-sky-300 cursor-pointer"
                              title={es ? 'Renombrar archivo' : 'Rename file'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingConfirm({
                                  kind: 'delete_files',
                                  files: [file],
                                })
                              }
                              className="pixel-btn p-1.5 bg-rose-600 border border-rose-300 text-white cursor-pointer"
                              title={es ? 'Eliminar archivo' : 'Delete file'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {nextPageToken && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleLoadMoreFiles()}
                        className="pixel-btn px-4 py-2 bg-slate-800 border-2 border-slate-500 text-sky-300 font-pixel text-xs cursor-pointer"
                      >
                        {es ? 'Cargar más archivos' : 'Load More Files'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Public Link Sharing Sub-Modal */}
      {shareModalFile && (() => {
        const publicPerm = getPublicPermission(shareModalFile);
        const shareUrl = getShareableUrl(shareModalFile);
        const isPublic = Boolean(publicPerm);
        return (
          <div className="fixed inset-0 z-[55] bg-slate-950/88 flex items-center justify-center p-4">
            <div className="pixel-panel w-full max-w-lg p-5 text-slate-100 space-y-4 border-cyan-400">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b-2 border-slate-700">
                <div className="flex items-center gap-2 min-w-0">
                  {isPublic ? (
                    <Globe className="w-5 h-5 text-cyan-300 shrink-0" />
                  ) : (
                    <Lock className="w-5 h-5 text-amber-300 shrink-0" />
                  )}
                  <h3 className="font-pixel text-sm text-amber-300 truncate">
                    {es ? 'Compartir Acceso Público' : 'Share Public Link Access'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShareModalFile(null)}
                  className="pixel-btn p-1.5 bg-slate-800 border-2 border-slate-500 text-slate-200 cursor-pointer"
                  aria-label={es ? 'Cerrar' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-pixel text-slate-400">
                  {es ? 'ARCHIVO:' : 'FILE:'}
                </div>
                <div className="text-xs font-medium text-white bg-slate-900 border border-slate-700 px-3 py-2 truncate">
                  {shareModalFile.name}
                </div>
              </div>

              {isPublic ? (
                <div className="space-y-3">
                  <div className="p-3 bg-cyan-950/60 border-2 border-cyan-400/70 text-xs text-cyan-100 space-y-1">
                    <div className="font-pixel text-[11px] text-cyan-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>
                        {es
                          ? 'CUALQUIER PERSONA CON EL ENLACE PUEDE VER'
                          : 'ANYONE WITH THE LINK CAN VIEW'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {es
                        ? 'Cualquier usuario con este enlace puede ver y descargar este archivo en modo solo lectura.'
                        : 'Anyone with this link can view and download this file (read-only).'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-pixel text-[10px] text-slate-400">
                      {es ? 'ENLACE PÚBLICO DE GOOGLE DRIVE' : 'GOOGLE DRIVE PUBLIC LINK'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        onFocus={(e) => e.currentTarget.select()}
                        className="flex-1 px-2.5 py-2 bg-slate-950 border-2 border-slate-600 text-xs text-sky-200 font-mono-num select-all"
                      />
                      <button
                        type="button"
                        onClick={() => void handleCopyShareLink(shareUrl)}
                        className="pixel-btn flex items-center gap-1.5 px-3 py-2 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-[11px] cursor-pointer shrink-0"
                      >
                        {copiedLink ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedLink
                            ? es
                              ? 'Copiado'
                              : 'Copied'
                            : es
                              ? 'Copiar'
                              : 'Copy'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pixel-btn inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 border-2 border-slate-500 text-sky-300 font-pixel text-[10px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{es ? 'Abrir en Drive' : 'Open in Drive'}</span>
                    </a>

                    <button
                      type="button"
                      disabled={Boolean(busyMessage)}
                      onClick={() =>
                        setPendingConfirm({
                          kind: 'revoke_public_link',
                          targetFile: shareModalFile,
                          permissionId: publicPerm!.id,
                        })
                      }
                      className="pixel-btn flex items-center gap-1.5 px-3 py-2 bg-rose-600 border-2 border-rose-300 text-white font-pixel text-[10px] cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {es ? 'Quitar Acceso Público' : 'Revoke Public Access'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900 border-2 border-slate-700 text-xs text-slate-300 space-y-1">
                    <div className="font-pixel text-[11px] text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {es ? 'ACCESO PRIVADO (SOLO TÚ)' : 'PRIVATE ACCESS (ONLY YOU)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {es
                        ? 'Activa el acceso público para generar un enlace que cualquier persona pueda abrir en modo solo lectura.'
                        : 'Enable public link access to generate a read-only URL anyone with the link can open.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShareModalFile(null)}
                      className="pixel-btn px-4 py-2 bg-slate-800 border-2 border-slate-500 text-slate-200 font-pixel text-xs cursor-pointer"
                    >
                      {es ? 'Cerrar' : 'Close'}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(busyMessage)}
                      onClick={() =>
                        setPendingConfirm({
                          kind: 'enable_public_link',
                          targetFile: shareModalFile,
                        })
                      }
                      className="pixel-btn flex items-center gap-1.5 px-4 py-2 bg-cyan-500 border-2 border-cyan-200 text-slate-950 font-pixel text-xs cursor-pointer disabled:opacity-50"
                    >
                      <Globe className="w-4 h-4" />
                      <span>
                        {es ? 'Compartir Link Público' : 'Enable Public Link'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Explicit Confirmation Modal for All Mutating / Destructive Operations */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 flex items-center justify-center p-4">
          <div className="pixel-panel w-full max-w-md p-5 text-slate-100 space-y-4 border-rose-400">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-pixel text-sm text-amber-300">
                {pendingConfirm.kind === 'delete_files'
                  ? es
                    ? `¿Eliminar ${pendingConfirm.files.length} archivo(s) de Google Drive?`
                    : `Delete ${pendingConfirm.files.length} file(s) from Google Drive?`
                  : pendingConfirm.kind === 'overwrite_save'
                    ? es
                      ? '¿Sobrescribir partida en Google Drive?'
                      : 'Overwrite Google Drive Save?'
                    : pendingConfirm.kind === 'rename_file'
                      ? es
                        ? '¿Renombrar archivo en Google Drive?'
                        : 'Rename Google Drive File?'
                      : pendingConfirm.kind === 'enable_public_link'
                        ? es
                          ? '¿Hacer público este archivo con un enlace?'
                          : 'Share Public Link Access?'
                        : es
                          ? '¿Revocar el enlace público?'
                          : 'Revoke Public Link Access?'}
              </h3>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              {pendingConfirm.kind === 'delete_files' && (
                <>
                  <p>
                    {es
                      ? 'Esta acción eliminará permanentemente los siguientes elementos de tu Google Drive:'
                      : 'This will permanently delete the following item(s) from your Google Drive:'}
                  </p>
                  <ul className="max-h-32 overflow-y-auto bg-slate-900 border border-slate-700 p-2 space-y-1 font-mono-num text-[11px] text-rose-200">
                    {pendingConfirm.files.map((f) => (
                      <li key={f.id} className="truncate">
                        • {f.name}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {pendingConfirm.kind === 'overwrite_save' && (
                <p>
                  {es
                    ? `El contenido de "${pendingConfirm.targetFile.name}" será reemplazado con: ${pendingConfirm.sourceLabel}.`
                    : `The contents of "${pendingConfirm.targetFile.name}" will be overwritten with: ${pendingConfirm.sourceLabel}.`}
                </p>
              )}

              {pendingConfirm.kind === 'rename_file' && (
                <p>
                  {es
                    ? `¿Cambiar el nombre de "${pendingConfirm.targetFile.name}" a "${pendingConfirm.newName}"?`
                    : `Rename "${pendingConfirm.targetFile.name}" to "${pendingConfirm.newName}"?`}
                </p>
              )}

              {pendingConfirm.kind === 'enable_public_link' && (
                <p>
                  {es
                    ? `Al confirmar, cualquier persona en internet que tenga el enlace podrá ver y descargar "${pendingConfirm.targetFile.name}" en modo solo lectura.`
                    : `Confirming will make "${pendingConfirm.targetFile.name}" publicly readable by anyone who has the share link.`}
                </p>
              )}

              {pendingConfirm.kind === 'revoke_public_link' && (
                <p>
                  {es
                    ? `Se eliminará el permiso público de "${pendingConfirm.targetFile.name}". El enlace público dejará de funcionar para terceros.`
                    : `Public link access for "${pendingConfirm.targetFile.name}" will be removed and the public link will stop working for others.`}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="pixel-btn px-4 py-2 bg-slate-800 border-2 border-slate-500 text-slate-200 font-pixel text-xs cursor-pointer"
              >
                {es ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => void executeConfirmedAction()}
                className={`pixel-btn px-4 py-2 border-2 font-pixel text-xs cursor-pointer ${
                  pendingConfirm.kind === 'delete_files' ||
                  pendingConfirm.kind === 'revoke_public_link'
                    ? 'bg-rose-600 border-rose-300 text-white'
                    : pendingConfirm.kind === 'enable_public_link'
                      ? 'bg-cyan-400 border-cyan-100 text-slate-950'
                      : 'bg-amber-400 border-amber-100 text-slate-950'
                }`}
              >
                {pendingConfirm.kind === 'delete_files'
                  ? es
                    ? 'Confirmar Eliminación'
                    : 'Delete'
                  : pendingConfirm.kind === 'revoke_public_link'
                    ? es
                      ? 'Revocar Acceso'
                      : 'Revoke Access'
                    : pendingConfirm.kind === 'enable_public_link'
                      ? es
                        ? 'Hacer Público'
                        : 'Enable Public Link'
                      : es
                        ? 'Confirmar Cambio'
                        : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
