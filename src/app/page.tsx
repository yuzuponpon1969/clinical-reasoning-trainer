import Link from "next/link";
import { ArrowRight, Activity, Brain, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 h-16 flex items-center border-b bg-white">
        <div className="flex items-center gap-2 font-bold text-xl text-primary-600">
           <Activity className="h-6 w-6 text-blue-600" />
           <span>Clinical Reasoning Trainer</span>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            Version 0.9 (Beta)
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900">
            Master the Art of <br/>
            <span className="text-blue-600">Clinical History Taking</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
             Simulate real-world patient encounters. Refine your diagnostic hypothesis. Get instant feedback on your reasoning process.
          </p>
          
          <div className="pt-4">
            <Link href="/select" 
              className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Start Training <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto p-12">
        <FeatureCard 
            icon={<Brain className="h-8 w-8 text-indigo-500" />}
            title="Reasoning Engine"
            desc="Practice forming hypotheses based on subtle clues in the patient's narrative."
        />
        <FeatureCard 
            icon={<ShieldCheck className="h-8 w-8 text-emerald-500" />}
            title="Red Flag Safety"
            desc="Learn to identify critical exclusion criteria and dangerous signs early."
        />
        <FeatureCard 
            icon={<Activity className="h-8 w-8 text-rose-500" />}
            title="Detailed Feedback"
            desc="Receive a 5-axis evaluation score and evidence-based rationale after every session."
        />
      </section>

      <footer className="py-6 text-center text-sm text-slate-400 border-t">
        © 2025 Clinical Reasoning Trainer. Educational Use Only.
        <div className="mt-2 text-xs text-slate-300">
             <Link href="/admin/knowledge" className="hover:text-slate-500 transition-colors">Admin: Knowledge Base</Link>
             <span className="mx-2">•</span>
             <Link href="/admin/import" className="hover:text-slate-500 transition-colors">Admin: Import Case</Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-slate-50 rounded-full">{icon}</div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{desc}</p>
        </div>
    );
}
