var translation = {};
var topleft;
var locations;

var TILESIZE = 128;
var UPDATE_FREQUENCY = 200;

var zoom = 0;
var world;

var mouse_pos = false;

// debug things
var counter = 0;

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
    // Debug
    counter += 1;
    $('#counter').html(counter);
    // gubeD

    $.get("var/data/locations.json")
    .success(function(data) {
        locations = data;
        use_locations(data);
    })
    .error(function() { error("Error when downloading locations"); });
}

function translation_zoom(translation, zoom) {

}

function use_locations(locations) {
    // There are three coordinate systems. The tiles, the mc coordinates,
    // and the actual position on the page
    var zoompower = Math.pow(2, zoom);
    var tx = topleft[0];
    var ty = topleft[1];

    var widthheight = get_viewport_wh();
    var bottomright = get_viewport_br();

    var bx = bottomright[0];
    var by = bottomright[1];

    var players = locations[world];

    //debug_clear();
    //debug(['topleft',tx,ty,tx/TILESIZE,ty/TILESIZE]);
    //
    for (var worldname in locations) {

        if (!(worldname in translation)) {
            // No point putting players on the map if we don't know where
            // they are relative to anything.
            continue;
        }

        for (var player in locations[worldname]) {
            var in_current_world = (worldname == world);
            var pcoord = locations[worldname][player]['coord'];
            var status_ = locations[worldname][player]['status'];
            px = ((pcoord[2]*-1) + translation[worldname][0]) / zoompower;
            // Yes I know it's technically Z, but w/e shut up
            py = ((pcoord[0]) + translation[worldname][1]) / zoompower;

            var rnd_x = Math.round(pcoord[0]);
            var rnd_y = Math.round(pcoord[1]);
            var rnd_z = Math.round(pcoord[2]);

            var fmt = "%s (%d, %d, %d)";
            var player_infodump = sprintf(fmt, player, rnd_x, rnd_y, rnd_z);


            var icon_id = '#icon_' + player;
            var onlineicon_id = '#onlineicon_' + player;

            if ($(icon_id).length) {
                // Do nothing, icon already exists.
            } else {
                var class_ = 'class="pin"'
                var src = 'src="var/icons/' + player + '-icon.png"';
                var id_ = sprintf('id="icon_%s"', player);

                var tag = sprintf('<img %s %s style="display: none" %s>',class_, id_, src);
                $('.pinholder').append(tag);
            }

            var onlinespan = '#' + worldname + '-online';

            if ($(onlineicon_id).length) {
                // icon exists
                if ($(sprintf('%s %s', onlinespan,onlineicon_id)).length) {
                    // icon is inside current world
                } else {
                    var elem = $(onlineicon_id).detach();
                    elem.appendTo(onlinespan);
                }

                if (status_ == 'online') {
                    $(onlineicon_id).attr('style', "");
                } else {
                    $(onlineicon_id).attr('style', "display: none;");
                }
            } else {
                var id_ = sprintf('id="onlineicon_%s"', player);
                var style = 'style="display: none"';
                var fmt = '<img class="statuspin" src="var/icons/%s-icon.png" %s %s>';
                var tag = sprintf(fmt, player, id_, style);
                $('span#' + worldname + '-online').append(tag);


                $('#onlineicon_' + player).click(function() {
                    focus_on_player($(this).data('playername'));
                }).data('playername', player);
            }

            if ((tx <= px && px <= bx) &&
                    (ty <= py && py <= by) &&
                    in_current_world) {

                if (true) {
                    var x = px - tx;
                    var y = py - ty;
                } else {
                    var x = 0;
                    var y = 0;
                }

                // Corrections so the point of the pin is on the coordinate
                x += -8;
                y += -32;

                var style = sprintf('left:%dpx; top:%dpx;', x, y);

                $(icon_id).attr('style', style);

                if (status_ == "online") {
                    $(icon_id).removeClass("offline").addClass("online");
                } else if (status_ == "offline") {
                    $(icon_id).removeClass("online").addClass("offline");
                }
            } else {
                $(icon_id).attr('style', 'display: none;');
            }
        }
    }

}

function get_tile(name,x,y,zoom) {
    fmt = "var/tiles/%s-%d.%d.%d.png";
    return sprintf(fmt, name, zoom, x, y);
};

function main() {
    // Everything starts here.
    $('.tile').remove();

    bottomright = get_viewport_br();

    tiles_per_side = viewport_wh.map(function(item) {
        return Math.floor(item / TILESIZE) + 3;
    });

    first_tile = topleft.map(function(item) {
        return Math.floor(item / (TILESIZE)) - 1;
    });

    var y, x;

    for (y = first_tile[1]; y < first_tile[1] + tiles_per_side[1]; y++) {
        for (x = first_tile[0]; x < first_tile[0] + tiles_per_side[0]; x++) {
            var tile_src = get_tile(world,x,y,zoom);
            // Determine absolute coordinates for tile
            var zoompower = Math.pow(2, zoom)
            var tile_abscoord = [
                x*TILESIZE,
                y*TILESIZE];

            var left = (tile_abscoord[0] - topleft[0]);
            var top_ = (tile_abscoord[1] - topleft[1]);

            var fmt = '<img class="tile" src="%s" style="position: absolute; left: %dpx; top: %dpx">';

            $('#mainviewport').append(sprintf(fmt, tile_src, left, top_));
        };
    };


}

