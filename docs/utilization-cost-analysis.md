# ClinIQ — Utilization & Cost Analysis
### 10-Doctor Scale · 5 Requests/Day · 20 Requests/Week

> **Document Purpose:** Evaluate the technical reliability of the current ClinIQ system at realistic clinical scale, project AI + storage costs across model options, and determine the appropriate Lovable subscription tier.

---

## 1. System Overview

ClinIQ is a AI-assisted clinical diagnostic tool for registered doctors. The core workflow:

1. Doctor logs in (Supabase Auth)
2. Doctor fills patient form (demographic, vitals, symptoms, optional diagnostic image)
3. Request hits `diagnose` edge function → Lovable AI Gateway → Gemini/GPT model
4. Structured diagnosis returned (4–5 sections) with Output + Reasoning per section
5. Doctor reviews, selects items for print, optionally edits selections, prints report
6. Diagnosis saved to `saved_diagnoses` (compressed 48h auto-purge, 15-day retention)

---

## 2. Usage Parameters (Baseline)

| Parameter | Value |
|---|---|
| Doctors | 10 |
| Max requests/doctor/day | 5 |
| Max requests/day (system) | 50 |
| Max requests/week (system) | 350 (5 × 10 × 7) |
| Effective weekly (80% utilization) | ~280 requests/week |
| Effective monthly (80% utilization) | ~1,120 requests/month |
| Days active per week (clinical) | 6 |
| Effective monthly at 6d/week, 80% | ~960 requests/month |

---

## 3. AI Token Estimation Per Request

### Text-Only Request (Pre / Detailed Mode)
| Component | Estimated Tokens |
|---|---|
| System prompt | ~1,800 tokens |
| User prompt (patient data) | ~600–900 tokens |
| Total Input | **~2,400–2,700 tokens** |
| AI Response (detailed) | ~2,500–4,000 tokens |
| AI Response (pre/quick) | ~1,000–1,500 tokens |
| **Total per detailed request** | **~5,000–6,700 tokens** |
| **Total per pre request** | **~3,400–4,200 tokens** |

### Vision Request (Image Upload — Detailed/Research Mode)
| Component | Estimated Tokens |
|---|---|
| System prompt | ~1,900 tokens |
| User prompt | ~700 tokens |
| Image (800px JPEG, ~100KB) | ~1,200–2,000 vision tokens |
| AI Response (with IMAGE ANALYSIS section) | ~3,500–5,000 tokens |
| **Total per vision request** | **~7,300–9,600 tokens** |

### Blended Average (60% detailed, 20% pre, 20% vision)
```
Blended avg input  = (0.6 × 2,550) + (0.2 × 2,000) + (0.2 × 2,800) = ~2,490 tokens
Blended avg output = (0.6 × 3,200) + (0.2 × 1,200) + (0.2 × 4,200) = ~2,960 tokens
Blended total      ≈ 5,450 tokens/request
```

---

## 4. Cost Analysis — Case Studies

> **Note on Lovable AI Gateway pricing:** The Lovable AI Gateway abstracts model costs. Costs below reflect **pass-through model pricing** as billed by the gateway. All prices in USD.

---

### Case Study A — Google Gemini 2.5 Flash *(Current Model)*

**Pricing:** ~$0.075/1M input tokens · ~$0.30/1M output tokens

| Metric | Calculation | Value |
|---|---|---|
| Monthly requests (80% util, 6d/wk) | 10 × 5 × 6 × 4.3 × 0.8 | ~1,032 req |
| Avg input tokens/req | 2,490 | 2,490 |
| Avg output tokens/req | 2,960 | 2,960 |
| Monthly input tokens | 1,032 × 2,490 | ~2.57M |
| Monthly output tokens | 1,032 × 2,960 | ~3.05M |
| Input cost | 2.57 × $0.075 | **$0.19** |
| Output cost | 3.05 × $0.30 | **$0.92** |
| **Total monthly AI cost** | | **~$1.11/month** |
| **Annual AI cost** | | **~$13.30/year** |

**Vision uplift (20% of requests):**
- Extra image tokens: ~1,600 avg × 206 vision requests × $0.075/1M = **$0.025/month**
- Negligible at this scale.

**✅ Verdict: Extremely cost-efficient. Gemini 2.5 Flash is ideal for this scale.**

---

