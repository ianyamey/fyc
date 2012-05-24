"use strict";

// Create namespaces so the text-editor doesn't complain
var Ember = Ember || {};
var Handlebars = Handlebars || {};
var I18n = I18n || {};
var $ = $ || {};

Handlebars.registerHelper('t', function(str){
  return (I18n !== undefined ? I18n.t(str) : str);
});

var App = Ember.Application.create({
  host: "data",
  minimumSimilarity: 0.6,
  minimumSearchLength: 2,
  maximumResults: 4,
  searchTimeout: 8000,
  ready: function() {
    $("#loadingModal").modal({backdrop: "static", keyboard: false, show: false});
  }

});

App.Result = Ember.Object.extend({
  imageUrl: function() {
    return App.host + "/v2/visits/" + this.getPath("visit.id") + "/entry.jpg";
  }.property('visit.id'),
  mapUrl: function() {
    return App.host + "/v2/maps/" + this.getPath("map.name") + ".png";
  }.property('map.name')
});


App.searchController = Ember.ArrayController.create({
  content: null,
  searchText: "",
  isInvalid: function() {
    return this.get('searchText').length < App.minimumSearchLength;
  }.property('searchText'),
  similarity: function() {
    return (this.get('searchText').length < 4) ? 0.4 : App.minimumSimilarity;
  },
  limit: function() {
    return App.maximumResults;
  },
  noResults: function() {
    App.resultListController.set("noResults", true);
  },
  search: function(){
    var self = this;
    if (this.get("isInvalid")) {
      return;
    }
    self.set("isSearching", true);
    
    console.log('search for %@'.fmt( this.get('searchText') ));
    
    var baysUrl = App.host + "/v2/bays.json?visit.plate.text=" + this.get("searchText") + "~" + this.get("similarity") + "&is_occupied=true&order=-similarity&limit=" + this.get("limit");
    
    setTimeout(function() {
    $.ajax({
      dataType: 'json',
      url: baysUrl,
      crossDomain: true,
      timeout: App.searchTimeout,
      error: function () { },
      beforeSend: function () { },
      complete: function() { self.set("isSearching", false); },
      success: function (data) {
        var results = [];
        $.each(data, function() {
          results.push(self.createContactFromJSON(this));
        });
        if (results.length >= 1) {
          App.resultListController.set('content', results);
        } else {
          self.noResults();
        }
      }
    });
    }, 500);
  },
  createContactFromJSON: function(json) {
    return App.Result.create(json);
  }
});

App.resultListController = Ember.ArrayController.create({
  content: [],
  selected: null,
  searchTextBinding: 'App.searchController.searchText'
});

App.mapController = Ember.Object.create({
  contentBinding: 'App.resultListController.selected'
});

App.ResultsView = Ember.View.extend({
  noResults: function(event) {
    App.resultListController.set("noResults", true)
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
      App.resultListController.set("selected", this.get("content"));
    }
});

App.MapView = Ember.View.extend({
  scale: 0.5,
  content: null,
  markerStyle: function() {
    
    var x = this.get("scale") * this.getPath("content.position.x"),
        y = this.get("scale") * this.getPath("content.position.y");
        
    return "position: absolute; top: %@px; left: %@px".fmt(x,y);
  }.property("content", "scale")
});

