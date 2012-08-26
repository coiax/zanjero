#!/usr/bin/python
import os
import json

files = os.listdir('./tiles')
images = [f for f in files if f.endswith('.png')]

def key(image):
    parts = image.split('.')
    return int(parts[2]), int(parts[1])

images.sort(key=key)

with open('tiles/allimages.json', 'w') as f:
    json.dump(images, f, indent=1)
