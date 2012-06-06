"use strict";

// Create namespaces so the text-editor doesn't complain
var Ember = Ember || {};
var Handlebars = Handlebars || {};
var I18n = I18n || {};
var $ = $ || {};

Handlebars.registerHelper('t', function(str){
  return (I18n !== undefined ? I18n.t(str) : str);
});

/* v1.3 */
/* https://github.com/farinspace/jquery.imgpreload */
if("undefined"!=typeof jQuery){(function(a){a.imgpreload=function(b,c){c=a.extend({},a.fn.imgpreload.defaults,c instanceof Function?{all:c}:c);if("string"==typeof b){b=new Array(b)}var d=new Array;a.each(b,function(e,f){var g=new Image;var h=f;var i=g;if("string"!=typeof f){h=a(f).attr("src");i=f}a(g).bind("load error",function(e){d.push(i);a.data(i,"loaded","error"==e.type?false:true);if(c.each instanceof Function){c.each.call(i)}if(d.length>=b.length&&c.all instanceof Function){c.all.call(d)}});g.src=h})};a.fn.imgpreload=function(b){a.imgpreload(this,b);return this};a.fn.imgpreload.defaults={each:null,all:null}})(jQuery)}

(function($){
$.fn.disableSelection = function() {
    return this.each(function() {           
        $(this).attr('unselectable', 'on')
               .css({
                   '-moz-user-select':'none',
                   '-webkit-user-select':'none',
                   'user-select':'none',
                   '-ms-user-select':'none'
               })
               .each(function() {
                   this.onselectstart = function() { return false; };
               });
    });
};
})(jQuery);


var App = Ember.Application.create({
  host: "data",//"http://10.99.3.1", //"data",
  minimumSimilarity: 0.5,
  minimumSearchLength: 2,
  maximumResults: 3,
  searchTimeout: 8000,
  mapScale: 0.5,
  waypointId: 1, // The id of the PASEServer waypoint
  ready: function() {
    
    $("body").disableSelection();
    
    App.mapController.findWaypoints();
  }
  
  
});

App.Marker = Ember.Object.extend({
  mapUrl: function() {
    return App.host + "/v2/maps/" + this.getPath("map.name") + ".png";
  }.property('map.name'),
  mapWidth: 0,
  init: function() {
    this._super();
    var img = new Image();
    var self = this;
    img.onload = function() {
      self.set("mapWidth",this.width);
    };
    img.src = this.get("mapUrl");
  }
});

App.Destination = App.Marker.extend({
  imageUrl: function() {
    return App.host + "/v2/visits/" + this.getPath("visit.id") + "/entry.jpg";
  }.property('visit.id')
});

App.Origin = App.Marker.extend({

});

App.searchController = Ember.ArrayController.create({
  content: null,
  reset: function() { this.set("searchText", ""); },
  searchText: "",
  isLoading: false,
  isInvalid: function() {
    return this.get('searchText').length < App.minimumSearchLength;
  }.property('searchText'),
  
  loading: function() {
    var m = $("#loadingModal").modal({backdrop: "static", keyboard: false, show: false});
    
    if (this.get("isLoading")) {
      m.modal("show");
    } else {
      m.modal("hide");
    }
  }.observes("isLoading"),
  
  similarity: function() {
    return (this.get('searchText').length < 4) ? App.minimumSimilarity / 2 : App.minimumSimilarity;
  }.property('searchText'),
  limit: function() {
    return App.maximumResults;
  }.property(),
  search: function(callback){
    var self = this;
    if (this.get("isInvalid")) { return; }
    self.set("isLoading", true);
    self.set("isError", false);
    
    var baysUrl = App.host + "/v2/bays.json?visit.plate.text=" + this.get("searchText") + "~" + this.get("similarity") + "&is_occupied=true&order=-similarity&limit=" + this.get("limit");
    
    $.ajax({
      url: baysUrl,
      crossDomain: true,
      timeout: App.searchTimeout,
      error: function () { self.set("isLoading", false); self.set("isError", true); },
      beforeSend: function () { },
      complete: function() {  },
      success: function (data) {
        var results = [];
        var preloadQueue = [];
        $.each(data, function() {
          var result = self.createDestinationFromJSON(this);
          results.push(result);
          preloadQueue.push(result.get("imageUrl"));
        });
        if (results.length >= 1) {
          App.resultsController.set('content', results);
          
          $.imgpreload(preloadQueue, function() {
            self.set("isLoading", false);
            App.stateManager.goToState('resultsPage');
          });
          
        } else {
          App.stateManager.goToState('noResultsPage');
          self.set("isLoading", false);
        }
        
      }
    });
  },
  createDestinationFromJSON: function(json) {
    return App.Destination.create(json);
  }
});

