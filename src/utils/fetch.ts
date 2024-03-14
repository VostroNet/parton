import fetch, { RequestInit } from "node-fetch";
export async function fetchWithTimeout(url: any, init?: RequestInit & {timeout?: number}) {
  const { timeout = 15000 } = init;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    ...init,
    signal: controller.signal  
  });
  clearTimeout(id);

  return response;
}
