import { PDFViewer } from "./pdf_viewer";

import { CursorTool, PDFCursorTools } from './pdf_cursor_tools';
import { PDFThumbnailViewer } from './pdf_thumbnail_viewer';
import { PDFAttachmentViewer } from './pdf_attachment_viewer';
import { PDFOutlineViewer } from './pdf_outline_viewer';
import { PDFThumbnailView } from './pdf_thumbnail_view';
import { SidebarView, PDFSidebar } from './pdf_sidebar';
import { THRONGenericCom, getExternalServices } from './thron_genericcom';
// import {PDFViewerApplication} from "./app";
import {animationStarted, DEFAULT_SCALE_VALUE} from "./ui_utils";


var DefaultExternalServices = {
  updateFindControlState(data) {},
  initPassiveLoading(callbacks) {},
  fallback(data, callback) {},
  reportTelemetry(data) {},
  createDownloadManager() {
    throw new Error('Not implemented: createDownloadManager');
  },
  createPreferences() {
    throw new Error('Not implemented: createPreferences');
  },
  createL10n() {
    throw new Error('Not implemented: createL10n');
  },
  supportsIntegratedFind: false,
  supportsDocumentFonts: true,
  supportsDocumentColors: true,
  supportedMouseWheelZoomModifierKeys: {
    ctrlKey: true,
    metaKey: true,
  },
};


class THRONPDFViewer extends PDFViewer {

  constructor(options = {container: null, linkService: null, l10n: null, instanceId: null}) {
    if(!options || !options.container || !options.linkService || !options.l10n || options.instanceId == null) {
      throw new Error("Missing required parameters for THRONPDFViewer constructor");
    }

    // Create the "default" pdf_viewer
    super(options);

    this.externalServices = getExternalServices(DefaultExternalServices);
    this.downloadManager = this.externalServices.createDownloadManager();
    this.initComponents();

    console.log("Created a THRONPDFViewer");
  }

  /**
   * Init other useful components
   */
  initComponents() {
    // let thumbnailButton = $('<button id="thumbnailButton">thumbnailButton</button>');
    // $('body').append(thumbnailButton);
    // let outlineButton = $('<button id="thumbnailButton">outlineButton</button>');
    // $('body').append(outlineButton);
    // let attachmentsButton = $('<button id="thumbnailButton">attachmentsButton</button>');
    // $('body').append(attachmentsButton);
    let toogleButton = $('<button id="thumbnailButton">toogle</button>');
    toogleButton[0].addEventListener('click', function() {
      this.pdfSidebar.toggle();
    }.bind(this));
    $('body').append(toogleButton);

    // let thumbViewContainer = $('<div id="thumbView"></div>');
    // let outlineViewContainer = $('<div id="outlineView"></div>');
    // let attachmentsViewContainer = $('<div id="attachmentsView"></div>');
    // let sidebarContainer = $('<div id="sidebar" class="th-sidebar" style="\n' +
    //   '      position: absolute;\n' +
    //   '      top: 0;\n' +
    //   '      bottom: 0;\n' +
    //   '      left: 0;\n' +
    //   '      width: 250px;\n' +
    //   '      background: sandybrown;\n' +
    //   '      overflow-y: scroll;\n' +
    //   '      z-index: 5;"\n' +
    //   '      >');
    // sidebarContainer.append(thumbViewContainer);
    // sidebarContainer.append(outlineViewContainer);
    // sidebarContainer.append(attachmentsViewContainer);
    // $('body').append(sidebarContainer);

    const thumbnailButton = $(this.container).find('#viewThumbnail');
    const outlineButton = $(this.container).find('#viewOutline');
    const attachmentsButton = $(this.container).find('#viewAttachments');
    // const toggleButton = ???;
    const thumbViewContainer = $(this.container).find('#thumbnailView');
    const outlineViewContainer = $(this.container).find('#outlineView');
    const attachmentsViewContainer = $(this.container).find('#attachmentsView');
    const sidebarContainer = $(this.container).find('#sidebarContainer');

    this.pdfThumbnailViewer = new PDFThumbnailViewer({
      container: thumbViewContainer[0],
      linkService: this.linkService,
      renderingQueue: this.renderingQueue,
      l10n: this.l10n
    });
    this.renderingQueue.setThumbnailViewer(this.pdfThumbnailViewer);
    this.pdfOutlineViewer = new PDFOutlineViewer({
      container: outlineViewContainer[0],
      eventBus: this.eventBus,
      linkService: this.linkService
    });
    this.pdfAttachmentViewer = new PDFAttachmentViewer({
      container: attachmentsViewContainer[0],
      eventBus: this.eventBus,
      downloadManager: this.downloadManager
    });
    this.pdfSidebar = new PDFSidebar({
      pdfViewer: this,
      pdfThumbnailViewer: this.pdfThumbnailViewer,
      pdfOutlineViewer: this.pdfOutlineViewer,
      eventBus: this.eventBus,

      mainContainer: this.container,
      outerContainer: sidebarContainer[0],
      thumbnailButton: thumbnailButton[0],
      outlineButton: outlineButton[0],
      attachmentsButton: attachmentsButton[0],
      toggleButton: toogleButton[0],

      thumbnailView: thumbViewContainer[0],
      outlineView: outlineViewContainer[0],
      attachmentsView: attachmentsViewContainer[0]

    }, this.l10n);

    this.pdfSidebar.onToggled = function() {
      // this.renderingQueue.printing = this.printing;
      this.renderingQueue.isThumbnailViewEnabled = this.pdfSidebar.isThumbnailViewVisible;
      this.renderingQueue.renderHighestPriority();
    }.bind(this);

    this.eventBus.on('pagerendered', function(e) {
      let pageNumber = e.pageNumber;
      let pageIndex = pageNumber - 1;
      let pageView = this.getPageView(pageIndex);

      // If the page is still visible when it has finished rendering,
      // ensure that the page number input loading indicator is hidden.
      if (pageNumber === this.page) {
        this.toolbar.updateLoadingIndicatorState(false);
      }

      // Prevent errors in the edge-case where the PDF document is removed *before*
      // the 'pagerendered' event handler is invoked.
      if (!pageView) {
        return;
      }

      // Use the rendered page to set the corresponding thumbnail image.
      if (true || this.pdfSidebar.isThumbnailViewVisible) { // TODO true ||
        let thumbnailView = this.pdfThumbnailViewer.getThumbnail(pageIndex);
        thumbnailView.setImage(pageView);
      }

      // if (PDFJS.pdfBug && Stats.enabled && pageView.stats) {
      //   Stats.add(pageNumber, pageView.stats);
      // }
      //
      // if (pageView.error) {
      //   PDFViewerApplication.l10n.get('rendering_error', null,
      //     'An error occurred while rendering the page.').then((msg) => {
      //     PDFViewerApplication.error(msg, pageView.error);
      //   });
      // }
      //
      // if (typeof PDFJSDev !== 'undefined' &&
      //   PDFJSDev.test('FIREFOX || MOZCENTRAL')) {
      //   PDFViewerApplication.externalServices.reportTelemetry({
      //     type: 'pageInfo',
      //   });
      //   // It is a good time to report stream and font types.
      //   PDFViewerApplication.pdfDocument.getStats().then(function (stats) {
      //     PDFViewerApplication.externalServices.reportTelemetry({
      //       type: 'documentStats',
      //       stats,
      //     });
      //   });
      // }
    }.bind(this));
    this.eventBus.on('pagechanging', function(e) {
      var page = e.pageNumber;

      // this.toolbar.setPageNumber(page, e.pageLabel || null);
      // this.secondaryToolbar.setPageNumber(page);

      if (true || this.pdfSidebar.isThumbnailViewVisible) { // TODO true ||
        this.pdfThumbnailViewer.scrollThumbnailIntoView(page);
      }

      // we need to update stats
      // if (PDFJS.pdfBug && Stats.enabled) {
      //   var pageView = PDFViewerApplication.pdfViewer.getPageView(page - 1);
      //   if (pageView.stats) {
      //     Stats.add(page, pageView.stats);
      //   }
      // }
    }.bind(this));
  }

