import MinecraftApi

import os
import stat
import json
import tempfile

kwargs = {
    'host' : 'spikey.ecs.soton.ac.uk',
    'username' : 'zanjero',
    'password' : 'c1a2b7f8ddf2841c41198edb448e9bb0',
    'salt' : 'jamtown',
    'port': 20059,
    'autoload_methods': False,
}

offlinefile = '../var/data/offline.json'

with open('../var/players') as f:
    proper_players = f.read().split()

api = MinecraftApi.MinecraftJsonApi(**kwargs)

playersdata = api.call('getPlayers')

# Get the offline data, so we can merge with it
with open(offlinefile) as f:
    worlds = json.load(f)

for player in playersdata:
    world = player['worldInfo']['name']

    if world not in worlds:
        worlds[world] = {}

    playername = player['name']

    for propername in proper_players:
        if propername.lower() == playername.lower():
            playername = propername

    location = player['location']
    x = location['x']
    y = location['y']
    z = location['z']
    coord = (x,y,z)
    worlds[world][playername] = {'coord': coord, 'status': 'online'}

dest = '../var/data/locations.json'

handle, pathname = tempfile.mkstemp()

os.chmod(pathname, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)

with open(pathname, 'w') as w:
    json.dump(worlds, w, indent=1)

os.rename(pathname, dest)