### Case Study B — Google Gemini 2.5 Pro

**Pricing:** ~$1.25/1M input tokens · ~$5.00/1M output tokens (≤200K tokens/min tier)

| Metric | Value |
|---|---|
| Monthly input tokens | ~2.57M |
| Monthly output tokens | ~3.05M |
| Input cost | 2.57 × $1.25 = **$3.21** |
| Output cost | 3.05 × $5.00 = **$15.25** |
| **Total monthly AI cost** | **~$18.46/month** |
| **Annual AI cost** | **~$221.52/year** |

**Benefit over Flash:** Higher reasoning quality, better complex differential generation, more reliable formatting compliance in research mode.

**⚠️ Verdict: 17× more expensive than Flash. Justifiable only if Flash shows consistent quality issues in research mode. Consider a hybrid — Flash for pre/detailed, Pro for research only.**

**Hybrid model cost estimate (Flash for 80%, Pro for 20% research):**
```
= $1.11 × 0.8 + $18.46 × 0.2 = $0.89 + $3.69 = ~$4.58/month
```

---

### Case Study C — OpenAI GPT-5 (gpt-5)

**Pricing (estimated):** ~$2.50/1M input · ~$10.00/1M output (projected, based on GPT-4o pricing trend)

| Metric | Value |
|---|---|
| Monthly input tokens | ~2.57M |
| Monthly output tokens | ~3.05M |
| Input cost | 2.57 × $2.50 = **$6.43** |
| Output cost | 3.05 × $10.00 = **$30.50** |
| **Total monthly AI cost** | **~$36.93/month** |
| **Annual AI cost** | **~$443.16/year** |

**Benefit:** GPT-5 excels at clinical reasoning, nuanced drug interaction checks, and structured output adherence. Excellent for medico-legal level documentation.

**⚠️ Verdict: 33× more expensive than Flash. Viable for premium/specialist tier if charging doctors, but not economical for a free/internal tool at this scale.**

---

### Cost Summary Comparison

| Model | Monthly Cost | Annual Cost | Relative Cost |
|---|---|---|---|
| **Gemini 2.5 Flash** (current) | **~$1.11** | **~$13** | 1× (baseline) |
| Gemini Flash + Pro hybrid | ~$4.58 | ~$55 | 4× |
| Gemini 2.5 Pro (all) | ~$18.46 | ~$221 | 17× |
| GPT-5 (all) | ~$36.93 | ~$443 | 33× |

---

## 5. Storage Cost Analysis

### Lovable Cloud (Supabase) Storage

**Current schema footprint per saved diagnosis:**

| Field | Approx Size |
|---|---|
| `patient_summary` (JSON, compressed) | ~200–350 bytes |
| `diagnosis_data` (JSON, top 2 items each section) | ~500–800 bytes |
| `doctor_config` (JSON) | ~100–150 bytes |
| `token_id`, `diagnosis_mode` | ~30 bytes |
| Row overhead (UUID, timestamps) | ~100 bytes |
| **Total per row** | **~950–1,430 bytes (~1.2 KB avg)** |

**Image data: NOT persisted** (sent inline to AI only, no storage bucket used).

**Monthly storage growth:**
```
1,032 req/month × 1.2 KB = ~1.24 MB/month (new data)
15-day retention → rolling ~2.5 MB active at any time
```

**Supabase free tier database storage: 500 MB**
At this scale, the system will use <1% of free tier storage indefinitely.

**Database rows:**
- `saved_diagnoses`: ~1,032 new/month, ~2,064 active (15-day window)
- `daily_request_counts`: 10 rows/day, 300/month, auto-obsolete
- `doctor_profiles`: 10 rows (static)
- `diagnosis_shares`: Occasional, negligible

**✅ Storage cost: $0 at this scale (well within free tier)**

---

## 6. Lovable Subscription Tier Evaluation

### Current Scale Requirements

| Requirement | Specification |
|---|---|
| Active users | 10 doctors |
| Edge function invocations | ~1,032/month |
| Database rows | <5,000 active |
| Storage | <10 MB |
| Auth (email/password) | ✅ included |
| Edge functions | 1 active function (`diagnose`) |
| Realtime | Not used |
| AI Gateway | ~$1–5/month (usage-based) |

### Lovable Plan Assessment

