import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  MapPin,
  Phone,
  ExternalLink,
  FlaskConical,
  Search,
  Award,
  Check,
  Copy,
  Info,
  PhoneCall,
} from 'lucide-react';
import { Locale } from '../lib/types';
import { t } from '../lib/i18n';

export interface AccreditedLab {
  id: string;
  name: string;
  hindiName?: string;
  category: 'NDDB Referral' | 'ICAR Apex' | 'State Veterinary University' | 'National Helpline';
  accreditation: string; // e.g. "NABL ISO/IEC 17025", "BIS Accredited"
  city: string;
  state: string;
  address: string;
  phone: string;
  tollFree?: string;
  mapsQuery: string;
  capabilities: string[];
}

export const ACCREDITED_LABS: AccreditedLab[] = [
  {
    id: 'nddb_calf_anand',
    name: 'CALF - Centre for Analysis and Learning in Livestock and Food (NDDB)',
    hindiName: 'सीएएलएफ - राष्ट्रीय डेयरी विकास बोर्ड (एनडीडीबी) केंद्रीय प्रयोगशाला',
    category: 'NDDB Referral',
    accreditation: 'NABL (ISO/IEC 17025:2017) & FSSAI National Referral Lab',
    city: 'Anand',
    state: 'Gujarat',
    address: 'National Dairy Development Board Campus, PB No. 40, Anand, Gujarat - 388001',
    phone: '+91-2692-260148',
    tollFree: '1800-180-1551',
    mapsQuery: 'CALF NDDB Anand Gujarat',
    capabilities: [
      'Aflatoxin B1 / M1 (HPLC & ELISA)',
      'Crude Protein (Kjeldahl Digestion)',
      'Acid Insoluble Ash (Sand & Silica)',
      'Fiber (Van Soest NDF / ADF)',
      'Fatty Acid Profile & Heavy Metals',
      'Urea Adulteration Quantification',
    ],
  },
  {
    id: 'icar_ndri_karnal',
    name: 'ICAR - National Dairy Research Institute (NDRI) Analytical Lab',
    hindiName: 'भाकृअनुप - राष्ट्रीय डेयरी अनुसंधान संस्थान (एनडीआरआई)',
    category: 'ICAR Apex',
    accreditation: 'ICAR Apex National Dairy Institute & NABL Accredited QA Lab',
    city: 'Karnal',
    state: 'Haryana',
    address: 'Animal Nutrition Division, ICAR-NDRI, GT Road, Karnal, Haryana - 132001',
    phone: '+91-184-2259002',
    mapsQuery: 'ICAR NDRI Karnal Haryana',
    capabilities: [
      'Silage Fermentation Quality (Flieg Score Verification)',
      'Lactic / Acetic / Butyric Acid Profiling',
      'Ammonia Nitrogen (% of Total N)',
      'In-Vitro Rumen Dry Matter Digestibility (IVDMD)',
      'Mineral Mixture Chelated Bioavailability Analysis',
    ],
  },
  {
    id: 'icar_igfri_jhansi',
    name: 'ICAR - Indian Grassland and Fodder Research Institute (IGFRI)',
    hindiName: 'भाकृअनुप - भारतीय चरागाह एवं चारा अनुसंधान संस्थान',
    category: 'ICAR Apex',
    accreditation: 'National Apex Institute for Forage & Fodder Quality',
    city: 'Jhansi',
    state: 'Uttar Pradesh',
    address: 'Plant-Animal Relationship Division, IGFRI, Gwalior Road, Jhansi, UP - 284003',
    phone: '+91-510-2730666',
    mapsQuery: 'ICAR IGFRI Jhansi Uttar Pradesh',
    capabilities: [
      'Green Fodder & Silage Quality Assessment',
      'HCN (Hydrocyanic Acid) in Sorghum/Chari',
      'Nitrate & Nitrite Toxicity Screening',
      'Tannin & Anti-Nutritional Factor Profiling',
      'True Protein vs NPN Differentiation',
    ],
  },
  {
    id: 'gadvasu_ludhiana',
    name: 'GADVASU Central Animal Nutrition & Feed Quality Diagnostic Lab',
    hindiName: 'गडवासु पशु पोषण एवं चारा विश्लेषण प्रयोगशाला, लुधियाना',
    category: 'State Veterinary University',
    accreditation: 'State Veterinary University Apex Diagnostic Center',
    city: 'Ludhiana',
    state: 'Punjab',
    address: 'Department of Animal Nutrition, GADVASU, Ferozepur Road, Ludhiana, Punjab - 141004',
    phone: '+91-161-2414009',
    mapsQuery: 'GADVASU Ludhiana Punjab',
    capabilities: [
      'Total Mixed Ration (TMR) Chemical Testing',
      'Urea Adulteration Verification in Khal/Pellets',
      'Mycotoxin Screen (Aflatoxin & Ochratoxin)',
      'Proximate Analysis (CP, CF, EE, Total Ash)',
    ],
  },
  {
    id: 'tanuvas_chennai',
    name: 'TANUVAS Central Feed Technology & Animal Nutrition Lab',
    hindiName: 'तनुवास पशु आहार प्रौद्योगिकी प्रयोगशाला, चेन्नई',
    category: 'State Veterinary University',
    accreditation: 'NABL ISO/IEC 17025 Accredited Animal Nutrition Testing Lab',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: 'Madhavaram Milk Colony, TANUVAS, Chennai, Tamil Nadu - 600051',
    phone: '+91-44-25551586',
    mapsQuery: 'TANUVAS Madhavaram Milk Colony Chennai',
    capabilities: [
      'BIS IS:2052 Statutory Cattle Feed Testing',
      'Kjeldahl Crude Protein & Amino Acid Profiling',
      'Van Soest Fiber Fractionation (NDF/ADF/ADL)',
      'Aflatoxin B1 ELISA & Chromatography',
    ],
  },
  {
    id: 'mafsu_shirwal',
    name: 'MAFSU - KNP College of Veterinary Science Feed Nutrition Lab',
    hindiName: 'माफसु - केएनपी पशुवैद्यकीय महाविद्यालय चारा विश्लेषण प्रयोगशाळा',
    category: 'State Veterinary University',
    accreditation: 'MAFSU Maharashtra State Veterinary University Diagnostic Facility',
    city: 'Shirwal / Satara',
    state: 'Maharashtra',
    address: 'Post Graduate Institute of Veterinary Sciences, Shirwal, Satara, Maharashtra - 412801',
    phone: '+91-2169-244227',
    mapsQuery: 'KNP College of Veterinary Science Shirwal Maharashtra',
    capabilities: [
      'Sugarcane Tops & Napier Silage Chemical Assays',
      'Feed Microscopy & Physical Adulterant Screen',
      'Total Digestible Nutrients (TDN) Estimation',
      'Calcium & Phosphorus Ratio Confirmation',
    ],
  },
  {
    id: 'rajuvas_bikaner',
    name: 'RAJUVAS Animal Nutrition & Fodder Testing Laboratory',
    hindiName: 'राजूवास पशु पोषण एवं चारा परीक्षण प्रयोगशाला, बीकानेर',
    category: 'State Veterinary University',
    accreditation: 'Arid Zone Livestock Nutrition Center / ICAR Supported',
    city: 'Bikaner',
    state: 'Rajasthan',
    address: 'College of Veterinary & Animal Science, RAJUVAS, Bijey Bhawan, Bikaner, Rajasthan - 334001',
    phone: '+91-151-2250024',
    mapsQuery: 'RAJUVAS Bikaner Rajasthan',
    capabilities: [
      'Dry Roughage (Wheat Bhusa / Bajra Kadbi) Evaluation',
      'Mineral Deficiency Profiling in Livestock Feed',
      'Silica / Sand Contamination Wet Digestion',
    ],
  },
  {
    id: 'national_helpline_1962',
    name: 'National Animal Disease & Dairy Helpline (DAHD, Govt of India)',
    hindiName: 'राष्ट्रीय पशु रोग एवं डेयरी आपातकालीन हेल्पलाइन (भारत सरकार)',
    category: 'National Helpline',
    accreditation: 'Ministry of Fisheries, Animal Husbandry and Dairying (DAHD)',
    city: 'Pan-India',
    state: 'All States / Union Territories',
    address: 'Toll-free 24/7 routing to nearest District Veterinary Polyclinic / Mobile Veterinary Unit (MVU)',
    phone: '1962',
    tollFree: '1962',
    mapsQuery: 'nearest Veterinary Hospital',
    capabilities: [
      'On-Farm Sample Collection Dispatch',
      'Mobile Veterinary Unit (MVU) Emergency Triage',
      'Referral to District Diagnostic Laboratory',
      'Acute Toxicity & Feed Poisoning First-Aid',
    ],
  },
];

