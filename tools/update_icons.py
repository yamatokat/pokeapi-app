#!/usr/bin/env python3
"""
Fetch official artwork for a given Pokémon ID and generate PWA icons (192/512).
Usage:
  python3 tools/update_icons.py --id 25
"""

import argparse
import io
import os
import sys
from urllib.request import urlopen

try:
    from PIL import Image
except Exception:
    print("Pillow is required. Install with: pip install pillow", file=sys.stderr)
    sys.exit(1)

API_BASE = "https://pokeapi.co/api/v2"


def fetch_official_artwork_url(poke_id: int) -> str:
    import json

    with urlopen(f"{API_BASE}/pokemon/{poke_id}") as resp:
        if resp.status != 200:
            raise RuntimeError(f"Failed to fetch pokemon {poke_id}: {resp.status}")
        data = json.loads(resp.read().decode("utf-8"))
    # Prefer official-artwork
    url = data.get("sprites", {}).get("other", {}).get("official-artwork", {}).get(
        "front_default"
    ) or data.get("sprites", {}).get("front_default")
    if not url:
        raise RuntimeError("No sprite available for this Pokémon")
    return url


def download_image(url: str) -> Image.Image:
    with urlopen(url) as resp:
        if resp.status != 200:
            raise RuntimeError(f"Failed to download image: {resp.status}")
        buf = io.BytesIO(resp.read())
    img = Image.open(buf).convert("RGBA")
    return img


def save_resized(img: Image.Image, size: int, out_path: str):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Fit within square while preserving aspect
    ratio = min(size / img.width, size / img.height)
    new_w = max(1, int(img.width * ratio))
    new_h = max(1, int(img.height * ratio))
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    # Center
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    canvas.save(out_path, format="PNG")
    print(f"Saved {out_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", type=int, default=25, help="Pokémon ID (default: 25)")
    parser.add_argument(
        "--dir", type=str, default="icons", help="Output directory (default: icons)"
    )
    args = parser.parse_args()

    os.makedirs(args.dir, exist_ok=True)
    url = fetch_official_artwork_url(args.id)
    img = download_image(url)
    save_resized(img, 192, os.path.join(args.dir, "icon-192.png"))
    save_resized(img, 512, os.path.join(args.dir, "icon-512.png"))


if __name__ == "__main__":
    main()
