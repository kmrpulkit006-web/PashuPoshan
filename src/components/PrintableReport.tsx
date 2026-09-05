import React from 'react';
import { FeedSample, Locale } from '../lib/types';
import { Award, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

interface PrintableReportProps {
  sample: FeedSample;
  locale: Locale;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ sample, locale }) => {
  return (
    <div id="printable-certificate" className="hidden print:block p-8 bg-white text-black font-serif max-w-2xl mx-auto">
      {/* Prototype Screening Header - No Government/Official Claims */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
        <div className="text-xs uppercase tracking-widest text-slate-600 font-sans font-bold">
          Smart India Hackathon (SIH 2026 PS 26111) — Student Prototype
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight mt-1 text-slate-900 font-sans">
          PashuPoshan Field Screening Report — SIH Prototype
        </h1>
        <p className="text-[11px] text-amber-800 font-sans font-semibold mt-1">
          RESEARCH PROTOTYPE ESTIMATE ONLY • NOT A STATUTORY CERTIFICATE • LABORATORY CONFIRMATION REQUIRED
        </p>
      </div>

      {/* Meta details */}
      <div className="grid grid-cols-2 gap-4 text-xs mb-6 font-sans bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div>
          <div><strong>Report ID:</strong> {sample.batchNumber}</div>
          <div><strong>Sample Name:</strong> {sample.name}</div>
          <div><strong>Feed Category:</strong> {sample.category.toUpperCase()}</div>
          <div><strong>Source / Brand:</strong> {sample.sourceOrBrand}</div>
        </div>
        <div className="text-right">
          <div><strong>Testing Date:</strong> {sample.timestamp}</div>
          <div><strong>Method:</strong> {sample.testedMethod}</div>
          <div><strong>Type:</strong> {sample.isSimulated ? 'Known Control Preset' : 'Prototype Optical Heuristic'}</div>
          <div><strong>Screening Status:</strong> {sample.bisCompliant ? 'Passed Reference Thresholds' : 'Threshold Breach Detected'}</div>
        </div>
      </div>

      {/* Classification Banner */}
      <div className={`p-3 rounded-lg border text-center mb-6 font-sans ${
        sample.overallGrade.includes('Tier A') 
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
          : (sample.overallGrade.includes('Tier C') ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-amber-50 border-amber-300 text-amber-900')
      }`}>
        <div className="text-xs uppercase font-bold tracking-wider">Field Screening Assessment (Non-Statutory Estimate)</div>
        <div className="text-xl font-black">{sample.overallGrade}</div>
        <div className="text-[11px] mt-1 text-slate-700">
          Screened against {sample.regulatoryCitation.standardCode} reference thresholds; laboratory confirmation required.
        </div>
      </div>

      {/* Detailed Parameters Table */}
      <table className="w-full text-xs text-left mb-6 border-collapse border border-slate-300 font-sans">
        <thead>
          <tr className="bg-slate-100 text-slate-800">
            <th className="border border-slate-300 p-2">Nutritional Parameter</th>
            <th className="border border-slate-300 p-2 text-center">Estimated Value*</th>
            <th className="border border-slate-300 p-2 text-center">BIS/ICAR Reference Threshold</th>
            <th className="border border-slate-300 p-2 text-center">Screening Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 p-2 font-semibold">Crude Protein (CP % DM basis)</td>
            <td className="border border-slate-300 p-2 text-center font-bold">
              {sample.metrics.crudeProtein !== undefined ? `${sample.metrics.crudeProtein}%` : 'Requires Lab Test'}
            </td>
            <td className="border border-slate-300 p-2 text-center">{sample.category === 'silage' ? 'Min 8.0%' : 'Min 20.0% (BIS Type II)'}</td>
            <td className="border border-slate-300 p-2 text-center">
              {sample.metrics.crudeProtein !== undefined
                ? sample.metrics.crudeProtein >= (sample.category === 'silage' ? 8.0 : 20.0)
                  ? '✓ Meets Reference'
                  : '✗ Below Reference'
                : 'Pending Wet Chemistry'}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-semibold">Moisture Content (%)</td>
            <td className="border border-slate-300 p-2 text-center font-bold">
              {sample.metrics.moisture !== undefined ? `${sample.metrics.moisture}%` : 'N/A'}
            </td>
            <td className="border border-slate-300 p-2 text-center">{sample.category === 'silage' ? 'Max 70.0%' : 'Max 11.0% (BIS)'}</td>
            <td className="border border-slate-300 p-2 text-center">
              {sample.metrics.moisture !== undefined
                ? sample.metrics.moisture <= (sample.category === 'silage' ? 70.0 : 11.0)
                  ? '✓ Within Limit'
                  : '✗ High Moisture'
                : 'N/A'}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-semibold">Acid Insoluble Ash / Sand (%)</td>
            <td className="border border-slate-300 p-2 text-center font-bold">
              {sample.metrics.acidInsolubleAsh !== undefined ? `${sample.metrics.acidInsolubleAsh}%` : 'Requires Lab Test'}
            </td>
            <td className="border border-slate-300 p-2 text-center">Max 3.5% (BIS IS:2052)</td>
            <td className="border border-slate-300 p-2 text-center">
              {sample.metrics.acidInsolubleAsh !== undefined
                ? sample.metrics.acidInsolubleAsh <= 3.5
                  ? '✓ Within Limit'
                  : '✗ Excess Sand'
                : 'Pending Muffle Furnace'}
            </td>
          </tr>
          {sample.silageMetrics && (
            <>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold">Silage Fermentation pH</td>
                <td className="border border-slate-300 p-2 text-center font-bold">{sample.silageMetrics.pH}</td>
                <td className="border border-slate-300 p-2 text-center">Optimum: 3.8 - 4.2</td>
                <td className="border border-slate-300 p-2 text-center">
                  {sample.silageMetrics.pH <= 4.2 ? '✓ Optimum' : '✗ Elevated pH'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold">Flieg Quality Score</td>
                <td className="border border-slate-300 p-2 text-center font-bold">{sample.silageMetrics.fliegScore} / 100</td>
                <td className="border border-slate-300 p-2 text-center">Min 61 for Good Grade</td>
                <td className="border border-slate-300 p-2 text-center font-bold">
                  {sample.silageMetrics.fliegGrade.toUpperCase()}
                </td>
              </tr>
            </>
          )}
          <tr>
            <td className="border border-slate-300 p-2 font-semibold">Synthetic Urea (NPN Adulterant)</td>
            <td className="border border-slate-300 p-2 text-center font-bold">
              {sample.adulteration.ureaPercentage}%
            </td>
            <td className="border border-slate-300 p-2 text-center">NIL (Unadulterated)</td>
            <td className="border border-slate-300 p-2 text-center font-bold">
              {sample.adulteration.ureaAdulterationDetected ? '✗ ADULTERATION SUSPECTED' : '✓ Negative'}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="text-[10px] text-slate-500 font-sans italic mb-4">
        * Estimated values are optical/colorimetric proxies generated by a hackathon prototype heuristic. They do not constitute certified analytical measurements.
      </div>

      {/* Advisory & Triage Note */}
      <div className="border border-slate-200 rounded p-3 text-xs mb-6 font-sans">
        <div className="font-bold text-slate-900 mb-1">Field Advisory & Suggested Next Steps:</div>
        <p className="text-slate-700">{sample.veterinaryAdvisory}</p>
        <ul className="list-disc pl-5 mt-2 space-y-0.5 text-slate-700">
          {sample.correctiveActions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>

      {/* Legal & Medical Disclaimer */}
      <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 font-sans leading-tight">
        <p><strong>PROTOTYPE DISCLAIMER:</strong> {sample.disclaimer}</p>
        <p className="mt-1">In emergency situations, contact your nearest Veterinary Dispensary or call the National Toll-Free Animal Health Helpline: <strong>1962</strong>.</p>
      </div>

      {/* Footer - No Official Stamp */}
      <div className="mt-8 pt-4 border-t-2 border-slate-900 flex items-center justify-between text-xs font-sans">
        <div>
          <div className="font-bold text-slate-900">PashuPoshan AI Prototype Screening System</div>
          <div className="text-[10px] text-slate-500">Student Innovation Project — Smart India Hackathon 2026</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-slate-500">GENERATED: {new Date().toISOString()}</div>
          <div className="font-semibold text-slate-700 text-[11px]">Unverified Field Screening Heuristic — Prototype Only</div>
        </div>
      </div>
    </div>
  );
};
