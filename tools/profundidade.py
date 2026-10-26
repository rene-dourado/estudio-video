"""Mapa de profundidade de fotos, para a peça <Foto3D> (src/_shared/foto3d.tsx).

Uso (o scripts/estudio.mjs resolve os caminhos):
    npm run estudio -- 001 profundidade "1_brutos/sala.jpg" ["1_brutos/fotos" ...] [--refazer]
    python tools/profundidade.py <projeto> <modelo.onnx> <foto-ou-pasta> [...] [--refazer]

Usa o Depth Anything V2 Small (ONNX, licença Apache 2.0, uso comercial liberado). Os modelos Base e Large
são CC BY-NC (não comercial) e não servem para vídeos de clientes. Roda na CPU com o onnxruntime e o NumPy
do ambiente da transcrição; o FFmpeg lê e grava as imagens (caminhos com acento funcionam). ~1 s por foto.

Grava 5_trabalho/midia/profundidade/<caminho da foto>.png: cinza do tamanho da foto, claro = perto, já
suavizado nas bordas para o movimento não rasgar os contornos. A foto original nunca é alterada. Se o mapa
já existe e é mais novo que a foto, não refaz (--refazer força).
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort

FOTOS = {".jpg", ".jpeg", ".png", ".webp"}
LADO = 518  # lado menor da entrada do modelo, múltiplo de 14
MEDIA = np.array([0.485, 0.456, 0.406], np.float32)
DESVIO = np.array([0.229, 0.224, 0.225], np.float32)


def tamanho(foto):
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", str(foto)],
                       capture_output=True, text=True, encoding="utf-8")
    v = json.loads(r.stdout or "{}").get("streams", [{}])[0]
    return v["width"], v["height"]


def ler(foto, w, h):
    """RGB float 0–1 em w×h (bicúbico, como o pré-processamento do modelo)."""
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(foto), "-vf", f"scale={w}:{h}:flags=bicubic",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.uint8).reshape(h, w, 3).astype(np.float32) / 255


def gravar(mapa, w, h, saida):
    """Mapa 0–1 do tamanho do modelo -> PNG cinza w×h."""
    mh, mw = mapa.shape
    dados = (mapa * 65535).astype("<u2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray16le", "-s", f"{mw}x{mh}",
                    "-i", "-", "-vf", f"scale={w}:{h}:flags=bicubic,format=gray", "-frames:v", "1", str(saida)],
                   input=dados, check=True)


def suavizar(mapa):
    """Dilata o que está perto e desfoca, para o deslocamento não rasgar os contornos (teste de 26/10/2026)."""
    lado = max(1, round(min(mapa.shape) / 130))  # ~4 px no mapa de 518 px (= 9 px numa foto de 1200)
    janela = np.lib.stride_tricks.sliding_window_view(np.pad(mapa, lado, mode="edge"), (2 * lado + 1,) * 2)
    mapa = janela.max(axis=(2, 3))
    sigma = lado * 0.7
    x = np.arange(-3 * round(sigma), 3 * round(sigma) + 1)
    k = np.exp(-x ** 2 / (2 * sigma ** 2))
    k /= k.sum()
    p = len(k) // 2
    mapa = np.apply_along_axis(lambda l: np.convolve(np.pad(l, p, mode="edge"), k, "valid"), 1, mapa)
    return np.apply_along_axis(lambda c: np.convolve(np.pad(c, p, mode="edge"), k, "valid"), 0, mapa)


def profundidade(sessao, foto, saida):
    w, h = tamanho(foto)
    escala = LADO / min(w, h)
    mw, mh = (max(LADO, round(n * escala / 14) * 14) for n in (w, h))
    rgb = (ler(foto, mw, mh) - MEDIA) / DESVIO
    disp = sessao.run(None, {sessao.get_inputs()[0].name: rgb.transpose(2, 0, 1)[None]})[0].squeeze()
    disp = (disp - disp.min()) / max(1e-6, disp.max() - disp.min())
    saida.parent.mkdir(parents=True, exist_ok=True)
    gravar(np.clip(suavizar(disp), 0, 1), w, h, saida)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("projeto", type=Path)
    ap.add_argument("modelo", type=Path)
    ap.add_argument("fotos", nargs="+", help="fotos ou pastas, relativas à pasta do projeto")
    ap.add_argument("--refazer", action="store_true")
    a = ap.parse_args()

    if not a.modelo.exists():
        sys.exit(f"Modelo não encontrado: {a.modelo}\nRode \"npm run instalar\" ou aponte \"profundidade\" no estudio.local.json.")
    lista = []
    for item in a.fotos:
        caminho = a.projeto / item
        if caminho.is_dir():
            lista += sorted(f for f in caminho.rglob("*") if f.suffix.lower() in FOTOS)
        elif caminho.exists():
            lista.append(caminho)
        else:
            sys.exit(f"Não encontrei {caminho}")

    sessao = ort.InferenceSession(str(a.modelo), providers=["CPUExecutionProvider"])
    base = a.projeto / "5_trabalho" / "midia" / "profundidade"
    for foto in lista:
        rel = foto.relative_to(a.projeto)
        saida = (base / rel).with_suffix(".png")
        if saida.exists() and saida.stat().st_mtime >= foto.stat().st_mtime and not a.refazer:
            print(f"Já existe: {saida.relative_to(a.projeto).as_posix()}")
            continue
        profundidade(sessao, foto, saida)
        print(f"Mapa: {saida.relative_to(a.projeto).as_posix()}. No código: <Foto3D src=\"{rel.as_posix()}\" ... />")


if __name__ == "__main__":
    main()
