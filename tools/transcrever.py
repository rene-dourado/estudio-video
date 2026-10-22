"""Transcrição local, gratuita, com o tempo exato de cada palavra.

Uso (o scripts/estudio.mjs resolve os caminhos):
    npm run estudio -- 001 transcrever "4_audio/narracao.wav" [--prompt "Café Aurora, cold brew"]
    python tools/transcrever.py <audio-ou-video> <pasta-de-saida> [--idioma pt] [--modelo large-v3-turbo] [--prompt "..."]

Gera em <pasta-de-saida>:
    palavras.json   [{w, s, e}] = palavra, início e fim em segundos (todo gatilho de edição sai daqui)
    transcript.md   [MM:SS.mmm] por frase, para leitura
    legenda.srt     legenda por frase, útil para conferir ou subir no YouTube

--prompt passa nomes próprios, marcas e termos técnicos ao Whisper, o que reduz erros de grafia.
Na primeira execução o faster-whisper baixa o modelo (~1,6 GB). Depois tudo roda offline.
Tenta a placa de vídeo (CUDA) e, se não houver, usa o processador.
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


def preparar_cuda():
    # No Windows, as DLLs do cuBLAS/cuDNN instaladas pelo pip (pacotes nvidia-*) não entram no PATH sozinhas.
    if os.name != "nt":
        return
    for site in map(Path, sys.path):
        nvidia = site / "nvidia"
        if nvidia.is_dir():
            for bin_dir in nvidia.glob("*/bin"):
                os.add_dll_directory(str(bin_dir))
                os.environ["PATH"] = f"{bin_dir}{os.pathsep}{os.environ['PATH']}"


preparar_cuda()
# Sem o Modo de Desenvolvedor, o Windows não cria links simbólicos; o cache funciona igual, só o aviso some.
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

import numpy as np  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

DISPOSITIVOS = [("cuda", "float16"), ("cpu", "int8")]


def mmss(t):
    return f"{int(t // 60):02d}:{t % 60:06.3f}"


def srt_tempo(t):
    h, resto = divmod(t, 3600)
    m, s = divmod(resto, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}"


def decodificar(fonte):
    # ffmpeg em vez do PyAV: o PyAV 15+ quebrou o decode_audio do faster-whisper
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(fonte), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0


def transcrever(audio, idioma, modelo, prompt):
    erros = []
    for device, compute in DISPOSITIVOS:
        try:
            m = WhisperModel(modelo, device=device, compute_type=compute)
            segs, info = m.transcribe(audio, language=idioma, word_timestamps=True, vad_filter=True,
                                      initial_prompt=prompt or None)
            # o gerador só decodifica aqui; erros de CUDA/CUBLAS aparecem nesta linha
            return list(segs), info, device
        except Exception as e:
            erros.append(f"{device}: {e}")
    sys.exit("a transcrição falhou:\n" + "\n".join(erros))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("fonte", type=Path)
    ap.add_argument("saida", type=Path)
    ap.add_argument("--idioma", default="pt")
    ap.add_argument("--modelo", default="large-v3-turbo")
    ap.add_argument("--prompt", default="")
    a = ap.parse_args()

    a.saida.mkdir(parents=True, exist_ok=True)
    segs, info, device = transcrever(decodificar(a.fonte), a.idioma, a.modelo, a.prompt)

    palavras = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
    (a.saida / "palavras.json").write_text(json.dumps(palavras, ensure_ascii=False, indent=1), encoding="utf-8")

    linhas = [f"<!-- {a.modelo} | {device} | {info.duration:.3f}s | {a.fonte.name} -->"]
    linhas += [f"[{mmss(s.start)}] {s.text.strip()}" for s in segs]
    (a.saida / "transcript.md").write_text("\n".join(linhas) + "\n", encoding="utf-8")

    srt = [f"{i}\n{srt_tempo(s.start)} --> {srt_tempo(s.end)}\n{s.text.strip()}\n" for i, s in enumerate(segs, 1)]
    (a.saida / "legenda.srt").write_text("\n".join(srt), encoding="utf-8")
    print(f"{len(palavras)} palavras, {len(segs)} frases, {info.duration:.1f}s, {device} -> {a.saida}")


if __name__ == "__main__":
    main()