function get_viewport_wh() {
    return [$('#mainviewport').width(), $('#mainviewport').height()];
}

function get_viewport_br() {
    viewport_wh = get_viewport_wh();
    bottomright = [topleft[0] + viewport_wh[0],
                topleft[1] + viewport_wh[1]];
    return bottomright;
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
        set_pins();

        mouse_pos = new_;
    };
};

function set_zoom(newzoom) {
    var oldzoom = zoom;
    var current_topleft = topleft;
    var current_bottomright = get_viewport_br();

    var midpoint = [];
    for (var i=0; i < current_topleft.length; i++) {
        midpoint.push((current_topleft[i] + current_bottomright[i]) / 2)
    }

    // We need to keep this midpoint when we're zooming
    var zoom_difference = oldzoom - newzoom;
    var zoom_diff_power = Math.pow(2, zoom_difference);

    midpoint[0] *= zoom_diff_power;
    midpoint[1] *= zoom_diff_power;

    // Now we have the new midpoint, we can determine the new topleft
    zoom = newzoom;
    $('#z' + newzoom).prop('checked', true);

    topleft = get_topleft_from_midpoint(midpoint);

    main();
    set_pins();
};

function get_topleft_from_midpoint(midpoint) {
    var widthheight = get_viewport_wh();

    new_topleft = [midpoint[0] - (widthheight[0]/2),
                midpoint[1] - (widthheight[1]/2)];

    return new_topleft;
};

function set_world(newworld) {
    // A whole new world
    // A new fantastic point of view
    // No one to tell us no or where to go
    // Or say we're only dreaming

    world = newworld;

    // Reset zoom to 0
    zoom = 0;
    $('#z0').prop('checked', true);

    // We'll centre the new world on (0,0) in MC coord
    debug(translation);
    var midpoint = translation[newworld];

    if (midpoint != undefined) {
        topleft = get_topleft_from_midpoint(midpoint);
    } else {
        // FALL BACK TO THE HILLS
        topleft = [0,0];
        error("No translation found for " + world);
        // (they're coming from the hills)
    };

    main();
    set_pins();

};

function focus_on_player(playername) {
    // Determine worldname
    var selected_worldname;
    for (worldname in locations) {
        if (playername in locations[worldname]) {
            selected_worldname = worldname;
            break;
        };
    };

    if (selected_worldname != undefined) {
        var selected_world = locations[selected_worldname];

    };

    // Determine the abscoords of that player
    var pcoord = selected_world[playername]['coord'];
    var world_translation = translation[selected_worldname];

    var zoompower = Math.pow(2, zoom);

    var px = ((pcoord[2]*-1) + world_translation[0]) / zoompower;
        // Yes I know it's technically Z, but w/e shut up
    var py = ((pcoord[0]) + world_translation[1]) / zoompower;

    var previous_world = world;
    var previous_zoom = zoom;

    set_world(selected_worldname);

    if (previous_world == selected_worldname) {
        set_zoom(previous_zoom);
    };


    $(sprintf('input[value=%s]', selected_worldname)).prop('checked',true);
    topleft = get_topleft_from_midpoint([px,py]);
    main();
    set_pins();

};

$(document).ready(function() {
    info("Page ready.");

    // True to display debug
    if (false) {
        $('.debughidden').removeClass('debughidden');
    };


    $.get("var/data/translation.json")
    .success(function(data) {
        translation = data;
        got_translation();
    })
    .error(function() {
        error("Error when downloading translation.");
        translation = {};
        got_translation();
    });
});

function got_translation() {
    var zoompower = Math.pow(2, zoom);

    topleft = [1950, 7474];

    set_zoom(0); // starting zoom
    $('#z0').prop('checked', true);

    // starting world is agnomen
    set_world('agnomen');
    $('#w0').prop('checked', true);

    $('input[type=radio][name=zoom]').change(function(event) {
        var val = $('input[type=radio][name=zoom]:checked').val();
        set_zoom(parseInt(val));
    });

    $('input[type=radio][name=world]').change(function(event) {
        var val = $('input[type=radio][name=world]:checked').val();
        set_world(val);
    });

    topleft[0] /= zoompower;
    topleft[1] /= zoompower;

    info(get_viewport_wh());


    main();
    setInterval(set_pins,UPDATE_FREQUENCY);

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

};

$(window).resize(function() {
    //On document resize, do things
    info("Resized: " + get_viewport_wh());
    main();
    set_pins();
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
        set_pins();
    }
});
