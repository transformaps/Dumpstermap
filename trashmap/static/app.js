var map;
L.mapbox.accessToken = 'pk.eyJ1IjoiZGViYWtlbCIsImEiOiJjMWVJWEdFIn0.WtaUd8Rh0rgHRiyEZNzSjQ';

window.onload = loadMap();
function loadMap() {
    // Karte laden
    map = L.map('map').setView([48.2633321, 10.8405515], 13);
    L.mapbox.tileLayer('mapbox.pirates', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'debakel.in6i4ino',
        accessToken: 'pk.eyJ1IjoiZGViYWtlbCIsImEiOiJjMWVJWEdFIn0.WtaUd8Rh0rgHRiyEZNzSjQ'
    }).addTo(map);

    L.control.locate().addTo(map);
   

    // Märkte holen
    var template_source = $("#market-template").html();
    var template = Handlebars.compile(template_source);

    function onEachFeature(feature, layer) {
        var context = feature.properties;
        var html = template(context);
        var popup = L.popup({minWidth: 333 }).setContent(html);
        layer.bindPopup(popup);
    }

    $.ajax({
        url: "/api/dumpster/all",
        cache: false
    })
        .done(function (response) {
            L.geoJson(JSON.parse(response), {onEachFeature: onEachFeature}).addTo(map);
        });
}


function send_vote(dumpster_id, voting) {
    $.ajax("/api/vote/" + dumpster_id + "/" + voting);
}
function send_comment(dumpster_id, name, comment) {
    $.post("/api/comments/add/" + dumpster_id,
            {'name': name, 'comment': comment}
        );
}
function getDumpsterId(){
    return id = $("#dumpster_id").val();
}
// Register buttons
$(document).on('click', '.btn_vote', function () {
    send_vote(getDumpsterId(), $(this).attr('voting'));
});
$(document).on('click', '#btn_comment', function (event) {
    event.preventDefault();
    var name = $("#txt_name").val();
    var comment = $("#txt_comment").val();
    var id = getDumpsterId();
    send_comment(id, name, comment);
});
