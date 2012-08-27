var allimages;
var translation;

var topleft;

var TILESIZE = 128;
var UPDATE_FREQUENCY = 125;

var mouse_pos = false;

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

    var players = locations['agnomen'];

    $('.pinholder').empty();

    //debug_clear();
    //debug(['topleft',tx,ty,tx/TILESIZE,ty/TILESIZE]);

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
            x += 1;
            y += 35;

            var style = ' style="left:' + x + 'px; top:' + y + 'px;" ';
            if (status_ == "offline") {
                var class_ = ' class="pin offline" '
            } else if (status_ == "online") {
                var class_ = ' class="pin online" '
            }

            var src = ' src="var/icons/' + player + '-icon.png" ';

            var tag = '<img' + class_ + style + src + '>';

            $('.pinholder').append(tag);


        }
        if (status_ == "online") {
            //info(player_infodump);
        } else {
            //error(player_infodump);
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

function get_tile(name,x,y) {
    fmt = "var/tiles/%s-0.%d.%d.png";
    return sprintf(fmt, name, x, y);
};

function main() {
    // Everything starts here.
    var world = "agnomen";

    $('#mainviewport').empty();

    viewport_wh = get_viewport_wh();

    bottomright = [topleft[0] + viewport_wh[0], topleft[1] + viewport_wh[1]];

    tiles_per_side = viewport_wh.map(function(item) {
        return Math.floor(item / TILESIZE) + 3;
    });

    first_tile = topleft.map(function(item) {
        return Math.floor(item / TILESIZE) - 1;
    });

    var y, x;

    for (y = first_tile[1]; y < first_tile[1] + tiles_per_side[1]; y++) {
        for (x = first_tile[0]; x < first_tile[0] + tiles_per_side[0]; x++) {
            var tile_src = get_tile(world,x,y);
            // Determine absolute coordinates for tile
            var tile_abscoord = [x*TILESIZE, y*TILESIZE];

            var left = tile_abscoord[0] - topleft[0];
            var top_ = tile_abscoord[1] - topleft[1];

            var fmt = '<img src="%s" style="position: absolute; left: %dpx; top: %dpx">';

            $('#mainviewport').append(sprintf(fmt, tile_src, left, top_));
        };
    };

}

function get_viewport_wh() {
    return [$('#mainviewport').width(), $('#mainviewport').height()];
}

function handle_mouse_move(event) {
    if (mouse_pos === false) {
        mouse_pos = [event.pageX, event.pageY];
    } else {
        old = mouse_pos;
        new_ = [event.pageX, event.pageY];

        diff_x = new_[0] - old[0];
        diff_y = new_[1] - old[1];

        topleft[0] -= diff_x;
        topleft[1] -= diff_y;
        main();

        mouse_pos = new_;
    };
};

$(document).ready(function() {
    info("Page ready.");
    topleft = [1950, 7474];
    info(get_viewport_wh());

    $.get("var/data/translation.json")
    .success(function(data) {
        translation = data;
    })
    .error(function() {
        error("Error when downloading translation.");
        translation = [0,0];
    });

    $.get("var/tiles/allimages.json")
    .success(function(data) {
        allimages = data;
    })
    .error(function() { error("Error when downloading tile list"); });

    main();

    $('#mainviewport')
    .mousedown(function(event) {
        event.preventDefault();
        mouse_pos = false;
        $('#mainviewport').on("mousemove", handle_mouse_move);
    })
    .mouseup(function(event) {
        event.preventDefault();
        mouse_pos = false;
        $('#mainviewport').off("mousemove");
    });

});

$(window).resize(function() {
    //On document resize, do things
    info("Resized: " + get_viewport_wh());
    main();
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

        topleft[0] += adj[0]*TILESIZE;
        topleft[1] += adj[1]*TILESIZE;
        main();
    }
});
