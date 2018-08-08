/**
 * This is a copy/paste and then customization of the pdf_sidebar of Mozilla
 * foundation. Made by Alberto De Agostini @ THRON
 */
import { NullL10n } from '../ui_utils';
import { RenderingStates } from '../pdf_rendering_queue';
import THRONHelper from './thron_helper';
import { THRONSelectors } from './thron_selectors';

const UI_NOTIFICATION_CLASS = 'pdfSidebarNotification';

const SidebarView = {
  NONE: 0,
  THUMBS: 1,
  OUTLINE: 2,
  ATTACHMENTS: 3,
};

/**
 * @typedef {Object} PDFSidebarOptions
 * @property {PDFViewer} pdfViewer - The document viewer.
 * @property {PDFThumbnailViewer} pdfThumbnailViewer - The thumbnail viewer.
 * @property {PDFOutlineViewer} pdfOutlineViewer - The outline viewer.
 * @property {HTMLDivElement} mainContainer - The main container
 *   (in which the viewer element is placed).
 * @property {HTMLDivElement} outerContainer - The outer container
 *   (encasing both the viewer and sidebar elements).
 * @property {EventBus} eventBus - The application event bus.
 * @property {HTMLButtonElement} thumbnailButton - The button used to show
 *   the thumbnail view.
 * @property {HTMLButtonElement} outlineButton - The button used to show
 *   the outline view.
 * @property {HTMLButtonElement} attachmentsButton - The button used to show
 *   the attachments view.
 * @property {HTMLDivElement} thumbnailView - The container in which
 *   the thumbnails are placed.
 * @property {HTMLDivElement} outlineView - The container in which
 *   the outline is placed.
 * @property {HTMLDivElement} attachmentsView - The container in which
 *   the attachments are placed.
 * @property {boolean} disableNotification - (optional) Disable the notification
 *   for documents containing outline/attachments. The default value is `false`.
 */

class PDFSidebar {
  /**
   * @param {PDFSidebarOptions} options
   * @param {IL10n} l10n - Localization service.
   */
  constructor(options, l10n = NullL10n) {
    this.isOpen = false;
    this.active = SidebarView.THUMBS;
    this.isInitialViewSet = false;

    /**
     * Callback used when the sidebar has been opened/closed, to ensure that
     * the viewers (PDFViewer/PDFThumbnailViewer) are updated correctly.
     */
    this.onToggled = null;

    this.pdfViewer = options.pdfViewer;
    this.pdfThumbnailViewer = options.pdfThumbnailViewer;
    this.pdfOutlineViewer = options.pdfOutlineViewer;

    this.mainContainer = options.mainContainer;
    this.outerContainer = options.outerContainer;
    this.eventBus = options.eventBus;
    // this.toggleButton = options.toggleButton;

    this.thumbnailButton = options.thumbnailButton;
    this.outlineButton = options.outlineButton;
    this.attachmentsButton = options.attachmentsButton;

    this.THRONThumbnailButton = this.thumbnailButton.querySelector(THRONSelectors.BUTTONS.SIMPLE_BUTTON);
    this.THRONOutlineButton = this.outlineButton.querySelector(THRONSelectors.BUTTONS.SIMPLE_BUTTON);
    this.THRONAttachmentsButton = this.attachmentsButton.querySelector(THRONSelectors.BUTTONS.SIMPLE_BUTTON);

    this.thumbnailView = options.thumbnailView;
    this.outlineView = options.outlineView;
    this.attachmentsView = options.attachmentsView;

    this.disableNotification = options.disableNotification || false;

    this.l10n = l10n;

    this._addEventListeners();
  }

  reset() {
    this.isInitialViewSet = false;

    this.switchView(SidebarView.THUMBS);

    this.outlineButton.disabled = false;
    this.attachmentsButton.disabled = false;
  }

  /**
   * @returns {number} One of the values in {SidebarView}.
   */
  get visibleView() {
    return (this.isOpen ? this.active : SidebarView.NONE);
  }

  get isThumbnailViewVisible() {
    return (this.isOpen && this.active === SidebarView.THUMBS);
  }

  get isOutlineViewVisible() {
    return (this.isOpen && this.active === SidebarView.OUTLINE);
  }

  get isAttachmentsViewVisible() {
    return (this.isOpen && this.active === SidebarView.ATTACHMENTS);
  }

  /**
   * @param {number} view - The sidebar view that should become visible,
   *                        must be one of the values in {SidebarView}.
   */
  setInitialView(view) {
    if (this.isInitialViewSet) {
      return;
    }
    this.isInitialViewSet = true;

    if (this.isOpen && view === SidebarView.NONE) {
      this._dispatchEvent();
      // If the user has already manually opened the sidebar,
      // immediately closing it would be bad UX.
      return;
    }
    var isViewPreserved = (view === this.visibleView);
    this.switchView(view);

    if (isViewPreserved) {
      // Prevent dispatching two back-to-back `sidebarviewchanged` events,
      // since `this.switchView` dispatched the event if the view changed.
      this._dispatchEvent();
    }
  }

