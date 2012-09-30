import argparse
import os
import os.path

p = argparse.ArgumentParser()
p.add_argument('worlds',nargs="+")
p.add_argument('-o','--out',default='./var/players')

args = p.parse_args()
players = set()

for world in args.worlds:
    for file in os.listdir(world):
        # Strip the .dat extension
        players.add(file[:-4])

current_players = set()

if os.path.exists(args.out):
    with open(args.out, 'r') as f:
        for player in f.read().split():
            current_players.add(player)

new_players = players | current_players

with open(args.out, 'w') as f:
    for player in new_players:
        f.write("{0}\n".format(player))
print "Written {0} players.".format(len(new_players))
