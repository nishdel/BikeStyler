"""Import metadata from the research ZIP; never extract photographs or CAD.

Maintainer-only: Python 3.10+. Application builds use committed JSON and Node.
Usage: python scripts/import-research-catalogue.py path/to/catalogue.zip
"""
import argparse
import collections
import hashlib
import html
import json
import re
import zipfile
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from catalogue_options import variant_label

ROOT = Path(__file__).resolve().parents[1]
MAPPING = {
    "rigid_fork": "fork", "suspension_fork": "fork", "handlebar": "handlebars",
    "stem": "stems", "bar_tape": "tape", "grip": "grips", "brake_hood": "hoods",
    "saddle": "saddles", "seatpost": "seatposts", "dropper_post": "seatposts",
    "wheel": "wheels", "rim": "rims", "tyre": "tyres", "inner_tube": "tubes",
    "spoke": "spokes", "hub": "hubs", "crankset": "cranksets", "chainring": "chainrings",
    "bottom_bracket": "bottom_brackets", "pedal": "pedals", "chain": "chains",
    "cassette": "cassettes", "freewheel": "freewheels", "rear_derailleur": "derailleurs",
    "front_derailleur": "derailleurs", "shifter": "shifters", "shift_brake_lever": "controls",
    "brake_lever": "brake_levers", "rim_brake": "brakes", "disc_brake": "brakes",
    "brake_rotor": "disc_rotors", "fender": "mudguards", "rack": "racks",
    "basket": "baskets", "bag": "bags", "bottle_cage": "bottles", "bottle": "bottles", "light": "lights",
}


def clean(value):
    return " ".join(html.unescape(re.sub(r"<[^>]*>", " ", str(value))).split())


def public_url(value):
    u = urlsplit(value)
    host = u.hostname or ""
    if u.scheme != "https" or u.username or u.password or not host or host == "localhost" or re.match(r"^[\d.:]+$", host):
        raise ValueError("Non-public source URL")
    return urlunsplit((u.scheme, u.netloc, u.path, u.query, ""))


def canonical(value):
    u = urlsplit(public_url(value))
    return urlunsplit((u.scheme, u.netloc.lower(), u.path.rstrip("/"), u.query, ""))


