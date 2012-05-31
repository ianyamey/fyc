"use strict";

// Create namespaces so the text-editor doesn't complain
var Ember = Ember || {};
var Handlebars = Handlebars || {};
var I18n = I18n || {};
var $ = $ || {};

Handlebars.registerHelper('t', function(str){
  return (I18n !== undefined ? I18n.t(str) : str);
});


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
  host: "data",
  minimumSimilarity: 0.6,
  minimumSearchLength: 2,
  maximumResults: 4,
  searchTimeout: 8000,
  ready: function() {
    $("#loadingModal").modal({backdrop: "static", keyboard: false, show: false});
    $("body").disableSelection();
  }
});

App.Destination = Ember.Object.extend({
  imageUrl: function() {
    return App.host + "/v2/visits/" + this.getPath("visit.id") + "/entry.jpg";
  }.property('visit.id'),
  mapUrl: function() {
    return App.host + "/v2/maps/" + this.getPath("map.name") + ".png";
  }.property('map.name')
});

App.Origin = Ember.Object.extend({
  mapUrl: function() {
    return App.host + "/v2/maps/" + this.getPath("map.name") + ".png";
  }.property('map.name')
});

App.searchController = Ember.ArrayController.create({
  content: null,
  reset: function() { this.set("searchText", ""); },
  searchText: "",
  isLoading: false,
  isInvalid: function() {
    return this.get('searchText').length < App.minimumSearchLength;
  }.property('searchText'),
  similarity: function() {
    return (this.get('searchText').length < 4) ? 0.4 : App.minimumSimilarity;
  },
  limit: function() {
    return App.maximumResults;
  },
  search: function(callback){
    var self = this;
    if (this.get("isInvalid")) {
      return;
    }
    self.set("isLoading", true);
        
    var baysUrl = App.host + "/v2/bays.json?visit.plate.text=" + this.get("searchText") + "~" + this.get("similarity") + "&is_occupied=true&order=-similarity&limit=" + this.get("limit");
    
    $.ajax({
      dataType: 'json',
      url: baysUrl,
      crossDomain: true,
      timeout: App.searchTimeout,
      error: function () { },
      beforeSend: function () { },
      complete: function() { self.set("isLoading", false); },
      success: function (data) {
        var results = [];
        $.each(data, function() {
          results.push(self.createDestinationFromJSON(this));
        });
        if (results.length >= 1) {
          App.resultsController.set('content', results);
          App.stateManager.goToState('resultsPage');
        } else {
          App.stateManager.goToState('noResultsPage');
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
        
    var waypointsUrl = App.host + "/v2/waypoints.json";
    
    $.ajax({
      dataType: 'json',
      url: waypointsUrl,
      crossDomain: true,
      timeout: App.searchTimeout,
      error: function () { },
      beforeSend: function () { },
      complete: function() { self.set("isLoading", false); },
      success: function (data) {
        var results = [];
        $.each(data, function() {
          results.push(self.createOriginFromJSON(this));
        });
        if (results.length >= 1) {
          // TODO: load this from app config
          var current = 2;
          self.set('origin', results[current]);
        }
      }
    });
  },
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
  scale: 0.5,
  markerStyle: function() {
    var x = this.get("scale") * this.getPath("content.position.x"),
        y = this.get("scale") * this.getPath("content.position.y");

    return "position: absolute; top: %@px; left: %@px".fmt(x,y);
  }.property("content", "scale")
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
      contentBinding: "App.resultsController.selected"
    })
  }),
  search: function(manager, context) {
    App.searchController.search();
    App.mapController.findWaypoints();
  },
  noResults: function(manager, context) {
    manager.goToState("noResultsPage");
  }
});


