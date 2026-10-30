"""Genuine source-aware byte-level encoder-decoder Transformer for Tēntli.

Unlabeled historical text trains denoising. English translation only trains
from separately supplied licensed bilingual examples. Neither task changes
the existing morphological analyzer, grammar IR or source claim assessments.
"""
from __future__ import annotations
import unicodedata
import torch
from torch import nn

PAD, BOS, EOS, MASK, DENOISE, TRANSLATE, ANALYZE, BYTE_OFFSET = range(8)
VOCAB_SIZE = 256 + BYTE_OFFSET


def encode_text(text: str, limit: int) -> list[int]:
    """Respect UTF-8 codepoint boundaries even at the sequence cap."""
    output: list[int] = []
    for char in unicodedata.normalize("NFC", text):
        b = list(char.encode("utf-8"))
        if len(output) + len(b) > limit:
            break
        output.extend(x + BYTE_OFFSET for x in b)
    return output


def decode_bytes(tokens: list[int]) -> str:
    raw = bytes(x - BYTE_OFFSET for x in tokens if BYTE_OFFSET <= x < VOCAB_SIZE)
    return raw.decode("utf-8", errors="replace")


def inputs(text: str, task: str, max_bytes: int) -> list[int]:
    code = {"denoise": DENOISE, "translate": TRANSLATE, "analyze": ANALYZE}.get(task)
    if code is None:
        raise ValueError("Unknown neural objective")
    # This guard is upstream of ALL callers, including experimental raw
    # decoding. Two longer sentences with distinct endings must never
    # collapse into the same first 254 UTF-8 bytes without an error.
    normalized = unicodedata.normalize("NFC", text)
    byte_length = len(normalized.encode("utf-8"))
    if byte_length > max_bytes - 2:
        raise ValueError(
            f"Neural source is {byte_length} UTF-8 bytes; model supports at most "
            f"{max_bytes - 2}. Refusing silent truncation. "
            "Use a reviewed longer-context design, not a guessed suffix.")
    return [code, *encode_text(normalized, max_bytes - 2), EOS]


def targets(text: str, max_bytes: int) -> list[int]:
    return [BOS, *encode_text(text, max_bytes - 2), EOS]


class TentliNeural(nn.Module):
    """Experimental byte Transformer; not a replacement canonical parser."""

    def __init__(self, *, width: int = 96, heads: int = 4, layers: int = 2,
                 max_bytes: int = 256, dropout: float = 0.1):
        super().__init__()
        if width % heads or width < 16 or heads < 1 or layers < 1 or max_bytes < 16:
            raise ValueError("Invalid Transformer dimensions")
        self.config = dict(width=width, heads=heads, layers=layers,
                           max_bytes=max_bytes, dropout=dropout)
        self.embedding = nn.Embedding(VOCAB_SIZE, width, padding_idx=PAD)
        self.positional = nn.Embedding(max_bytes, width)
        self.network = nn.Transformer(
            d_model=width, nhead=heads, num_encoder_layers=layers,
            num_decoder_layers=layers, dim_feedforward=width * 4,
            dropout=dropout, batch_first=True,
        )
        self.output = nn.Linear(width, VOCAB_SIZE)

    def _embed(self, ids: torch.Tensor) -> torch.Tensor:
        if ids.size(1) > self.config["max_bytes"]:
            raise ValueError("Sequence exceeds model maximum")
        position = torch.arange(ids.size(1), device=ids.device).unsqueeze(0)
        return self.embedding(ids) + self.positional(position)

    def forward(self, src: torch.Tensor, tgt: torch.Tensor) -> torch.Tensor:
        n = tgt.size(1)
        causal = torch.triu(torch.ones(n, n, dtype=torch.bool, device=tgt.device), diagonal=1)
        decoded = self.network(
            self._embed(src), self._embed(tgt),
            tgt_mask=causal, src_key_padding_mask=src.eq(PAD),
            tgt_key_padding_mask=tgt.eq(PAD), memory_key_padding_mask=src.eq(PAD),
        )
        return self.output(decoded)

    @torch.inference_mode()
    def generate(self, text: str, *, task: str, limit: int | None = None) -> str:
        self.eval()
        device = next(self.parameters()).device
        cap = self.config["max_bytes"]
        src = torch.tensor([inputs(text, task, cap)], device=device)
        tgt = torch.tensor([[BOS]], device=device)
        for _ in range(min(limit or cap - 2, cap - 2)):
            pred = self(src, tgt)[:, -1].argmax(dim=-1, keepdim=True)
            if pred.item() == EOS:
                break
            tgt = torch.cat((tgt, pred), dim=1)
        return decode_bytes(tgt[0].tolist()[1:])
