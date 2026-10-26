"""Câmera lenta de um trecho de clipe, com quadros intermediários criados pelo RIFE (rife-ncnn-vulkan, v4.25).

Uso (o scripts/estudio.mjs resolve os caminhos):
    npm run estudio -- 001 lento "1_brutos/IMG_0423.MOV" --inicio 12.5 --duracao 3 [--fator 2] [--altura 1920] [--refazer]
    python tools/lento.py <projeto> <rife-ncnn-vulkan.exe> <arquivo-relativo> --inicio s --duracao s [...]

Grava 5_trabalho/midia/<nome>-<inicio>s-lento<fator>x.mp4: o trecho (de --duracao segundos do original) fica
<fator> vezes mais longo, a 30 fps, sem som. No código, use a cópia num <Clipe> com velocidade normal; o
<Clipe velocidade={0.5}> só repete quadros e o movimento anda aos saltos. O bruto original nunca é alterado.

Como o proxy.py: HDR vira SDR, a rotação é aplicada e a taxa de quadros fica constante (30 fps). O lado maior
é limitado a 1920 px por padrão (4K de celular demora 4x mais e o Reels não precisa). Roda na placa de vídeo
(Vulkan); 3 s de vertical 1080x1920 em 2x levam ~20 s numa RTX 3060. Os quadros temporários vão para a pasta
temporária do sistema, fora de pastas sincronizadas, e são apagados no fim.

Cuidado: mãos e objetos finos em movimento rápido podem deformar nos quadros criados. Confira o resultado.
"""

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from proxy import filtros_sdr, sondar

MODELO = "rife-v4.25"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("projeto", type=Path)
    ap.add_argument("rife", type=Path)
    ap.add_argument("arquivo")
    ap.add_argument("--inicio", type=float, required=True, help="segundos do original")
    ap.add_argument("--duracao", type=float, required=True, help="segundos do original (a cópia dura fator vezes mais)")
    ap.add_argument("--fator", type=int, default=2, choices=[2, 3, 4])
    ap.add_argument("--altura", type=int, default=1920, help="limita o lado maior; 0 mantém")
    ap.add_argument("--refazer", action="store_true")
    a = ap.parse_args()

    if not (a.rife.exists() and (a.rife.parent / MODELO).is_dir()):
        sys.exit(f"RIFE não encontrado em {a.rife} (com a pasta {MODELO} ao lado).\n"
                 "Baixe o windows.zip de https://github.com/TNTwise/rife-ncnn-vulkan/releases, guarde o executável,\n"
                 f"a vcomp140.dll e a pasta {MODELO}, e aponte \"rife\" no estudio.local.json.")
    fonte = a.projeto / a.arquivo
    if not fonte.exists():
        sys.exit(f"Não encontrei {fonte}")
    rotulo = f"{a.inicio:g}".replace(".", "_")
    saida = a.projeto / "5_trabalho" / "midia" / f"{Path(a.arquivo).stem}-{rotulo}s-lento{a.fator}x.mp4"
    if saida.exists() and not a.refazer:
        print(f"Já existe: {saida} (--refazer para gerar de novo)")
        return
    saida.parent.mkdir(parents=True, exist_ok=True)

    v, _ = sondar(fonte)
    if not v:
        sys.exit("O arquivo não tem vídeo.")
    filtros, hdr = filtros_sdr(v, a.altura)
    tmp = Path(tempfile.mkdtemp(prefix="estudio-lento-"))
    try:
        ent, sai = tmp / "entrada", tmp / "saida"
        ent.mkdir()
        sai.mkdir()
        # Quadros do trecho a 30 fps constantes, já em SDR e em pé.
        subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-ss", str(a.inicio), "-t", str(a.duracao),
                        "-i", str(fonte), "-vf", ",".join(filtros + ["fps=30"]), str(ent / "%06d.png")], check=True)
        n = len(list(ent.glob("*.png")))
        if n < 2:
            sys.exit("O trecho tem menos de 2 quadros: confira --inicio e --duracao.")
        subprocess.run([str(a.rife), "-i", str(ent), "-o", str(sai), "-m", str(a.rife.parent / MODELO),
                        "-n", str(n * a.fator), "-f", "%06d.png"], check=True, cwd=a.rife.parent,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # RGB -> YUV pela matriz BT.709 (o padrão do FFmpeg para PNG seria a BT.601, que desloca as cores).
        subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-framerate", "30", "-i", str(sai / "%06d.png"),
                        "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,"
                               "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
                        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                        "-movflags", "+faststart", "-an", str(saida)], check=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    rel = saida.relative_to(a.projeto).as_posix()
    print(f"Câmera lenta {a.fator}x: {rel} ({n * a.fator / 30:.1f} s{', HDR convertido para SDR' if hdr else ''}). "
          f"No código: <Clipe src=\"{rel}\" inicio={{0}} ... />")


if __name__ == "__main__":
    main()
