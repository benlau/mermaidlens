install:
	npm install

build:
	npm run build

pack:
	npm run pack

format:
	npm run format

lint:
	npm run lint

test:
	npm run test

setup: install
	@echo "Project setup complete"

dev: build
	@echo "Development build complete"

release: build pack
	@echo "Release package created"

clean:
	rm -rf out/
	rm -rf .vscode-test/
	rm -f *.vsix

.PHONY: install build pack format lint test setup dev release clean help 