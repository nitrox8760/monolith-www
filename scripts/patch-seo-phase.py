"""Patch guide and resource pages: OG images, schema, apple-touch-icon, script versions."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://www.monolithcompliance.co.uk"
OG_BASE = f"{SITE}/assets/og"
GUIDE_IMG_BASE = f"{SITE}/assets/guides"

GUIDES = [
    (
        "guides/how-often-to-test-emergency-lighting.html",
        "how-often-to-test-emergency-lighting",
        "How often to test emergency lighting",
    ),
    (
        "guides/how-to-do-monthly-emergency-lighting-test.html",
        "how-to-do-monthly-emergency-lighting-test",
        "How to do a monthly emergency lighting test",
    ),
    (
        "guides/how-to-run-annual-emergency-lighting-duration-test.html",
        "how-to-run-annual-emergency-lighting-duration-test",
        "How to run an annual emergency lighting duration test",
    ),
    (
        "guides/visit-report-vs-certificate-vs-logbook.html",
        "visit-report-vs-certificate-vs-logbook",
        "Visit report vs site certificate vs logbook",
    ),
    (
        "guides/emergency-lighting-logbook-uk.html",
        "emergency-lighting-logbook-uk",
        "Emergency lighting logbook: what to record in the UK",
    ),
    (
        "guides/living-site-register.html",
        "living-site-register",
        "Keep a living site register",
    ),
    (
        "guides/emergency-lighting-testing-software-uk.html",
        "emergency-lighting-testing-software-uk",
        "Emergency lighting test software (UK)",
    ),
]

RESOURCES = [
    (
        "resources/emergency-lighting-certificate-template.html",
        "emergency-lighting-certificate-template",
        "Free Emergency Lighting Certificate Template",
        "2026-08-23",
    ),
    (
        "resources/emergency-lighting-periodic-inspection-report-template.html",
        "emergency-lighting-periodic-inspection-report-template",
        "Free Emergency Lighting Periodic Inspection Report Template",
        "2026-08-23",
    ),
]

HEAD_PATCHES = [
    (
        '<meta property="og:image" content="https://www.monolithcompliance.co.uk/assets/og-card.png" />',
        None,  # replaced per file
    ),
    (
        '<meta name="twitter:image" content="https://www.monolithcompliance.co.uk/assets/og-card.png" />',
        None,
    ),
    (
        '<link rel="icon" href="/assets/brand/pillar.svg" type="image/svg+xml" />',
        '<link rel="icon" href="/assets/brand/pillar.svg" type="image/svg+xml" />\n'
        '  <link rel="apple-touch-icon" href="/assets/icons/icon-192.png" />',
    ),
    (
        '<script src="/js/analytics.js?v=20260816a" defer></script>',
        '<script src="/js/analytics.js?v=20260830a" defer></script>',
    ),
    (
        '<script src="/js/site.js?v=20260823b" defer></script>',
        '<script src="/js/site.js?v=20260830a" defer></script>',
    ),
    (
        '<script src="/js/site.js?v=20260823d" defer></script>',
        '<script src="/js/site.js?v=20260830a" defer></script>',
    ),
]


def patch_og(text: str, og_slug: str) -> str:
    og_url = f"{OG_BASE}/{og_slug}.png"
    text = re.sub(
        r'<meta property="og:image" content="[^"]+" />',
        f'<meta property="og:image" content="{og_url}" />',
        text,
        count=1,
    )
    text = re.sub(
        r'<meta name="twitter:image" content="[^"]+" />',
        f'<meta name="twitter:image" content="{og_url}" />',
        text,
        count=1,
    )
    return text


def patch_head_common(text: str) -> str:
    if 'rel="apple-touch-icon"' not in text:
        text = text.replace(
            '<link rel="icon" href="/assets/brand/pillar.svg" type="image/svg+xml" />',
            '<link rel="icon" href="/assets/brand/pillar.svg" type="image/svg+xml" />\n'
            '  <link rel="apple-touch-icon" href="/assets/icons/icon-192.png" />',
            1,
        )
    text = text.replace(
        '<script src="/js/analytics.js?v=20260816a" defer></script>',
        '<script src="/js/analytics.js?v=20260830a" defer></script>',
    )
    for old in ('<script src="/js/site.js?v=20260823b" defer></script>', '<script src="/js/site.js?v=20260823d" defer></script>'):
        text = text.replace(old, '<script src="/js/site.js?v=20260830a" defer></script>')
    return text


def patch_guide_schema(text: str, path: str, slug: str, crumb_title: str) -> str:
    canonical = f"{SITE}/{path.replace(chr(92), '/')}"
    webp = f"{GUIDE_IMG_BASE}/{slug}.webp"
    if '"image":' not in text:
        text = re.sub(
            r'("dateModified": "[^"]+",)\n(\s+"inLanguage": "en-GB",)',
            rf'\1\n        "image": "{webp}",\n\2',
            text,
            count=1,
        )
    breadcrumb = f"""      {{
        "@type": "BreadcrumbList",
        "@id": "{canonical}#breadcrumb",
        "itemListElement": [
          {{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "{SITE}/"
          }},
          {{
            "@type": "ListItem",
            "position": 2,
            "name": "Guides",
            "item": "{SITE}/guides/"
          }},
          {{
            "@type": "ListItem",
            "position": 3,
            "name": "{crumb_title}",
            "item": "{canonical}"
          }}
        ]
      }}"""
    if "BreadcrumbList" not in text:
        text = text.replace("\n    ]\n  }\n  </script>", f",\n{breadcrumb}\n    ]\n  }}\n  </script>", 1)
    return text


def patch_resource_schema_and_meta(text: str, path: str, slug: str, crumb_title: str, modified: str) -> str:
    canonical = f"{SITE}/{path.replace(chr(92), '/')}"
    text = patch_og(text, slug)
    text = patch_head_common(text)
    text = text.replace('<meta property="og:type" content="website" />', '<meta property="og:type" content="article" />')
    if 'property="article:modified_time"' not in text:
        insert_after = '<meta property="og:type" content="article" />'
        text = text.replace(
            insert_after,
            insert_after + f'\n  <meta property="article:modified_time" content="{modified}" />',
            1,
        )
    breadcrumb = f"""      {{
        "@type": "BreadcrumbList",
        "@id": "{canonical}#breadcrumb",
        "itemListElement": [
          {{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "{SITE}/"
          }},
          {{
            "@type": "ListItem",
            "position": 2,
            "name": "Templates",
            "item": "{SITE}/resources/"
          }},
          {{
            "@type": "ListItem",
            "position": 3,
            "name": "{crumb_title}",
            "item": "{canonical}"
          }}
        ]
      }}"""
    if "BreadcrumbList" not in text:
        text = text.replace("\n    ]\n  }\n  </script>", f",\n{breadcrumb}\n    ]\n  }}\n  </script>", 1)
    return text


def patch_guide_more_alts(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        block = match.group(0)
        title_match = re.search(r'guide-more__card-title">([^<]+)</p>', block)
        if not title_match:
            return block
        alt = title_match.group(1).strip()
        return re.sub(r'alt=""', f'alt="{alt}"', block, count=1)

    return re.sub(
        r'<a class="guide-more__card"[\s\S]*?</a>',
        repl,
        text,
    )


def main() -> None:
    for rel, slug, crumb in GUIDES:
        path = ROOT / rel
        text = path.read_text(encoding="utf-8")
        text = patch_og(text, slug)
        text = patch_head_common(text)
        text = patch_guide_schema(text, rel.replace("\\", "/"), slug, crumb)
        text = patch_guide_more_alts(text)
        path.write_text(text, encoding="utf-8")
        print(f"patched {rel}")

    for rel, slug, crumb, modified in RESOURCES:
        path = ROOT / rel
        text = path.read_text(encoding="utf-8")
        text = patch_resource_schema_and_meta(text, rel.replace("\\", "/"), slug, crumb, modified)
        path.write_text(text, encoding="utf-8")
        print(f"patched {rel}")

    for rel, og_slug in (
        ("guides/index.html", "guides-hub"),
        ("resources/index.html", "resources-hub"),
    ):
        path = ROOT / rel
        text = path.read_text(encoding="utf-8")
        text = patch_og(text, og_slug)
        text = patch_head_common(text)
        path.write_text(text, encoding="utf-8")
        print(f"patched {rel}")

    for rel in ("privacy.html", "terms.html"):
        path = ROOT / rel
        if not path.is_file():
            continue
        text = patch_head_common(path.read_text(encoding="utf-8"))
        path.write_text(text, encoding="utf-8")
        print(f"patched {rel}")


if __name__ == "__main__":
    main()
