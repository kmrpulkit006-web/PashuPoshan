import React from 'react';
import { FeedSample, Locale } from '../lib/types';
import { t } from '../lib/i18n';
import { Award, ShieldCheck, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

interface PrintableReportProps {
  sample: FeedSample;
  locale: Locale;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ sample, locale }) => {
  return (
    <div id="printable-certificate" className="hidden print:block p-8 bg-white text-black font-serif max-w-2xl mx-auto">
      {/* Official Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
        <div className="text-xs uppercase tracking-widest text-slate-600 font-sans font-bold">
          Government of India • Ministry of Fisheries, Animal Husbandry & Dairying
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight mt-1 text-slate-900 font-sans">
          PashuPoshan National Feed & Silage Quality Certificate
        </h1>
        <p className="text-[11px] text-slate-600 font-sans">
          Smart India Hackathon (SIH 2026 PS 26111) — Rapid Livestock Compliance Network
        </p>
      </div>

      {/* Meta details */}
      <div className="grid grid-cols-2 gap-4 text-xs mb-6 font-sans bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div>
          <div><strong>Certificate No:</strong> {sample.batchNumber}</div>
          <div><strong>Sample Name:</strong> {sample.name}</div>
          <div><strong>Feed Category:</strong> {sample.category.toUpperCase()}</div>
          <div><strong>Source / Brand:</strong> {sample.sourceOrBrand}</div>
        </div>
        <div className="text-right">
          <div><strong>Testing Date:</strong> {sample.timestamp}</div>
          <div><strong>Testing Method:</strong> {sample.testedMethod}</div>
          <div><strong>Confidence Score:</strong> {sample.confidenceScore}%</div>
          <div><strong>Regulatory Status:</strong> {sample.bisCompliant ? 'BIS COMPLIANT' : 'NON-COMPLIANT'}</div>
        </div>
      </div>

      {/* Classification Banner */}
      <div className={`p-3 rounded-lg border text-center mb-6 font-sans ${
        sample.overallGrade.includes('Tier A') 
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
          : (sample.overallGrade.includes('Tier C') ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-amber-50 border-amber-300 text-amber-900')
      }`}>
        <div className="text-xs uppercase font-bold tracking-wider">Quality Grade Assessment</div>
        <div className="text-xl font-black">{sample.overallGrade}</div>
        <div className="text-[11px] mt-1">{sample.regulatoryCitation.standardCode} ({sample.regulatoryCitation.clause})</div>
      </div>

      {/* Detailed Parameters Table */}
      <table className="w-full text-xs text-left mb-6 border-collapse border border-slate-300 font-sans">
        <thead>
          <tr className="bg-slate-100 text-slate-800">
            <th className="border border-slate-300 p-2">Nutritional Parameter</th>
            <th className="border border-slate-300 p-2 text-center">Observed Value</th>
            <th className="border border-slate-300 p-2 text-center">Prescribed Standard Limit</th>
            <th className="border border-slate-300 p-2 text-center">Compliance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 p-2 font-semibold">Crude Protein (CP % DM basis)</td>
            <td className="border border-slate-300 p-2 text-center font-bold">{sample.metrics.crudeProtein}%</td>
            <td className="border border-slate-300 p-2 text-center">{sample.category === 'silage' ? 'Min 8.0%' : 'Min 20.0% (BIS Type II)'}</td>
            <td className="border border-slate-300 p-2 text-center">
              {sample.metrics.crudeProtein >= (sample.category === 'silage' ? 8.0 : 20.0) ? '✓ PASS' : '✗ DEFICIT'}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-semibold">Moisture Content (%)</td>
            <td className="border border-slate-300 p-2 text-center font-bold">{sample.metrics.moisture}%</td>
            <td className="border border-slate-300 p-2 text-center">{sample.category === 'silage' ? 'Max 70.0%' : 'Max 11.0% (BIS)'}</td>
            <td className="border border-slate-300 p-2 text-center">
              {sample.metrics.moisture <= (sample.category === 'silage' ? 70.0 : 11.0) ? '✓ PASS' : '✗ HIGH'}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-semibold">Acid Insoluble Ash / Sand (%)</td>
            <td className="border border-slate-300 p-2 text-center font-bold">{sample.metrics.acidInsolubleAsh}%</td>
            <td className="border border-slate-300 p-2 text-center">Max 3.5% (BIS IS:2052)</td>
            <td className="border border-slate-300 p-2 text-center">
              {sample.metrics.acidInsolubleAsh <= 3.5 ? '✓ PASS' : '✗ EXCESS SAND'}
            </td>
          </tr>
          {sample.silageMetrics && (
            <>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold">Silage Fermentation pH</td>
                <td className="border border-slate-300 p-2 text-center font-bold">{sample.silageMetrics.pH}</td>
                <td className="border border-slate-300 p-2 text-center">Optimum: 3.8 - 4.2</td>
                <td className="border border-slate-300 p-2 text-center">
                  {sample.silageMetrics.pH <= 4.2 ? '✓ OPTIMUM' : '✗ CLOSTRIDIAL RISK'}
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
              {sample.adulteration.ureaAdulterationDetected ? '✗ ADULTERATED' : '✓ CLEAR'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Advisory & Triage Note */}
      <div className="border border-slate-200 rounded p-3 text-xs mb-6 font-sans">
        <div className="font-bold text-slate-900 mb-1">Field Advisory & Recommended Protocol:</div>
        <p className="text-slate-700">{sample.veterinaryAdvisory}</p>
        <ul className="list-disc pl-5 mt-2 space-y-0.5 text-slate-700">
          {sample.correctiveActions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>

      {/* Legal & Medical Disclaimer */}
      <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 font-sans leading-tight">
        <p><strong>LEGAL & VETERINARY DISCLAIMER:</strong> {sample.disclaimer}</p>
        <p className="mt-1">In emergency situations, contact your nearest Veterinary Dispensary or call the National Toll-Free Animal Health Helpline: <strong>1962</strong>.</p>
      </div>

      {/* Digital Stamp Footer */}
      <div className="mt-8 pt-4 border-t-2 border-slate-900 flex items-center justify-between text-xs font-sans">
        <div>
          <div className="font-bold text-slate-900">PashuPoshan AI Digital Diagnostic Engine</div>
          <div className="text-[10px] text-slate-500">Ministry of Animal Husbandry (DAHD) Hackathon Platform</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-slate-500">TIMESTAMP: {new Date().toISOString()}</div>
          <div className="font-bold text-slate-800">Verified Electronic Screening Record</div>
        </div>
      </div>
    </div>
  );
};
