var map, featureList;



$(window).resize(function() {

  sizeLayerControl();

});



$(document).on("click", ".feature-row", function(e) {

  $(document).off("mouseout", ".feature-row", clearHighlight);

  poibarClick(parseInt($(this).attr("id"), 10));

});



if ( !("ontouchstart" in window) ) {

  $(document).on("mouseover", ".feature-row", function(e) {

    highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));

  });

}



$(document).on("mouseout", ".feature-row", clearHighlight);



$("#about-btn").click(function() {

  $("#aboutModal").modal("show");

  $(".navbar-collapse.in").collapse("hide");

  return false;

});



$("#full-extent-btn").click(function() {

  map.fitBounds(royals.getBounds());

  $(".navbar-collapse.in").collapse("hide");

  return false;

});



$("#legend-btn").click(function() {

  $("#legendModal").modal("show");

  $(".navbar-collapse.in").collapse("hide");

  return false;

});



$("#login-btn").click(function() {

  $("#loginModal").modal("show");

  $(".navbar-collapse.in").collapse("hide");

  return false;

});



$("#list-btn").click(function() {

  animatepoibar();

  return false;

});



$("#nav-btn").click(function() {

  $(".navbar-collapse").collapse("toggle");

  return false;

});



$("#poibar-toggle-btn").click(function() {

  animatepoibar();

  return false;

});



$("#poibar-hide-btn").click(function() {

  animatepoibar();

  return false;

});



function animatepoibar() {

  $("#poibar").animate({

    width: "toggle"

  }, 350, function() {

    map.invalidateSize();

  });

}



function sizeLayerControl() {

  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);

}



function clearHighlight() {

  highlight.clearLayers();

}



function poibarClick(id) {

  var layer = markerClusters.getLayer(id);

  map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);

  layer.fire("click");

  /* Hide poibar and go to the map on small screens */

  if (document.body.clientWidth <= 767) {

    $("#poibar").hide();

    map.invalidateSize();

  }

}



function syncpoibar() {

  /* Empty poibar features */

  $("#feature-list tbody").empty();

  /* Loop through royals layer and add only features which are in the map bounds */

  royals.eachLayer(function (layer) {

    if (map.hasLayer(royalLayer)) {

      if (map.getBounds().contains(layer.getLatLng())) {

        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/royalsites.svg"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');

      }

    }

  });

  /* Loop through inaugurations layer and add only features which are in the map bounds */

  inaugurations.eachLayer(function (layer) {

    if (map.hasLayer(inaugurationLayer)) {

      if (map.getBounds().contains(layer.getLatLng())) {

        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/inauguration.svg"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');

      }

    }

  });

  

  

  /* Loop through keating layer and add only features which are in the map bounds */

  keating.eachLayer(function (layer) {

    if (map.hasLayer(keatingLayer)) {

      if (map.getBounds().contains(layer.getLatLng())) {

        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/division.svg"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');

      }

    }

  });

  

  

  

  

  

  

  

  

  

  

  

  

  

  /* Update list.js featureList */

  featureList = new List("features", {

    valueNames: ["feature-name"]

  });

  featureList.sort("feature-name", {

    order: "asc"

  });

}



/* Basemap Layers */

var cartoLight = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {

  maxZoom: 19,

  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'

});

var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {

	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'

});



var Esri_WorldShadedRelief = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {

	attribution: 'Tiles &copy; Esri &mdash; Source: Esri',

	maxZoom: 13

});













/* Overlay Layers */

var highlight = L.geoJson(null);

var highlightStyle = {

  stroke: false,

  fillColor: "#00FFFF",

  fillOpacity: 0.7,

  radius: 10

};





var rings = L.geoJson(null, {

  style: function (feature) {

    return {

      color: "#2c3c65",

      dashArray: "2 5",

	  fill: false,

      weight: 2,

	  opacity: 0.5,

      clickable: false

    };

  },

  onEachFeature: function (feature, layer) {

    

  }

});

$.getJSON("data/rings.geojson", function (data) {

  rings.addData(data);

});





/* Test KML Layer */

