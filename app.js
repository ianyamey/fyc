App = Ember.Application.create({
  host: "data",
  minimumSimilarity: 0.6,
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
    return this.get('searchText').length < 3;
  }.property('searchText'),
  similarity: function() {
    return (this.get('searchText').length < 4) ? 0.4 : App.minimumSimilarity;
  },
  limit: function() {
    return App.maximumResults;
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
    // http://stackoverflow.com/questions/1002367/jquery-ajax-jsonp-ignores-a-timeout-and-doesnt-fire-the-error-event
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
        App.resultListController.set('content', results);
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

App.SearchView = Ember.TextField.extend(Ember.TargetActionSupport, {
    valueBinding: 'App.searchController.searchText',
    insertNewline: function() {
        this.triggerAction();
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
    tagName: "li",
    adjustedIndex: function() {
        return this.getPath('_parentView.contentIndex') + 1;
    }.property(),
    click: function(event) {
      App.resultListController.set("selected", this.get("content"));
    }
});

App.MapView = Ember.View.extend({
  scale: 1

  markerStyle: function() {
    var controller = App.mapController;
    var x = this.get("scale") * controller.get("content.position.x"),
        y = this.get("scale") * controller.get("content.position.y");
        
        console.log(x,y)
        
    return "position: absolute; top: %@; left: %@".fmt(x,y);
  }
});

