import os.path
import argparse
import tempfile
import re
import operator
import itertools

import PIL.Image

def list_images(folder):
    files = os.listdir(folder)
    infos = []
    # Filename is in {WORLD}-{ZOOM}.{X}.{Z}.png format
    for file in files:
        if not file.endswith('.png'):
            continue

        match = re.match(r'(\w+)-(\d+)\.(\d+)\.(\d+)\.png', file)

        if match is None:
            print "Bad filename: {}".format(file)
            raise Exception
            continue

        world, zoom, x, z = match.groups()

        info = os.path.join(folder, file), world, int(zoom), int(x), int(z)

        infos.append(info)

    # Swap x and z when we sort, so tiles are in left to right lines
    # Ignore filename when sorting
    infos.sort(key=operator.itemgetter(1,2,4,3))

    return infos

def create_zoom(infos, world, zoom, destination):
    # file, world, zoom, x, z
    # Use only the tiles we want
    infos = [i for i in infos if i[1] == world and i[2] == zoom]

    max_x = infos[-1][3]
    max_z = infos[-1][4]

    zoomed_max_x = max_x // 2
    zoomed_max_z = max_z // 2

    new_tiles = []

    for z in range(zoomed_max_z):
        for x in range(zoomed_max_x):
            # It's backwards because the tiles are written left-to-right
            components = []
            for i,j in itertools.product((x*2, x*2+1), (z*2, z*2+1)):
                selected = None
                for k in infos:
                    # k is a possible info tuple
                    # if i and j are
                    if (k[3], k[4]) == (i,j):
                        selected = k
                        break

                # yes, selected can be None, this is intentional
                components.append(selected)

            # Now in components we have four component file names
            image = squash(components)

            namefmt = "{world}-{zoom}.{x}.{z}.png"
            name = namefmt.format(world=world, zoom=zoom+1, x=x, z=z)
            path = os.path.join(destination, name)

            image.save(path)


def squash(components):
    # The size'll be based on double the size of the first component
    images = []
    for component in components:
        i = PIL.Image.open(component[0])
        i.load()
        images.append(i)

    small_x, small_y = images[0].size
    assert small_x == small_y

    bigsize = (small_x * 2, small_y * 2)

    bigimage = PIL.Image.new("RGBA", bigsize, (0,0,0,0))

    for image, placement in zip(images, ((0,0), (0,1), (1,0), (1,1))):
        if image is None:
            continue

        bigimage.paste(image, (placement[0] * small_x, placement[1] * small_y))

    smallbig = bigimage.resize((small_x, small_y), PIL.Image.ANTIALIAS)
    return smallbig




if __name__=='__main__':
    for i in range(6):
        L = list_images('./var/tiles')
        create_zoom(L, 'agnomen', i, './var/tiles')