App.resultsController = Ember.ArrayController.create({
  content: [],
  reset: function() { this.set("content", []); this.set("selected", null); },
  selected: null,
  searchTextBinding: 'App.searchController.searchText'
});

App.mapController = Ember.Object.create({
  origin: null,
  destinationBinding: 'App.resultsController.selected',

  findWaypoints: function(callback){
    var self = this;

    self.set("isLoading", true);
        
    var waypointsUrl = /* App.host */ "data" + "/v2/waypoints/"+ App.waypointId +".json";
    
    $.ajax({
      dataType: 'json',
      url: waypointsUrl,
      crossDomain: true,
      timeout: App.searchTimeout,
      error: function () { },
      beforeSend: function () { },
      complete: function() { self.set("isLoading", false); },
      success: function (data) {
        self.set('origin', self.createOriginFromJSON(data));
      }
    });
  },
  onSameMap: function() {
    console.log(this.getPath("destination.map.name"), this.get("destination"))
    return this.getPath("destination.map.name") == this.getPath("origin.map.name");
  }.property("destination", "origin"),
  createOriginFromJSON: function(json) {
    return App.Origin.create(json);
  }

});

App.KeyboardView = Ember.View.extend({
  append: function(event) {
    var query = App.searchController.get('searchText') + $(event.target).text();
    App.searchController.set('searchText', query);
  },
  backspace: function() {
    var query = App.searchController.get('searchText').slice(0, -1);
    App.searchController.set('searchText', query);
  }
});


App.ResultView = Ember.View.extend({
  content: null,
  adjustedIndex: function() {
    return this.getPath('_parentView.contentIndex') + 1;
  }.property(),
  click: function(event) {
    App.resultsController.set("selected", this.get("content"));
    App.stateManager.goToState("mapPage");
  }
});

App.MapView = Ember.View.extend({
  didInsertElement: function() {    
    // Set the width once the view has been rendered
    var container = "#"+this.get("elementId");
    this.set('width', jQuery(container).width());
  },
  width: null,
  scale: function() {
    var usableWidth = this.get("width");
    var mapWidth = this.getPath('content.mapWidth');
    return (mapWidth > 0 ? usableWidth / mapWidth : 1);
  }.property('content.mapWidth','width'),
  mapStyle: function() {
    return "width: %@px".fmt(this.get("width"));
  }.property("width")
});

App.MarkerView = Ember.View.extend({
  style: function() {
    var x = this.getPath("parentView.scale") * this.getPath("content.position.x"),
        y = this.getPath("parentView.scale") * this.getPath("content.position.y");

    return "position: absolute; left: %@px; top: %@px".fmt(Math.round(x),Math.round(y));
  }.property("content", "parentView.scale")
});

App.stateManager = Ember.StateManager.create({
  initialState: 'searchPage',

  searchPage: Ember.ViewState.create({
    view: Ember.View.create({
      templateName: "search",
      layoutName: "layout"
    })
  }),
 
  resultsPage: Ember.ViewState.create({
    view: Ember.View.create({
      templateName: "results",
      layoutName: "layout"
    }),
  }),

  noResultsPage: Ember.ViewState.create({
    view: Ember.View.create({
      templateName: "no-results",
      layoutName: "layout"
    })
  }),
  
  mapPage: Ember.ViewState.create({
    view: Ember.View.create({
      templateName: "map",
      layoutName: "layout",

      
    })
  }),
  search: function(manager, context) {
    App.searchController.search();
  },
  noResults: function(manager, context) {
    manager.goToState("noResultsPage");
  }
});
