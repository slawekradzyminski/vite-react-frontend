#!/usr/bin/env python3
"""Export the trained teaching CNN checkpoint to a browser-readable JSON asset."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import torch


EXPECTED_SHAPES = {
    "conv1.weight": [8, 1, 3, 3],
    "conv1.bias": [8],
    "conv2.weight": [16, 8, 3, 3],
    "conv2.bias": [16],
    "fc.weight": [10, 784],
    "fc.bias": [10],
}


def tensor_payload(tensor: torch.Tensor) -> dict[str, Any]:
    cpu_tensor = tensor.detach().cpu().to(torch.float32).contiguous()
    return {
        "shape": list(cpu_tensor.shape),
        "values": cpu_tensor.view(-1).tolist(),
    }


def export_checkpoint(source: Path, target: Path) -> None:
    state = torch.load(source, map_location="cpu", weights_only=True)
    actual_shapes = {name: list(tensor.shape) for name, tensor in state.items()}
    if actual_shapes != EXPECTED_SHAPES:
        raise ValueError(f"Unexpected checkpoint tensors: {actual_shapes}")

    parameter_count = sum(tensor.numel() for tensor in state.values())
    payload = {
        "formatVersion": 1,
        "modelName": "SimpleCNN MNIST teaching model",
        "sourceCheckpoint": source.name,
        "architecture": "conv1-relu-pool-conv2-relu-pool-fc-softmax",
        "parameterCount": parameter_count,
        "tensors": {name: tensor_payload(state[name]) for name in EXPECTED_SHAPES},
    }

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"Exported {parameter_count} parameters to {target}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    args = parser.parse_args()
    export_checkpoint(args.source, args.target)


if __name__ == "__main__":
    main()
