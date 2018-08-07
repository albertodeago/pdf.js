import { BasePreferences } from '../preferences';
import { DownloadManager } from '../download_manager';
import { GenericL10n } from '../genericl10n';
import { PDFJS } from 'pdfjs-lib';


var THRONGenericCom = {}; // only God knows what is this used for

class GenericPreferences extends BasePreferences {
  _writeToStorage(prefObj) {
    return new Promise(function(resolve) {
      localStorage.setItem('pdfjs.preferences', JSON.stringify(prefObj));
      resolve();
    });
  }

  _readFromStorage(prefObj) {
    return new Promise(function(resolve) {
      var readPrefs = JSON.parse(localStorage.getItem('pdfjs.preferences'));
      resolve(readPrefs);
    });
  }
}

const getExternalServices = function (defaultExternalServices) {
  var GenericExternalServices = Object.create(defaultExternalServices);
  GenericExternalServices.createDownloadManager = function () {
    return new DownloadManager();
  };
  GenericExternalServices.createPreferences = function () {
    return new GenericPreferences();
  };
  GenericExternalServices.createL10n = function () {
    return new GenericL10n(PDFJS.locale);
  };

  return GenericExternalServices;
};

export {
  THRONGenericCom, getExternalServices
};
