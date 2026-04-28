package ipdata

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"fingerauth/pkg/fifocache"
)

type IPInfo struct {
	IP            string      `json:"ip"`
	City          string      `json:"city"`
	Region        string      `json:"region"`
	Country       string      `json:"country_name"`
	ContinentName string      `json:"continent_name"`
	TimeZone      TimeZone    `json:"time_zone"`
	Threat        Threat      `json:"threat"`
}

type TimeZone struct {
	Name        string `json:"name"`
	Offset      string `json:"offset"`
}

type Threat struct {
	IsTor           bool        `json:"is_tor"`
	IsVPN           bool        `json:"is_vpn"`
	IsICloudRelay   bool        `json:"is_icloud_relay"`
	IsProxy         bool        `json:"is_proxy"`
	IsDatacenter    bool        `json:"is_datacenter"`
	IsAnonymous     bool        `json:"is_anonymous"`
	IsKnownAttacker bool        `json:"is_known_attacker"`
	IsKnownAbuser   bool        `json:"is_known_abuser"`
	IsThreat        bool        `json:"is_threat"`
	IsBogon         bool        `json:"is_bogon"`
	Blocklists      []Blocklist `json:"blocklists"`
	Scores          *Scores     `json:"scores,omitempty"`
}

type Blocklist struct {
	Name string `json:"name"`
	Site string `json:"site"`
	Type string `json:"type"`
}

type Scores struct {
	VPNScore    int `json:"vpn_score"`
	ProxyScore  int `json:"proxy_score"`
	ThreatScore int `json:"threat_score"`
	TrustScore  int `json:"trust_score"`
}

type Client struct {
	apiKey     string
	httpClient *http.Client
	cache      *fifocache.Cache[string, IPInfo]
}

func NewClient(apiKey string, cacheSize uint) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
		cache: fifocache.New[string, IPInfo](cacheSize),
	}
}

func (c *Client) Lookup(ip string) (IPInfo, error) {
	if info, ok := c.cache.Get(ip); ok {
		return info, nil
	}

	url := fmt.Sprintf("https://api.ipdata.co/%s?api-key=%s", ip, c.apiKey)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return IPInfo{}, fmt.Errorf("ipdata request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return IPInfo{}, fmt.Errorf("ipdata returned status %d", resp.StatusCode)
	}

	var info IPInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return IPInfo{}, fmt.Errorf("ipdata decode failed: %w", err)
	}

	c.cache.Put(ip, info)

	return info, nil
}