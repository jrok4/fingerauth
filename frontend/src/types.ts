export interface BanInfo {
  reason: string;
  expires: string | null;
  bannedAt: string;
}

export type AuthData = {
  message?: string;
  error?: string;
  score?: number;
  verdict?: string;
  reasons?: string[];
  username?: string;
  ban?: BanInfo;
  fingerprint?: {
    ja3?: string;
    ja4?: string;
    peet_print?: string;
    user_agent?: string;
    ip?: string;
  };
  ip_info?: {
    ip?: string;
    city?: string;
    region?: string;
    country_name?: string;
    continent_name?: string;
    time_zone?: {
      name?: string;
      abbr?: string;
      offset?: string;
      is_dst?: boolean;
      current_time?: string;
    };
    threat?: {
      is_tor?: boolean;
      is_vpn?: boolean;
      is_icloud_relay?: boolean;
      is_proxy?: boolean;
      is_datacenter?: boolean;
      is_anonymous?: boolean;
      is_known_attacker?: boolean;
      is_known_abuser?: boolean;
      is_threat?: boolean;
      is_bogon?: boolean;
      blocklists?: string[];
    };
    [key: string]: unknown;
  };
};

export type PageType = "login" | "register" | "dashboard" | "banned";