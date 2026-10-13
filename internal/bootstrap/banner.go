package bootstrap

import (
	"fmt"
	"io"
	"os"

	"cs-agent/internal/pkg/config"
)

func printBanner() {
	printBannerTo(os.Stdout, config.Current())
}

func printBannerTo(w io.Writer, cfg config.Config) {
	_, _ = fmt.Fprint(w, renderBanner(cfg))
}

func renderBanner(cfg config.Config) string {
	port := cfg.Server.Port
	if port <= 0 {
		port = 8080
	}
	dbType := cfg.DB.Type
	if dbType == "" {
		dbType = "unknown"
	}

	return fmt.Sprintf(`
  +-------------------------------------------+
  |       CUSTOMER SERVICE AGENT              |
  +-------------------------------------------+

:: Customer Service Agent ::

Port     : %d
DB       : %s
Address  : http://127.0.0.1:%d

`, port, dbType, port)
}
