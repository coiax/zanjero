import MinecraftApi

import os
import os.path
import stat
import json
import tempfile
import argparse
import hashlib

kwargs = {
    'host' : 'spikey.ecs.soton.ac.uk',
    'username' : 'zanjero',
    'password' : 'c1a2b7f8ddf2841c41198edb448e9bb0',
    'salt' : 'jamtown',
    'port': 20059,
    'autoload_methods': False,
}

p = argparse.ArgumentParser()
p.add_argument('varfolder',default='./var',nargs='?')
p.add_argument('-H','--host',default='spikey.ecs.soton.ac.uk')

args = p.parse_args()

kwargs['host'] = args.host


offlinefile = os.path.join(args.varfolder, 'data/offline.json')

with open(os.path.join(args.varfolder, 'players')) as f:
    proper_players = f.read().split()

api = MinecraftApi.MinecraftJsonApi(**kwargs)

playersdata = api.call('getPlayers')

# Get the offline data, so we can merge with it
with open(offlinefile) as f:
    worlds = json.load(f)

for world in worlds.copy():
    for player in worlds[world].copy():
        for propername in proper_players:
            if player.lower() == propername.lower():
                tmp = worlds[world][player]
                del worlds[world][player]
                worlds[world][propername] = tmp
                break


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

dest = os.path.join(args.varfolder,'data/locations.json')

handle, pathname = tempfile.mkstemp()

os.chmod(pathname, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)

with open(pathname, 'w') as w:
    json.dump(worlds, w, indent=1)

rename = True

if os.path.exists(dest):
    with open(pathname) as f1, open(dest) as f2:
        h1 = hashlib.md5(f1.read()).digest()
        h2 = hashlib.md5(f2.read()).digest()

    if h1 == h2:
        rename = False

if rename:
    os.rename(pathname, dest)
else:
    os.unlink(pathname)