  /**
   *
   * @param pdfDocument
   */
  onAfterSetDocument(pdfDocument) {
    this.linkService.setDocument(pdfDocument);
    this.pdfThumbnailViewer.setDocument(pdfDocument);
    // this.pdfDocumentProperties.setDocument(pdfDocument, this.url);

    // let pdfViewer = this.pdfViewer;
    // pdfViewer.setDocument(pdfDocument);
    // let firstPagePromise = pdfViewer.firstPagePromise;
    let pagesPromise = this.pagesPromise;
    let onePageRendered = this.onePageRendered;

    this.firstPagePromise.then((pdfPage) => {
      debugger;

        this.setInitialView(null, { sidebarView: 1 });
        // initialParams.hash = storedHash;

        // Make all navigation keys work on document load,
        // unless the viewer is embedded in a web page.
        if (!this.isViewerEmbedded) {
          this.focus();
        }
        return pagesPromise;
      }).then(() => {
        // For documents with different page sizes, once all pages are resolved,
        // ensure that the correct location becomes visible on load.
        // if (!initialParams.destination && !initialParams.bookmark &&
        //   !initialParams.hash) {
        //   return;
        // }
        // if (this.hasEqualPageSizes) {
        //   return;
        // }
        // this.initialDestination = initialParams.destination;
        // this.initialBookmark = initialParams.bookmark;
		//
        // this.pdfViewer.currentScaleValue = this.pdfViewer.currentScaleValue;
        // this.setInitialView(initialParams.hash);
    });

    Promise.all([animationStarted, onePageRendered]).then(() => {
      pdfDocument.getOutline().then((outline) => {
        this.pdfOutlineViewer.render({ outline, });
      });
      pdfDocument.getAttachments().then((attachments) => {
        this.pdfAttachmentViewer.render({ attachments, });
      });
    });
  }

  setInitialView(storedHash, options = {}) {
    var { scale = 0, sidebarView = SidebarView.NONE, } = options;

    this.isInitialViewSet = true;
    this.pdfSidebar.setInitialView(sidebarView);

    // if (this.initialDestination) {
    //   this.pdfLinkService.navigateTo(this.initialDestination);
    //   this.initialDestination = null;
    // } else if (this.initialBookmark) {
    //   this.pdfLinkService.setHash(this.initialBookmark);
    //   this.pdfHistory.push({ hash: this.initialBookmark, }, true);
    //   this.initialBookmark = null;
    // } else if (storedHash) {
    //   this.pdfLinkService.setHash(storedHash);
    // } else if (scale) {
    //   this.pdfViewer.currentScaleValue = scale;
    //   this.page = 1;
    // }
	//
    // // Ensure that the correct page number is displayed in the UI,
    // // even if the active page didn't change during document load.
    // this.toolbar.setPageNumber(this.pdfViewer.currentPageNumber, this.pdfViewer.currentPageLabel);
    // this.secondaryToolbar.setPageNumber(this.pdfViewer.currentPageNumber);
	//
    // if (!this.pdfViewer.currentScaleValue) {
    //   // Scale was not initialized: invalid bookmark or scale was not specified.
    //   // Setting the default one.
    //   this.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
    // }
  }

}

export { THRONPDFViewer, PDFViewer, DefaultExternalServices };
