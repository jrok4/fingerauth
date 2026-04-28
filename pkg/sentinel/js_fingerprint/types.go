package js_fingerprint

type ClientFingerprint struct {
	Engine              *string              `json:"engine"`
	UserAgent           *string              `json:"userAgent"`
	Platform            *string              `json:"platform"`
	Language            *string              `json:"language"`
	Languages           []string             `json:"languages"`
	CookieEnabled       *bool                `json:"cookieEnabled"`
	DoNotTrack          *string              `json:"doNotTrack"`
	HardwareConcurrency *int                 `json:"hardwareConcurrency"`
	DeviceMemory        *float64             `json:"deviceMemory"`
	MaxTouchPoints      *int                 `json:"maxTouchPoints"`
	Screen              *FPScreen            `json:"screen"`
	Timezone            *string              `json:"timezone"`
	TimezoneOffset      *int                 `json:"timezoneOffset"`
	CanvasHash          *string              `json:"canvasHash"`
	WebGL               *FPWebGL             `json:"webgl"`
	AudioHash           *string              `json:"audioHash"`
	Automation          *FPAutomation        `json:"automation"`
	Fonts               []string             `json:"fonts"`
	MathHash            *string              `json:"mathHash"`
	Plugins             []string             `json:"plugins"`
	Connection          *FPConnection        `json:"connection"`
	Storage             *FPStorage           `json:"storage"`
	Battery             *string              `json:"battery"`
	Consistency         *FPConsistency       `json:"consistency"`
	Hash                *string              `json:"hash"`
}

type FPScreen struct {
	Width       *int     `json:"width"`
	Height      *int     `json:"height"`
	AvailWidth  *int     `json:"availWidth"`
	AvailHeight *int     `json:"availHeight"`
	ColorDepth  *int     `json:"colorDepth"`
	PixelRatio  *float64 `json:"pixelRatio"`
	Orientation *string  `json:"orientation"`
}

type FPWebGL struct {
	Vendor                 *string  `json:"vendor"`
	Renderer               *string  `json:"renderer"`
	UnmaskedVendor         *string  `json:"unmaskedVendor"`
	UnmaskedRenderer       *string  `json:"unmaskedRenderer"`
	Version                *string  `json:"version"`
	ShadingLanguageVersion *string  `json:"shadingLanguageVersion"`
	Extensions             []string `json:"extensions"`
}

type FPAutomation struct {
	IsAutomated *bool    `json:"isAutomated"`
	Signals     []string `json:"signals"`
}

type FPConnection struct {
	EffectiveType *string  `json:"effectiveType"`
	Downlink      *float64 `json:"downlink"`
	RTT           *int     `json:"rtt"`
	SaveData      *bool    `json:"saveData"`
}

type FPStorage struct {
	LocalStorage   *bool `json:"localStorage"`
	SessionStorage *bool `json:"sessionStorage"`
	IndexedDB      *bool `json:"indexedDB"`
}

type FPConsistency struct {
	EngineMatchesUA      *bool `json:"engineMatchesUA"`
	TimezoneMatchesOffset *bool `json:"timezoneMatchesOffset"`
	PluginsMatchEngine   *bool `json:"pluginsMatchEngine"`
	WebGLMatchesPlatform *bool `json:"webglMatchesPlatform"`
}