"""Cópia de trabalho de um bruto, pronta para o Remotion: H.264, SDR, taxa de quadros constante, rotação aplicada.

Uso (o scripts/estudio.mjs resolve os caminhos):
    npm run estudio -- 001 proxy "1_brutos/IMG_0423.MOV" [--fps 30] [--altura 1920] [--sem-audio]
    python tools/proxy.py <projeto> <arquivo-relativo> [--fps 30] [--altura 1920] [--sem-audio]

Quando usar (o sondar.py avisa):
- vídeo HDR (HLG ou PQ, comum em iPhone e Android recentes): converte para SDR com tone mapping, para a cor
  não sair lavada ou estourada;
- taxa de quadros variável (VFR): evita o erro "No frame found at position";
- HEVC muito pesado ou 4K: deixa os stills e o render mais rápidos.

Grava em 5_trabalho/midia/<nome>.mp4. O bruto original nunca é alterado. Se a cópia já existe, não refaz.
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

HDR = {"arib-std-b67", "smpte2084"}


def sondar(arquivo):
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", str(arquivo)],
                       capture_output=True, text=True, encoding="utf-8")
    streams = json.loads(r.stdout or "{}").get("streams", [])
    return next((s for s in streams if s.get("codec_type") == "video"), None), any(s.get("codec_type") == "audio" for s in streams)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("projeto", type=Path)
    ap.add_argument("arquivo")
    ap.add_argument("--fps", type=float, default=30)
    ap.add_argument("--altura", type=int, default=0, help="limita o lado maior (ex.: 1920); 0 mantém")
    ap.add_argument("--sem-audio", action="store_true")
    a = ap.parse_args()

    fonte = a.projeto / a.arquivo
    if not fonte.exists():
        sys.exit(f"Não encontrei {fonte}")
    saida = a.projeto / "5_trabalho" / "midia" / f"{Path(a.arquivo).stem}.mp4"
    if saida.exists():
        print(f"Já existe: {saida} (apague a cópia para refazer)")
        return
    saida.parent.mkdir(parents=True, exist_ok=True)

    v, tem_audio = sondar(fonte)
    if not v:
        sys.exit("O arquivo não tem vídeo.")
    filtros = []
    hdr = v.get("color_transfer") in HDR
    if hdr:
        # HDR -> SDR (BT.709) com tone mapping Hable, o mesmo caminho usado em pós-produção com FFmpeg.
        filtros += ["zscale=t=linear:npl=100", "format=gbrpf32le", "zscale=p=bt709", "tonemap=hable:desat=0",
                    "zscale=t=bt709:m=bt709:r=tv"]
    if a.altura:
        filtros.append(f"scale='if(gt(iw,ih),{a.altura},-2)':'if(gt(iw,ih),-2,{a.altura})'")
    filtros.append("format=yuv420p")

    # A rotação dos metadados é aplicada pelo FFmpeg na decodificação (autorotate), e a cópia sai já em pé.
    cmd = ["ffmpeg", "-hide_banner", "-v", "error", "-stats", "-i", str(fonte), "-vf", ",".join(filtros),
           "-fps_mode", "cfr", "-r", str(a.fps), "-c:v", "libx264", "-preset", "medium", "-crf", "16",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart"]
    cmd += ["-an"] if a.sem_audio or not tem_audio else ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    subprocess.run(cmd + [str(saida)], check=True)
    rel = saida.relative_to(a.projeto).as_posix()
    print(f"Cópia de trabalho: {rel}{' (HDR convertido para SDR)' if hdr else ''}. No código: <Clipe src=\"{rel}\" ... />")


if __name__ == "__main__":
    main()
