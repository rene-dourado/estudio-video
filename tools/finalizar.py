"""Finalização para publicar: loudness padrão de redes sociais e codificação compatível.

Uso (o scripts/estudio.mjs resolve os caminhos; o render já chama este passo):
    python tools/finalizar.py <entrada.mp4> <saida.mp4> [--lufs -14] [--pico -1]
    python tools/finalizar.py <arquivo> --medir

- Áudio: normalização de loudness em duas passagens (EBU R128, padrão -14 LUFS integrado, pico real -1 dBTP),
  AAC 48 kHz 256 kb/s.
- Vídeo: H.264 High, yuv420p, mesma resolução e fps, CRF 18 com teto de 16 Mb/s, faststart (começa a tocar antes
  de baixar tudo). Serve para Instagram, YouTube, WhatsApp e site.
- Recusa sobrescrever a saída. Ao fim, mede o arquivo gerado e imprime o relatório.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def tem_audio(arquivo):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0",
                        str(arquivo)], capture_output=True, text=True)
    return bool(r.stdout.strip())


def medir_loudness(arquivo, lufs, pico):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(arquivo), "-af",
                        f"loudnorm=I={lufs}:TP={pico}:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    bloco = re.findall(r"\{[^{}]*\}", r.stderr)
    return json.loads(bloco[-1]) if bloco else None


def formato(arquivo):
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(arquivo)],
                       capture_output=True, text=True, encoding="utf-8")
    info = json.loads(r.stdout)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    num, den = v["avg_frame_rate"].split("/")
    return (f"{v['width']}x{v['height']}, {float(num) / float(den):.2f} fps, {v['codec_name']} {v.get('profile', '')}, "
            f"{float(info['format']['duration']):.2f} s, {int(info['format'].get('bit_rate', 0)) / 1e6:.1f} Mb/s")


def relatorio(arquivo, lufs, pico):
    linha = formato(arquivo)
    if tem_audio(arquivo):
        m = medir_loudness(arquivo, lufs, pico)
        linha += f"; áudio {m['input_i']} LUFS, pico {m['input_tp']} dBTP" if m else "; loudness não medido"
    else:
        linha += "; sem áudio"
    return linha


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("entrada", type=Path)
    ap.add_argument("saida", type=Path, nargs="?")
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--pico", type=float, default=-1.0)
    ap.add_argument("--medir", action="store_true")
    a = ap.parse_args()

    if a.medir or a.saida is None:
        print(f"{a.entrada.name}: {relatorio(a.entrada, a.lufs, a.pico)}")
        return
    if a.saida.exists():
        sys.exit(f"Já existe {a.saida}. Entregas não são sobrescritas: use a próxima revisão.")
    a.saida.parent.mkdir(parents=True, exist_ok=True)

    cmd = ["ffmpeg", "-hide_banner", "-v", "error", "-stats", "-i", str(a.entrada),
           "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "18",
           "-maxrate", "16M", "-bufsize", "32M", "-movflags", "+faststart"]
    if tem_audio(a.entrada):
        m = medir_loudness(a.entrada, a.lufs, a.pico)
        filtro = (f"loudnorm=I={a.lufs}:TP={a.pico}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
                  f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
        cmd += ["-af", filtro, "-c:a", "aac", "-b:a", "256k", "-ar", "48000"]
    else:
        cmd += ["-an"]
    subprocess.run(cmd + [str(a.saida)], check=True)
    print(f"Pronto para publicar: {a.saida}\n  {relatorio(a.saida, a.lufs, a.pico)}")


if __name__ == "__main__":
    main()
