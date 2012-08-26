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

api = MinecraftApi.MinecraftJsonApi(**kwargs)

playersdata = api.call('getPlayers')
players = {}

for player in playersdata:
    world = player['worldInfo']

    if world['name'] == 'agnomen':
        playername = player['name']
        location = player['location']
        x = location['x']
        y = location['y']
        z = location['z']
        coord = (x,y,z)
        players[playername] = {'coord': coord, 'status': 'online'}

# Then merge with the offline data
with open(offlinefile) as f:
    offline = json.load(f)

offline['players'].update(players)

dest = '../var/data/locations.json'

handle, pathname = tempfile.mkstemp()

os.chmod(pathname, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)

with open(pathname, 'w') as w:
    json.dump(offline, w, indent=1)

os.rename(pathname, dest)
