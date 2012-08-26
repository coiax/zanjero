var allimages;
var in_view;

var TILESIZE = 128;
var UPDATE_FREQUENCY = 125;

var WIDTH = 8;
var HEIGHT = 4;

function debug(thing) {
    _message(thing, "debug");
}
function info(thing) {
    _message(thing, "info");
}

function error(thing) {
    _message(thing, "error");
}

function _message(thing, level) {
    $('#debugdump').append('<span class="'+level+'">' + thing + '</span><br>')
}

function debug_clear() {
    $('#debugdump').empty();
}

function set_pins() {
    $.get("var/data/locations.json")
    .success(function(data) {
        use_locations(data);
    })
    .error(function() { error("Error when downloading locations"); });
}

function use_locations(locations) {
    // There are three coordinate systems. The tiles, the mc coordinates,
    // and the actual position on the page
    var topleft = in_view[0][0];
    var tx = topleft[0] * TILESIZE;
    var ty = topleft[1] * TILESIZE;

    var bottomrightrow = in_view[in_view.length - 1];
    var bottomright = bottomrightrow[bottomrightrow.length - 1];

    var bx = (bottomright[0] + 1) * TILESIZE;
    var by = (bottomright[1] + 1) * TILESIZE;

    var translation = locations['translation'];
    var players = locations['players'];

    $('.pinholder').empty();

    debug_clear();
    debug(['topleft',tx,ty,tx/TILESIZE,ty/TILESIZE]);

    for (var player in players) {
        var pcoord = players[player]['coord'];
        var status_ = players[player]['status'];
        px = (pcoord[2]*-1) + translation[0];
        // Yes I know it's technically Z, but w/e shut up
        py = (pcoord[0]) + translation[1];

        var rnd_x = Math.round(pcoord[0]);
        var rnd_y = Math.round(pcoord[1]);
        var rnd_z = Math.round(pcoord[2]);

        var fmt = "%s (%d, %d, %d)";
        var player_infodump = sprintf(fmt, player, rnd_x, rnd_y, rnd_z);

        if ((tx <= px && px <= bx) && (ty <= py && py <= by)) {

            if (true) {
                var x = px - tx;
                var y = py - ty;
            } else {
                var x = 0;
                var y = 0;
            }

            // Corrections so the point of the pin is on the coordinate
            x += -22;
            y += 10;

            var style = ' style="left:' + x + 'px; top:' + y + 'px;" ';
            if (status_ == "offline") {
                var class_ = ' class="pin offline" '
            } else if (status_ == "online") {
                var class_ = ' class="pin online" '
            }

            var tag = '<img' + class_ + style + 'src="defaults/icons/map_pin.svg">';

            $('.pinholder').append(tag);


        }
        if (status_ == "online") {
            info(player_infodump);
        } else {
            error(player_infodump);
        }
    }

}

function use_image_list() {
    debug(allimages.length + " images found.");
    generate_in_view();
    fill_viewport();

    setInterval(set_pins,UPDATE_FREQUENCY);
}

function generate_in_view() {
    in_view = [];
    var x = 0;
    var y = 0;

    var initial_x = 15;
    var initial_y = 58;


    max_x = initial_x + WIDTH;
    max_y = initial_y + HEIGHT;

    for (y = initial_y; y < max_y; y++) {
        var row = [];
        for (x = initial_x; x < max_x; x++) {
            row.push([x,y]);
        }
        in_view.push(row);
    }
}

function adjust_in_view(adjustment) {
    dx = adjustment[0];
    dy = adjustment[1];

    for (var i = 0; i < in_view.length; i++) {
        row = in_view[i];
        for (var j = 0; j < row.length; j++) {
            item = row[j];
            item[0] = item[0] + dx;
            item[1] = item[1] + dy;
        }
    }
}

function fill_viewport() {
    /*
    <img src="tiles/agnomen-0.0.0.png">
    <img src="tiles/agnomen-0.1.0.png">
    <img src="tiles/agnomen-0.2.0.png">
    <br>
    <img src="tiles/agnomen-0.0.1.png">
    <img src="tiles/agnomen-0.1.1.png">
    <img src="tiles/agnomen-0.2.1.png">
    */

    $('#mainviewport').empty();
    $('#mainviewport').append('<div class="pinholder"></div>')

    fmt = "agnomen-0.%d.%d.png";
    for (i = 0; i < in_view.length; i++) { 
        row = in_view[i];
        for (j = 0; j < row.length; j++) {
            item = row[j];
            str = sprintf(fmt, item[0], item[1]);
            var filename;
            filename = str;

            var tag = '<img class="tile" src="var/tiles/' + filename + '">';

            $('#mainviewport').append(tag);
        };

        $('#mainviewport').append('<br>');
    };


}

$(document).ready(function() {
    info("Page ready.");
    $.get("var/tiles/allimages.json")
    .success(function(data) {
        allimages = data;
        use_image_list();
    })
    .error(function() { error("Error when downloading tile list"); });

});

$(document).keydown(function(event) {
    var keycode = event.which;
    // left 37, up 38, right 39, down 40
    if (37 <= keycode && keycode <= 40) {
        event.preventDefault();

        var adjustment = {
            37: [-1,0],
            39: [1,0],
            38: [0,-1],
            40: [0,1],
        }

        var adj = adjustment[keycode];
        adjust_in_view(adj);
        fill_viewport();
        set_pins();
    }
});
