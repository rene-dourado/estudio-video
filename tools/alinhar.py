"""Legenda pelo TEXTO do roteiro, com os tempos da transcrição.

O Whisper erra nomes próprios ("Orora" em vez de "Aurora") e às vezes números. Em vez de mostrar a transcrição crua,
este script casa cada palavra do texto aprovado com a palavra falada (difflib) e grava o texto com os tempos.
Palavras que não casam (a voz pulou ou disse outra coisa) recebem um tempo interpolado e aparecem no relatório.

Uso (o scripts/estudio.mjs resolve os caminhos):
    npm run estudio -- 001 alinhar "5_trabalho/legenda.txt" "5_trabalho/transcricao/narracao/palavras.json" [--alias "orora=aurora, coudbru=cold brew"]
    python tools/alinhar.py <texto.txt> <palavras.json> <saida.json> [--alias "..."]

O texto é o roteiro como deve aparecer na tela (números em algarismos, se for o caso). Linhas que começam com
# são ignoradas. [nome] colado antes de uma palavra marca uma âncora de corte: "[rua]Rua das Flores".
--alias corrige grafias e formas diferentes que o Whisper usa, comparadas sem acento e sem pontuação:
    "orora=aurora, 8=oito, m2=metros quadrados" (o lado direito pode ter mais de uma palavra).

Gera:
    <saida.json>  [{w, s, e, a?, i?}] = palavra do TEXTO, início, fim, âncora, interpolada (mesmo formato do palavras.json)
    <saida.md>    relatório: quanto casou e cada trecho em que a voz diverge do texto, com o tempo
Confira o relatório: onde a voz disse OUTRA coisa (não só outra grafia), corrija o texto ou gere a voz de novo.
O texto na tela segue o que a voz realmente diz.
"""

import argparse
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path


