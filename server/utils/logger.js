
export function log(message, ...optionalParams) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...optionalParams);
}

