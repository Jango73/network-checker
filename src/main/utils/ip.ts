/**
 * Check if an IP address is valid (IPv4 or IPv6), ignoring interface suffixes.
 * @param ip IP address to validate.
 * @returns True if the IP is valid, false otherwise.
 */
export const isValidIP = (ip: string): boolean => {
  // Remove interface suffix (e.g., %17) for IPv6
  const cleanIP = ip.replace(/%\d+$/, '');
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex =
    /^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)$/;
  return ipv4Regex.test(cleanIP) || ipv6Regex.test(cleanIP);
};

/**
 * Check if an IP is local or private.
 * @param ip IP address to check.
 * @returns True if local/private, false otherwise.
 */
export const isLocalIP = (ip: string): boolean => {
  // Remove interface suffix for IPv6
  const cleanIP = ip.replace(/%\d+$/, '');
  return (
    cleanIP.startsWith('10.') ||
    cleanIP.startsWith('192.168.') ||
    cleanIP.startsWith('127.') ||
    cleanIP === '0.0.0.0' ||
    cleanIP === '::1' ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIP) ||
    cleanIP.includes('::')
  );
};
