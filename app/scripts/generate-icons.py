"""Resize the approved artwork into Android launcher resources."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


APP = Path(__file__).resolve().parents[1]
RES = APP / "android/app/src/main/res"
BACKGROUND = "#275b66"
DENSITIES = [
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432),
]


def round_image(image, size):
    result = ImageOps.fit(image, (size, size), method=Image.Resampling.LANCZOS).convert("RGBA")
    mask = Image.new("L", (size * 4, size * 4))
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    result.putalpha(mask.resize((size, size), Image.Resampling.LANCZOS))
    return result


def generate():
    with Image.open(APP / "assets/icon.png") as original:
        source = original.convert("RGB")
    if source.size != (1024, 1024):
        raise ValueError("The launcher master must be a 1024x1024 image.")

    # Remove the baked-in frame for launcher-controlled shapes.
    cropped = source.crop((64, 64, 960, 960))
    for density, icon_size, layer_size in DENSITIES:
        target = RES / f"mipmap-{density}"
        target.mkdir(parents=True, exist_ok=True)
        source.resize((icon_size, icon_size), Image.Resampling.LANCZOS).save(
            target / "ic_launcher.png")
        round_image(cropped, icon_size).save(target / "ic_launcher_round.png")

        # Android masks the middle 72dp of a 108dp adaptive layer.
        artwork_size = layer_size * 2 // 3
        foreground = Image.new("RGBA", (layer_size, layer_size))
        artwork = round_image(cropped, artwork_size)
        offset = (layer_size - artwork_size) // 2
        foreground.paste(artwork, (offset, offset))
        foreground.save(target / "ic_launcher_foreground.png")

    (RES / "values/ic_launcher_background.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        "<resources>\n"
        f'    <color name="ic_launcher_background">{BACKGROUND}</color>\n'
        "</resources>\n"
    )


if __name__ == "__main__":
    generate()
