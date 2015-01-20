/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  var settings = require('app/settings');

  // Models
  var MeasureCollection = require('app/models/measureCollection');
  var CityModel = require('app/models/city');

  // Views
  var CityView = require('app/views/cityView');
  var SparklineCollectionView = require('app/views/sparklineCollectionView');

  var CityModule = function(CityModule, App, Backbone, Marionette, $, _) {
    CityModule.Router = Backbone.Marionette.AppRouter.extend({
      appRoutes: {
        '!/cities/:name': 'city'
      }
    });

    var routeController = {
      city: function(name) {
        console.log("Going to city", name);

        // Update the map
        console.log(settings.fakeSF);
        App.mapView.addLocations(settings.fakeSF.sensors);

        // Show the main city data
        var city = new CityModel({name: name});
        var cityView = new CityView({
          model: city
        });
        App.mainRegion.show(cityView);

        // Show the sparklines
        var measuresCollection = new MeasureCollection();
        measuresCollection.fetch();
        var sparklineView = new SparklineCollectionView({
          model: city,
          collection: measuresCollection
        });
        App.sparklineRegion.show(sparklineView);
      }
    };

    App.on('before:start', function() {
      var router = new CityModule.Router({
        controller: routeController
      });
    });
  };

  return CityModule;
});
