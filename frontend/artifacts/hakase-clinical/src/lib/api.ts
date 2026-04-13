const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Trials ───────────────────────────────────────────────────────────────────
export const searchTrials = (params: Record<string, string | number>) =>
  request<any>(`/trials/search?${new URLSearchParams(params as any)}`);

export const getTrial = (nctId: string) =>
  request<any>(`/trials/${nctId}`);

export const getTrialSites = (nctId: string) =>
  request<any>(`/trials/${nctId}/sites`);

// ── Safety ───────────────────────────────────────────────────────────────────
export const getAdverseEvents = (drug: string, limit = 25) =>
  request<any>(`/safety/adverse-events?drug=${encodeURIComponent(drug)}&limit=${limit}`);

export const getDrugLabel = (drug: string) =>
  request<any>(`/safety/drug-label?drug=${encodeURIComponent(drug)}`);

export const getDrugRecalls = (drug: string) =>
  request<any>(`/safety/recalls?drug=${encodeURIComponent(drug)}`);

export const getFaersTimeline = (drug: string, years = 5) =>
  request<any>(`/safety/faers-timeline?drug=${encodeURIComponent(drug)}&years=${years}`);

export const getFullSafetyProfile = (drug: string) =>
  request<any>(`/safety/profile?drug=${encodeURIComponent(drug)}`);

// ── Publications ─────────────────────────────────────────────────────────────
export const searchPublications = (q: string, maxResults = 20, sinceYear?: number) => {
  const params = new URLSearchParams({ q, max_results: String(maxResults) });
  if (sinceYear) params.set("since_year", String(sinceYear));
  return request<any>(`/publications/search?${params}`);
};

export const getEvidenceMap = (condition: string, intervention = "") =>
  request<any>(
    `/publications/evidence-map?condition=${encodeURIComponent(condition)}&intervention=${encodeURIComponent(intervention)}`
  );

export const getAbstract = (pmid: string) =>
  request<any>(`/publications/abstract/${pmid}`);

// ── Compliance ───────────────────────────────────────────────────────────────
export const checkCompliance = (protocol: Record<string, any>) =>
  request<any>("/compliance/check", { method: "POST", body: JSON.stringify(protocol) });

export const checkTrialCompliance = (nctId: string) =>
  request<any>(`/compliance/check/${nctId}`);

export const getRegulations = () =>
  request<any>("/compliance/regulations");

// ── Simulation ───────────────────────────────────────────────────────────────
export const simulateEnrollment = (body: Record<string, any>) =>
  request<any>("/simulation/enrollment", { method: "POST", body: JSON.stringify(body) });

export const simulateProtocolImpact = (body: Record<string, any>) =>
  request<any>("/simulation/protocol-impact", { method: "POST", body: JSON.stringify(body) });

// ── Sites ─────────────────────────────────────────────────────────────────────
export const recommendSites = (condition: string, phase?: string, countries?: string, limit = 30) => {
  const params = new URLSearchParams({ condition, limit: String(limit) });
  if (phase) params.set("phase", phase);
  if (countries) params.set("countries", countries);
  return request<any>(`/sites/recommend?${params}`);
};

// ── KOLs ──────────────────────────────────────────────────────────────────────
export const findKOLs = (condition: string, intervention = "", limit = 20) => {
  const params = new URLSearchParams({ condition, limit: String(limit) });
  if (intervention) params.set("intervention", intervention);
  return request<any>(`/kols/find?${params}`);
};

// ── Protocol ─────────────────────────────────────────────────────────────────
export const analyzeProtocolText = (body: { text: string; condition?: string; phase?: string[] }) =>
  request<any>("/protocol/analyze-text", { method: "POST", body: JSON.stringify(body) });

export const analyzeProtocolUpload = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/protocol/analyze-upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getProtocolStrategies = (condition: string, phase?: string, limit = 30) => {
  const params = new URLSearchParams({ condition, limit: String(limit) });
  if (phase) params.set("phase", phase);
  return request<any>(`/protocol/strategies?${params}`);
};

// ── Data Sources ──────────────────────────────────────────────────────────────
export const getDataSources = () => request<any>("/data-sources");
