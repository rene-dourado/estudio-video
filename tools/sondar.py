"""Inventário do material de um projeto de vídeo: o que há em 1_brutos/ e 4_audio/.

Uso (o scripts/estudio.mjs resolve o caminho):
    npm run estudio -- 001 sondar [--quadros 20]
    python tools/sondar.py <pasta-do-projeto> [--quadros 20]

Gera em 5_trabalho/:
    inventario.md            tabela com tipo, duração, resolução já girada, fps, codecs e áudio de cada arquivo
    pranchas/<arquivo>.jpg   prancha com N quadros espaçados de cada vídeo, para escolher trechos sem assistir tudo

Só lê o material; nada em 1_brutos/ ou 4_audio/ é alterado. Usa só a biblioteca padrão, o ffmpeg e o ffprobe.
"""

import argparse
import json
import math
import subprocess
from pathlib import Path

VIDEO = {".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm", ".mts", ".insv"}
AUDIO = {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg", ".opus"}
IMAGEM = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff", ".bmp"}


def sondar(arquivo):
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(arquivo)],
                       capture_output=True, text=True, encoding="utf-8")
    return json.loads(r.stdout or "{}")


def rotacao(stream):
    for dado in stream.get("side_data_list", []):
        if "rotation" in dado:
            return int(dado["rotation"])
    return int(stream.get("tags", {}).get("rotate", 0))


def fps(stream, campo="avg_frame_rate"):
    num, _, den = stream.get(campo, "0/1").partition("/")
    return float(num) / float(den or 1) if float(den or 1) else 0.0


def variavel(stream):
    # Celulares gravam com taxa de quadros variável (VFR); o Remotion pode falhar com "No frame found at position".
    return abs(fps(stream) - fps(stream, "r_frame_rate")) > 0.05


def prancha(arquivo, duracao, destino, quadros):
    colunas = 5
    linhas = math.ceil(quadros / colunas)
    passo = max(duracao / quadros, 0.1)
    filtro = f"fps=1/{passo:.3f},scale=384:-2,tile={colunas}x{linhas}:padding=6:margin=6"
    destino.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(arquivo), "-vf", filtro, "-frames:v", "1", "-q:v", "3", str(destino)],
                   check=False)
    return passo


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("projeto", type=Path)
    ap.add_argument("--quadros", type=int, default=20)
    a = ap.parse_args()

    trabalho = a.projeto / "5_trabalho"
    linhas = ["# Inventário do material", "",
              "| Pasta | Arquivo | Tipo | Duração | Resolução | fps | Vídeo | Áudio | Prancha |",
              "|---|---|---|---|---|---|---|---|---|"]
    total = {"video": 0, "audio": 0, "imagem": 0}

    for pasta in ("1_brutos", "4_audio"):
        for arq in sorted(p for p in (a.projeto / pasta).rglob("*") if p.is_file()):
            ext = arq.suffix.lower()
            if ext not in VIDEO | AUDIO | IMAGEM:
                continue
            info = sondar(arq)
            streams = info.get("streams", [])
            v = next((s for s in streams if s.get("codec_type") == "video"), None)
            au = next((s for s in streams if s.get("codec_type") == "audio"), None)
            dur = float(info.get("format", {}).get("duration") or 0)
            rel = arq.relative_to(a.projeto / pasta).as_posix()
            tipo = "imagem" if ext in IMAGEM else "vídeo" if ext in VIDEO else "áudio"
            res = taxa = cv = ""
            if v:
                w, h = v.get("width", 0), v.get("height", 0)
                if abs(rotacao(v)) in (90, 270):
                    w, h = h, w
                res = f"{w}x{h}" + (" (vertical)" if h > w else "")
                taxa = (f"{fps(v):.2f}" + (" **variável**" if variavel(v) else "")) if tipo == "vídeo" else ""
                cv = v.get("codec_name", "")
                if tipo == "vídeo":
                    if v.get("color_transfer") in ("arib-std-b67", "smpte2084"):
                        cv += " **HDR**"
                    if rotacao(v):
                        cv += f" (girado {rotacao(v)}°)"
                    if max(w, h) > 2160:
                        cv += " 4K+"
            ca = f"{au.get('codec_name', '')} {int(au.get('sample_rate', 0)) // 1000} kHz" if au else "-"
            link = ""
            if tipo == "vídeo" and dur > 0:
                destino = trabalho / "pranchas" / f"{rel.replace('/', '__')}.jpg"
                passo = prancha(arq, dur, destino, a.quadros)
                link = f"[a cada {passo:.1f} s](pranchas/{destino.name.replace(' ', '%20')})"
            total["imagem" if tipo == "imagem" else "video" if tipo == "vídeo" else "audio"] += 1
            linhas.append(f"| {pasta} | {rel} | {tipo} | {dur:.1f} s | {res} | {taxa} | {cv} | {ca} | {link} |"
                          if tipo != "imagem" else f"| {pasta} | {rel} | {tipo} | - | {res} | - | {cv} | - | |")

    linhas += ["", f"Total: {total['video']} vídeos, {total['imagem']} imagens, {total['audio']} áudios."]
    total_linha = len(linhas) - 1
    avisos = []
    if any("**variável**" in l for l in linhas):
        avisos.append("taxa de quadros **variável** (pode causar \"No frame found at position\" no Remotion)")
    if any("**HDR**" in l for l in linhas):
        avisos.append("**HDR** (a cor pode sair lavada ou estourada; confira um still contra o celular)")
    if avisos:
        linhas += ["", "Recomendado: usar cópias de trabalho dos clipes com " + " e ".join(avisos) + ". Gere com "
                   "`npm run estudio -- NNN proxy \"1_brutos/<arquivo>\"` (H.264, SDR, fps constante, em 5_trabalho/midia/) "
                   "e use a cópia no código. O bruto original não é alterado."]
    trabalho.mkdir(parents=True, exist_ok=True)
    (trabalho / "inventario.md").write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(linhas[total_linha] + f" -> {trabalho / 'inventario.md'}")
    for aviso in linhas[total_linha + 1:]:
        if aviso:
            print(aviso)


if __name__ == "__main__":
    main()
