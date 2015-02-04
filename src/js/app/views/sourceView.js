/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Chartist = require('chartist');
  var L = require('leaflet');
  var Marionette = require('marionette');

  // App
  var settings = require('app/settings');
  var util = require('app/util');

  // Models
  var AggregationCollection = require('app/models/aggregationCollection');
  var MeasureCollection = require('app/models/measureCollection');

  // Views
  var MeasureCollectionView = require('app/views/measureCollectionView');
  var ToolsView = require('app/views/toolsView');

  // Templates
  var template = require('text!templates/source.html');

  var SoureView = Marionette.LayoutView.extend({
    template: _.template(template),

    className: 'source',

    regions: {
      graphsRegion: '#graphs-region',
      toolsRegion: '#tools-region'
    },

    initialize: function() {
      _.bindAll(this, 'setGraphs');
    },

    setGraphs: function(span) {
      if (span === undefined) {
        span = 'day';
      }
      var sources = _.filter(settings.sources, { city: this.model.get('properties').name });

      var collectionOptions = {
        type: 'sources',
        sources: [this.model.get('properties').id],
        fields: settings.fieldsString,
        op: 'mean'
      };
      _.assign(collectionOptions, util.getTimeRange(span));

      var aggregationCollection = new AggregationCollection([], collectionOptions);
      aggregationCollection.on('ready', function() {
        var measureCollection = new MeasureCollection(aggregationCollection.getMeasures());
        var measuresView = new MeasureCollectionView({
          collection: measureCollection
        });
        this.getRegion('graphsRegion').show(measuresView);
      }.bind(this));
    },

    onBeforeShow: function() {
      // Get the graphs
      this.setGraphs('day');

      // Create the tools view
      var toolsView = new ToolsView({ });
      toolsView.on('time:setRange', this.setGraphs);
      this.getRegion('toolsRegion').show(toolsView);
    }
  });

  return SoureView;
});
