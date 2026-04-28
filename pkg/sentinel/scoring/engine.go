package scoring

import (
	"fmt"
	"strconv"
	"strings"

	"fingerauth/pkg/sentinel/ipdata"
	"fingerauth/pkg/sentinel/js_fingerprint"
	"fingerauth/pkg/store"
)

type Result struct {
	Score   int      `json:"score"`
	Verdict string   `json:"verdict"`
	Reasons []string `json:"reasons"`
}

type Engine struct{}

func NewEngine() *Engine {
	return &Engine{}
}

func (e *Engine) Evaluate(known []store.Fingerprint, current store.Fingerprint, ipInfo ipdata.IPInfo) Result {
	score := 100
	var reasons []string

	client := current.Client

	// ── Automation detection ────────────────────────────────────────
	if client != nil && client.Automation != nil &&
		client.Automation.IsAutomated != nil && *client.Automation.IsAutomated {
		score -= 25
		reasons = append(reasons, "automation detected: "+strings.Join(client.Automation.Signals, ", "))
	}

	// ── Self-consistency checks ─────────────────────────────────────
	if client != nil && client.Consistency != nil {
		c := client.Consistency
		if c.EngineMatchesUA != nil && !*c.EngineMatchesUA {
			score -= 5
			reasons = append(reasons, "engine does not match user agent")
		}
		if c.TimezoneMatchesOffset != nil && !*c.TimezoneMatchesOffset {
			score -= 5
			reasons = append(reasons, "timezone does not match offset")
		}
		if c.PluginsMatchEngine != nil && !*c.PluginsMatchEngine {
			score -= 5
			reasons = append(reasons, "plugins do not match engine")
		}
		if c.WebGLMatchesPlatform != nil && !*c.WebGLMatchesPlatform {
			score -= 5
			reasons = append(reasons, "WebGL does not match platform")
		}
	}

	// ── Cross-layer checks ──────────────────────────────────────────
	// JS timezone name vs IP timezone name
	if client != nil && client.Timezone != nil && ipInfo.TimeZone.Name != "" {
		if *client.Timezone != ipInfo.TimeZone.Name {
			score -= 5
			reasons = append(reasons, "JS timezone name ("+*client.Timezone+") does not match IP timezone name ("+ipInfo.TimeZone.Name+")")
		}
	}

	// JS timezone offset vs IP timezone offset
	if client != nil && client.TimezoneOffset != nil && ipInfo.TimeZone.Offset != "" {
		jsMinutes := jsOffsetToUTCMinutes(*client.TimezoneOffset)
		ipMinutes, err := ipOffsetToMinutes(ipInfo.TimeZone.Offset)
		if err == nil && jsMinutes != ipMinutes {
			score -= 10
			reasons = append(reasons, fmt.Sprintf(
				"JS UTC offset (%+d min) does not match IP UTC offset (%+d min, %s)",
				jsMinutes, ipMinutes, ipInfo.TimeZone.Offset,
			))
		}
	}

	// JS user agent vs HTTP user agent
	if client != nil && client.UserAgent != nil && current.UserAgent != "" {
		if *client.UserAgent != current.UserAgent {
			score -= 10
			reasons = append(reasons, "JS user agent does not match HTTP user agent")
		}
	}

	// ── Known fingerprint comparison (returning users) ──────────────
	if len(known) > 0 {
		// TLS fingerprints
		if !anyMatch(known, func(fp store.Fingerprint) bool { return fp.JA3 == current.JA3 }) {
			score -= 10
			reasons = append(reasons, "JA3 fingerprint not seen before")
		}
		if !anyMatch(known, func(fp store.Fingerprint) bool { return fp.JA4 == current.JA4 }) {
			score -= 15
			reasons = append(reasons, "JA4 fingerprint not seen before")
		}
		if !anyMatch(known, func(fp store.Fingerprint) bool { return fp.PeetPrint == current.PeetPrint }) {
			score -= 5
			reasons = append(reasons, "PeetPrint not seen before")
		}

		// Client fingerprint hash
		if client != nil && client.Hash != nil {
			if !anyMatchClient(known, func(c *js_fingerprint.ClientFingerprint) bool {
				return c.Hash != nil && *c.Hash == *client.Hash
			}) {
				score -= 10
				reasons = append(reasons, "client fingerprint hash not seen before")

				if client.CanvasHash != nil && !anyMatchClient(known, func(c *js_fingerprint.ClientFingerprint) bool {
					return c.CanvasHash != nil && *c.CanvasHash == *client.CanvasHash
				}) {
					score -= 5
					reasons = append(reasons, "canvas hash not seen before")
				}

				if client.AudioHash != nil && !anyMatchClient(known, func(c *js_fingerprint.ClientFingerprint) bool {
					return c.AudioHash != nil && *c.AudioHash == *client.AudioHash
				}) {
					score -= 3
					reasons = append(reasons, "audio hash not seen before")
				}

				if client.MathHash != nil && !anyMatchClient(known, func(c *js_fingerprint.ClientFingerprint) bool {
					return c.MathHash != nil && *c.MathHash == *client.MathHash
				}) {
					score -= 3
					reasons = append(reasons, "math hash not seen before")
				}

				if client.WebGL != nil && client.WebGL.UnmaskedRenderer != nil {
					if !anyMatchClient(known, func(c *js_fingerprint.ClientFingerprint) bool {
						return c.WebGL != nil && c.WebGL.UnmaskedRenderer != nil &&
							*c.WebGL.UnmaskedRenderer == *client.WebGL.UnmaskedRenderer
					}) {
						score -= 5
						reasons = append(reasons, "WebGL renderer not seen before")
					}
				}

				if client.Platform != nil && !anyMatchClient(known, func(c *js_fingerprint.ClientFingerprint) bool {
					return c.Platform != nil && *c.Platform == *client.Platform
				}) {
					score -= 5
					reasons = append(reasons, "platform changed")
				}

				if client.Screen != nil && client.Screen.Width != nil && client.Screen.Height != nil {
					if !anyMatchClient(known, func(c *js_fingerprint.ClientFingerprint) bool {
						return c.Screen != nil && c.Screen.Width != nil && c.Screen.Height != nil &&
							*c.Screen.Width == *client.Screen.Width &&
							*c.Screen.Height == *client.Screen.Height
					}) {
						score -= 3
						reasons = append(reasons, "screen resolution not seen before")
					}
				}
			}
		}
	}

	// ── Clamp & verdict ─────────────────────────────────────────────
	if score < 0 {
		score = 0
	}

	verdict := "allow"
	if score < 50 {
		verdict = "ban"
	}

	return Result{
		Score:   score,
		Verdict: verdict,
		Reasons: reasons,
	}
}

