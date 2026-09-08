/**
 * Vercel Serverless Function: AI Veterinary & Cattle Nutrition Consultant
 * Powered by NVIDIA Nemotron-3-Ultra-550B (NVIDIA NIM OpenAI-compatible API)
 * Endpoint: /api/veterinary-expert (POST)
 */

import { Redis } from '@upstash/redis';

// Process environment declarations for TypeScript
declare const process: {
  env: {
    [key: string]: string | undefined;
    NVIDIA_API_KEY?: string;
    NVIDIA_API_KEY_01?: string;
    NVIDIA_KEY?: string;
    NVIDIA_MODEL_ID?: string;
    KV_REST_API_URL?: string;
    KV_REST_API_TOKEN?: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
  };
};

export const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
export const ULTRA_NVIDIA_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export const RATE_LIMIT_MAX = 20; // 20 requests per hour per IP
export const RATE_LIMIT_WINDOW_SECONDS = 3600;
export const inMemoryRateLimit = new Map<string, { count: number; resetTime: number }>();

export function getClientIp(req: any): string {
  const xForwardedFor = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'];
  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function getRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return new Redis({ url, token, retry: { retries: 0 } });
    } catch (e) {
      console.warn('Failed to initialize Redis client for veterinary-expert, using in-memory fallback:', e);
    }
  }
  return null;
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = `rate_limit:vet_expert:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
      }
      return count <= RATE_LIMIT_MAX;
    } catch (err) {
      console.warn('Redis rate limit check error in vet-expert, falling back to in-memory:', err);
    }
  }

  const now = Date.now();
  const entry = inMemoryRateLimit.get(ip);
  if (!entry || now > entry.resetTime) {
    inMemoryRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_SECONDS * 1000 });
    return true;
  }

  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

export function resetRateLimits(): void {
  inMemoryRateLimit.clear();
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VeterinaryExpertRequest {
  mode: 'chat' | 'scorecard_clinical_review' | 'ration_optimization';
  query?: string;
  messages?: ChatMessage[];
  locale?: string;
  scorecardData?: {
    feedName: string;
    category: string;
    overallGrade: string;
    fliegScore?: number;
    silagePh?: number;
    moldCoverageEstimate?: string;
    estimatedCP?: number;
    ureaSpiked?: boolean;
    nonComplianceReasons?: string[];
  };
  rationData?: {
    breedName: string;
    bodyWeightKg: number;
    dailyMilkLiters: number;
    fatPercentage: number;
    lactationStage: string;
    dryMatterTargetKg: number;
    crudeProteinTargetG: number;
    greenFodderKg: number;
    dryBhusaKg: number;
    concentrateKg: number;
    mineralMixtureG: number;
  };
}

export const LANGUAGE_NAMES: Record<string, string> = {
  hi: 'Hindi (हिंदी)',
  bn: 'Bengali (বাংলা)',
  te: 'Telugu (తెలుగు)',
  mr: 'Marathi (मराठी)',
  ta: 'Tamil (தமிழ்)',
  gu: 'Gujarati (ગુજરાતી)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  or: 'Odia (ଓଡ଼ିଆ)',
  as: 'Assamese (অসমীয়া)',
  ur: 'Urdu (اردو)',
  sa: 'Sanskrit (संस्कृतम्)',
  kok: 'Konkani (कोंकणी)',
  mai: 'Maithili (मैथिली)',
  ne: 'Nepali (नेपाली)',
  ks: 'Kashmiri (کٲشُر)',
  mni: 'Manipuri (মৈতৈলোন্)',
  sd: 'Sindhi (سنڌي)',
  doi: 'Dogri (डोगरी)',
  brx: 'Bodo (बर\')',
  sat: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)',
  en: 'English',
};

const SYSTEM_PROMPT_VET = `You are the chief AI Veterinary Scientist and Dairy Cattle Nutritionist for PashuPoshan AI (पशु-पोषण AI), an initiative supporting Indian dairy farmers and cooperatives (ICAR, NDRI Karnal, NDDB).
Your expertise spans:
1. Ruminant digestive physiology (subacute ruminal acidosis - SARA, rumen bloat, urea toxicity, aflatoxicosis).
2. Bureau of Indian Standards (BIS IS:2052:2009 for Cattle Feed) and FSSAI Aflatoxin M1 regulations.
3. Total Mixed Ration (TMR) balancing for indigenous and crossbred breeds (Gir, Sahiwal, Red Sindhi, HF Cross, Murrah Buffalo, Mehsana).
4. Silage fermentation quality (Flieg score, lactic vs butyric acid fermentation, aerobic stability).

