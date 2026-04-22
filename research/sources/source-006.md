---
source_url: https://mozilla.github.io/pdf.js/getting_started/
title: PDF.js - Getting Started
fetched_at: 2026-04-22T15:35:04Z
---

PDF.js - Getting Started

Getting Started

An introduction to PDF.js with examples.

Introduction

Before downloading PDF.js please take a moment to understand the different layers of the PDF.js project.

Layer
About

Core
The core layer is where a binary PDF is parsed and interpreted. This layer is the foundation for all subsequent layers. It is not documented here because using it directly is considered an advanced usage and the API is likely to change. For an example of using the core layer see the PDF Object Browser.

Display
The display layer takes the core layer and exposes an easier to use API to render PDFs and get other information out of a document. This API is what the version number is based on.

Viewer
The viewer is built on the display layer and is the UI for PDF viewer in Firefox and the other browser extensions within the project. It can be a good starting point for building your own viewer. However, we do ask if you plan to embed the viewer in your own site, that it not just be an unmodified version. Please re-skin it or build upon it.

Download

Please refer to this wiki page for information about supported browsers.

Prebuilt (modern browsers)

Includes the generic build of PDF.js and the viewer.

Stable (v5.6.205)

Prebuilt (older browsers)

Includes the generic build of PDF.js and the viewer.

Stable (v5.6.205)

Source

To get a local copy of the current code, clone it using git:

$ git clone https://github.com/mozilla/pdf.js.git
$ cd pdf.js

Including via a CDN

PDF.js is hosted on several free CDNs:

https://www.jsdelivr.com/package/npm/pdfjs-dist

https://cdnjs.com/libraries/pdf.js

https://unpkg.com/pdfjs-dist/

File Layout Overview

Note that we only mention the most relevant files and folders.

Prebuilt

├── build/
│   ├── pdf.mjs                            - display layer
│   ├── pdf.mjs.map                        - display layer's source map
│   ├── pdf.worker.mjs                     - core layer
│   └── pdf.worker.mjs.map                 - core layer's source map
├── web/
│   ├── cmaps/                             - character maps (required by core)
│   ├── compressed.tracemonkey-pldi-09.pdf - PDF file for testing purposes
│   ├── images/                            - images for the viewer and annotation icons
│   ├── locale/                            - translation files
│   ├── viewer.css                         - viewer style sheet
│   ├── viewer.html                        - viewer layout
│   ├── viewer.mjs                         - viewer layer
│   └── viewer.mjs.map                     - viewer layer's source map
└── LICENSE

Source

├── docs/                                  - website source code
├── examples/                              - simple usage examples
├── extensions/                            - browser extension source code
├── external/                              - third party code
├── l10n/                                  - translation files
├── src/
│   ├── core/                              - core layer
│   ├── display/                           - display layer
│   ├── shared/                            - shared code between the core and display layers
│   ├── interfaces.js                      - interface definitions for the core/display layers
│   └── pdf.*.js                           - wrapper files for bundling
├── test/                                  - unit, font, reference, and integration tests
├── web/                                   - viewer layer
├── LICENSE
├── README.md
├── gulpfile.mjs                           - build scripts/logic
├── package-lock.json                      - pinned dependency versions
└── package.json                           - package definition and dependencies

Trying the Viewer

With the prebuilt or source version, open
web/viewer.html
in a browser and the test pdf should load. Note: the worker is not enabled for file:// urls, so use a server. If you're using the source build and have node, you can run
npx gulp server
.

More Information

For a further walkthrough of a minimal viewer, see the hello world example. More documentation can be found in our wiki too.
