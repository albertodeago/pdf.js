import { PDFViewer } from "../pdf_viewer";

import { PDFThumbnailViewer } from '../pdf_thumbnail_viewer';
import { PDFAttachmentViewer } from '../pdf_attachment_viewer';
import { PDFOutlineViewer } from '../pdf_outline_viewer';
import { SidebarView, PDFSidebar } from './pdf_thron_sidebar';
import { THRONGenericCom, getExternalServices } from './thron_genericcom';
import { THRONSelectors } from "./thron_selectors";
import {animationStarted, DEFAULT_SCALE_VALUE} from "../ui_utils";


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

  /**
   *
   * @param {PDFSidebarOptions} options
   * @param {HTMLElement} options.sidebarContainer the div where the sidebar will be rendered
   * @param {HTMLElement} options.container the div where the pdf viewer will be rendered
   * @param {IPDFLinkService} options.linkService
   * @param {l10n} options.l10n
   * @param {String} options.instanceId the instance identifier of the THRON player
   */
  constructor(options = {container: null, linkService: null, l10n: null, instanceId: null}) {
    if(!options || !options.container || !options.linkService || !options.l10n || options.instanceId == null) {
      throw new Error("Missing required parameters for THRONPDFViewer constructor");
    }

    // Create the "default" pdf_viewer
    super(options);

    this.sidebarContainer = options.sidebarContainer;

    // bind method to this for event handlers
    this.bindMethodsToThis();

    // create the external services that will be used by some components (i.e. downloadManager for attachments)
    this.externalServices = getExternalServices(DefaultExternalServices);
    this.downloadManager = this.externalServices.createDownloadManager();

    // Create the sidebar and other useful components
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

    const thumbnailButton = this.sidebarContainer.querySelector(THRONSelectors.BUTTONS.THUMBNAIL);
    const outlineButton = this.sidebarContainer.querySelector(THRONSelectors.BUTTONS.OUTLINE);
    const attachmentsButton = this.sidebarContainer.querySelector(THRONSelectors.BUTTONS.ATTACHMENTS);
    const thumbViewContainer = this.sidebarContainer.querySelector(THRONSelectors.VIEWS.THUMBNAIL);
    const outlineViewContainer = this.sidebarContainer.querySelector(THRONSelectors.VIEWS.OUTLINE);
    const attachmentsViewContainer = this.sidebarContainer.querySelector(THRONSelectors.VIEWS.ATTACHMENTS);

    this.pdfThumbnailViewer = new PDFThumbnailViewer({
      container: thumbViewContainer,
      linkService: this.linkService,
      renderingQueue: this.renderingQueue,
      l10n: this.l10n
    });
    this.renderingQueue.setThumbnailViewer(this.pdfThumbnailViewer);
    this.pdfOutlineViewer = new PDFOutlineViewer({
      container: outlineViewContainer,
      eventBus: this.eventBus,
      linkService: this.linkService
    });
    this.pdfAttachmentViewer = new PDFAttachmentViewer({
      container: attachmentsViewContainer,
      eventBus: this.eventBus,
      downloadManager: this.downloadManager
    });
    this.pdfSidebar = new PDFSidebar({
      pdfViewer: this,
      pdfThumbnailViewer: this.pdfThumbnailViewer,
      pdfOutlineViewer: this.pdfOutlineViewer,
      eventBus: this.eventBus,

      mainContainer: this.container,
      outerContainer: this.sidebarContainer,
      thumbnailButton: thumbnailButton,
      outlineButton: outlineButton,
      attachmentsButton: attachmentsButton,

      thumbnailView: thumbViewContainer,
      outlineView: outlineViewContainer,
      attachmentsView: attachmentsViewContainer

    }, this.l10n);
    this.pdfSidebar.onToggled = this.onToggleSidebar;

    this.attachEventListeners();
  }

  /**
   * Click handler for sidebar toggle button
   */
  onToggleSidebar() {
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
    if (this.pdfSidebar.isThumbnailViewVisible) {
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
    if (this.pdfSidebar.isThumbnailViewVisible) {
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

    let pagesPromise = this.pagesPromise;
    let onePageRendered = this.onePageRendered;

    this.firstPagePromise.then((pdfPage) => {

      this.setInitialView(null, { sidebarView: 1 });

      // Make all navigation keys work on document load,
      // unless the viewer is embedded in a web page.
      if (!this.isViewerEmbedded) {
        this.focus();
      }
      return pagesPromise;
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
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.eventBus.on('pagerendered', this.onPageRendered);
    this.eventBus.on('pagechanging', this.onPageChanging);
  }

  /**
   * Unbind all attached event listeners.
   */
  removeEventListeners() {
    this.eventBus.off('pagerendered', this.onPageRendered);
    this.eventBus.off('pagechanging', this.onPageChanging);
  }

}

export { THRONPDFViewer, PDFViewer, DefaultExternalServices };
