package utils

import (
	"regexp"
	"testing"
)

func TestGenerateShortCode(t *testing.T) {
	pattern := regexp.MustCompile(`^[23456789abcdefghjkmnpqrstuvwxyz]+$`)
	seen := make(map[string]struct{}, 200)
	for i := 0; i < 200; i++ {
		code, err := GenerateShortCode(8)
		if err != nil {
			t.Fatalf("GenerateShortCode returned error: %v", err)
		}
		if len(code) != 8 {
			t.Fatalf("expected length 8, got %d (%q)", len(code), code)
		}
		if !pattern.MatchString(code) {
			t.Fatalf("code %q contains characters outside the expected alphabet", code)
		}
		seen[code] = struct{}{}
	}
	if len(seen) < 190 {
		t.Fatalf("expected mostly unique codes, got %d unique out of 200", len(seen))
	}
}

func TestGenerateShortCodeRejectsNonPositiveLength(t *testing.T) {
	if _, err := GenerateShortCode(0); err == nil {
		t.Fatal("expected error for zero length")
	}
	if _, err := GenerateShortCode(-1); err == nil {
		t.Fatal("expected error for negative length")
	}
}