#### Free Plan
- **5 daily credits** (messages to Lovable AI for development)
- **Lovable Cloud:** Included with free usage limits
- **Supabase limits (free project):** 500MB DB, 1GB storage, 50K monthly active users, 500K edge function invocations/month
- **AI Gateway:** Usage-based billing on top
- **❌ Constraint:** 30 messages/month cap on Free plan makes ongoing development impractical

#### Pro Plan (~$25/month)
- **100+ credits/month** for development
- All Lovable Cloud features
- Custom domains
- Full access to edge functions, storage, auth
- **✅ Sufficient** for 10-doctor scale at current usage
- **Recommended for:** Active development + deployment

#### Business Plan
- Team collaboration (multiple developers)
- SSO, granular roles
- Higher credit limits
- **Needed if:** Multiple developers building the tool simultaneously, or clinic wants admin dashboard oversight

### Recommendation

| Scenario | Recommended Plan |
|---|---|
| Solo developer, live tool | **Pro (~$25/month)** |
| Team of 2–3 developers | **Business** |
| Scale to 50+ doctors | **Business + Cloud instance upgrade** |

**Total projected monthly cost at current scale (Pro plan):**
```
Lovable Pro:     $25.00/month
AI Gateway:       $1.11/month (Gemini 2.5 Flash)
Storage/DB:       $0.00/month (free tier)
─────────────────────────────
Total:           ~$26.11/month
```

---

## 7. System Reliability Assessment

### Rate Limiting (Newly Implemented)
- ✅ Atomic DB-level check via `check_and_increment_daily_request()` with `FOR UPDATE` row lock
- ✅ IST-aware daily reset via `Asia/Kolkata` timezone in PostgreSQL
- ✅ Enforced at edge function level before AI call (no wasted credits on over-limit attempts)
- ✅ Dashboard display showing remaining requests + reset time

### Diagnosis Pipeline
- ✅ Edge function with proper CORS, auth validation, error handling
- ✅ Structured prompt with section enforcement (prevents hallucinated formats)
- ✅ Graceful degradation (429, 402, 401 handled distinctly)
- ✅ Image vision via Gemini 2.5 Flash (multimodal, base64 inline)

### Data Privacy
- ✅ Patient images NOT persisted (inline-only to AI)
- ✅ Patient data compressed to summary before DB insert
- ✅ 15-day auto-purge via `purge_old_diagnoses()`
- ✅ RLS on all tables (user-scoped access only)
- ✅ SECURITY DEFINER functions prevent RLS bypass

### Scalability Headroom
| Component | Current | Free Tier Limit | Buffer |
|---|---|---|---|
| Edge function calls | ~1,032/month | 500,000/month | 484× |
| DB rows | ~2,500 active | ~millions | Massive |
| Storage | ~3 MB | 500 MB | 166× |
| Auth MAU | 10 | 50,000 | 5,000× |

**The current architecture can support 484× the current AI call volume before hitting infrastructure limits.** The practical constraint is AI cost, not infrastructure.

---

## 8. Scaling Beyond 10 Doctors

### 50 Doctors (5 req/day, 6d/week)

```
Monthly requests: 50 × 5 × 6 × 4.3 × 0.8 = ~5,160 req/month
AI cost (Gemini Flash): ~$5.55/month
Storage growth: ~6.2 MB/month (still free tier)
```

### 100 Doctors

```
Monthly requests: ~10,320 req/month
AI cost (Gemini Flash): ~$11.10/month
DB rows active: ~20,640 (15-day window, still negligible)
Infrastructure: Still within free Supabase limits
```

**At 100 doctors, total monthly cost stays under $40 (Pro + AI).**

---

## 9. Recommendations

1. **Keep Gemini 2.5 Flash as default** — optimal cost/quality ratio at this scale
2. **Consider Flash + Pro hybrid** for research mode only if output quality is insufficient (~$4.58/month)
3. **Pro plan is the right tier** for solo development + live deployment
4. **No infrastructure upgrades needed** until 500+ doctors (at which point move to paid Supabase instance)
5. **Rate limiting at 5/day is sustainable** — at 100% utilization across 10 doctors, monthly AI cost stays under $2
6. **Image analysis feature adds ~15–20% token overhead** — negligible at this scale

---

*Document generated: March 2026 | ClinIQ v1.0 | 10-Doctor Scale Analysis*
