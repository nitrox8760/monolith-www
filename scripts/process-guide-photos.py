"""Process guide hero photos: crop 16:9, resize to 960x540 WebP."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CURSOR_ASSETS = Path(
    r"C:\Users\samue\.cursor\projects\c-Users-samue-Projects-monolith-www\assets"
)
GUIDES = ROOT / "assets" / "guides"
STOCK = GUIDES / "stock"
TARGET = (960, 540)

# slug -> (source filename suffix, optional crop box as fraction: left, top, right, bottom of image)
ASSIGNMENTS = {
    "how-often-to-test-emergency-lighting.webp": (
        "c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_3b32630e3cb37fc821d5e9fcdef92ab0_images_pexels-mian-rizwan-250562-10612649-99b2743e-85bb-4cfb-b59c-409c37708b5f.png",
        None,
    ),
    "how-to-do-monthly-emergency-lighting-test.webp": (
        "c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_3b32630e3cb37fc821d5e9fcdef92ab0_images_pexels-badboysoflex-5894937-1b5e13de-63f6-4557-9c89-0bdac57cd794.png",
        None,
    ),
    "how-to-run-annual-emergency-lighting-duration-test.webp": (
        "c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_3b32630e3cb37fc821d5e9fcdef92ab0_images_pexels-burst-544965-b06d4685-c6ec-4056-b2e9-d84f2cad7954.png",
        None,
    ),
    "visit-report-vs-certificate-vs-logbook.webp": (
        "c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_3b32630e3cb37fc821d5e9fcdef92ab0_images_pexels-daniel-andraski-197681005-12234106-e4508cf5-93ae-491f-8bac-e476e386b4d7.png",
        None,
    ),
    "emergency-lighting-logbook-uk.webp": (
        "c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_3b32630e3cb37fc821d5e9fcdef92ab0_images_pexels-connorscottmcmanus-17616803-bcea2312-94cf-4f7d-b379-f173df34362c.png",
        (0.0, 0.22, 1.0, 1.0),
    ),
    "living-site-register.webp": (
        "c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_3b32630e3cb37fc821d5e9fcdef92ab0_images_pexels-jakubzerdzicki-24702725-674fc445-3d86-44a3-9b11-0b4ba6760678.png",
        None,
    ),
    "emergency-lighting-testing-software-uk.webp": (
        "c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_3b32630e3cb37fc821d5e9fcdef92ab0_images_pexels-artbovich-6794929-28479249-b100-46cd-842c-a239758cbaed.png",
        None,
    ),
}

STOCK_ONLY = {
    "mateusz-dach-dark-exit-sign.webp": (
        "c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_3b32630e3cb37fc821d5e9fcdef92ab0_images_pexels-mateusz-dach-99805-878832-1b88cd0f-454f-45de-bf38-fe35f1ba54d9.png",
        None,
    ),
    "ellysa-jordens-parking-exit-sign.webp": (
        "c__Users_samue_AppData_Roaming_Cursor_User_workspaceStorage_3b32630e3cb37fc821d5e9fcdef92ab0_images_pexels-ellysa-jordens-1869690570-30634848-dc083416-f442-485d-a926-46c1d72ddf48.png",
        None,
    ),
}


def crop_fraction(im: Image.Image, box: tuple[float, float, float, float]) -> Image.Image:
    w, h = im.size
    left, top, right, bottom = box
    return im.crop((int(w * left), int(h * top), int(w * right), int(h * bottom)))


def crop_16_9(im: Image.Image) -> Image.Image:
    w, h = im.size
    target_ratio = 16 / 9
    current = w / h
    if current > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        box = (0, top, w, top + new_h)
    return im.crop(box)


def process(src_name: str, out_path: Path, pre_crop: tuple | None) -> None:
    src = CURSOR_ASSETS / src_name
    im = Image.open(src).convert("RGB")
    if pre_crop:
        im = crop_fraction(im, pre_crop)
    im = crop_16_9(im)
    im = im.resize(TARGET, Image.Resampling.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    im.save(out_path, "WEBP", quality=82, method=6)
    print(f"Wrote {out_path} ({out_path.stat().st_size // 1024} KB)")


def main() -> None:
    for name, (src, pre) in ASSIGNMENTS.items():
        process(src, GUIDES / name, pre)
    for name, (src, pre) in STOCK_ONLY.items():
        process(src, STOCK / name, pre)


if __name__ == "__main__":
    main()
