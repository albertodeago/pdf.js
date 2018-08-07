## Basic THRON explanation
Let's get a super simple explanation about PDFJS.
PDFJS is a big project created and maintained by the Mozilla team, it's a js library to display pdf on the browser.
It's mainly composed by 2 part:
* the pdfjs library itself, can be found in the 'src' folder and the final build is usually composed by 2 files 'pdf.js' and 'pdf.worker.js'. 
This is the core of the library and it's responsible of actually reading the pdf and transforming into a PDFDocument js object (it's a custom object).
We in THRON never modified this part. 
* the web part, this is collection of components and in the repository is under the 'web' folder. 
This components are responsible of the rendering of all the components used to let the user interact with the pdf (the sidebar, the zoom buttons, the toolbar etc...)
running the example of the Mozilla team (viewer.html is the file to open to see it) the entry point used to load the UI is 'app.js'. This script load pretty much 
every component contained in the 'web' folder and make everything works together by attaching listeners and other things.

## THRON Customizations and how to customize
In the old THRON Player (PL5) the pdf reproducer was an iframe pointing to the mozilla producer with the pdf passed as url in the queryparam; so it was 'as is' without any customization.

With the coming of the THRON Content Experience (CE1, that is a completely new Player built from zero) THRON decided to customize a bit the pdf UI reproducer.
This was done by importing the pdfViewer ('pdf_viewer.js') file that ships the basic  UI components (not everything) and customizing some component, mainly with 
adding some 'th' classes and customizing with css.

### THRON Changelog
We didn't keep a changelog until July 2018. Mainly the work done before was to put pdfjs library inside the THRONContentExperience and to instantiate the basic PDFViewer inside the player with some customized classes. 
* July 2018 - task CNT-8205
    * created a pdf_thron_viewer as entry point of the pdf viewer. This extends the standard PDFViewer created by pdfjs.
    * Added the creation of sidebar components into THRONPDFViewer (pdf_thron_viewer). 
    * Added some event listener in pdf_thron_viewer to handle events used to load and make it work the sidebar
    * Added an 'hook' (onAfterSetDocument) in the PDFViewer. the THRONPDFViewer define that hook handler and there we init some things like setting the document to the thumbnail viewer, get the attachments and the outlines.
    * Changed in pdf_attachment_viewer the logic inside the 'render' function. Now every attachment is downloaded at click instead of not downlading the pdf if they were attachment (default pdfjs is opening the pdf attachment in a new tab).
    * Added 'thron_genericcom'. This is almost identical of 'genericcom', used inside the THRONPDFViewer setting the external preferences, this is useful to create a DownloadManager that handles the attachments download on user click 
    * Added 'thron_helper' to add some helper functions, Extend it if you need!
    * Added 'thron_selectors' to group up every selector used by the sidebar to avoid 'class dispersion'
    * Created a THRON folder inside the pdfjs project to group up all THRON custom files. Most of them are copy-paste of the relative file (with the name without 'thron') but with different behaviour/customization.
Note: Even if THRON doesn't show the pdf attachment view (because THRON has his own attatchments), we decided to implement the view 
anyway and not display it so if in the future will become useful, we already got it.

### Building for THRON
* gulp generic builds the pdf library. This is super intensive and probably to make that work you have to run with some nodejs options like   
gulp generic --max-old-space-size=10000 to increase the heap space to 10gb (in my machine it used 8gb of ram the compilation)

* gulp build builds everything. This means both the web components and the pdf library. This is super intensive too having the pdf to compile.

* gulp components builds only the component part. This will output the built component in the folder build/components (this is not memory intensive)
  
 999% of the time we will only need gulp components, than we have to copy-paste the component folder generated (in build/components) in the thron-content-experience repository under 
 src\js\players\doc\js\lib\pdfjs-dist overwriting the component directory.
 

# PDF.js

PDF.js is a Portable Document Format (PDF) viewer that is built with HTML5.

PDF.js is community-driven and supported by Mozilla Labs. Our goal is to
create a general-purpose, web standards-based platform for parsing and
rendering PDFs.

## Contributing

PDF.js is an open source project and always looking for more contributors. To
get involved, visit:

