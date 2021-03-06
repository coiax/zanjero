import argparse
import urllib
import tempfile
import shutil
import os.path
import json
import hashlib

import PIL.Image

DEFAULT_ICON = "/var/www/zanjero/defaults/icons/default.png"

def file_hash(filename):
    with open(filename) as f:
        return hashlib.md5(f.read()).digest()

def iconify_names(usernames,destdir='.'):
    tmpdir = tempfile.mkdtemp('minecrafticonify')

    if not os.path.exists(destdir):
        os.mkdirs(destdir)

    try:
        for username in usernames:
            savename = '{}-icon.png'.format(username)
            tempname = os.path.join(tmpdir, savename)
            destname = os.path.join(destdir, savename)

            data, code = download_skin(username)

            if data is None:
                fmt = "Network error: {}, code {}: default skin used"
                print fmt.format(username, code)
                path_to_default_icon = os.path.relpath(DEFAULT_ICON, destdir)

                if os.path.lexists(destname):
                    os.unlink(destname)

                os.symlink(path_to_default_icon, destname)
                continue

            imagefile = os.path.join(tmpdir, "{}.png".format(username))

            with open(imagefile, 'wb') as f:
                f.write(data)

            with open(imagefile, 'rb') as f:
                try:
                    image = iconify(imagefile)
                except IOError:
                    print "IO error with {}".format(imagefile)
                    continue



            image.save(tempname)
            if os.path.exists(destname):
                if file_hash(tempname) == file_hash(destname):
                    # Do nothing
                    print "{} skin is unchanged.".format(username)
                    continue

            os.rename(tempname, destname)

            print "{} skin is saved.".format(username)

    finally:
        shutil.rmtree(tmpdir)

def download_skin(username):
    URL = "https://www.minecraft.net/skin/{}.png"
    conn = urllib.urlopen(URL.format(username))
    code = conn.getcode()
    if code in {404,403}:
        return None, code

    data = conn.read()

    return data, code

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
    try:
        final.paste(hat,(4,0), hat) # apparantly, the hat overlays the head
        # Passing hat a second time uses the alpha for the hat to overlay the
        # head? So then they're not just stuck with a hat and no head
    except ValueError:
        # Doesn't always work, ignore it, move on
        print "Transparency problem with {}".format(file)
    final.paste(arm,(0,8))
    final.paste(torso,(4,8))
    final.paste(arm,(12,8))
    final.paste(leg,(4,20))
    final.paste(leg,(8,20))

    return final

def make_parser():
    p = argparse.ArgumentParser()
    p.add_argument('-d','--destination',default='./var/icons/')
    p.add_argument('-f','--locations-file',default=None)
    p.add_argument('-l','--list-file',default=None)
    p.add_argument('usernames',nargs='*')

    return p

if __name__=='__main__':
    args = make_parser().parse_args()

    if args.locations_file is None and args.list_file is None:
        iconify_names(args.usernames, args.destination)
    elif args.locations_file is not None:
        with open(args.locations_file) as f:
            data = json.load(f)

        usernames = list(data['players'])
        iconify_names(usernames, args.destination)
    elif args.list_file is not None:
        with open(args.list_file) as f:
            names = f.read().split()
            # Remove duplicates
            names = set(names)

        iconify_names(names, args.destination)