  /**
   * @param {number} view - The sidebar view that should be switched to,
   *                        must be one of the values in {SidebarView}.
   * @param {boolean} forceOpen - (optional) Ensure that the sidebar is open.
   *                              The default value is `false`.
   */
  switchView(view, forceOpen = false) {
    if (view === SidebarView.NONE) {
      this.close();
      return;
    }
    var isViewChanged = (view !== this.active);
    var shouldForceRendering = false;

    switch (view) {
      case SidebarView.THUMBS:
        THRONHelper.addClass(this.THRONThumbnailButton, 'th-button-color-active');
        THRONHelper.removeClass(this.THRONOutlineButton, 'th-button-color-active');
        THRONHelper.removeClass(this.THRONAttachmentsButton, 'th-button-color-active');

        THRONHelper.removeClass(this.thumbnailView, 'th-hidden');
        THRONHelper.addClass(this.outlineView, 'th-hidden');
        THRONHelper.addClass(this.attachmentsView, 'th-hidden');

        if (this.isOpen && isViewChanged) {
          this._updateThumbnailViewer();
          shouldForceRendering = true;
        }
        break;
      case SidebarView.OUTLINE:
        THRONHelper.removeClass(this.THRONThumbnailButton, 'th-button-color-active');
        THRONHelper.addClass(this.THRONOutlineButton, 'th-button-color-active');
        THRONHelper.removeClass(this.THRONAttachmentsButton, 'th-button-color-active');

        THRONHelper.addClass(this.thumbnailView, 'th-hidden');
        THRONHelper.removeClass(this.outlineView, 'th-hidden');
        THRONHelper.addClass(this.attachmentsView, 'th-hidden');
        break;
      case SidebarView.ATTACHMENTS:
        THRONHelper.removeClass(this.THRONThumbnailButton, 'th-button-color-active');
        THRONHelper.removeClass(this.THRONOutlineButton, 'th-button-color-active');
        THRONHelper.addClass(this.THRONAttachmentsButton, 'th-button-color-active');

        THRONHelper.addClass(this.thumbnailView, 'th-hidden');
        THRONHelper.addClass(this.outlineView, 'th-hidden');
        THRONHelper.removeClass(this.attachmentsView, 'th-hidden');
        break;
      default:
        console.error('PDFSidebar_switchView: "' + view + '" is an unsupported value.');
        return;
    }
    // Update the active view *after* it has been validated above,
    // in order to prevent setting it to an invalid state.
    this.active = view | 0;

    if (forceOpen && !this.isOpen) {
      this.open();
      return; // NOTE: Opening will trigger rendering, and dispatch the event.
    }
    if (shouldForceRendering) {
      this._forceRendering();
    }
    if (isViewChanged) {
      this._dispatchEvent();
    }
  }

  open() {
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;

    if (this.active === SidebarView.THUMBS) {
      this._updateThumbnailViewer();
    }
    this._forceRendering();
    this._dispatchEvent();
  }

  close() {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;

    this._forceRendering();
    this._dispatchEvent();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * @private
   */
  _dispatchEvent() {
    this.eventBus.dispatch('sidebarviewchanged', {
      source: this,
      view: this.visibleView,
    });
  }

  /**
   * @private
   */
  _forceRendering() {
    if (this.onToggled) {
      this.onToggled();
    } else { // Fallback
      this.pdfViewer.forceRendering();
      this.pdfThumbnailViewer.forceRendering();
    }
  }

  /**
   * @private
   */
  _updateThumbnailViewer() {
    var pdfViewer = this.pdfViewer;
    var thumbnailViewer = this.pdfThumbnailViewer;

    // Use the rendered pages to set the corresponding thumbnail images.
    var pagesCount = pdfViewer.pagesCount;
    for (var pageIndex = 0; pageIndex < pagesCount; pageIndex++) {
      var pageView = pdfViewer.getPageView(pageIndex);
      if (pageView && pageView.renderingState === RenderingStates.FINISHED) {
        var thumbnailView = thumbnailViewer.getThumbnail(pageIndex);
        thumbnailView.setImage(pageView);
      }
    }
    thumbnailViewer.scrollThumbnailIntoView(pdfViewer.currentPageNumber);
  }

  /**
   * @private
   */
  _addEventListeners() {
    // Buttons for switching views.
    this.thumbnailButton.addEventListener('click', () => {
      this.switchView(SidebarView.THUMBS);
    });

    this.outlineButton.addEventListener('click', () => {
      if(THRONHelper.hasClass(this.THRONOutlineButton, 'th-button-disabled'))
        return;
      this.switchView(SidebarView.OUTLINE);
    });
    this.outlineButton.addEventListener('dblclick', () => {
      if(THRONHelper.hasClass(this.THRONOutlineButton, 'th-button-disabled'))
        return;
      this.pdfOutlineViewer.toggleOutlineTree();
    });

    this.attachmentsButton.addEventListener('click', () => {
      if(THRONHelper.hasClass(this.THRONAttachmentsButton, 'th-button-disabled'))
        return;
      this.switchView(SidebarView.ATTACHMENTS);
    });

    // Disable/enable views.
    this.eventBus.on('outlineloaded', (evt) => {
      var outlineCount = evt.outlineCount;

      if(!outlineCount && !THRONHelper.hasClass(this.outlineButton, 'th-button-disabled')) {
        THRONHelper.addClass(this.THRONOutlineButton, "th-button-disabled");
        this.switchView(SidebarView.THUMBS); // switch to thumbnails if there are no outline
      }
    });

    this.eventBus.on('attachmentsloaded', (evt) => {
      var attachmentsCount = evt.attachmentsCount;

      if(!attachmentsCount && !THRONHelper.hasClass(this.attachmentsButton, 'th-button-disabled')) {
        THRONHelper.addClass(this.THRONAttachmentsButton, "th-button-disabled");
        this.switchView(SidebarView.THUMBS); // switch to thumbnails if there are no attachments
      }
    });

    // Update the thumbnailViewer, if visible, when exiting presentation mode.
    this.eventBus.on('presentationmodechanged', (evt) => {
      if (!evt.active && !evt.switchInProgress && this.isThumbnailViewVisible) {
        this._updateThumbnailViewer();
      }
    });
  }
}

export {
  SidebarView,
  PDFSidebar,
};