interface NearestLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

export const NearestLabModal: React.FC<NearestLabModalProps> = ({
  isOpen,
  onClose,
  locale,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredLabs = useMemo(() => {
    return ACCREDITED_LABS.filter((lab) => {
      const matchesCategory =
        selectedCategory === 'All' || lab.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        lab.name.toLowerCase().includes(q) ||
        (lab.hindiName && lab.hindiName.toLowerCase().includes(q)) ||
        lab.city.toLowerCase().includes(q) ||
        lab.state.toLowerCase().includes(q) ||
        lab.capabilities.some((c) => c.toLowerCase().includes(q)) ||
        lab.accreditation.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopy = (lab: AccreditedLab) => {
    const text = `${lab.name}\n${lab.address}\nPhone: ${lab.phone}\nAccreditation: ${lab.accreditation}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(lab.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-800 border-b border-[#DCD3BF] dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1F5D3B]/10 text-[#1F5D3B] dark:text-emerald-400 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="lab-modal-title"
                className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white leading-tight"
              >
                {t('lab.title', locale)}
              </h2>
              <p className="text-xs text-[#5A5243] dark:text-slate-400 font-semibold">
                {t('lab.subtitle', locale)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors"
            aria-label={t('common.close', locale)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 bg-[#F3EEE1] dark:bg-slate-800/60 border-b border-[#DCD3BF] dark:border-slate-700 shrink-0 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('lab.searchPlaceholder', locale)}
              className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-white dark:bg-slate-900 border border-[#DCD3BF] dark:border-slate-700 rounded-xl text-xs sm:text-sm text-[#1A1A1A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F5D3B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] px-2 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {['All', 'NDDB Referral', 'ICAR Apex', 'State Veterinary University', 'National Helpline'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 min-h-[44px] inline-flex items-center justify-center rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#1F5D3B] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-[#5A5243] dark:text-slate-300 border border-[#DCD3BF] dark:border-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat === 'All' ? t('lab.allLabs', locale) : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Lab Cards Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Emergency 1962 Banner */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1F5D3B] text-white flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#1F5D3B] dark:text-emerald-300">
                  {t('lab.helplineTitle', locale)}
                </h4>
                <p className="text-[11px] text-[#5A5243] dark:text-slate-300 font-medium">
                  {t('lab.helplineDesc', locale)}
                </p>
              </div>
            </div>
            <a
              href="tel:1962"
              className="px-3.5 py-2 min-h-[44px] bg-[#1F5D3B] hover:bg-[#184a2f] text-white rounded-xl font-black text-xs shadow shrink-0 inline-flex items-center space-x-1.5 ml-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t('lab.call1962', locale)}</span>
            </a>
          </div>

          {/* List of Labs */}
          {filteredLabs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FlaskConical className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('lab.noLabs', locale)}
              </p>
              <p className="text-xs text-slate-500">
                {t('lab.noLabsSub', locale)}
              </p>
            </div>
          ) : (
            filteredLabs.map((lab) => (
              <div
                key={lab.id}
                className="bg-white dark:bg-slate-800 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-sm hover:border-[#1F5D3B]/60 transition-all"
              >
                {/* Lab Title and Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#1F5D3B] dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700">
                        {lab.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {lab.state}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-[#1A1A1A] dark:text-white leading-snug">
                      {lab.name}
                    </h3>
                    {locale === 'hi' && lab.hindiName && (
                      <p className="text-[11px] text-[#5A5243] dark:text-slate-400 font-semibold">
                        {lab.hindiName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Accreditation Badge */}
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#1F5D3B] dark:text-emerald-400">
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>{lab.accreditation}</span>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-1.5 text-xs text-[#5A5243] dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                  <span>{lab.address}</span>
                </div>

                {/* Accredited Capabilities Pills */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    {t('lab.testingAssays', locale)}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {lab.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#F3EEE1] dark:bg-slate-700 text-[#1A1A1A] dark:text-slate-200"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Call, Maps, Copy */}
                <div className="pt-2 border-t border-[#DCD3BF]/60 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <a
                      href={`tel:${lab.phone.replace(/[^0-9+]/g, '')}`}
                      className="px-3.5 py-2 min-h-[44px] bg-[#1F5D3B] hover:bg-[#184a2f] text-white rounded-xl text-xs font-black inline-flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t('lab.callLab', locale)}: {lab.phone}</span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        lab.mapsQuery
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 min-h-[44px] bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-[#DCD3BF] dark:border-slate-600 text-[#1A1A1A] dark:text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('lab.directions', locale)}</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(lab)}
                    className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold inline-flex items-center space-x-1.5"
                    title="Copy lab address and details"
                    aria-label="Copy lab address and details"
                  >
                    {copiedId === lab.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 text-xs">{t('lab.copied', locale)}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-xs">{t('lab.copyInfo', locale)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Sample Sampling Guidance Note */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl text-xs space-y-1.5 text-[#5A5243] dark:text-slate-300">
            <div className="flex items-center space-x-1.5 font-black text-[#C2703D] dark:text-amber-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>{t('lab.samplingTitle', locale)}</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
              <li>{t('lab.samplingStep1', locale)}</li>
              <li>{t('lab.samplingStep2', locale)}</li>
              <li>{t('lab.samplingStep3', locale)}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white dark:bg-slate-800 border-t border-[#DCD3BF] dark:border-slate-700 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            {t('lab.footer', locale)}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[44px] inline-flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-colors"
          >
            {t('common.close', locale)}
          </button>
        </div>
      </div>
    </div>
  );
};
