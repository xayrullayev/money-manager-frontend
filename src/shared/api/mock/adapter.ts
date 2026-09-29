/**
 * Mock axios adapter (Frontend-check-01).
 *
 * `apiClient.defaults.adapter` shu funksiyaga almashtirilganda hech qanday tarmoq
 * so'rovi ketmaydi — so'rov `handlers.ts` route jadvaliga yo'naltiriladi va
 * kontraktga mos javob (yoki Problem Details xato) qaytadi. Shu bilan axios
 * interceptorlari, `ApiError` mapping va butun UI oqimi real backenddagidek
 * ishlaydi.
 */
import { AxiosError, AxiosHeaders } from "axios";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { env } from "../env";
import { dispatch, MockHttpError } from "./handlers";

/** Mock javob kechikishi (ms) — loading holatlari ko'rinishi uchun kichik latency. */
const LATENCY_MS = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeHeaders(config: InternalAxiosRequestConfig): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = config.headers ?? {};
  Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => {
    if (value != null && typeof value !== "object") out[key.toLowerCase()] = String(value);
  });
  return out;
}

function pathFromUrl(config: InternalAxiosRequestConfig): string {
  const url = config.url ?? "";
  // baseURL prefiksini (masalan "/api/v1") olib tashlaymiz — handlerlar undan keyingi yo'lni kutadi.
  const base = config.baseURL ?? env.apiBaseUrl;
  let path = url;
  try {
    const parsed = new URL(url, base);
    const basePath = new URL(base, "http://mock").pathname.replace(/\/$/, "");
    path = parsed.pathname.startsWith(basePath) ? parsed.pathname.slice(basePath.length) : parsed.pathname;
  } catch {
    const marker = base.replace(/^https?:\/\/[^/]+/, "");
    path = url.startsWith(marker) ? url.slice(marker.length) : url;
  }
  return path || "/";
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await delay(LATENCY_MS);
  const method = (config.method ?? "get").toUpperCase();
  const path = pathFromUrl(config);
  const query = (config.params as Record<string, unknown>) ?? {};
  const headers = normalizeHeaders(config);

  const respond = (status: number, data: unknown): AxiosResponse => {
    const responseHeaders = new AxiosHeaders();
    let payload: unknown = data;
    if (config.responseType === "blob") {
      const isCsv = typeof data === "string";
      responseHeaders.set("content-type", isCsv ? "text/csv;charset=utf-8" : "application/json");
      payload = new Blob([isCsv ? (data as string) : JSON.stringify(data)], {
        type: isCsv ? "text/csv;charset=utf-8" : "application/json",
      });
    } else {
      responseHeaders.set("content-type", "application/json");
    }
    return {
      data: payload,
      status,
      statusText: status === 204 ? "No Content" : "OK",
      headers: responseHeaders,
      config,
      request: {},
    };
  };

  try {
    const result = await dispatch(method, path, query, config.data, headers);
    const response = respond(result.status, result.data);
    const validate = config.validateStatus;
    if (validate && !validate(response.status)) {
      throw new AxiosError(`Request failed with status code ${response.status}`, AxiosError.ERR_BAD_RESPONSE, config, response.request, response);
    }
    return response;
  } catch (error) {
    if (error instanceof MockHttpError) {
      const problem = {
        status: error.status,
        code: error.code,
        detail: error.message,
        fieldErrors: error.fieldErrors,
      };
      const response = respond(error.status, config.responseType === "blob" ? problem : problem);
      // Blob rejimida (CSV eksport) xatoni ham Blob sifatida qaytaramiz — chaqiruvchi `.text()` bilan o'qiydi.
      if (config.responseType === "blob") {
        response.data = new Blob([JSON.stringify(problem)], { type: "application/json" });
      }
      const validate = config.validateStatus;
      if (validate && !validate(response.status)) {
        throw new AxiosError(error.message, AxiosError.ERR_BAD_RESPONSE, config, response.request, response);
      }
      return response;
    }
    throw error;
  }
};
