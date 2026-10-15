import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Calculator, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { AnalyticsData } from '../types.ts';
import { calculateCER, calculateWER } from '../utils/metrics.ts';

interface AnalyticsViewProps {
  analytics: AnalyticsData | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  // CER / WER Interactive Evaluator State
  const [referenceText, setReferenceText] = useState(
    'அகர முதல எழுத்தெல்லாம் ஆதி பகவன் முதற்றே உலகு.'
  );
  const [hypothesisText, setHypothesisText] = useState(
    'அகர முதல எழுத்தெல்லாம் ஆதி பகவன் முதற்றே உலகு.'
  );
  const [evalCer, setEvalCer] = useState<number | null>(0);
  const [evalWer, setEvalWer] = useState<number | null>(0);

  const handleComputeMetrics = () => {
    const cer = calculateCER(referenceText, hypothesisText);
    const wer = calculateWER(referenceText, hypothesisText);
    setEvalCer(cer);
    setEvalWer(wer);
  };

  const total = analytics?.total_pages || 1;
  const verifiedPct = Math.round(((analytics?.verified_pages || 0) / total) * 100);

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-[#E2D6C3] pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#6B1724] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#8B2635]" />
          தரவுப் பகுப்பாய்வு & துல்லிய மதிப்பீட்டுக் கூடம்
        </h1>
        <p className="text-xs text-[#706257]">
          நூல்களின் செயலாக்க நிலை, Tesseract OCR நம்பிக்கையளவுகள், மற்றும் மனித சரிபார்ப்பு முன்னேற்றம்
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-xs">
          <span className="text-xs font-semibold text-[#7C6E65]">மொத்த பக்கங்கள்</span>
          <div className="mt-2 text-2xl font-bold text-[#2C241E]">
            {analytics?.total_pages || 0}
          </div>
          <span className="text-[11px] text-[#8C7E74]">எண்மியப்படுத்தப்பட்டவை</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-xs">
          <span className="text-xs font-semibold text-[#7C6E65]">மனித சரிபார்ப்பு (Verified)</span>
          <div className="mt-2 text-2xl font-bold text-emerald-800">
            {analytics?.verified_pages || 0}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">{verifiedPct}% நிறைவு பெற்றது</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-xs">
          <span className="text-xs font-semibold text-[#7C6E65]">ஏற்கப்பட்ட பரிந்துரைகள்</span>
          <div className="mt-2 text-2xl font-bold text-[#8C5A20]">
            {analytics?.accepted_corrections || 0}
          </div>
          <span className="text-[11px] text-[#8C7E74]">சான்றாதாரங்களுடன்</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-xs">
          <span className="text-xs font-semibold text-[#7C6E65]">தெளிவற்றவை [தெளிவில்லை]</span>
          <div className="mt-2 text-2xl font-bold text-rose-700">
            {analytics?.unresolved_corrections || 0}
          </div>
          <span className="text-[11px] text-rose-600 font-medium">பாதுகாக்கப்பட்டவை</span>
        </div>
      </div>

      {/* Analytics Charts & Confidence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Confidence Histogram (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-[#E2D6C3] shadow-md space-y-4">
          <div className="border-b border-[#F0E8DC] pb-3 flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-[#6B1724] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#8B2635]" />
              OCR நம்பிக்கையளவுப் பரவல் (Confidence Distribution)
            </h2>
            <span className="text-xs font-bold text-[#8C5A20] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              சராசரி: {analytics?.average_ocr_confidence || 92.0}%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#4A3E36] mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600" />
                  மிக உயர்ந்த துல்லியம் (90% - 100%)
                </span>
                <span>{analytics?.confidence_distribution.high_90_100 || 0} பக்கங்கள்</span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${Math.min(100, ((analytics?.confidence_distribution.high_90_100 || 1) / total) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#4A3E36] mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  நடுத்தர நம்பிக்கை (75% - 89%)
                </span>
                <span>{analytics?.confidence_distribution.medium_75_89 || 0} பக்கங்கள்</span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${Math.min(100, ((analytics?.confidence_distribution.medium_75_89 || 0) / total) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#4A3E36] mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  குறைந்த நம்பிக்கை (50% - 74%)
                </span>
                <span>{analytics?.confidence_distribution.low_50_74 || 0} பக்கங்கள்</span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: `${Math.min(100, ((analytics?.confidence_distribution.low_50_74 || 0) / total) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#4A3E36] mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600" />
                  மிகக் குறைவான நம்பிக்கை (&lt; 50%)
                </span>
                <span>{analytics?.confidence_distribution.critical_under_50 || 0} பக்கங்கள்</span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{
                    width: `${Math.min(100, ((analytics?.confidence_distribution.critical_under_50 || 0) / total) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Progress Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-[#E2D6C3] shadow-md space-y-4">
          <div className="border-b border-[#F0E8DC] pb-3">
            <h2 className="font-serif text-base font-bold text-[#6B1724] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              சரிபார்ப்பு நிலை & தரப் பகுப்பாய்வு
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9]">
              <span className="text-[#7C6E65] block">செயலாக்கம் பெற்றவை:</span>
              <span className="text-lg font-bold text-[#2C241E] mt-1 block">
                {analytics?.processed_pages || 0} பக்கங்கள்
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9]">
              <span className="text-[#7C6E65] block">சரிபார்ப்புக் காத்திருப்பவை:</span>
              <span className="text-lg font-bold text-amber-800 mt-1 block">
                {analytics?.awaiting_review || 0} பக்கங்கள்
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9]">
              <span className="text-[#7C6E65] block">நிராகரிக்கப்பட்ட பரிந்துரைகள்:</span>
              <span className="text-lg font-bold text-stone-700 mt-1 block">
                {analytics?.rejected_corrections || 0}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9]">
              <span className="text-[#7C6E65] block">மனித ஒப்புதல் விகிதம்:</span>
              <span className="text-lg font-bold text-emerald-800 mt-1 block">
                {verifiedPct}%
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#786B62] leading-relaxed pt-2">
            எங்கள் எண்மிய ஆவண அமைப்பில், எந்தவொரு பக்கமும் மனித சரிபார்ப்பாளர் வெளிப்படையாக ஒப்புதல் அளிக்காமல் தானாக "சரிபார்க்கப்பட்டது" என முத்திரையிடப்படாது.
          </p>
        </div>
      </div>

      {/* CER & WER Interactive Evaluation Calculator */}
      <div className="bg-white rounded-2xl p-6 border-2 border-[#B47B36]/30 shadow-md space-y-5">
        <div className="border-b border-[#F0E8DC] pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#6B1724] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#8B2635]" />
              உண்மையான CER & WER துல்லியக் கணிப்பான் (Error Rate Evaluator)
            </h2>
            <p className="text-xs text-[#706257]">
              மூல உரையையும் (Ground Truth) OCR முடிவையும் ஒப்பிட்டு எழுத்துப் பிழை விகிதம் (CER) மற்றும் சொல் பிழை விகிதத்தைக் (WER) கணக்கிடுகிறது.
            </p>
          </div>
          <button
            onClick={handleComputeMetrics}
            className="px-4 py-2 bg-[#8B2635] hover:bg-[#6B1724] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            கணக்கிடுக
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#4A3E36] mb-1">
              மூல உண்மை உரை (Reference / Ground Truth):
            </label>
            <textarea
              rows={4}
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              className="w-full p-2.5 bg-[#FAF7F2] border border-[#D5C9B3] rounded-xl font-serif text-xs leading-relaxed resize-none focus:outline-hidden focus:ring-1 focus:ring-[#8B2635]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#4A3E36] mb-1">
              OCR உரை (Hypothesis to Evaluate):
            </label>
            <textarea
              rows={4}
              value={hypothesisText}
              onChange={(e) => setHypothesisText(e.target.value)}
              className="w-full p-2.5 bg-[#FAF7F2] border border-[#D5C9B3] rounded-xl font-serif text-xs leading-relaxed resize-none focus:outline-hidden focus:ring-1 focus:ring-[#8B2635]"
            />
          </div>
        </div>

        {/* Results */}
        {evalCer !== null && evalWer !== null && (
          <div className="p-4 bg-[#FAF5ED] rounded-xl border border-[#D49A3D]/40 flex flex-wrap items-center justify-around gap-4 text-center">
            <div>
              <span className="text-xs font-semibold text-[#7C6E65] block">எழுத்துப் பிழை விகிதம் (CER):</span>
              <span className={`text-2xl font-bold font-mono ${evalCer === 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                {evalCer}%
              </span>
              <span className="text-[10px] text-[#8C7E74] block">Levenshtein தூரத்தின்படி</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#7C6E65] block">சொல் பிழை விகிதம் (WER):</span>
              <span className={`text-2xl font-bold font-mono ${evalWer === 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                {evalWer}%
              </span>
              <span className="text-[10px] text-[#8C7E74] block">சொல் ஒப்பீட்டின்படி</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#7C6E65] block">அடையாள துல்லியம் (Accuracy):</span>
              <span className="text-2xl font-bold font-mono text-[#8B2635]">
                {Math.max(0, 100 - evalCer).toFixed(1)}%
              </span>
              <span className="text-[10px] text-[#8C7E74] block">மெய்நிகர் சான்றாதார அளவு</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