def unique(rows, name):
    ids = [r["id"] for r in rows]
    if len(ids) != len(set(ids)) or any(not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}", x) for x in ids):
        raise ValueError("Duplicate or unsafe " + name + " IDs")
    return {r["id"]: r for r in rows}


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def convert(archive):
    with zipfile.ZipFile(archive) as z:
        prefix = "BikeStyler_Catalogue/"
        if sum(i.file_size for i in z.infolist()) > 200_000_000:
            raise ValueError("Research archive exceeds 200 MB expanded limit")
        checksums = z.read(prefix + "SHA256SUMS.txt").decode().splitlines()
        for line in checksums:
            digest, name = line.split(None, 1)
            if hashlib.sha256(z.read(prefix + name.lstrip("*"))).hexdigest() != digest:
                raise ValueError("Archive checksum mismatch: " + name)
        read = lambda n: json.loads(z.read(prefix + n + ".json"))
        catalogue, variants, images = read("catalogue"), read("variants"), read("images")
        taxonomy, sources, priority = read("taxonomy"), read("sources"), read("priority_products")
    products = catalogue["products"]
    ps, vs, ims = unique(products, "listing"), unique(variants, "variant"), unique(images, "image")
    if len(ps) > 10000 or len(vs) > 100000 or len(ims) > 100000:
        raise ValueError("Research catalogue exceeds bounded importer limits")
    categories = {t["id"] for t in taxonomy}
    if any(not re.fullmatch(r"[a-z][a-z_]{0,60}", c) for c in categories):
        raise ValueError("Unsafe taxonomy category")
    publishers = {s["id"] for s in sources}
    for rows in (variants, images):
        for row in rows:
            if row["product_id"] not in ps:
                raise ValueError("Orphan source record")
    aliases_path = ROOT / "research/catalogue-aliases.json"
    aliases = json.loads(aliases_path.read_text(encoding="utf-8")) if aliases_path.exists() else {}
    review_path = ROOT / "research/catalogue-review.json"
    reviews = {r["listingId"]: r for r in json.loads(review_path.read_text(encoding="utf-8"))["candidates"]} if review_path.exists() else {}
    if any(r.get("categoryOverride") == "out_of_scope" for r in reviews.values()):
        taxonomy.append(dict(id="out_of_scope", name="Not a bicycle component"))
    reviewed = json.loads((ROOT / "src/products.generated.json").read_text(encoding="utf-8"))
    reviewed_ids = {p["id"] for p in reviewed["products"]}
    for incoming, existing in aliases.items():
        if incoming not in ps or existing not in reviewed_ids:
            raise ValueError("Invalid reviewed alias")
    shards, listings = collections.defaultdict(dict), []
    for p in sorted(products, key=lambda p: p["id"]):
        if p["category"] not in categories or p["publisher_id"] not in publishers:
            raise ValueError("Unknown taxonomy or publisher")
        if p["compatibility_status"] != "unknown" or p["physical_dimensions"] or p["anchors"] is not None:
            raise ValueError("Fitment changes require independent review")
        pv, pi = [vs[i] for i in p["variant_ids"]], [ims[i] for i in p["image_ids"]]
        if any(r["product_id"] != p["id"] for r in pv + pi) or len(pv) != len(set(p["variant_ids"])) or len(pi) != len(set(p["image_ids"])):
            raise ValueError("Invalid reverse source relationship")
        review = reviews.get(p["id"], {})
        category = review.get("categoryOverride", p["category"])
        listing = dict(id=p["id"], brand=clean(p["brand"]), name=clean(p["name"]), category=category, sourceCategory=p["category"],
                       visualCategory=review.get("visualCategory", MAPPING.get(category)), publisherId=p["publisher_id"], productUrl=public_url(p["product_url"]),
                       variantCount=len(pv), imageCount=len(pi), classificationReview=p["classification_review"])
        if review:
            listing["reviewNote"] = review["finding"]
            listing["classificationReview"] = "reviewed"
        if p["id"] in aliases:
            listing["reviewedProductId"] = aliases[p["id"]]
        listings.append(listing)
        shards[category][p["id"]] = dict(
            id=p["id"], checkedOn=p["checked_on"], sourceUrl=public_url(p["source_url"]), sourceUpdatedAt=p.get("source_updated_at"),
            sourceOptions=p.get("source_options", []), compatibility="unknown",
            variants=[dict(id=v["id"], label=clean(variant_label(v)), options=v["options"], available=v["source_available"], imageId=v.get("image_id")) for v in pv],
            images=[dict(id=i["id"], url=public_url(i["source_url"]), license=i["license"], redistributionAllowed=i["redistribution_allowed"], contentStatus=i["content_status"]) for i in pi])
    if sum(len(s["variants"]) for shard in shards.values() for s in shard.values()) != len(vs):
        raise ValueError("Unreferenced variant")
    if sum(len(s["images"]) for shard in shards.values() for s in shard.values()) != len(ims):
        raise ValueError("Unreferenced image")
    counts = dict(listings=len(ps), variants=len(vs), imageReferences=len(ims), publishers=len(publishers),
                  populatedCategories=len(shards), taxonomyCategories=len(taxonomy), aliases=len(aliases), priorityCandidates=len(priority))
    index = dict(version=1, catalogueId=catalogue["catalogue_id"], asOf=catalogue["as_of"], counts=counts, listings=listings,
                 categories=[dict(id=t["id"], name=t["name"], visualCategory=MAPPING.get(t["id"])) for t in taxonomy],
                 publishers=[dict(id=s["id"], website=public_url(s["website"]), role=s["publisher_role"]) for s in sources])
    write(ROOT / "public/catalogue/index.json", index)
    for category, records in sorted(shards.items()):
        write(ROOT / "public/catalogue/details" / (category + ".json"), records)
    # Only generated category files within this fixed directory can be retired.
    detail_root = (ROOT / "public/catalogue/details").resolve()
    for path in detail_root.glob("*.json"):
        if path.resolve().parent == detail_root and re.fullmatch(r"[a-z][a-z_]{0,60}", path.stem) and path.stem not in shards:
            path.unlink()
    write(ROOT / "research/catalogue-import.json", dict(catalogueId=index["catalogueId"], asOf=index["asOf"],
          archiveSha256=hashlib.sha256(Path(archive).read_bytes()).hexdigest(), verifiedChecksums=len(checksums), counts=counts,
          imagePolicy="References only; no reference photograph or CAD is extracted or redistributed."))
    print(json.dumps(counts, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    convert(parser.parse_args().archive)