def normalizar(w):
    w = unicodedata.normalize("NFKD", w.lower())
    w = "".join(c for c in w if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", w)


def ler_alias(texto):
    alias = {}
    for par in filter(None, (p.strip() for p in (texto or "").split(","))):
        if "=" not in par:
            sys.exit(f'--alias: "{par}" não tem "=" (ex.: "orora=aurora")')
        de, para = (x.strip() for x in par.split("=", 1))
        alias[normalizar(de)] = [normalizar(x) for x in para.split()]
    return alias


def tokens(texto):
    """(palavra exibida, nome da âncora ou None)."""
    out = []
    for linha in texto.splitlines():
        if linha.lstrip().startswith("#"):
            continue
        for tok in linha.split():
            m = re.match(r"\[(\w+)\](.*)", tok)
            if m and not m.group(2):
                sys.exit(f"A âncora [{m.group(1)}] precisa vir colada a uma palavra: [{m.group(1)}]Palavra")
            out.append((m.group(2), m.group(1)) if m else (tok, None))
    return out


def chaves(w, alias):
    k = normalizar(w)
    return alias.get(k, [k]) if k else []


def alinhar(toks, trans, alias):
    # junta "guarda" + "-roupa", "co" + "-working" etc., como estão no texto
    junt = []
    for p in trans:
        if p["w"].startswith("-") and junt:
            junt[-1] = {"w": junt[-1]["w"] + p["w"], "s": junt[-1]["s"], "e": p["e"]}
        else:
            junt.append(dict(p))
    trans = junt
    # Cada palavra pode virar várias chaves (alias "m2=metros quadrados"); guardamos de quem é cada chave.
    ke, de_e = [], []
    for i, (w, _) in enumerate(toks):
        for k in chaves(w, alias):
            ke.append(k)
            de_e.append(i)
    kt, de_t = [], []
    for j, p in enumerate(trans):
        for k in chaves(p["w"], alias):
            kt.append(k)
            de_t.append(j)
    sm = difflib.SequenceMatcher(None, ke, kt, autojunk=False)
    tempos = [None] * len(toks)
    for bloco in sm.get_matching_blocks():
        for n in range(bloco.size):
            i, p = de_e[bloco.a + n], trans[de_t[bloco.b + n]]
            # o Whisper às vezes cola a pausa anterior no início da palavra; números ("257" = "duzentos e
            # cinquenta e sete") são longos de verdade e ficam com o tempo original
            s = p["s"] if re.search(r"\d", p["w"]) else max(p["s"], p["e"] - 0.6)
            tempos[i] = (s, p["e"]) if tempos[i] is None else (tempos[i][0], p["e"])
    casadas = [i for i, t in enumerate(tempos) if t]
    if not casadas:
        sys.exit("Nenhuma palavra do texto casou com a transcrição: confira se são o mesmo áudio.")
    fim = trans[-1]["e"]
    for i in range(len(toks)):
        if tempos[i] is None:
            ant = max([j for j in casadas if j < i], default=None)
            pro = min([j for j in casadas if j > i], default=None)
            t0 = tempos[ant][1] if ant is not None else 0.0
            t1 = tempos[pro][0] if pro is not None else fim
            a0 = ant if ant is not None else -1
            vao = (pro if pro is not None else len(toks)) - a0 - 1
            passo = (t1 - t0) / (vao + 1)
            k = i - a0
            tempos[i] = (t0 + passo * (k - 0.5), t0 + passo * (k + 0.5))
    saida = []
    for i, ((w, ancora), (s, e)) in enumerate(zip(toks, tempos)):
        p = {"w": w, "s": round(s, 3), "e": round(e, 3)}
        if ancora:
            p["a"] = ancora
        if i not in casadas:
            p["i"] = True
        saida.append(p)
    # Divergências, para o relatório: trechos do texto e da voz que não casaram.
    diverge = []
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op == "equal":
            continue
        texto = " ".join(dict.fromkeys(toks[de_e[x]][0] for x in range(a0, a1)))
        voz = " ".join(dict.fromkeys(trans[de_t[x]]["w"] for x in range(b0, b1)))
        quando = trans[de_t[b0]]["s"] if b0 < b1 else (saida[de_e[a0]]["s"] if a0 < a1 else 0.0)
        diverge.append((quando, texto, voz))
    return saida, len(casadas) / len(toks), diverge


def mmss(t):
    return f"{int(t // 60):02d}:{t % 60:06.3f}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("texto")
    ap.add_argument("palavras")
    ap.add_argument("saida")
    ap.add_argument("--alias", default="")
    args = ap.parse_args()

    toks = tokens(Path(args.texto).read_text(encoding="utf-8"))
    if not toks:
        sys.exit(f"{args.texto} está vazio.")
    trans = json.loads(Path(args.palavras).read_text(encoding="utf-8"))
    ancoras = [a for _, a in toks if a]
    repetidas = sorted({a for a in ancoras if ancoras.count(a) > 1})
    if repetidas:
        sys.exit(f"Âncoras repetidas no texto: {', '.join(repetidas)}")

    saida, taxa, diverge = alinhar(toks, trans, ler_alias(args.alias))
    destino = Path(args.saida)
    destino.parent.mkdir(parents=True, exist_ok=True)
    # uma palavra por linha, fácil de ler e de comparar
    destino.write_text("[\n" + ",\n".join(json.dumps(p, ensure_ascii=False) for p in saida) + "\n]\n", encoding="utf-8")

    linhas = [
        f"# Alinhamento do texto com a voz",
        "",
        f"- Texto: `{Path(args.texto).name}` · transcrição: `{Path(args.palavras).parent.name}/{Path(args.palavras).name}`",
        f"- Palavras do texto casadas com a voz: **{taxa:.0%}** ({len(saida)} no texto, {len(ancoras)} âncoras)",
        "",
        "## Onde a voz diverge do texto",
        "",
        "Grafia diferente de um nome é normal (acrescente um --alias). Palavra pulada ou trocada exige corrigir o texto ou a voz.",
        "",
    ]
    if diverge:
        linhas += ["| Tempo | Texto | Voz (transcrição) |", "| --- | --- | --- |"]
        linhas += [f"| {mmss(t)} | {a or '—'} | {b or '—'} |" for t, a, b in diverge]
    else:
        linhas.append("Nenhuma: a voz disse exatamente o texto.")
    relatorio = destino.with_suffix(".md")
    relatorio.write_text("\n".join(linhas) + "\n", encoding="utf-8")

    print(f"Casadas: {taxa:.0%} de {len(saida)} palavras. Âncoras: {', '.join(ancoras) or 'nenhuma'}")
    for t, a, b in diverge:
        print(f"  {mmss(t)}  texto: {a or '—'}  |  voz: {b or '—'}")
    print(f"Gravado: {destino}\nRelatório: {relatorio}")


if __name__ == "__main__":
    main()