var VisabilityCloak = L.geoJson(null, {

  style: function (feature) {

    return {

      fill: false,

      weight: 1,

	  opacity: 0.5,

      clickable: false

    };

  },

  onEachFeature: function (feature, layer) {

    

  }

});

$.getJSON("data/K52-Uisneach@184/VisabilityCloak.geojson", function (data) {

  VisabilityCloak.addData(data);

});



/* Test Lat Long Layer */


L.latlngGraticule({
            showLabel: true,
            zoomInterval: [
                {start: 2, end: 3, interval: 30},
                {start: 4, end: 4, interval: 10},
                {start: 5, end: 7, interval: 5},
                {start: 8, end: 10, interval: 1}
            ]
        }).addTo(map);

        console.log(map.options.crs);



















var testarrow = new L.featureGroup();

var arrow = L.polyline([[57, -19], [60, -12]]).addTo(testarrow);

var arrowHead = L.polylineDecorator(arrow, {

    patterns: [

        {

            offset: '100%',

            repeat: 0,

            symbol: L.Symbol.arrowHead({pixelSize: 15, polygon: false, pathOptions: {color: '#f00', stroke: true}})

        }

    ]

}).addTo(testarrow);







// --- Arrow, with animation to demonstrate the use of setPatterns ---

    

	var testarrow2 = new L.featureGroup();

	var arrow = L.polyline([[58, -11], [63, -12]], {}).addTo(testarrow2);

    var arrowHead = L.polylineDecorator(arrow).addTo(testarrow2);



    var arrowOffset = 0;

    var anim = window.setInterval(function() {

        arrowHead.setPatterns([

            {offset: arrowOffset+'%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 15, polygon: false, pathOptions: {stroke: true}})}

        ])

        if(++arrowOffset > 100)

            arrowOffset = 0;

    }, 100);













var test2 = L.geoJson(null, {

  style: function (feature) {

    return {

      color: "#757575",

      dashArray: "10 3",

	  fill: false,

      weight: 1,

	  opacity: 1,

      clickable: false

    };

  },

  onEachFeature: function (feature, layer) {

    L.polylineDecorator(layer, {

        patterns: [

 { offset: 12, repeat: 25, symbol: L.Symbol.dash({pixelSize: 10, pathOptions: {color: '#f00', weight: 2}}) },

                { offset: 0, repeat: 25, symbol: L.Symbol.dash({pixelSize: 0}) }

        ]

    }).addTo(testarrow2);

 }

});

$.getJSON("data/klines.geojson", function (data) {

  test2.addData(data);

});





















// --- Test Custom Icons ---

var TestIcon = L.Icon.extend({

    options: {

        iconSize: [20, 20],

        locationsiconAnchor: [10, 10],

        popupAnchor: [0, -25]

    }

});



var sunriseIcon = new TestIcon({iconUrl: 'assets/img/sunrise.svg'}),

    sunsetIcon = new TestIcon({iconUrl: 'assets/img/sunset.svg'}),

    moonriseIcon = new TestIcon({iconUrl: 'assets/img/moonrise.svg'});

    moonsetIcon = new TestIcon({iconUrl: 'assets/img/moonset.svg'});



var promise = $.getJSON("data/celestialallignments.geojson");

    promise.then(function(data) {



        

        var allbusinesses = L.geoJson(data);



        // THIS IS NEW

        var sunrise = L.geoJson(data, {

            filter: function(feature, layer) {

                return feature.properties.IconType === "sunrise";

            },

            pointToLayer: function(feature, latlng) {

                return L.marker(latlng, {

                    icon: sunriseIcon

                });

            }

        });



        var sunset = L.geoJson(data, {

            filter: function(feature, layer) {

                return feature.properties.IconType === "sunset";

            },

            pointToLayer: function(feature, latlng) {

                return L.marker(latlng, {

                    icon: sunsetIcon

                });

            }

        });





        var moonrise = L.geoJson(data, {

            filter: function(feature, layer) {

                return feature.properties.IconType === "moonrise";

            },

            pointToLayer: function(feature, latlng) {

                return L.marker(latlng, {

                    icon: moonriseIcon

                });

            }

        });



        var moonset = L.geoJson(data, {

            filter: function(feature, layer) {

                return feature.properties.IconType === "moonset";

            },

            pointToLayer: function(feature, latlng) {

                return L.marker(latlng, {

                    icon: moonsetIcon

                });

            }

        });



       		

		// THIS IS NEW

        sunrise.addTo(subwayLines);

        sunset.addTo(subwayLines);

	    moonrise.addTo(subwayLines);

        moonset.addTo(subwayLines);

	

	});














/*var division1 = L.geoJson(null, {

  style: function (feature) {

    return {

      

	fillColor: "#ff7800",

    color: "#000",

    weight: 1,

    opacity: 0.5,

    fillOpacity: 0.5,

	dashArray: "4 4",

	clickable: false

    };

  },

  onEachFeature: function (feature, layer) {

    

  }

});

$.getJSON("data/division1.geojson", function (data) {

  division1.addData(data);

}); */







/*

//Create a color dictionary based off of Division1 id

var Division1Colours = {"1":"#ff3135", "2":"#ff3135", "3":"#009b2e", "4":"#009b2e",

    "5":"#fd9a00", "6":"#fd9a00", "7":"#2c3c65", "8":"#2c3c65", "9":"#2c3c65",

    "10":"#0EBFE9", "11":"#0EBFE9","12":"#2c3c65", "13":"#2c3c65", "14":"#fd9a00",

    "15":"#fd9a00", "16":"#009b2e", "17":"#009b2e", "18":"#ff3135", "19":"#ff3135",

    "GS":"#6e6e6e", "J":"#976900", "Z":"#976900", "L":"#969696", "N":"#ffff00",

    "Q":"#ffff00", "R":"#ffff00" };



var Division1Shapes = L.geoJson(null, {

  style: function (feature) {

      return {

        fillColor: Division1Colours[feature.properties.id],

        color: "#000",

        weight: 1,

        opacity: 0.5,

        fillOpacity: 0.5,

	    dashArray: "4 4",

	    clickable: false

      };

  },

  onEachFeature: function (feature, layer) {

    if (feature.properties) {

      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Division</th><td>" + feature.properties.Division + "</td></tr>" + "<tr><th>Line</th><td>" + feature.properties.Line + "</td></tr>" + "<table>";

      layer.on({

        click: function (e) {

          $("#feature-title").html(feature.properties.Line);

          $("#feature-info").html(content);

          $("#featureModal").modal("show");



        }

      });

    }

    layer.on({

      mouseover: function (e) {

        var layer = e.target;

        layer.setStyle({

          weight: 3,

          color: "#00FFFF",

          opacity: 1

        });

        if (!L.Browser.ie && !L.Browser.opera) {

          layer.bringToFront();

        }

      },

      mouseout: function (e) {

        Division1Shapes.resetStyle(e.target);

      }

    });

  }

});

$.getJSON("data/division1.geojson", function (data) {

  Division1Shapes.addData(data);

});



*/





var Division1Colours = {"1":"#C0D9AF", "2":"#77896C", "3":"#A6D785", "4":"#4DBD33",

    "5":"#525C65", "6":"#fd9a00", "7":"#2c3c65", "8":"#2c3c65", "9":"#2c3c65",

    "10":"#0EBFE9", "11":"#0EBFE9","12":"#2c3c65", "13":"#2c3c65", "14":"#fd9a00",

    "15":"#fd9a00", "16":"#009b2e", "17":"#009b2e", "18":"#ff3135", "19":"#ff3135",

    "GS":"#6e6e6e", "J":"#976900", "Z":"#976900", "L":"#969696", "N":"#ffff00",

    "Q":"#ffff00", "R":"#ffff00" };



var Division1Shapes = L.geoJson(null, {

  style: function (feature) {

      return {

        fillColor: Division1Colours[feature.properties.id],

        color: "#596C56",

        weight: 1.5,

        opacity: 0.5,

        fillOpacity: 0.25,

	    dashArray: "4 4",

	    clickable: false

      };

  },

  onEachFeature: function (feature, layer) {

    if (feature.properties) {

      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Division</th><td>" + feature.properties.Division + "</td></tr>" + "<tr><th>Line</th><td>" + feature.properties.Line + "</td></tr>" + "<table>";

      layer.on({

        click: function (e) {

          $("#feature-title").html(feature.properties.Line);

          $("#feature-info").html(content);

          $("#featureModal").modal("show");



        }

      });

    }

    layer.on({

      mouseover: function (e) {

        var layer = e.target;

        layer.setStyle({

          weight: 3,

          color: "#00FFFF",

          opacity: 1

        });

        if (!L.Browser.ie && !L.Browser.opera) {

          layer.bringToFront();

        }

      },

      mouseout: function (e) {

        Division1Shapes.resetStyle(e.target);

      }

    });

  }

});

$.getJSON("data/firbolg.geojson", function (data) {

  Division1Shapes.addData(data);

});









































































var radials = L.geoJson(null, {

  style: function (feature) {

    return {

      color: "#757575",

      dashArray: "10 3",

	  fill: false,

      weight: 1,

	  opacity: 1,

      clickable: false

    };

  },

  onEachFeature: function (feature, layer) {

    

  }

});

$.getJSON("data/klines.geojson", function (data) {

  radials.addData(data);

});



















//Create a color dictionary based off of subway route_id

var subwayColors = {"1":"#ff3135", "2":"#ff3135", "3":"#009b2e", "4":"#009b2e",

    "5":"#fd9a00", "6":"#fd9a00", "7":"#2c3c65", "8":"#2c3c65", "9":"#2c3c65",

    "10":"#0EBFE9", "11":"#0EBFE9","12":"#2c3c65", "13":"#2c3c65", "14":"#fd9a00",

    "15":"#fd9a00", "16":"#009b2e", "17":"#009b2e", "18":"#ff3135", "19":"#ff3135",

    "GS":"#6e6e6e", "J":"#976900", "Z":"#976900", "L":"#969696", "N":"#ffff00",

    "Q":"#ffff00", "R":"#ffff00" };



var subwayLines = L.geoJson(null, {

  style: function (feature) {

      return {

        color: subwayColors[feature.properties.route_id],

        weight: 2,

        opacity: 0.5,

		dashArray: "2 5"

      };

  },

  onEachFeature: function (feature, layer) {

    if (feature.properties) {

      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Division</th><td>" + feature.properties.Division + "</td></tr>" + "<tr><th>Line</th><td>" + feature.properties.Line + "</td></tr>" + "<table>";

      layer.on({

        click: function (e) {

          $("#feature-title").html(feature.properties.Line);

          $("#feature-info").html(content);

          $("#featureModal").modal("show");



        }

      });

    }

    layer.on({

      mouseover: function (e) {

        var layer = e.target;

        layer.setStyle({

          weight: 3,

          color: "#00FFFF",

          opacity: 1

        });

        if (!L.Browser.ie && !L.Browser.opera) {

          layer.bringToFront();

        }

      },

      mouseout: function (e) {

        subwayLines.resetStyle(e.target);

      }

    });

  }

});

$.getJSON("data/subways.geojson", function (data) {

  subwayLines.addData(data);

});















/* Single marker cluster layer to hold all clusters */

var markerClusters = new L.MarkerClusterGroup({

  spiderfyOnMaxZoom: true,

  showCoverageOnHover: false,

  zoomToBoundsOnClick: true,

  disableClusteringAtZoom: 5

});





















/* Empty layer placeholder to add to layer control for listening when to add/remove royals to markerClusters layer */

var royalLayer = L.geoJson(null);

var royals = L.geoJson(null, {

  pointToLayer: function (feature, latlng) {

    return L.marker(latlng, {

      icon: L.icon({

        iconUrl: "assets/img/royalsites.svg",

        iconSize: [20, 20],

        iconAnchor: [10, 10],

        popupAnchor: [0, -25]

      }),

      title: feature.properties.NAME,

      riseOnHover: true

    });

  },

  onEachFeature: function (feature, layer) {

    if (feature.properties) {

      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.NAME + "</td></tr>" + "<tr><th>Description</th><td>" + feature.properties.DESCRIPTION + "</td></tr>" + "<tr><th>Address</th><td>" + feature.properties.ADDRESS1 + "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.URL + "' target='_blank'>" + feature.properties.URL + "</a></td></tr>" + "<table>";

      layer.on({

        click: function (e) {

          $("#feature-title").html(feature.properties.NAME);

          $("#feature-info").html(content);

          $("#featureModal").modal("show");

          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));

        }

      });

      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/royalsites.svg"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');

      

    }

  }

});

