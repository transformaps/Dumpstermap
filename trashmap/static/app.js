L.mapbox.accessToken = 'pk.eyJ1IjoiZGViYWtlbCIsImEiOiJjMWVJWEdFIn0.WtaUd8Rh0rgHRiyEZNzSjQ';

// Handlebars Helpers

Handlebars.registerHelper('listItem', function (from, to, context, options) {
    /*
     * Item helper.
     *
     *  {{#listItem 2 6 articles}}
     *      {{> article }}
     *  {{/listItem}}
     *
     *
     *  @return n elements
     */
    var item = "";
    for (var i = from, j = to; i < j; i++) {
        item = item + options.fn(context[i]);
    }
    return item;
});

// Handlebars Templates
var templates = {
    'list_entry': Handlebars.compile($("#template_dumpster-list-entry").html())
};
var hb_dumpster_popup_template = $("#dumpster_popup_template").html();
var hb_dumpster_popup = Handlebars.compile(hb_dumpster_popup_template);

var hb_dumpster_popup_comments_template = $("#dumpster_popup_comments_template").html();
var hb_dumpster_popup_comments = Handlebars.compile(hb_dumpster_popup_comments_template);

var handlebars_dumpster_list_entry = Handlebars.compile($("#template_dumpster-list-entry").html());
// Globale variablen
var map, dumpsters_json, dumpster_layer, sidebar;

window.onload = init();
function init() {
    loadMap();
    loadMarkers();
}

function loadMap() {
    // Karte laden
    map = L.mapbox.map('map').setView([48.2633321, 10.8405515], 10);
    L.mapbox.tileLayer('mapbox.light', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'debakel.in6i4ino',
        accessToken: 'pk.eyJ1IjoiZGViYWtlbCIsImEiOiJjMWVJWEdFIn0.WtaUd8Rh0rgHRiyEZNzSjQ'
    }).addTo(map);

    // Location plugin
    L.control.locate().addTo(map);

    // Add sidebar
    sidebar = L.control.sidebar('sidebar').addTo(map);
}
function loadMarkers() {
    function makeMarker(feature, latlng) {
        function getMarkerOptions(feature) {
            /** All available marker-symbols here: https://www.mapbox.com/maki/ **/
            var votes = feature.properties.total_votes;
            var color;
            var size;
            if (votes == 0) {
                //color = "grey"; //white
                size = "small";
            }
            else if (votes < 0) {
                color = "#CC0000"; //red
                size = "small";
            }
            else if (votes > 0) {
                color = "#33CC33"; //green
                size = "small";
            }

            return {
                icon: L.mapbox.marker.icon({
                    'marker-size': size,
                    'marker-symbol': 'marker',
                    'marker-color': color
                })
            };
        }

        return L.marker(latlng, getMarkerOptions(feature));
    }

    function onEachFeature(feature, layer) {
        var data = feature.properties;
        var html = hb_dumpster_popup(data);
        var popup = L.popup({minWidth: 333}).setContent(html);
        layer.bindPopup(popup);
    }

    // Get geojson from server
    $.ajax({
        url: "/api/dumpster/all",
        cache: false
    })
        .done(function (response) {
            dumpsters_json = JSON.parse(response);
            dumpster_layer = L.geoJson(JSON.parse(response), {
                onEachFeature: onEachFeature, pointToLayer: makeMarker
            });
            dumpster_layer.addTo(map);
        });
}

// Api Calls
function send_vote(dumpster_id, voting, options) {
    $.ajax("/api/vote/" + dumpster_id + "/" + voting, options);
}
function send_comment(dumpster_id, name, comment, on_success) {
    $.post("/api/comments/add/" + dumpster_id,
        {'name': name, 'comment': comment},
        on_success
    );
}
function getDumpsterId() {
    return id = $("#dumpster_id").val();
}

// Register events
map.on('move', function () {
    $("#sidebar-dumpster-list").html("");
    // Get the map bounds - the top-left and bottom-right locations.
    bounds = map.getBounds();

    // For each marker, consider whether it is currently visible by comparing with the current map bounds.
    dumpster_layer.eachLayer(function (marker) {
        if (bounds.contains(marker.getLatLng())) {
            var html = templates.list_entry(marker.feature.properties);

            $("#sidebar-dumpster-list").append(html);
            $(html).click(function () {
                alert($(this).children("input").val());
            });
        }
    });


});
$(document).on('click', '.btn-vote', function () {
    send_vote(getDumpsterId(), $(this).attr('voting'),
        //Ajax options
        {
            // callback on success
            success: function (json) {
                //TODO: check result
                $(this).addClass('active');
                // count up
                var element = $(this).children("span[name=count]")
                var value = parseInt(element.text()) + 1;
                element.text(value);
            },
            context: $(this)
        }
    );
});
$(document).on('click', '#btn_comment', function (event) {
    event.preventDefault();
    var name = $("#txt_name").val();
    var comment = $("#txt_comment").val();
    var id = getDumpsterId();

    //update view
    var update_comments = function () {
        var comment = {'name': name, 'comment': comment, 'date': '?'};
        var html = hb_dumpster_popup_comments(comment);
        $(html).hide().appendTo("#comment_list").fadeIn(500);
    };

    send_comment(id, name, comment, update_comments);


});
