"""Generate 1200x630 Open Graph PNGs from guide heroes and template previews."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OG = ROOT / "assets" / "og"
OG.mkdir(parents=True, exist_ok=True)
TARGET = (1200, 630)

GUIDE_SOURCES = {
    "how-often-to-test-emergency-lighting": ROOT
    / "assets/guides/how-often-to-test-emergency-lighting.webp",
    "how-to-do-monthly-emergency-lighting-test": ROOT
    / "assets/guides/how-to-do-monthly-emergency-lighting-test.webp",
    "how-to-run-annual-emergency-lighting-duration-test": ROOT
    / "assets/guides/how-to-run-annual-emergency-lighting-duration-test.webp",
    "visit-report-vs-certificate-vs-logbook": ROOT
    / "assets/guides/visit-report-vs-certificate-vs-logbook.webp",
    "emergency-lighting-logbook-uk": ROOT / "assets/guides/emergency-lighting-logbook-uk.webp",
    "living-site-register": ROOT / "assets/guides/living-site-register.webp",
    "emergency-lighting-testing-software-uk": ROOT
    / "assets/guides/emergency-lighting-testing-software-uk.webp",
    "guides-hub": ROOT / "assets/guides/emergency-lighting-testing-software-uk.webp",
    "resources-hub": ROOT / "assets/paperwork-templates/periodic-certificate-template-p1.png",
    "emergency-lighting-certificate-template": ROOT
    / "assets/paperwork-templates/periodic-certificate-template-p1.png",
    "emergency-lighting-periodic-inspection-report-template": ROOT
    / "assets/paperwork-templates/periodic-inspection-report-template-p1.png",
}


def cover_crop(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    target_ratio = target_w / target_h
    src_w, src_h = img.size
    src_ratio = src_w / src_h
    if src_ratio > target_ratio:
        new_h = src_h
        new_w = int(src_h * target_ratio)
    else:
        new_w = src_w
        new_h = int(src_w / target_ratio)
    left = (src_w - new_w) // 2
    top = (src_h - new_h) // 2
    cropped = img.crop((left, top, left + new_w, top + new_h))
    return cropped.resize(size, Image.Resampling.LANCZOS)


def main() -> None:
    for name, source in GUIDE_SOURCES.items():
        if not source.is_file():
            print(f"skip (missing): {source}")
            continue
        img = Image.open(source).convert("RGB")
        out = OG / f"{name}.png"
        cover_crop(img, TARGET).save(out, optimize=True)
        print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
