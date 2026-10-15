"""Publish complete, immutable local preparations; no overwrite of an existing release."""
import hashlib
import json
import re
import shutil
import tempfile
from pathlib import Path


def freeze_existing(output: Path) -> Path:
    catalog = json.loads((output / "catalog.json").read_text(encoding="utf-8"))
    snapshot_id = catalog["snapshotId"]
    if not re.fullmatch(r"atlas-v1-[0-9a-f]{16}", snapshot_id):
        raise ValueError("Invalid snapshot identifier")
    releases = output / "releases"
    releases.mkdir(parents=True, exist_ok=True)
    target = releases / snapshot_id
    if target.exists():
        # A repeated preparation of identical data reuses its first published metadata.
        if not (target / "manifest.json").is_file():
            raise ValueError("Release exists but is incomplete; inspect it before publication")
        return target
    files = sorted([*output.glob("*.json"), *output.glob("metrics/*.json"), *output.glob("geometry/*.json")])
    if len(files) != 61:
        raise ValueError(f"Expected 61 files for schema v1, found {len(files)}")
    staging = Path(tempfile.mkdtemp(prefix=f".staging-{snapshot_id}-", dir=releases))
    hashes = {}
    for source in files:
        relative = source.relative_to(output)
        destination = staging / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        hashes[relative.as_posix()] = hashlib.sha256(destination.read_bytes()).hexdigest()
    (staging / "manifest.json").write_text(json.dumps({"snapshotId":snapshot_id,"files":hashes},ensure_ascii=False,indent=2),encoding="utf-8")
    staging.rename(target)  # Complete folder becomes visible only after all files and manifest exist.
    return target


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    print(freeze_existing(parser.parse_args().output))