// jsOffsetToUTCMinutes converts the JS Date.getTimezoneOffset() value to
// a UTC offset in minutes. JS returns the inverse: UTC+3 → -180, so we negate.
func jsOffsetToUTCMinutes(jsOffset int) int {
	return -jsOffset
}

// ipOffsetToMinutes parses an ipdata-style offset string like "+0300" or "-0530"
// into a signed number of minutes from UTC.
func ipOffsetToMinutes(offset string) (int, error) {
	offset = strings.TrimSpace(offset)
	if len(offset) != 5 {
		return 0, fmt.Errorf("unexpected offset format: %s", offset)
	}

	sign := 1
	switch offset[0] {
	case '+':
		sign = 1
	case '-':
		sign = -1
	default:
		return 0, fmt.Errorf("unexpected offset sign: %c", offset[0])
	}

	hours, err := strconv.Atoi(offset[1:3])
	if err != nil {
		return 0, fmt.Errorf("bad hours in offset %s: %w", offset, err)
	}
	minutes, err := strconv.Atoi(offset[3:5])
	if err != nil {
		return 0, fmt.Errorf("bad minutes in offset %s: %w", offset, err)
	}

	return sign * (hours*60 + minutes), nil
}

func anyMatch(fps []store.Fingerprint, pred func(store.Fingerprint) bool) bool {
	for _, fp := range fps {
		if pred(fp) {
			return true
		}
	}
	return false
}

func anyMatchClient(fps []store.Fingerprint, pred func(*js_fingerprint.ClientFingerprint) bool) bool {
	for _, fp := range fps {
		if fp.Client != nil && pred(fp.Client) {
			return true
		}
	}
	return false
}