import { useState } from 'react';
import { Truck, Camera, Map, Settings as SettingsIcon, Trash2, ExternalLink, Play, CheckCircle2, Plus } from 'lucide-react';
import { processImage } from './services/ocrService';
import { extractShipments } from './services/extractionService';
import { addressEngine } from './services/addressEngine';
import { optimizeRoute } from './services/optimizationService';
import { getIndividualNavigationUrl, getMultiStopRouteUrl } from './services/mapsService';
import { useShipments } from './hooks/useShipments';
import type { Shipment } from './types';

type View = 'capture' | 'route' | 'settings';

function App() {
  const [view, setView] = useState<View>('capture');
  const [isProcessing, setIsProcessing] = useState(false);
  const { shipments, addShipments, clearShipments, removeShipment, saveShipments, updateShipment } = useShipments();
  const [newLocality, setNewLocality] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const fileList = Array.from(files);
      const newShipments: Shipment[] = [];

      for (const file of fileList) {
        const text = await processImage(file);
        const extracted = extractShipments(text);

        extracted.forEach(s => {
          s.area = addressEngine.recognizeArea(`${s.address} ${s.landmark}`) || 'Other';
        });

        newShipments.push(...extracted);
      }

      addShipments(newShipments);
      setView('route');
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimize = () => {
    const optimized = optimizeRoute(shipments);
    saveShipments(optimized);
  };

  const handleLearnArea = (shipment: Shipment) => {
    const area = prompt("Enter the locality name to learn from this address:", shipment.area === 'Other' ? '' : shipment.area);
    if (area) {
      addressEngine.learnLocality(area);
      const updated = { ...shipment, area: area };
      updateShipment(updated);
      alert(`Learned locality: ${area}`);
    }
  };

  const handleAddCustomLocality = () => {
    if (newLocality.trim()) {
      addressEngine.learnLocality(newLocality.trim());
      setNewLocality('');
      alert(`Added ${newLocality}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">RoutePilot</h1>
          </div>
          {shipments.length > 0 && (
            <button
              onClick={() => confirm("Clear all shipments?") && clearShipments()}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full pb-20">
        {view === 'capture' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Deliver?</h2>
              <p className="text-gray-500 mb-8">Upload your Flipkart/Ekart jobsheet screenshots to start your route.</p>

              <label className="block">
                <span className="sr-only">Choose photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700
                    cursor-pointer"
                  disabled={isProcessing}
                />
              </label>

              {isProcessing && (
                <div className="mt-6 flex items-center justify-center gap-2 text-blue-600 font-medium">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  Reading shipments...
                </div>
              )}
            </div>

            {shipments.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-blue-800 font-bold">{shipments.length} Shipments Loaded</p>
                  <p className="text-blue-600 text-sm">Proceed to route optimization</p>
                </div>
                <button
                  onClick={() => setView('route')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm"
                >
                  View Route
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'route' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Delivery Route</h2>
              <button
                onClick={handleOptimize}
                className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-full font-bold shadow-sm"
              >
                <Play className="w-4 h-4" /> Optimize
              </button>
            </div>

            {shipments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No shipments loaded.</p>
                <button onClick={() => setView('capture')} className="text-blue-600 font-bold mt-2">Go to Capture</button>
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  {shipments.map((s, index) => (
                    <div key={s.id} className={`bg-white p-4 rounded-xl shadow-sm border ${s.priority ? 'border-red-100 bg-red-50/10' : 'border-gray-100'} relative overflow-hidden`}>
                      {s.priority && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-bl-lg">
                          PRIORITY
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div className="flex-none">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-900 truncate">{s.customerName}</h3>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                              {s.area}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{s.address}</p>
                          {s.landmark && (
                            <p className="text-xs text-blue-600 mt-1 font-medium italic">📍 {s.landmark}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <a
                              href={getIndividualNavigationUrl(s)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border border-gray-200"
                            >
                              <Map className="w-4 h-4" /> Navigate
                            </a>
                            <button
                              onClick={() => handleLearnArea(s)}
                              className="p-2 text-gray-400 hover:text-blue-600"
                              title="Learn this area"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => removeShipment(s.id)}
                              className="p-2 text-gray-400 hover:text-green-600"
                              title="Mark as delivered"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sticky bottom-20 left-0 right-0 px-4 mt-6">
                  <a
                    href={getMultiStopRouteUrl(shipments)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform border-4 border-white"
                  >
                    <ExternalLink className="w-6 h-6" />
                    START ENTIRE ROUTE
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Smart Address Engine</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500 block mb-2">Known Localities</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {addressEngine.getAllLocalities().map(l => (
                        <span key={l} className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-bold uppercase tracking-wider">{l}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLocality}
                        onChange={(e) => setNewLocality(e.target.value)}
                        placeholder="Add new locality..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        onClick={handleAddCustomLocality}
                        className="bg-blue-600 text-white p-2 rounded-lg"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">System</h2>
                <button
                  onClick={() => {
                    if(confirm("This will clear all learned localities and shipments. Continue?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="w-full py-3 text-red-600 font-bold border border-red-200 rounded-xl hover:bg-red-50"
                >
                  Reset All Application Data
                </button>
              </div>
            </div>
            <div className="text-center text-gray-400 text-xs py-4">
              RoutePilot v1.0.0
            </div>
          </div>
        )}
      </main>

      <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-20 flex justify-around items-center h-16 safe-area-inset-bottom">
        <button
          onClick={() => setView('capture')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === 'capture' ? 'text-blue-600 border-t-2 border-blue-600' : 'text-gray-400'}`}
        >
          <Camera className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Capture</span>
        </button>
        <button
          onClick={() => setView('route')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === 'route' ? 'text-blue-600 border-t-2 border-blue-600' : 'text-gray-400'}`}
        >
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Route</span>
        </button>
        <button
          onClick={() => setView('settings')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === 'settings' ? 'text-blue-600 border-t-2 border-blue-600' : 'text-gray-400'}`}
        >
          <SettingsIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
