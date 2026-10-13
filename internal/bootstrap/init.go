package bootstrap

import (
	"cs-agent/internal/ai/rag/vectordb"
	"cs-agent/internal/oidcclient"
	"cs-agent/internal/pkg/config"
	"cs-agent/internal/pkg/i18nx"
	"cs-agent/internal/pkg/logx"
	"cs-agent/internal/services/cronx"
	"cs-agent/internal/wxwork"
	"context"
	"log/slog"

	_ "cs-agent/internal/services/event_handlers"
)

func Init(configPath string) error {
	cfg, err := config.Load(configPath)
	if err != nil {
		slog.Error("init config failed", "error", err)
		return err
	}
	config.SetCurrent(cfg)
	i18nx.SetDefaultLocale(cfg.LanguageOrDefault())

	logx.Init(logx.Config{
		Level:     cfg.Logger.Level,
		Format:    cfg.Logger.Format,
		AddSource: cfg.Logger.AddSource,
	})

	if _, err := InitDB(cfg.DB); err != nil {
		slog.Error("init db failed", "error", err)
		return err
	}
	if err := InitMigrations(); err != nil {
		slog.Error("init migrations failed", "error", err)
		return err
	}
	if err := vectordb.Init(&cfg.VectorDB); err != nil {
		slog.Error("init vector db failed", "error", err)
		return err
	}

	// 启动任务调度器
	cronx.Init()

	wxwork.Init()
	if err := oidcclient.Init(context.Background()); err != nil {
		slog.Warn("init oidc at startup failed (will retry lazily on request)", "error", err)
	}
	return nil
}
