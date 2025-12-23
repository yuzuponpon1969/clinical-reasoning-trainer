"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ARCHETYPES, BODY_REGIONS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ChevronRight, User, MapPin, Activity, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SelectionPage() {
  const router = useRouter();
  const [step, setStep] = useState<"archetype" | "region" | "category">("archetype");
  const [selection, setSelection] = useState<{
    archetypeId?: string;
    regionId?: string;
    categoryId?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  // Handlers
  const selectArchetype = (id: string) => {
    setSelection(prev => ({ ...prev, archetypeId: id }));
    setStep("region");
  };

  const selectRegion = (id: string) => {
    setSelection(prev => ({ ...prev, regionId: id }));
    const region = BODY_REGIONS.find(r => r.id === id);
    // If region has no sub-categories or default, might skip, but spec entails detailed selection
    setStep("category");
  };

  /* Random Helper to pick a valid category for an archetype */
  const pickRandomCategory = (archetypeId: string) => {
      const arch = ARCHETYPES.find(a => a.id === archetypeId);
      if (!arch) return null;
      
      const regions = arch.navigationGroups || BODY_REGIONS;
      // Flatten all categories
      const allCats: {regionId: string, categoryId: string}[] = [];
      regions.forEach(r => {
          r.categories.forEach(c => {
             if (c.subcategories) {
                 c.subcategories.forEach(s => allCats.push({regionId: r.id, categoryId: s.id}));
             } else {
                 allCats.push({regionId: r.id, categoryId: c.id});
             }
          });
      });
      
      if (allCats.length === 0) return null;
      const random = allCats[Math.floor(Math.random() * allCats.length)];
      return random;
  };

  const handleRandomTraining = () => {
      // Pick random archetype
      const randomArch = ARCHETYPES[Math.floor(Math.random() * 5)]; // Exclude user prompt generated ones if any? Just use first 5.
      // Actually just use length.
      const arch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
      const randomCat = pickRandomCategory(arch.id);
      
      if (randomCat) {
          startSession(arch.id, randomCat.regionId, randomCat.categoryId, true);
      }
  };

  const handleArchetypeTraining = (archetypeId: string) => {
      const randomCat = pickRandomCategory(archetypeId);
      if (randomCat) {
          startSession(archetypeId, randomCat.regionId, randomCat.categoryId, true);
      }
  };

  const selectCategory = async (id: string) => {
    setSelection(prev => ({ ...prev, categoryId: id }));
    // Automatically start session
    startSession(selection.archetypeId!, selection.regionId!, id, false);
  };

  const startSession = async (archetypeId: string, regionId: string, categoryId: string, isTraining: boolean = false) => {
    try {
      setLoading(true);
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archetypeId, regionId, categoryId })
      });
      const data = await res.json();
      if (data.sessionId) {
        // Save session context
        sessionStorage.setItem(`session_${data.sessionId}_init`, data.initialMessage);
        sessionStorage.setItem(`session_${data.sessionId}_caseId`, data.caseId);
        
        // Hide title in training mode
        const displayTitle = isTraining ? "診断名：？（トレーニング）" : data.caseTitle;
        sessionStorage.setItem(`session_${data.sessionId}_title`, displayTitle);
        
        sessionStorage.setItem(`session_${data.sessionId}_patient`, data.patientLabel);
        sessionStorage.setItem(`session_${data.sessionId}_frames`, JSON.stringify(data.interviewFrames));
        sessionStorage.setItem(`session_${data.sessionId}_profile`, JSON.stringify(data.patientProfile));
        
        router.push(`/session/${data.sessionId}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to start session");
      setLoading(false);
    }
  };

  // Helper to get current region object (Global OR Custom)
  const getActiveRegionList = () => {
      const arch = ARCHETYPES.find(a => a.id === selection.archetypeId);
      return arch?.navigationGroups || BODY_REGIONS;
  };

  const currentRegion = getActiveRegionList().find(r => r.id === selection.regionId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="px-6 h-14 flex items-center border-b bg-white">
        <div className="font-semibold text-slate-700">New Session Setup</div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        
        {/* Progress Stepper */}
        <div className="flex items-center justify-center space-x-4 mb-8">
            <StepIndicator active={step === 'archetype' || !!selection.archetypeId} label="Patient" icon={<User className="w-4 h-4"/>} />
            <div className="w-8 h-px bg-slate-300" />
            <StepIndicator active={step === 'region' || !!selection.regionId} label="Region" icon={<MapPin className="w-4 h-4"/>} />
            <div className="w-8 h-px bg-slate-300" />
            <StepIndicator active={step === 'category' || !!selection.categoryId} label="Category" icon={<Activity className="w-4 h-4"/>} />
        </div>

        <AnimatePresence mode="wait">
            
            {/* Step 1: Archetype */}
            {step === 'archetype' && (
                <motion.div 
                    key="archetype"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                >
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Select Patient Persona</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {ARCHETYPES.map(a => (
                            <button key={a.id} onClick={() => selectArchetype(a.id)}
                                className="flex flex-col items-start p-4 bg-white border rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
                            >
                                <span className="font-semibold text-lg text-slate-900">{a.label}</span>
                                <span className="text-sm text-slate-500 mt-1">{a.description}</span>
                            </button>
                        ))}
                        {/* 6th Button: Random Training */}
                        <button onClick={handleRandomTraining} disabled={loading}
                             className="flex flex-col items-start p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all text-left"
                        >
                             <span className="font-semibold text-lg text-indigo-900">医療面接トレーニング</span>
                             <span className="text-sm text-indigo-600 mt-1 font-medium">病態の把握と判断プロセスを学ぶ</span>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 2: Region / Custom Group */}
            {step === 'region' && (
                <motion.div 
                    key="region"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                >
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">
                        {ARCHETYPES.find(a => a.id === selection.archetypeId)?.navigationGroups ? "Select Clinical Category" : "Select Body Region"}
                    </h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {(ARCHETYPES.find(a => a.id === selection.archetypeId)?.navigationGroups || BODY_REGIONS).map(r => (
                            <button key={r.id} onClick={() => selectRegion(r.id)}
                                className="h-32 flex flex-col items-center justify-center p-4 bg-white border rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-center"
                            >
                                <span className="font-semibold text-lg text-slate-900">{r.label}</span>
                            </button>
                        ))}
                        {/* Training Button for Step 2 */}
                        <button onClick={() => handleArchetypeTraining(selection.archetypeId!)} disabled={loading}
                             className="h-32 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all text-center"
                        >
                             <span className="font-semibold text-lg text-indigo-900">医療面接トレーニング</span>
                             <span className="text-xs text-indigo-600 mt-1 font-medium">病態の把握と判断プロセスを学ぶ</span>
                        </button>
                    </div>
                    <button onClick={() => setStep('archetype')} className="text-sm text-slate-400 mt-4 underline">Back</button>
                </motion.div>
            )}

            {/* Step 3: Category */}
            {step === 'category' && currentRegion && (
                <motion.div 
                    key="category"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                >
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Select Category for {currentRegion.label}</h2>
                    <div className="space-y-6">
                        {currentRegion.categories.length === 0 && <div className="text-slate-500">No specific categories defined.</div>}
                        
                        {currentRegion.categories.map(cat => (
                           <div key={cat.id} className="space-y-2">
                                <h3 className="font-semibold text-slate-700 border-b pb-1">{cat.label}</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {/* If no subcategories, make the category itself clickable (logic simplification) */}
                                    {(!cat.subcategories || cat.subcategories.length === 0) ? (
                                        <CardOption label={cat.label} onClick={() => selectCategory(cat.id)} loading={loading} />
                                    ) : (
                                        cat.subcategories.map(sub => (
                                            <CardOption key={sub.id} label={sub.label} onClick={() => selectCategory(sub.id)} loading={loading} />
                                        ))
                                    )}
                                </div>
                           </div> 
                        ))}
                    </div>
                     <button onClick={() => setStep('region')} className="text-sm text-slate-400 mt-4 underline">Back</button>
                </motion.div>
            )}

        </AnimatePresence>
      </main>
    </div>
  );
}

function StepIndicator({ active, label, icon }: { active: boolean, label: string, icon: any }) {
    return (
        <div className={cn("flex items-center gap-2", active ? "text-blue-600" : "text-slate-400")}>
            <div className={cn("flex items-center justify-center w-8 h-8 rounded-full border", active ? "bg-blue-50 border-blue-600" : "bg-white")}>
                {icon}
            </div>
            <span className="text-sm font-medium hidden sm:block">{label}</span>
        </div>
    )
}

function CardOption({ label, onClick, loading }: { label: string, onClick: () => void, loading: boolean }) {
    return (
        <button disabled={loading} onClick={onClick} className="flex items-center p-3 bg-white border rounded-lg hover:bg-slate-50 hover:border-blue-400 transition-all text-left disabled:opacity-50">
           <div className="flex-1 font-medium text-slate-800">{label}</div>
           <ChevronRight className="w-4 h-4 text-slate-300" />
        </button>
    )
}
