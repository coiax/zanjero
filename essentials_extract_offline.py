#!/usr/bin/python
import argparse
import os
import os.path
import json

import yaml

def make_parser():
    p = argparse.ArgumentParser()
    p.add_argument('-o','--outfile', type=argparse.FileType('w'), default='-')
    p.add_argument('folder')
    return p

args = make_parser().parse_args()

files = os.listdir(args.folder)

worlds = {}

for filename in files:
    playername = filename.replace('.yml','')
    filename = os.path.join(args.folder, filename)
    with open(filename) as f:
        data = yaml.safe_load(f)
    try:
        locations = data['lastlocation']
        world = locations['world']
        if world not in worlds:
            worlds[world] = {}

        x = locations['x']
        y = locations['y']
        z = locations['z']
        worlds[world][playername] = {'coord':(x,y,z), 'status':'offline'}
    except KeyError:
        pass

json.dump(worlds, args.outfile, indent=1)