+ [Issue Reporting Guide](https://github.com/mozilla/pdf.js/blob/master/.github/CONTRIBUTING.md)
+ [Code Contribution Guide](https://github.com/mozilla/pdf.js/wiki/Contributing)
+ [Frequently Asked Questions](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions)
+ [Good Beginner Bugs](https://github.com/mozilla/pdf.js/issues?direction=desc&labels=5-good-beginner-bug&page=1&sort=created&state=open)
+ [Projects](https://github.com/mozilla/pdf.js/projects)

Feel free to stop by #pdfjs on irc.mozilla.org for questions or guidance.

## Getting Started

### Online demo

+ https://mozilla.github.io/pdf.js/web/viewer.html

### Browser Extensions

#### Firefox (and Seamonkey)

PDF.js is built into version 19+ of Firefox, however one extension is still available:

+ [Development Version](http://mozilla.github.io/pdf.js/extensions/firefox/pdf.js.xpi) - This extension is mainly intended for developers/testers, and it is updated every time new code is merged into the PDF.js codebase. It should be quite stable, but might break from time to time.

  + Please note that the extension is *not* guaranteed to be compatible with Firefox versions that are *older* than the current ESR version, see the [Release Calendar](https://wiki.mozilla.org/RapidRelease/Calendar#Past_branch_dates).

  + The extension should also work in Seamonkey, provided that it is based on a Firefox version as above (see [Which version of Firefox does SeaMonkey 2.x correspond with?](https://wiki.mozilla.org/SeaMonkey/FAQ#General)), but we do *not* guarantee compatibility.

#### Chrome

+ The official extension for Chrome can be installed from the [Chrome Web Store](https://chrome.google.com/webstore/detail/pdf-viewer/oemmndcbldboiebfnladdacbdfmadadm).
*This extension is maintained by [@Rob--W](https://github.com/Rob--W).*
+ Build Your Own - Get the code as explained below and issue `gulp chromium`. Then open
Chrome, go to `Tools > Extension` and load the (unpackaged) extension from the
directory `build/chromium`.

## Getting the Code

To get a local copy of the current code, clone it using git:

    $ git clone git://github.com/mozilla/pdf.js.git
    $ cd pdf.js

Next, install Node.js via the [official package](http://nodejs.org) or via
[nvm](https://github.com/creationix/nvm). You need to install the gulp package
globally (see also [gulp's getting started](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md#getting-started)):

    $ npm install -g gulp-cli

If everything worked out, install all dependencies for PDF.js:

    $ npm install

Finally you need to start a local web server as some browsers do not allow opening
PDF files using a file:// URL. Run

    $ gulp server

and then you can open

+ http://localhost:8888/web/viewer.html

It is also possible to view all test PDF files on the right side by opening

+ http://localhost:8888/test/pdfs/?frame

## Building PDF.js

In order to bundle all `src/` files into two production scripts and build the generic
viewer, run:

    $ gulp generic

This will generate `pdf.js` and `pdf.worker.js` in the `build/generic/build/` directory.
Both scripts are needed but only `pdf.js` needs to be included since `pdf.worker.js` will
be loaded by `pdf.js`. The PDF.js files are large and should be minified for production.

## Using PDF.js in a web application

To use PDF.js in a web application you can choose to use a pre-built version of the library
or to build it from source. We supply pre-built versions for usage with NPM and Bower under
the `pdfjs-dist` name. For more information and examples please refer to the
[wiki page](https://github.com/mozilla/pdf.js/wiki/Setup-pdf.js-in-a-website) on this subject.

## Learning

You can play with the PDF.js API directly from your browser using the live
demos below:

+ [Interactive examples](http://mozilla.github.io/pdf.js/examples/index.html#interactive-examples)

The repository contains a hello world example that you can run locally:

+ [examples/helloworld/](https://github.com/mozilla/pdf.js/blob/master/examples/helloworld/)

More examples can be found at the examples folder. Some of them are using the pdfjs-dist package, which can be built and installed in this repo directory via `gulp dist-install` command.

For an introduction to the PDF.js code, check out the presentation by our
contributor Julian Viereck:

+ http://www.youtube.com/watch?v=Iv15UY-4Fg8

More learning resources can be found at:

+ https://github.com/mozilla/pdf.js/wiki/Additional-Learning-Resources

## Questions

Check out our FAQs and get answers to common questions:

+ https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions

Talk to us on IRC:

+ #pdfjs on irc.mozilla.org

File an issue:

+ https://github.com/mozilla/pdf.js/issues/new

Follow us on twitter: @pdfjs

+ http://twitter.com/#!/pdfjs