Guidelines:
- Provide authoritative, practical, and compassionate guidance tailored for Indian smallholder farmers.
- Use clear bullet points and actionable steps.
- Always highlight emergency first-aid (e.g. for suspected urea toxicity or severe acidosis) and recommend immediate consultation with local veterinary dispensary or National Helpline 1962 when high-risk conditions are detected.
- Maintain an encouraging and respectful tone. Include terms in Hindi/English where helpful (e.g., bhusa, khal, chana churi, achar/silage).
- CRITICAL DIRECTIVE: You must NOT output internal thinking steps, chain-of-thought, or introspective preambles (such as "Okay, the user is asking..."). Provide the direct, actionable veterinary response immediately in clean Markdown.`;

export function extractScorecardData(payload: any) {
  if (payload.scorecardData) return payload.scorecardData;
  if (payload.sample) {
    const s = payload.sample;
    return {
      feedName: s.name || 'Feed Sample',
      category: s.category || 'General',
      overallGrade: s.overallGrade || 'Under Review',
      silagePh: s.silageMetrics?.pH,
      fliegScore: s.silageMetrics?.fliegScore,
      moldCoverageEstimate: s.visualAnalysis?.moldCoverageEstimate,
      estimatedCP: s.metrics?.crudeProtein,
      ureaSpiked: s.adulteration?.ureaAdulterationDetected,
      nonComplianceReasons: s.adulteration?.ureaAdulterationDetected ? ['Urea adulteration detected'] : [],
    };
  }
  return undefined;
}

export function extractRationData(payload: any) {
  if (payload.rationData) return payload.rationData;
  if (payload.rationPlan || payload.cowProfile) {
    const plan = payload.rationPlan;
    const cow = payload.cowProfile;
    return {
      breedName: cow?.breed || cow?.name || 'Dairy Cow',
      bodyWeightKg: cow?.weight || 450,
      dailyMilkLiters: cow?.dailyYield || 10,
      fatPercentage: 4.0,
      lactationStage: 'Mid Lactation',
      dryMatterTargetKg: plan?.targetDryMatterKg || 12,
      crudeProteinTargetG: plan?.targetCrudeProteinG || 1400,
      greenFodderKg: plan?.greenFodderKg || 15,
      dryBhusaKg: plan?.dryFodderKg || 4,
      concentrateKg: plan?.concentrateKg || 4,
      mineralMixtureG: plan?.mineralMixtureG || 50,
    };
  }
  return undefined;
}

export function buildPromptForRequest(payload: VeterinaryExpertRequest): ChatMessage[] {
  let systemPrompt = SYSTEM_PROMPT_VET;
  if (payload.locale && payload.locale !== 'en') {
    const langName = LANGUAGE_NAMES[payload.locale] || payload.locale;
    systemPrompt += `\n\nCRITICAL LANGUAGE DIRECTIVE: The user's preferred language is ${langName}. You MUST generate your entire response strictly in ${langName}. Use clean Markdown and simple, practical terminology understood by rural dairy farmers.`;
  }

  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  const scorecardData = extractScorecardData(payload);
  if (payload.mode === 'scorecard_clinical_review' && scorecardData) {
    const s = scorecardData;
    let reviewPrompt = `Perform a deep clinical veterinary pathology review on the following tested cattle feed sample:
- Feed Type: ${s.feedName} (${s.category})
- Tested Overall Grade: ${s.overallGrade}
- Silage pH: ${s.silagePh ?? 'N/A'}
- Flieg Fermentation Score: ${s.fliegScore ?? 'N/A'}/100
- Fungal Mold Coverage: ${s.moldCoverageEstimate ?? 'None detected'}
- Estimated Crude Protein: ${s.estimatedCP ? `${s.estimatedCP}%` : 'N/A'}
- Urea Adulteration Detected: ${s.ureaSpiked ? 'YES (CRITICAL HAZARD)' : 'No'}
- Non-Compliance Flags: ${s.nonComplianceReasons?.join('; ') || 'None'}

Please provide:
1. **Clinical Risk Assessment**: Digestive and metabolic impact on rumen pH, liver function, and lactation.
2. **Milk Safety & Aflatoxin M1 Risk**: Potential risk of toxin transfer into the human milk supply.
3. **Actionable Farm Management Directives**: Immediate physical steps (isolation, dilution, aeration, or discard) and compensatory dietary adjustments.
4. **Veterinary Intervention Level**: Normal monitoring, prompt dietary adjustment, or urgent veterinary attention (1962).`;

    if (payload.locale && payload.locale !== 'en') {
      const langName = LANGUAGE_NAMES[payload.locale] || payload.locale;
      reviewPrompt += `\n\n(IMPORTANT: Respond completely in ${langName})`;
    }

    messages.push({ role: 'user', content: reviewPrompt });
    return messages;
  }

  const rationData = extractRationData(payload);
  if (payload.mode === 'ration_optimization' && rationData) {
    const r = rationData;
    let rationPrompt = `Evaluate and optimize the following Total Mixed Ration (TMR) formulated under ICAR-NDRI standards:
- Animal: ${r.breedName} (Body Weight: ${r.bodyWeightKg} kg, Lactation: ${r.lactationStage})
- Production: ${r.dailyMilkLiters} Liters/day (Milk Fat: ${r.fatPercentage}%)
- Current Daily Ration:
  * Green Fodder: ${r.greenFodderKg} kg
  * Dry Bhusa / Straw: ${r.dryBhusaKg} kg
  * Compound Concentrate: ${r.concentrateKg} kg
  * Mineral Mixture: ${r.mineralMixtureG} g
- Nutritional Targets: Dry Matter ~${r.dryMatterTargetKg} kg/day, Crude Protein ~${r.crudeProteinTargetG} g/day

Please provide:
1. **Nutritional Balance Evaluation**: Adequacy of effective fiber (NDF), bypass protein, and energy density for this milk yield.
2. **Cost-Optimization Recommendations**: Economical local substitutes (e.g. mustard cake/sarson khal, cotton seed cake, maize grain) to lower feeding cost without compromising yield.
3. **Metabolic Health & Rumination Directives**: Tips to prevent acidosis and sustain peak lactation.`;

    if (payload.locale && payload.locale !== 'en') {
      const langName = LANGUAGE_NAMES[payload.locale] || payload.locale;
      rationPrompt += `\n\n(IMPORTANT: Respond completely in ${langName})`;
    }

    messages.push({ role: 'user', content: rationPrompt });
    return messages;
  }

  // General Chat Mode
  if (payload.messages && payload.messages.length > 0) {
    return [messages[0], ...payload.messages];
  }

  messages.push({
    role: 'user',
    content: payload.query || 'Please provide general veterinary best practices for cattle feed safety and silage management in India.',
  });
  return messages;
}