$.getJSON("data/Royal_Sites.geojson", function (data) {

  royals.addData(data);

  map.addLayer(royalLayer);

});



/* Empty layer placeholder to add to layer control for listening when to add/remove inaugurations to markerClusters layer */

var inaugurationLayer = L.geoJson(null);

var inaugurations = L.geoJson(null, {

  pointToLayer: function (feature, latlng) {

    return L.marker(latlng, {

      icon: L.icon({

        iconUrl: "assets/img/inauguration.svg",

        iconSize: [20, 20],

        iconAnchor: [10, 10],

        popupAnchor: [0, -25]

      }),

      title: feature.properties.NAME,

      riseOnHover: true

    });

  },

  onEachFeature: function (feature, layer) {

    if (feature.properties) {

      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.NAME + "</td></tr>" + "<tr><th>Phone</th><td>" + feature.properties.TEL + "</td></tr>" + "<tr><th>Address</th><td>" + feature.properties.ADRESS1 + "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.URL + "' target='_blank'>" + feature.properties.URL + "</a></td></tr>" + "<table>";

      layer.on({

        click: function (e) {

          $("#feature-title").html(feature.properties.NAME);

          $("#feature-info").html(content);

          $("#featureModal").modal("show");

          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));

        }

      });

      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/inauguration.svg"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');

      

    }

  }

});

