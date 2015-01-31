/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('underscore');
  var async = require('async');
  var Backbone = require('backbone');

  // App
  var settings = require('app/settings');
  var Aggregation = require('app/models/aggregation');

  var AggregationCollection = Backbone.Collection.extend({
    model: Aggregation,

    initialize: function(data, options) {
      _.bindAll(this, 'getCityData', 'getSourceData');
      console.log("Init", options);
      this.options = options;

      // If we are getting aggregations of all cities in the world
      if (options.type === 'cities') {
        this.createWorldModels();
      }

      // If we are getting aggregations for a list of sources
      if (options.type === 'sources') {
        this.sources = options.sources;
        this.createCityModels();
      }
    },

    getSourceData: function(url) {
      var req = $.get(url).done(function(data) {
        data = _.groupBy(data, 'source');
        _.each(data, function(d) {
          this.add({ data: d }, { parse: true });
        }.bind(this));
      }.bind(this)).fail(function(error){
        console.log("Error getting aggregation", error);
      });
    },

    createCityModels: function() {
      var params, url;
      var options = this.options;
      options.sources = this.sources.join(',');
      params = $.param(options);
      url = 'http://localdata-sensors-beta.herokuapp.com/api/v1/aggregations?' + params;
      this.getSourceData(url);
    },

    // Fetch the aggreation at a given URL
    // Create a model with the data and add it to this collection
    getCityData: function(url) {
      var req = $.get(url).done(function(data){
        this.add({ data: data }, { parse: true });
      }.bind(this)).fail(function(error){
        console.log("Error getting aggregation", error);
      });
    },

    // Get an aggregation for every city in the world
    createWorldModels: function() {
      var params, url, urls;
      urls = [];

      // Generate a list of URLs from the list of cities.
      _.each(settings.cities, function(city) {
        var options = this.options;
        options.city = city.properties.name;
        params = $.param(options);
        url = 'http://localdata-sensors-beta.herokuapp.com/api/v1/aggregations?' + params;
        urls.push(url);
      }.bind(this));

      // Get the data for all of the aggregations.
      _.each(urls, this.getCityData);

      // Alternatively, we can wait until all the data is loaded:
      // async.each(urls, this.getDataForURL, this.ready);
    },

    ready: function() {
      console.log("It's ready");
      this.trigger('ready');
    },


    // Get the aggregations grouped by measure (rather than by source)
    // TODO
    // Rewrite this to be simpler & quicker
    getMeasures: function() {
      var measures = {};

      // Get the longest list of timestamps
      // TODO
      // should compute this using the daterange...
      // With this stupid method we might lose timepoints...
      var longest = [];
      this.each(function(data) {
        var labels = data.get('sound').labels;
        if (labels.length > longest.length) {
          longest = labels;
        }
      });

      // Go over each source
      this.each(function(data) {

        // Go over each measure from the source
        _.each(data.toJSON(), function(measure, name) {

          // See if we've already started recording data for this measure
          if (!_.has(measures, name)) {
            measures[name] = {
              name: name,
              meta: settings.measureLabels[name],
              labels: measure.labels,
              values: []
            };
          }

          // Connect measuers and timestamps
          var times = {};
          _.each(measure.labels, function(timestamp, i) {
            times[timestamp] = measure.values[i];
          });

          // Reconstitute the values in order, filling in missing values
          var values = [];
          _.each(longest, function(timestamp) {
            if (_.has(times, timestamp)) {
              values.push(times[timestamp]);
            } else {
              // Stopgap vor missing values. Ideally we'd support undefined ranges
              values.push(0);
            }
          });

          // Store the values for this measure
          measures[name].labels = longest;
          measures[name].values.push({
            name: measure.source,
            data: values // measure.values
          });
        });
      });

      return _.values(measures);
    }
  });

  return AggregationCollection;
});
