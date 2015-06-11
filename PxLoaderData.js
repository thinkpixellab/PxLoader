var PxLoaderData = function(url, tags, priority) {
  var self = this;
  var loader = null;

  // used by the loader to categorize and prioritize 
  this.tags = tags;
  this.priority = priority;

  this.request = new XMLHttpRequest();
  this.request.onload = this.onLoad;
  this.request.onerror = this.onError;

  // this.request.onreadystatechange = function () {
  //   if (self.request.readyState === 4) {
  //     if(self.request.status === 200){
  //       loader.onLoad(self);
  //     }else{
  //       loader.onError(self);
  //     }
  //   }
  // };

  // called by PxLoader to trigger download 
  this.start = function(pxLoader) {
    // we need the loader ref so we can notify upon completion 
    loader = pxLoader;

    // set up event handlers so we send the loader progress updates 

    // there are 3 possible events we can tell the loader about: 
    // loader.onLoad(self);    // the resource loaded 
    // loader.onError(self);   // an error occured 
    // loader.onTimeout(self); // timeout while waiting 

    self.request.open('GET', url, true);
    self.request.send(null);
  };

  // called by PxLoader to check status of image (fallback in case 
  // the event listeners are not triggered). 
  this.checkStatus = function() {
    if (self.request.status === 200) {
      loader.onLoad(self);
    }
  // report any status changes to the loader 
  // no need to do anything if nothing has changed 
  };

  // called by PxLoader when it is no longer waiting 
  this.onTimeout = function() {
    // must report a status to the loader: load, error, or timeout 
    if (self.request.status === 200) {
      loader.onLoad(self);
    } else {
      loader.onTimeout(self);
    }
  };

  this.onLoad = function(){
    loader.onLoad(self);
  };

  this.onError = function(){
    loader.onError(self);
  };

  // returns a name for the resource that can be used in logging 
  this.getName = function() {
    return url;
  };
};

module.exports = PxLoaderData;

