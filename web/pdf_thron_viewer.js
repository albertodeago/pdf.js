import { PDFViewer } from "./pdf_viewer";

import { PDFThumbnailViewer } from './pdf_thumbnail_viewer';
import { PDFAttachmentViewer } from './pdf_attachment_viewer';
import { PDFOutlineViewer } from './pdf_outline_viewer';
import { SidebarView, PDFSidebar } from './pdf_sidebar';
import { THRONGenericCom, getExternalServices } from './thron_genericcom';
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

    this.bindMethodsToThis();
    this.externalServices = getExternalServices(DefaultExternalServices);
    this.downloadManager = this.externalServices.createDownloadManager();
    this.initComponents();
  }

  /**
   * Bind methods to the right 'this'
   */
  bindMethodsToThis() {
    this.onToggleSidebar = this.onToggleSidebar.bind(this);
    this.onPageChanging = this.onPageChanging.bind(this);
    this.onPageRendered = this.onPageRendered.bind(this);
  }

  /**
   * Init other useful components like Sidebar and every view inside it.
   */
  initComponents() {
    let toogleButton = $('<button id="thumbnailButton">toggle</button>');
    toogleButton[0].addEventListener('click', function() {
      this.pdfSidebar.toggle();
    }.bind(this));
    $('body').append(toogleButton);

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

    this.pdfSidebar.onToggled = this.onToggleSidebar;

    this.eventBus.on('pagerendered', this.onPageRendered);
    this.eventBus.on('pagechanging', this.onPageChanging);
  }

  /**
   * Click handler for sidebar toggle button
   */
  onToggleSidebar() {
    // this.renderingQueue.printing = this.printing;
    this.renderingQueue.isThumbnailViewEnabled = this.pdfSidebar.isThumbnailViewVisible;
    this.renderingQueue.renderHighestPriority();
  }

  /**
   * Page rendered event handler
   * @param e {Event}
   */
  onPageRendered(e) {
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
  }

  /**
   * Page changing event handler
   * @param e {Event}
   */
  onPageChanging(e) {
    const page = e.pageNumber;
    if (true || this.pdfSidebar.isThumbnailViewVisible) { // TODO true ||
      this.pdfThumbnailViewer.scrollThumbnailIntoView(page);
    }
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

  /**
   * Unbind all methods attached to the eventBus
   */
  unbindMethods() {
    this.eventBus.off('pagerendered', this.onPageRendered);
    this.eventBus.off('pagechanging', this.onPageChanging);
  }

}

export { THRONPDFViewer, PDFViewer, DefaultExternalServices };
