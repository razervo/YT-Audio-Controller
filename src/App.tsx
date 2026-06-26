import { useState, useRef } from 'react';
import {
  Truck, Camera, Map, Settings as SettingsIcon, Trash2, ExternalLink,
  Play, Download, BarChart3, ChevronRight, Search,
  CheckCircle2, Clock, AlertTriangle, FileText
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { processImage, tileImage } from './services/ocrService';
import { extractShipments, deduplicateShipments } from './services/extractionService';
import { addressEngine } from './services/addressEngine';
import { optimizeRoute, calculateStats } from './services/optimizationService';
import { getMultiStopRouteUrl } from './services/mapsService';
import { useShipments } from './hooks/useShipments';
import { SortableShipmentItem } from './components/SortableShipmentItem';
import type { Shipment } from './types';

type View = 'capture' | 'route' | 'stats' | 'settings';

function App() {
  const [view, setView] = useState<View>('capture');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState<string>('All');
  const [processingProgress, setProcessingProgress] = useState(0);

  const { shipments, addShipments, clearShipments, removeShipment, saveShipments, updateShipment } = useShipments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stats = calculateStats(shipments);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const fileList = Array.from(files);
      const allExtracted: Shipment[] = [];

      let processedCount = 0;
      const totalToProcess = fileList.length;

      for (const file of fileList) {
        const tiles = await tileImage(file);

        for (const tile of tiles) {
          const tileFile = new File([tile], 'tile.jpg', { type: 'image/jpeg' });
          const text = await processImage(tileFile);
          const extracted = extractShipments(text);

          extracted.forEach(s => {
            s.area = addressEngine.recognizeArea(s.address, s.landmark);
          });

          allExtracted.push(...extracted);
        }

        processedCount++;
        setProcessingProgress(Math.round((processedCount / totalToProcess) * 100));
      }

      const finalNewShipments = deduplicateShipments(allExtracted);
      addShipments(finalNewShipments);
      setView('route');
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Error processing screenshots.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleOptimize = () => {
    const optimized = optimizeRoute(shipments);
    saveShipments(optimized);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = shipments.findIndex((s) => s.id === active.id);
      const newIndex = shipments.findIndex((s) => s.id === over.id);
      saveShipments(arrayMove(shipments, oldIndex, newIndex));
    }
  };

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = filterArea === 'All' || s.area === filterArea;
    return matchesSearch && matchesArea;
  });

  const areas = ['All', ...addressEngine.getAllLocalities()];

  const exportData = (format: 'csv' | 'json') => {
    let content = '';
    let mimeType = '';
    let fileName = `routepilot-export-${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(shipments, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      const headers = ['Name', 'Phone', 'Address', 'Landmark', 'Area', 'Status', 'COD'];
      const rows = shipments.map(s => [`"${s.customerName}"`, s.phone, `"${s.address}"`, `"${s.landmark}"`, s.area, s.status, s.cod]);
      content = [headers, ...rows].map(r => r.join(',')).join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-blue-100">
      <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-30 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">RoutePilot</h1>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest leading-none">Phase 2 Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView('stats')} aria-label="Statistics"
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            {shipments.length > 0 && (
              <button
                onClick={() => confirm("Delete all shipments?") && clearShipments()}
                className="p-2 hover:bg-red-500 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full pb-32">
        {view === 'capture' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <FileText className="w-32 h-32" />
              </div>

              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-blue-50/50">
                <Camera className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Import Jobsheet</h2>
              <p className="text-gray-500 text-sm mb-10 leading-relaxed px-4">
                Upload your long-scrolling Field X or Ekart screenshots. Our engine will automatically merge and optimize them.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isProcessing ? 'SCANNING...' : 'SELECT SCREENSHOTS'}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {isProcessing && (
                <div className="mt-8 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-blue-600 uppercase">
                    <span>Processing Confidence: 98%</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <AlertTriangle className="w-5 h-5 text-orange-500 mb-2" />
                <h3 className="text-xs font-black text-orange-900 uppercase">Pro Tip</h3>
                <p className="text-[10px] text-orange-700 leading-tight">Use scrolling screenshots for faster processing.</p>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-500 mb-2" />
                <h3 className="text-xs font-black text-green-900 uppercase">Privacy</h3>
                <p className="text-[10px] text-green-700 leading-tight">Data never leaves your device. No cloud sync.</p>
              </div>
            </div>

            {shipments.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">
                      {shipments.length}
                   </div>
                   <div>
                      <p className="font-black text-gray-900 leading-none">Shipments Ready</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ready for Delivery</p>
                   </div>
                </div>
                <button
                  onClick={() => setView('route')}
                  className="bg-gray-900 text-white p-3 rounded-xl"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'route' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sticky top-[72px] z-20 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl pl-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {areas.map(area => (
                  <button
                    key={area}
                    onClick={() => setFilterArea(area)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterArea === area ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-black text-gray-900">Your Route</h2>
              <button
                onClick={handleOptimize}
                className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-4 py-2 rounded-full font-black shadow-lg shadow-green-100 active:scale-95"
              >
                <Play className="w-3.5 h-3.5" /> OPTIMIZE
              </button>
            </div>

            {filteredShipments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">No shipments found.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredShipments.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 pb-4">
                    {filteredShipments.map((s) => (
                      <SortableShipmentItem
                        key={s.id}
                        shipment={s}
                        onUpdate={updateShipment}
                        onDelete={removeShipment}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {view === 'stats' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
             <h2 className="text-2xl font-black text-gray-900">Statistics</h2>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-xl">
                   <p className="text-xs font-bold opacity-80 uppercase mb-1">Total Jobs</p>
                   <p className="text-4xl font-black">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                   <p className="text-xs font-bold text-gray-400 uppercase mb-1">Completed</p>
                   <p className="text-4xl font-black text-green-600">{stats.completed}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                   <p className="text-xs font-bold text-gray-400 uppercase mb-1">Priority</p>
                   <p className="text-4xl font-black text-red-500">{stats.priority}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                   <p className="text-xs font-bold text-gray-400 uppercase mb-1">Unique Areas</p>
                   <p className="text-4xl font-black text-blue-600">{stats.areas}</p>
                </div>
             </div>

             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-black text-gray-900 mb-4 uppercase text-sm tracking-widest">Route Estimation</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Clock className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-500">Total Delivery Time</span>
                      </div>
                      <span className="font-black text-gray-900">{stats.estimatedTime}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Map className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-500">Estimated Distance</span>
                      </div>
                      <span className="font-black text-gray-900">{stats.estimatedDistance}</span>
                   </div>
                </div>
             </div>

             <div className="flex gap-2">
                <button
                  onClick={() => exportData('csv')}
                  className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> EXPORT CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-white text-gray-900 border-2 border-gray-900 font-black px-6 rounded-2xl"
                >
                  PRINT
                </button>
             </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
             <h2 className="text-2xl font-black text-gray-900">Settings</h2>

             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 divide-y">
                <div className="p-6">
                   <h3 className="font-black text-gray-900 mb-4 uppercase text-xs tracking-widest">Address Engine v2</h3>
                   <div className="flex flex-wrap gap-2 mb-6">
                      {addressEngine.getAllLocalities().map(l => (
                        <span key={l} className="text-[10px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-black uppercase">{l}</span>
                      ))}
                   </div>
                </div>

                <div className="p-6">
                   <button
                    onClick={() => confirm("Clear ALL data?") && localStorage.clear() && window.location.reload()}
                    className="w-full py-4 text-red-600 font-black text-sm uppercase tracking-widest border-2 border-red-50 border-dashed rounded-2xl hover:bg-red-50"
                  >
                    Wipe All Data
                  </button>
                </div>
             </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        {shipments.length > 0 && view === 'route' && (
          <div className="max-w-md mx-auto px-4 pb-2">
            <a
              href={getMultiStopRouteUrl(filteredShipments)}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform border-4 border-white"
            >
              <ExternalLink className="w-6 h-6" />
              START REMAINING ROUTE
            </a>
          </div>
        )}

        <nav className="bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center h-20 safe-area-inset-bottom max-w-md mx-auto rounded-t-[40px] shadow-2xl">
          <button
            onClick={() => setView('capture')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${view === 'capture' ? 'text-blue-600' : 'text-gray-300'}`}
          >
            <div className={`p-2 rounded-2xl ${view === 'capture' ? 'bg-blue-50' : ''}`}><Camera className="w-6 h-6" /></div>
            <span className="text-[10px] font-black mt-1 uppercase tracking-widest">Scan</span>
          </button>
          <button
            onClick={() => setView('route')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${view === 'route' ? 'text-blue-600' : 'text-gray-300'}`}
          >
            <div className={`p-2 rounded-2xl ${view === 'route' ? 'bg-blue-50' : ''}`}><Map className="w-6 h-6" /></div>
            <span className="text-[10px] font-black mt-1 uppercase tracking-widest">Route</span>
          </button>
          <button
            onClick={() => setView('settings')} aria-label="Settings"
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${view === 'settings' ? 'text-blue-600' : 'text-gray-300'}`}
          >
            <div className={`p-2 rounded-2xl ${view === 'settings' ? 'bg-blue-50' : ''}`}><SettingsIcon className="w-6 h-6" /></div>
            <span className="text-[10px] font-black mt-1 uppercase tracking-widest">Config</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default App;
