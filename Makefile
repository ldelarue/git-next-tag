SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: lint
lint: ## Run super-linter locally
	@docker run -e RUN_LOCAL=true --env-file ".github/super-linter.env" -v $(CURDIR):/tmp/lint ghcr.io/super-linter/super-linter:slim-v6.5.0

.PHONY: lint-debug
lint-debug: ## Run super-linter locally with DEBUG mode
	@docker run -e RUN_LOCAL=true --env-file ".github/super-linter.env" -e LOG_LEVEL=DEBUG -v $(CURDIR):/tmp/lint ghcr.io/super-linter/super-linter:slim-v6.5.0

.PHONY: dist-checksum
dist-checksum: ## Generate checksums for dist directory
	@sort <(find $(CURDIR)/dist -type f -exec sha256sum {} + 2> /dev/null || echo '') | awk '{print $$1}' | sha256sum | awk '{print $$1}' 

# https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.PHONY: help
help: ## Print all available make commands.
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