$.getJSON("data/Inauguration_Sites.geojson", function (data) {

  inaugurations.addData(data);

});







/* Empty layer placeholder to add to layer control for listening when to add/remove inaugurations to markerClusters layer */

var keatingLayer = L.geoJson(null);

var keating = L.geoJson(null, {

  pointToLayer: function (feature, latlng) {

    return L.marker(latlng, {

      icon: L.icon({

        iconUrl: "assets/img/division.svg",

        iconSize: [20, 20],

        iconAnchor: [10, 10],

        popupAnchor: [0, -25]

      }),

      title: feature.properties.NAME,

      riseOnHover: true

    });

  },

  onEachFeature: function (feature, layer) {

    if (feature.properties) {

      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.NAME + "</td></tr>" + "<tr><th>Phone</th><td>" + feature.properties.TEL + "</td></tr>" + "<tr><th>Address</th><td>" + feature.properties.ADRESS1 + "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.URL + "' target='_blank'>" + feature.properties.URL + "</a></td></tr>" + "<table>";

      layer.on({

        click: function (e) {

          $("#feature-title").html(feature.properties.NAME);

          $("#feature-info").html(content);

          $("#featureModal").modal("show");

          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));

        }

      });

      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/inauguration.svg"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');

      

    }

  }

});

$.getJSON("data/klocations.geojson", function (data) {

  keating.addData(data);

});







