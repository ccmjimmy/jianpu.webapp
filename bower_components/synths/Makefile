REPORTER ?= spec

test:
	./node_modules/.bin/mocha \
		--check-leaks \
		--reporter $(REPORTER) \
		$(OPTION) \
		$(WATCH)

# watch the test
test-w:
	make test WATCH=-w

test-wb:
	make test WATCH='-w -b'

docs: test-docs-html test-docs-md clean

# make an html documentation in docs/test.html
test-docs-html:
	make test \
		--silent \
		REPORTER=doc \
		> .tmp/test.html && \
		sed -e 's/`\([^`]*\)`/<code>\1<\/code>/g' \
			-e 's/<pre>/<pre class=\"prettyprint\">/g' \
			.tmp/test.html \
		| cat docs/src/head.html - docs/src/tail.html \
		> docs/test.html

# make a markdown documentation in docs/test.md
test-docs-md:
	make test \
		--silent \
		REPORTER=markdown \
		> .tmp/test.md && \
		sed -e s/TOC/Contents/ \
			-e s/^#/##/ \
			.tmp/test.md \
		| cat docs/src/head.md - \
		> docs/test.md

install:
	cp docs/test.html ignore/synths/index.html && \
	cd ignore/synths && \
	git commit -a && \
	git push origin gh-pages && \
	cd ../..

clean:
	rm -f .tmp/*

.PHONY: test
