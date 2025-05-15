BAKSUFX ?=

proj    :=  vscode-auto-reload-window
bakdir  :=  ../.backup/$(proj)

backup: suffix := $(if $(value BAKSUFX),_$(BAKSUFX),)
backup: arch   := $(shell date "+%Y-%m-%d_%H.%M.%S")$(suffix).tgz
backup:
	@[ -d "$(bakdir)" ] || { echo no dir "$(bakdir)"; exit 1; }
	gtar czf $(bakdir)/$(arch) --exclude-ignore=.backupignore -C .. $(proj)
	@echo '\ncreated archive:' && ls -lh $(bakdir)/$(arch)

.PHONY: backup