/* Empty layer placeholder to add to layer control for listening when to add/remove inaugurations to markerClusters layer */

var keysitesLayer = L.geoJson(null);

var keysites = L.geoJson(null, {

  pointToLayer: function (feature, latlng) {

    return L.marker(latlng, {

      icon: L.icon({

        iconUrl: "assets/img/division.svg",

        iconSize: [20, 20],

        iconAnchor: [10, 10],

        popupAnchor: [0, -25]

      }),

      title: feature.properties.NAME,

      riseOnHover: true

    });

  },

  onEachFeature: function (feature, layer) {

    if (feature.properties) {

      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.NAME + "</td></tr>" + "<tr><th>Phone</th><td>" + feature.properties.TEL + "</td></tr>" + "<tr><th>Address</th><td>" + feature.properties.ADRESS1 + "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.URL + "' target='_blank'>" + feature.properties.URL + "</a></td></tr>" + "<table>";

      layer.on({

        click: function (e) {

          $("#feature-title").html(feature.properties.NAME);

          $("#feature-info").html(content);

          $("#featureModal").modal("show");

          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));

        }

      });

      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/inauguration.svg"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');

      

    }

  }

});

$.getJSON("data/keysites.geojson", function (data) {

  keysites.addData(data);

});







































































map = L.map("map", {

  zoom: 7,

  center: [53.48692, -7.56549],

  layers: [cartoLight, markerClusters, highlight],

  zoomControl: false,

  attributionControl: false

});



