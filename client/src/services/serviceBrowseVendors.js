import { apiFetch } from "../utils/apiFetch.js";
import { log } from "../utils/logger.js";   

export async function fetchVendors() {
  return apiFetch("/browseVendors");
 
}