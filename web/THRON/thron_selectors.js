
const BASE_SELECTORS = {
  SIDEBAR_BUTTON: ".th-sidebar__toolbar__buttons__button",
  SIDEBAR_VIEW: ".th-sidebar__content",
};
const THRONSelectors = {
  BUTTONS: {
    THUMBNAIL: BASE_SELECTORS.SIDEBAR_BUTTON + "--thumbnail",
    OUTLINE: BASE_SELECTORS.SIDEBAR_BUTTON + "--outline",
    ATTACHMENTS: BASE_SELECTORS.SIDEBAR_BUTTON + "--attachments",
  },
  VIEWS: {
    THUMBNAIL: BASE_SELECTORS.SIDEBAR_VIEW + "__thumbnail",
    OUTLINE: BASE_SELECTORS.SIDEBAR_VIEW + "__outline",
    ATTACHMENTS: BASE_SELECTORS.SIDEBAR_VIEW + "__attachments"
  }
};

export { THRONSelectors };
