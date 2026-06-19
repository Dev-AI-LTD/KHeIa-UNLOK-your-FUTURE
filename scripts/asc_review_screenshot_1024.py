#!/usr/bin/env python3
"""
Paywall screenshots -> App Store Connect IAP assets.

Review Information -> Screenshot: iPhone portrait (1284x2778) — NOT 1024x1024.
Image (Optional) promo: exactly 1024x1024.

Usage: python scripts/asc_review_screenshot_1024.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

DPI = 72
BACKGROUND_RGB = (0x0D, 0x13, 0x26)
PATCH_RGB = (0x1E, 0x26, 0x40)
FOOTER_PATCH_RGB = (0x14, 0x19, 0x2E)

PROMO_SIZE = (1024, 1024)
PORTRAIT_SIZE = (1284, 2778)  # iPhone 6.5" — valid IAP review screenshot size

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = PROJECT_ROOT / "marketing" / "app-store" / "export" / "promo-images"

DEFAULT_JOBS = [
    {
        "input": OUT_DIR / "paywall-monthly-app.png",
        "review_portrait": OUT_DIR / "kheya-pro-monthly-review-portrait.png",
        "promo_1024": OUT_DIR / "kheya-pro-monthly-promo-1024.png",
    },
    {
        "input": OUT_DIR / "paywall-yearly-app.png",
        "review_portrait": OUT_DIR / "kheya-pro-yearly-review-portrait.png",
        "promo_1024": OUT_DIR / "kheya-pro-yearly-promo-1024.png",
    },
]


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates.extend(
            [
                "C:/Windows/Fonts/arialbd.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            ]
        )
    candidates.extend(
        [
            "C:/Windows/Fonts/arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
        ]
    )
    for path in candidates:
        if Path(path).is_file():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _price_layout(w: int, h: int, plan: str) -> tuple[int, int, int, int, int]:
    if plan == "yearly":
        price_y = int(h * 0.666)
        price_text_y = int(h * 0.678)
    else:
        price_y = int(h * 0.656)
        price_text_y = int(h * 0.668)

    price_h = int(h * 0.024)
    annual_cx = int(w * 0.27)
    monthly_cx = int(w * 0.73)
    return price_y, price_h, annual_cx, monthly_cx, price_text_y


def apply_lei_overlay(im: Image.Image, plan: str = "monthly") -> Image.Image:
    base = im.convert("RGBA")
    w, h = base.size
    draw = ImageDraw.Draw(base)

    footer_font = _load_font(max(10, round(w * 0.032)))
    price_font = _load_font(max(12, round(w * 0.046)), bold=True)

    annual_x = int(w * 0.11)
    annual_w = int(w * 0.32)
    monthly_x = int(w * 0.57)
    monthly_w = int(w * 0.32)
    price_y, price_h, annual_cx, monthly_cx, price_text_y = _price_layout(w, h, plan)

    draw.rectangle([annual_x, price_y, annual_x + annual_w, price_y + price_h], fill=PATCH_RGB)
    draw.rectangle([monthly_x, price_y, monthly_x + monthly_w, price_y + price_h], fill=PATCH_RGB)
    draw.text((annual_cx, price_text_y), "249 lei/an", fill="#f8fafc", font=price_font, anchor="mm")
    draw.text((monthly_cx, price_text_y), "29 lei/lună", fill="#f8fafc", font=price_font, anchor="mm")

    footer_y = int(h * 0.806)
    footer_h = int(h * 0.082)
    draw.rectangle([int(w * 0.04), footer_y, int(w * 0.96), footer_y + footer_h], fill=FOOTER_PATCH_RGB)
    draw.text(
        (w // 2, footer_y + int(footer_h * 0.52)),
        "Abonamentul se reînnoiește automat. Poți anula oricând din App Store.",
        fill="#94a3b8",
        font=footer_font,
        anchor="mm",
    )
    return base


def _compose_on_canvas(fixed: Image.Image, canvas_size: tuple[int, int]) -> Image.Image:
    cw, ch = canvas_size
    layer = fixed.copy()
    layer.thumbnail((cw, ch), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", canvas_size, BACKGROUND_RGB)
    x = (cw - layer.width) // 2
    y = (ch - layer.height) // 2
    canvas.paste(layer, (x, y), layer)
    return canvas


def _save_asc(path: Path, im: Image.Image) -> None:
    """RGB, flattened, 72 dpi — no alpha, no ICC surprises."""
    rgb = im.convert("RGB")
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        rgb.save(path, format="JPEG", dpi=(DPI, DPI), quality=95, subsampling=0, optimize=True)
    else:
        rgb.save(path, format="PNG", dpi=(DPI, DPI), compress_level=6, optimize=False)

    with Image.open(path) as check:
        if check.mode != "RGB":
            raise ValueError(f"{path.name}: expected RGB, got {check.mode}")
        if "A" in check.getbands():
            raise ValueError(f"{path.name}: alpha channel present")


def build_outputs(src: Path, review_portrait: Path, promo_1024: Path) -> None:
    if not src.is_file():
        raise FileNotFoundError(f"Source not found: {src}")

    plan = "yearly" if "yearly" in src.stem else "monthly"
    with Image.open(src) as im:
        fixed = apply_lei_overlay(im, plan)

    portrait = _compose_on_canvas(fixed, PORTRAIT_SIZE)
    square = _compose_on_canvas(fixed, PROMO_SIZE)

    review_portrait.parent.mkdir(parents=True, exist_ok=True)
    _save_asc(review_portrait, portrait)
    _save_asc(promo_1024, square)

    with Image.open(review_portrait) as p:
        print(f"OK {review_portrait.name} -> {p.size[0]}x{p.size[1]} (Review Screenshot)")
    with Image.open(promo_1024) as s:
        print(f"OK {promo_1024.name} -> {s.size[0]}x{s.size[1]} (Promo Image optional)")


def cleanup_old_outputs() -> None:
    for pattern in [
        "kheya-pro-*-review-1024.png",
        "kheya-pro-*-review-1024.jpg",
        "kheya-pro-*-promo.png",
        "*-asc-upload*",
        "paywall-source.png",
    ]:
        for path in OUT_DIR.glob(pattern):
            path.unlink(missing_ok=True)


def main() -> int:
    for job in DEFAULT_JOBS:
        build_outputs(job["input"], job["review_portrait"], job["promo_1024"])

    cleanup_old_outputs()

    print("\nASC upload:")
    print("  Review Information -> Screenshot:")
    print("    kheya-pro-monthly-review-portrait.png  (1284x2778) -> KHEYA_pro_monthly")
    print("    kheya-pro-yearly-review-portrait.png   (1284x2778) -> KHEYA_pro_yearly")
    print("  Image (Optional) promo 1024x1024:")
    print("    kheya-pro-monthly-promo-1024.png")
    print("    kheya-pro-yearly-promo-1024.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
