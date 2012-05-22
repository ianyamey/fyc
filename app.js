var Ember, App;

$(window).load(function() {
    "use strict";

    App = Ember.Application.create({
      host: "data",
      minimumSimilarity: 0.6,
      maximumResults: 4,
      searchTimeout: 8000
    });

    App.Result = Ember.Object.extend({
        image: function() {
            return App.host + "/v2/visits/" + this.getPath("visit.id") + "/entry.jpg";
        }.property('visit.id')
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
        console.log('search for %@'.fmt( this.get('searchText') ));
        
        
        var baysUrl = App.host + "/v2/bays.json?visit.plate.text=" + this.get("searchText") + "~" + this.get("similarity") + "&is_occupied=true&order=-similarity&limit=" + this.get("limit");
        
        // http://stackoverflow.com/questions/1002367/jquery-ajax-jsonp-ignores-a-timeout-and-doesnt-fire-the-error-event
        $.ajax({
          dataType: 'json',
          url: baysUrl,
          crossDomain: true,
          timeout: App.searchTimeout,
          context: this,
          error: function () { },
          beforeSend: function () { },
          complete: function () { },
          success: function (data) {
            var results = [];
            $.each(data, function() {
              console.log(this)
              results.push(App.Result.create(this));
            });
            this.set('content', results);
          }
        });
        
      }
    });

    App.SearchView = Ember.TextField.extend(Ember.TargetActionSupport, {
        valueBinding: 'App.searchController.searchText',
        insertNewline: function() {
            this.triggerAction();
        }
    });

    App.KeyboardView = Ember.View.extend({
        content: null,
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
        resultClicked: function() {
            console.log(this.getPath('result.visit.id'));
        }
    });



});