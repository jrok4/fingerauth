package peetprint

import (
	"encoding/binary"
	"fmt"
	"io"
	"sort"
	"strings"

	utls "github.com/refraction-networking/utls"
)

var greaseValues = map[uint16]bool{
	0x0a0a: true, 0x1a1a: true, 0x2a2a: true, 0x3a3a: true,
	0x4a4a: true, 0x5a5a: true, 0x6a6a: true, 0x7a7a: true,
	0x8a8a: true, 0x9a9a: true, 0xaaaa: true, 0xbaba: true,
	0xcaca: true, 0xdada: true, 0xeaea: true, 0xfafa: true,
}

type PeetPrintFingerprint struct {
	Ciphers         []uint16
	Extensions      []uint16
	Groups          []uint16
	Versions        []uint16
	SigAlgs         []uint16
	PSKModes        []uint8
	CompAlgs        []uint16
	RecordSizeLimit uint16
	Protocols       []string
	KeyShareGroups  []uint16
}

func (p *PeetPrintFingerprint) UnmarshalBytes(raw []byte) error {
	f := &utls.Fingerprinter{
		AllowBluntMimicry: true,
	}
	spec, err := f.FingerprintClientHello(raw)
	if err != nil {
		return err
	}

	p.Ciphers = spec.CipherSuites

	for _, ext := range spec.Extensions {
		if id, ok := extensionID(ext); ok {
			p.Extensions = append(p.Extensions, id)
		}

		switch e := ext.(type) {
		case *utls.SupportedVersionsExtension:
			for _, v := range e.Versions {
				p.Versions = append(p.Versions, uint16(v))
			}
		case *utls.ALPNExtension:
			p.Protocols = e.AlpnProtocols
		case *utls.SupportedCurvesExtension:
			for _, c := range e.Curves {
				p.Groups = append(p.Groups, uint16(c))
			}
		case *utls.SignatureAlgorithmsExtension:
			for _, s := range e.SupportedSignatureAlgorithms {
				p.SigAlgs = append(p.SigAlgs, uint16(s))
			}
		case *utls.PSKKeyExchangeModesExtension:
			p.PSKModes = e.Modes
		case *utls.UtlsCompressCertExtension:
			for _, a := range e.Algorithms {
				p.CompAlgs = append(p.CompAlgs, uint16(a))
			}
		case *utls.KeyShareExtension:
			for _, ks := range e.KeyShares {
				p.KeyShareGroups = append(p.KeyShareGroups, uint16(ks.Group))
			}
		case *utls.GenericExtension:
			p.parseGenericExtension(e)
		}
	}

	return nil
}

// parseGenericExtension handles extensions that utls didn't parse into a typed struct.
func (p *PeetPrintFingerprint) parseGenericExtension(e *utls.GenericExtension) {
	switch e.Id {
	case 45: // psk_key_exchange_modes
		if len(p.PSKModes) == 0 && len(e.Data) >= 2 {
			count := int(e.Data[0])
			for i := 1; i <= count && i < len(e.Data); i++ {
				p.PSKModes = append(p.PSKModes, e.Data[i])
			}
		}
	case 27: // compress_certificate
		if len(p.CompAlgs) == 0 && len(e.Data) >= 3 {
			algLen := int(e.Data[0])
			for i := 1; i+2 <= 1+algLen && i+1 < len(e.Data); i += 2 {
				p.CompAlgs = append(p.CompAlgs, binary.BigEndian.Uint16(e.Data[i:i+2]))
			}
		}
	case 51: // key_share
		if len(p.KeyShareGroups) == 0 && len(e.Data) >= 2 {
			listLen := int(binary.BigEndian.Uint16(e.Data[:2]))
			offset := 2
			for offset+4 <= 2+listLen && offset+4 <= len(e.Data) {
				group := binary.BigEndian.Uint16(e.Data[offset : offset+2])
				keyLen := int(binary.BigEndian.Uint16(e.Data[offset+2 : offset+4]))
				p.KeyShareGroups = append(p.KeyShareGroups, group)
				offset += 4 + keyLen
			}
		}
	}
}

func (p *PeetPrintFingerprint) String() string {
	return strings.Join([]string{
		formatUint16s(p.Versions),       // 1. supported-tls-versions
		formatALPN(p.Protocols),         // 2. supported-protocols
		formatUint16s(p.Groups),         // 3. supported-groups
		formatUint16s(p.SigAlgs),        // 4. supported-signature-algorithms
		formatUint8s(p.PSKModes),        // 5. psk-key-exchange-mode
		formatUint16s(p.CompAlgs),       // 6. certificate-compression-algorithms
		formatUint16s(p.Ciphers),        // 7. cipher-suites
		formatExtsSorted(p.Extensions),  // 8. sorted-extensions
		formatUint16s(p.KeyShareGroups),  // 9. key share groups
	}, "|")
}

// --- helpers ---

func extensionID(ext utls.TLSExtension) (uint16, bool) {
	if ge, ok := ext.(*utls.GenericExtension); ok {
		return ge.Id, true
	}
	l := ext.Len()
	if l < 4 {
		return 0, false
	}
	buf := make([]byte, l)
	n, err := ext.Read(buf)
	if err != nil && err != io.EOF {
		return 0, false
	}
	if n < 2 {
		return 0, false
	}
	return binary.BigEndian.Uint16(buf[:2]), true
}

func formatUint16s(vals []uint16) string {
	parts := make([]string, 0, len(vals))
	for _, v := range vals {
		if greaseValues[v] {
			parts = append(parts, "G")
		} else {
			parts = append(parts, fmt.Sprintf("%d", v))
		}
	}
	return strings.Join(parts, "-")
}

func formatUint8s(vals []uint8) string {
	parts := make([]string, 0, len(vals))
	for _, v := range vals {
		parts = append(parts, fmt.Sprintf("%d", v))
	}
	return strings.Join(parts, "-")
}

func formatALPN(protos []string) string {
	parts := make([]string, 0, len(protos))
	for _, p := range protos {
		switch strings.ToLower(p) {
		case "h2":
			parts = append(parts, "20")
		case "http/1.1":
			parts = append(parts, "11")
		case "http/1.0":
			parts = append(parts, "10")
		default:
			parts = append(parts, p)
		}
	}
	return strings.Join(parts, "-")
}

func formatExtsSorted(exts []uint16) string {
	parts := make([]string, 0, len(exts))
	for _, v := range exts {
		if greaseValues[v] {
			parts = append(parts, "G")
		} else {
			parts = append(parts, fmt.Sprintf("%d", v))
		}
	}
	sort.Strings(parts)
	return strings.Join(parts, "-")
}

func formatRecordSizeLimit(limit uint16) string {
	if limit == 0 {
		return ""
	}
	return fmt.Sprintf("%d", limit)
}