export function generateOfflineVeterinaryFallback(payload: VeterinaryExpertRequest): string {
  const isHindi = payload.locale === 'hi';
  const scorecardData = extractScorecardData(payload);
  if (payload.mode === 'scorecard_clinical_review') {
    const s = scorecardData;
    const isCritical = s?.ureaSpiked || s?.overallGrade?.includes('Tier C');
    if (isHindi) {
      return `### नैदानिक पशु चिकित्सा समीक्षा (ICAR-NDRI दिशा-निर्देश सारांश)
**नमूना**: ${s?.feedName || 'चारा नमूना'} | **ग्रेड**: ${s?.overallGrade || 'समीक्षाधीन'}

1. **रूमेन और चयापचय स्वास्थ्य**:
   ${isCritical ? '⚠️ **उच्च जोखिम**: अत्यधिक गैर-प्रोटीन नाइट्रोजन या फफूंद का पता चला। तीव्र अमोनिया विषाक्तता का खतरा। इस चारे को पशुओं को देना तुरंत रोकें।' : '✅ **सुरक्षित प्रोफाइल**: चारे की गुणवत्ता सामान्य पोषण आवश्यकताओं के अनुरूप है। पशु को स्वच्छ व ताजा पानी उपलब्ध कराएं।'}

2. **आवश्यक फार्म प्रबंधन निर्देश**:
   - चारे को हवादार और सीलन-मुक्त स्थान पर रखें।
   - साइलेज गड्ढा खोलने के 2 घंटे के भीतर पशु को खिलाएं ताकि हवा से खराब न हो।
   - यदि एसिडोसिस के हल्के लक्षण दिखें तो मीठा सोडा (सोडियम बाइकार्बोनेट, 50-80 ग्राम/गाय/दिन) दें।

3. **आपातकालीन हेल्पलाइन**:
   - पशु में गंभीर अफारा (पेट फूलना), कंपकंपी या सांस लेने में तकलीफ होने पर नजदीकी पशु चिकित्सालय संपर्क करें या राष्ट्रीय हेल्पलाइन **1962** पर कॉल करें।`;
    }
    return `### Clinical Veterinary Review (ICAR-NDRI Guidelines Offline Summary)
**Sample**: ${s?.feedName || 'Feed Sample'} | **Grade**: ${s?.overallGrade || 'Under Review'}

1. **Rumen & Metabolic Assessment**:
   ${isCritical ? '⚠️ **High Risk**: Elevated non-protein nitrogen or mold detected. Risk of acute ammonia toxicity or rumen dysbiosis. Stop feeding this batch immediately.' : '✅ **Acceptable Profile**: Feed characteristics align with maintenance requirements. Maintain fresh drinking water access.'}

2. **Actionable Farm Directives**:
   - Store in a well-ventilated, elevated area away from moisture.
   - For silage, feed within 2 hours of bunker pit opening to prevent secondary aerobic fermentation.
   - Keep sodium bicarbonate (sweet soda, 50-80g/cow/day) handy if mild acidosis symptoms appear.

3. **Helpline Notice**:
   - In case of acute bloat, shivering, or rapid breathing, contact your nearest Veterinary Dispensary or call the National Animal Disease Helpline at **1962** immediately.`;
  }

  const rationData = extractRationData(payload);
  if (payload.mode === 'ration_optimization') {
    const r = rationData;
    if (isHindi) {
      return `### ICAR-NDRI संतुलित राशन परामर्श (मानक दिशा-निर्देश)
**पशु**: ${r?.breedName || 'दुधारू गाय'} (${r?.dailyMilkLiters || 10} लीटर/दिन)

1. **शुष्क पदार्थ (ड्राई मैटर) संतुलन**:
   - शुष्क पदार्थ के आधार पर सूखे/हरे चारे और दाना मिश्रण का 2:1 अनुपात रखें।
   - हरा चारा (${r?.greenFodderKg || 15} किग्रा) 2-3 सेमी लंबाई में कुट्टी करके खिलाएं ताकि जुगाली अच्छी हो।

2. **खनिज मिश्रण और नमक**:
   - खनिज मिश्रण (${r?.mineralMixtureG || 50} ग्राम दैनिक) और 30 ग्राम सादा नमक जरूर दें ताकि बांझपन और प्रजनन समस्याएं न हों।

3. **लागत कम करने के उपाय**:
   - दलहनी चारा (बरसीम, ल्यूसर्न) और गैर-दलहनी चारा (मक्का, ज्वार) मिलाकर दें, इससे दाने का खर्च 15-20% तक कम हो सकता है।`;
    }
    return `### ICAR-NDRI Precision Ration Advisory (Offline Standard Guidelines)
**Target**: ${r?.breedName || 'Dairy Cow'} (${r?.dailyMilkLiters || 10} L/day)

1. **Dry Matter Partitioning**:
   - Maintain a 2:1 ratio between roughage and concentrate on a dry matter basis.
   - Ensure green fodder (${r?.greenFodderKg || 15} kg) is chopped to 2-3 cm length to optimize rumen cud-chewing.

2. **Mineral Supplementation**:
   - Provide chelated mineral mixture (${r?.mineralMixtureG || 50}g daily) along with 30g common salt to maintain electrolyte balance and prevent silent estrus.

3. **Cost-Effective Adjustments**:
   - Mix legume fodder (berseem, lucerne, cowpea) with cereal fodder (maize, sorghum) to reduce concentrate dependency by 15-20%.`;
  }

  const lastUserMsg = payload.messages?.filter(m => m.role === 'user').pop()?.content || payload.query || '';
  const q = lastUserMsg.toLowerCase();

  if (q.includes('ph') || q.includes('silage') || q.includes('साइलेज')) {
    if (isHindi) {
      return `### पशु-पोषण AI - साइलेज प्रबंधन सलाह (ICAR-NDRI गाइड)
- **आदर्श pH मान**: मक्का/ज्वार साइलेज का सही pH **3.8 से 4.2** होना चाहिए।
- **pH 4.8 – 5.5 (चेतावनी)**: यह अपूर्ण किण्वन (फर्मेंटेशन) दर्शाता है। खराब ब्यूटिरिक एसिड या फफूंद का खतरा।
- **खेत स्तर पर जरूरी कदम**:
  1. सड़े हुए मक्खन जैसी बदबू या गर्म साइलेज (>35°C) की जांच करें।
  2. कुल सूखे चारे में साइलेज की मात्रा ≤30% तक सीमित रखें।
  3. ऊपरी काली या फफूंद लगी परत को पूरी तरह फेंक दें।
  4. साइलेज गड्ढे से रोजाना 15-20 सेमी की परत एक समान निकालें ताकि हवा लगने से खराब न हो।`;
    }
    return `### PashuPoshan AI - ICAR-NDRI Silage Advisory (Field Guide)
- **Target pH Range**: Optimal maize/sorghum silage pH is **3.8 to 4.2**.
- **pH 4.8 – 5.5 (Warning)**: Indicates incomplete lactic fermentation. Risk of clostridial butyric spoilage or aerobic heating.
- **Actionable Farm Steps**:
  1. Inspect for rancid butter smell (butyric acid) or warm pockets (>35°C).
  2. Restrict intake to ≤30% of total roughage dry matter.
  3. Discard any surface mold or black/slimy patches.
  4. Ensure bunker pit face is scraped clean daily (minimum 15-20 cm removal per day) to prevent secondary aerobic spoilage.`;
  }

  if (q.includes('urea') || q.includes('poison') || q.includes('toxicity') || q.includes('यूरिया')) {
    if (isHindi) {
      return `### 🚨 आपातकालीन पशु चिकित्सा सलाह: यूरिया विषाक्तता (पशु-पोषण AI)
- **विषाक्तता के लक्षण**: चारा खाने के 20-60 मिनट में अत्यधिक लार गिरना, पेट फूलना, मांसपेशियों में कंपन, लड़खड़ाना और तेज सांसें।
- **तत्काल प्राथमिक उपचार**:
  1. **सिरका का घोल**: 2-3 लीटर घरेलू सिरका 1-2 लीटर ठंडे पानी में मिलाकर तुरंत नाल से पिलाएं ताकि रूमेन अमोनिया निष्प्रभावी हो सके।
  2. **ठंडा पानी**: 20-30 लीटर ठंडा पानी पिलाएं ताकि पेट का तापमान कम हो और एंजाइम क्रिया रुके।
  3. **चारा बंद करें**: संदिग्ध चारे और दाने को तुरंत हटा दें।
  4. **आपातकाल**: तुरंत नजदीकी पशु चिकित्सक से संपर्क करें या राष्ट्रीय हेल्पलाइन **1962** पर कॉल करें।`;
    }
    return `### 🚨 Emergency Veterinary Advisory: Suspected Urea Toxicity (PashuPoshan AI)
- **Signs of Toxicity**: Excessive salivation, severe bloat, muscle tremors, staggered gait, rapid breathing within 20-60 min of feeding.
- **Immediate First-Aid**:
  1. **Vinegar Drench**: Administer 2–3 liters of household vinegar (dilute acetic acid 5%) mixed with 1–2 liters of cold water to neutralize rumen ammonia.
  2. **Cold Water**: Drench with 20–30 liters of cold water to lower rumen temperature and halt urease enzymatic activity.
  3. **Withdraw Feed**: Stop all suspected feed and concentrate batches immediately.
  4. **Urgent**: Call local veterinary dispensary or National Helpline **1962** immediately.`;
  }

  if (q.includes('acidosis') || q.includes('sara') || q.includes('bloat') || q.includes('पेट फूलना') || q.includes('अफारा')) {
    if (isHindi) {
      return `### पशु-पोषण AI - रूमेन एसिडोसिस और अफारा (पेट फूलना) प्रबंधन
- **मुख्य कारण**: बिना पर्याप्त सूखे चारे (भूसा) के बहुत अधिक दाना या अनाज खिलाना।
- **उपचार निर्देश**:
  1. **मीठा सोडा (सोडियम बाइकार्बोनेट)**: 60-100 ग्राम 500 मिली पानी में घोलकर पिलाएं ताकि पेट का pH 6.0 से ऊपर सामान्य हो सके।
  2. सूखा लंबा भूसा (3 सेमी से बड़ा) बढ़ाएं ताकि पशु जुगाली करे और लार बने।
  3. झागदार अफारे में 50-100 मिली वनस्पति तेल या अफारा रोधी दवा (जैसे टिम्पोल) पिलाएं।`;
    }
    return `### PashuPoshan AI - Rumen Acidosis (SARA) & Bloat Management
- **Primary Cause**: Feeding excessive grains/concentrates without adequate effective fiber (bhusa/fodder).
- **Corrective Protocol**:
  1. Drench with **Sodium Bicarbonate (meetha soda)**: 60–100g in 500ml water to buffer rumen pH back above 6.0.
  2. Increase long-stem dry roughage (wheat/paddy straw cut to >3 cm) to stimulate cud-chewing and natural saliva bicarbonate flow.
  3. For frothy bloat, administer 50–100 ml vegetable oil or bloat remedy (e.g., Tympol/Bloatosil) as oral drench.`;
  }

  if (q.includes('bhusa') || q.includes('fodder') || q.includes('ration') || q.includes('दूध') || q.includes('milk') || q.includes('चारा')) {
    if (isHindi) {
      return `### पशु-पोषण AI - दुधारू पशुओं के दैनिक आहार का सामान्य नियम
- **शुष्क पदार्थ (ड्राई मैटर)**: पशु के 100 किग्रा शरीर भार पर 2.5-3.0 किग्रा (जैसे 400 किग्रा गाय के लिए 10-12 किग्रा शुष्क पदार्थ)।
- **आहार का अनुपात**:
  - **हरा चारा**: 15–20 किग्रा दैनिक (विटामिन व पाचक प्रोटीन हेतु)।
  - **सूखा भूसा**: 4–6 किग्रा दैनिक (जुगाली और रेशे हेतु)।
  - **दाना मिश्रण**: शरीर निर्वाह हेतु 1.5 किग्रा + प्रति 2.5 लीटर दूध उत्पादन पर 1 किग्रा अतिरिक्त।
  - **खनिज मिश्रण**: 50 ग्राम दैनिक + 30 ग्राम सादा नमक।`;
    }
    return `### PashuPoshan AI - Daily Dairy Feeding Rule-of-Thumb
- **Dry Matter Intake (DMI)**: 2.5–3.0 kg per 100 kg body weight (e.g. 10–12 kg DM for a 400 kg cow).
- **Portion Ratio**:
  - **Green Fodder**: 15–20 kg daily (succulent vitamins & crude protein).
  - **Dry Bhusa**: 4–6 kg daily (effective fiber for rumination).
  - **Compound Feed**: 1.5 kg for body maintenance + 1 kg for every 2.5 L milk produced.
  - **Mineral Mixture**: 50g daily + 30g common salt.`;
  }

  if (isHindi) {
    return `### पशु-पोषण AI पशु चिकित्सा मार्गदर्शन (मानक दिशा-निर्देश)
पशु पोषण और चारे की गुणवत्ता संबंधी प्रश्न पूछने के लिए धन्यवाद।
- ध्यान रखें कि दाना मिश्रण BIS IS:2052 मानकों के अनुसार हो (उच्च दूध उत्पादन के लिए न्यूनतम 20% क्रूड प्रोटीन)।
- साइलेज में सड़े मक्खन जैसी बदबू या कालेपन की नियमित जांच करें।
- अपने जिले में आपातकालीन पशु चिकित्सा सहायता के लिए 1962 डायल करें।`;
  }

  return `### PashuPoshan AI Veterinary Guidance (Standard Guidelines)
Thank you for your query regarding cattle nutrition and feed health.
- Ensure all compound feed complies with BIS IS:2052 standards (minimum 20% crude protein for high-yield dairy).
- Inspect silage pits regularly for foul butyric odors (rancid butter smell) or dark discoloration.
- For emergency veterinary assistance in your district, dial 1962.`;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Rate Limiting (20 requests/hour per IP)
  const clientIp = getClientIp(req);
  const isAllowed = await checkRateLimit(clientIp);
  if (!isAllowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please try again later.',
    });
  }

  try {
    let body: VeterinaryExpertRequest = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Something went wrong. Please try again.' });
      }
    }

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Something went wrong. Please try again.' });
    }

    const apiKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY_01 || process.env.NVIDIA_KEY;
    const model = process.env.NVIDIA_MODEL_ID || DEFAULT_NVIDIA_MODEL;

    // Fallback if NVIDIA API key is not yet configured in environment
    if (!apiKey) {
      console.warn('NVIDIA_API_KEY is not configured on the server; using deterministic ICAR fallback.');
      const fallbackResponse = generateOfflineVeterinaryFallback(body);
      return res.status(200).json({
        advice: fallbackResponse,
        model: 'icar-ndri-offline-fallback',
        isFallback: true,
        disclaimer: 'Advisory derived from ICAR-NDRI standards (NVIDIA API key not set in server environment).',
      });
    }

    const messages = buildPromptForRequest(body);

    const callNvidia = async (targetModel: string, timeoutMs: number) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: targetModel,
            messages,
            temperature: 0.25,
            max_tokens: 500,
            top_p: 0.9,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    let upstreamResponse: any = null;
    let activeModel = model;

    try {
      upstreamResponse = await callNvidia(model, 25000);
      if (!upstreamResponse.ok && model !== DEFAULT_NVIDIA_MODEL) {
        console.warn(`Primary model ${model} failed (${upstreamResponse.status}), failing over to ${DEFAULT_NVIDIA_MODEL}...`);
        upstreamResponse = await callNvidia(DEFAULT_NVIDIA_MODEL, 20000);
        activeModel = DEFAULT_NVIDIA_MODEL;
      }
    } catch (primaryErr) {
      if (model !== DEFAULT_NVIDIA_MODEL) {
        console.warn(`Primary model ${model} timed out or failed, failing over to ${DEFAULT_NVIDIA_MODEL}...`);
        try {
          upstreamResponse = await callNvidia(DEFAULT_NVIDIA_MODEL, 20000);
          activeModel = DEFAULT_NVIDIA_MODEL;
        } catch (fallbackErr) {
          // both failed
        }
      }
    }

    if (upstreamResponse && upstreamResponse.ok) {
      const completionData = await upstreamResponse.json();
      let answer = completionData.choices?.[0]?.message?.content;

      // In Nemotron-3 reasoning models, answer might be in content or reasoning_content
      if (!answer && completionData.choices?.[0]?.message?.reasoning_content) {
        answer = completionData.choices?.[0]?.message?.reasoning_content;
      }

      // If answer leaked internal monologue preamble, strip it to start at the actual response
      if (typeof answer === 'string') {
        const trimmed = answer.trim();
        if (trimmed.startsWith('Okay, the user') || trimmed.startsWith("Here's a thinking process")) {
          const parts = trimmed.split('\n\n');
          if (parts.length > 1) {
            answer = parts.slice(1).join('\n\n').trim();
          }
        }
      }

      if (answer && typeof answer === 'string' && answer.trim()) {
        const text = answer.trim();
        return res.status(200).json({
          advice: text,
          review: text,
          reply: text,
          model: activeModel,
          isFallback: false,
          usage: completionData.usage,
          disclaimer: 'Grounded in ICAR-NDRI scientific veterinary nutrition benchmarks powered by NVIDIA Nemotron-3.',
        });
      }
    }

    const fallbackResponse = generateOfflineVeterinaryFallback(body);
    return res.status(200).json({
      advice: fallbackResponse,
      review: fallbackResponse,
      reply: fallbackResponse,
      model: 'icar-ndri-resilient-fallback',
      isFallback: true,
      disclaimer: 'Advisory generated via ICAR-NDRI fallback following upstream connection timeout.',
    });
  } catch (error: any) {
    console.error('Veterinary Expert Handler Exception:', error);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
    });
  }
}