/* Layer control listeners that allow for a single markerClusters layer */

map.on("overlayadd", function(e) {

  if (e.layer === royalLayer) {

    markerClusters.addLayer(royals);

    syncpoibar();

  }

  if (e.layer === inaugurationLayer) {

    markerClusters.addLayer(inaugurations);

    syncpoibar();

  }

if (e.layer === keatingLayer) {

    markerClusters.addLayer(keating);

    syncpoibar();

  }

if (e.layer === keysitesLayer) {

    markerClusters.addLayer(keysites);

    syncpoibar();

  }



});





map.on("overlayremove", function(e) {

  if (e.layer === royalLayer) {

    markerClusters.removeLayer(royals);

    syncpoibar();

  }

  if (e.layer === inaugurationLayer) {

    markerClusters.removeLayer(inaugurations);

    syncpoibar();

  }

if (e.layer === keatingLayer) {

    markerClusters.removeLayer(keating);

    syncpoibar();

  }



if (e.layer === keysitesLayer) {

    markerClusters.removeLayer(keysites);

    syncpoibar();

  }







});



/* Filter poibar feature list to only show features in current map bounds */

map.on("moveend", function (e) {

  syncpoibar();

});



/* Clear feature highlight when map is clicked */

map.on("click", function(e) {

  highlight.clearLayers();

});



/* Zoom Control */



var zoomControl = L.control.zoom({

  position: "topleft"

}).addTo(map);







/* Larger screens get expanded layer control and visible poibar */

if (document.body.clientWidth <= 767) {

  var isCollapsed = true;

} else {

  var isCollapsed = false;

}



var baseLayers = {

  "Street Map": cartoLight,

  "Aerial Imagery": Esri_WorldImagery,

  "Hill Shade": Esri_WorldShadedRelief

};



var groupedOverlays = {

  "Points of Interest": {

    "<img src='assets/img/royalsites.svg' width='20' height='20'>&nbsp;Royal Sites": royalLayer,

    "<img src='assets/img/inauguration.svg' width='20' height='20'>&nbsp;Inauguration Sites": inaugurationLayer,

    

  },

  "Reference": {

    "Rings": rings,

	"VisabiltyCloak": VisabilityCloak,

	"Testarrow": testarrow,

	"Testarrow2": testarrow2,

	"Allignments": subwayLines



  },

  "Keatings Divisions": {

  "Radials": radials,

 /* "Division1": division1,*/

  "Division1": Division1Shapes,

  "<img src='assets/img/division.svg' width='20' height='20'>&nbsp;Keating Sites": keatingLayer,

  "<img src='assets/img/division.svg' width='20' height='20'>&nbsp;Key Sites": keysitesLayer

  }

  

};



var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {

  collapsed: isCollapsed

}).addTo(map);











/* Typeahead search functionality */

$(document).one("ajaxStop", function () {

  $("#loading").hide();

  sizeLayerControl();

  /* Fit map to royals bounds */

  map.fitBounds(royals.getBounds());

  featureList = new List("features", {valueNames: ["feature-name"]});

  featureList.sort("feature-name", {order:"asc"});



  });



  

  



  



// Leaflet patch to make layer control scrollable on touch browsers

var container = $(".leaflet-control-layers")[0];

if (!L.Browser.touch) {

  L.DomEvent

  .disableClickPropagation(container)

  .disableScrollPropagation(container);

} else {

  L.DomEvent.disableClickPropagation(container);

}

