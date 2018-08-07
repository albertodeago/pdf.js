export default {

  hasClass: function(element, classname) {
    return element.className.indexOf(classname) > -1;
  },

  addClass: function(element, classname) {
    if(element.className.indexOf(classname) === -1) {
      element.className += " " + classname;
    }
  },

  removeClass: function(element, classname) {
    if(element.className.indexOf(classname) > -1) {
      element.className = element.className.replace(new RegExp('(?:^|\\s)'+ classname + '(?:\\s|$)'), ' ');
    }
  }
}
