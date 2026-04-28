package js_fingerprint

func (fp *ClientFingerprint) IsValid() bool {
	if fp == nil {
		return false
	}
	return fp.Engine != nil &&
		fp.UserAgent != nil &&
		fp.Platform != nil &&
		fp.Language != nil &&
		len(fp.Languages) > 0 &&
		fp.CookieEnabled != nil &&
		fp.HardwareConcurrency != nil &&
		// fp.DeviceMemory != nil && Safari somehow dont give it =)
		fp.MaxTouchPoints != nil &&
		fp.Screen.IsValid() &&
		fp.Timezone != nil &&
		fp.TimezoneOffset != nil &&
		fp.CanvasHash != nil &&
		fp.WebGL.IsValid() &&
		fp.AudioHash != nil &&
		fp.Automation.IsValid() &&
		fp.MathHash != nil &&
		// fp.Connection.IsValid() && Safari somehow dont give it =)
		fp.Storage.IsValid() &&
		fp.Consistency.IsValid() &&
		fp.Hash != nil
}

func (s *FPScreen) IsValid() bool {
	if s == nil {
		return false
	}
	return s.Width != nil &&
		s.Height != nil &&
		s.AvailWidth != nil &&
		s.AvailHeight != nil &&
		s.ColorDepth != nil &&
		s.PixelRatio != nil &&
		s.Orientation != nil
}

func (w *FPWebGL) IsValid() bool {
	if w == nil {
		return false
	}
	return w.Vendor != nil &&
		w.Renderer != nil &&
		w.Version != nil &&
		w.ShadingLanguageVersion != nil
}

func (a *FPAutomation) IsValid() bool {
	if a == nil {
		return false
	}
	return a.IsAutomated != nil
}

func (c *FPConnection) IsValid() bool {
	if c == nil {
		return false
	}
	return c.EffectiveType != nil &&
		c.RTT != nil
}

func (s *FPStorage) IsValid() bool {
	if s == nil {
		return false
	}
	return s.LocalStorage != nil &&
		s.SessionStorage != nil &&
		s.IndexedDB != nil
}

func (c *FPConsistency) IsValid() bool {
	if c == nil {
		return false
	}
	return c.EngineMatchesUA != nil &&
		c.TimezoneMatchesOffset != nil &&
		c.PluginsMatchEngine != nil &&
		c.WebGLMatchesPlatform != nil
}