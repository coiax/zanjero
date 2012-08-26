import argparse
import urllib
import tempfile
import shutil
import os.path

import PIL.Image

def iconify_names(usernames):
    tmpdir = tempfile.mkdtemp('minecrafticonify')
    try:
        for username in usernames:
            data = download_skin(username)
            if data is None:
                print "Network error for {}, bad username?".format(username)
                continue

            imagefile = os.path.join(tmpdir, "{}.png".format(username))

            with open(imagefile, 'wb') as f:
                f.write(data)

            with open(imagefile, 'rb') as f:
                image = iconify(imagefile)

            image.save('{}-icon.png'.format(username))

    except Exception as e:
        print tmpdir
        raise e
    else:
        shutil.rmtree(tmpdir)

def download_skin(username):
    URL = "https://www.minecraft.net/skin/{}.png"
    conn = urllib.urlopen(URL.format(username).lower())
    if conn.getcode() in {404,403}:
        return None
    data = conn.read()

    return data

def iconify(file):
    skin = PIL.Image.open(file)
    skin.load()

    head = skin.crop((8,8,16,16))
    leg = skin.crop((4,20,8,32))
    torso = skin.crop((20,20,28,32))
    arm = skin.crop((44,20,48,32))
    hat = skin.crop((40,8,48,16))

    # final image, 16,28 FIXME we'll ignore the hat for now
    # Fill with transparent.
    final = PIL.Image.new("RGBA",(16,32),(0,0,0,0))

    final.paste(head,(4,0))
    final.paste(arm,(0,8))
    final.paste(torso,(4,8))
    final.paste(arm,(12,8))
    final.paste(leg,(4,20))
    final.paste(leg,(8,20))

    return final

def make_parser():
    p = argparse.ArgumentParser()
    p.add_argument('usernames',nargs='+')

    return p

args = make_parser().parse_args()
iconify_names(args.usernames)
