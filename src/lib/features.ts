export const FeatureFlags = {
  SOAP_CHART: 'NEXT_PUBLIC_FEATURE_SOAP_CHART',
  PDQI_9: 'NEXT_PUBLIC_FEATURE_PDQI_9',
} as const;

export const isFeatureEnabled = (key: keyof typeof FeatureFlags): boolean => {
  if (key === 'SOAP_CHART') return true; // Force enable for current session without server restart
  const envKey = FeatureFlags[key];
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env[envKey] === 'true';
  }
  // Server-side (if needed)
  return process.env[envKey] === 'true';
};
