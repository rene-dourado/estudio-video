import {Config} from '@remotion/cli/config';

Config.setCodec('h264');
Config.setVideoImageFormat('jpeg');
Config.setPixelFormat('yuv420p');
// Entregas nunca são sobrescritas: o scripts/estudio.mjs recusa arquivo existente antes de chamar o render.
Config.setOverwriteOutput(true);
// A pasta pública é a pasta do projeto de vídeo (dados/projetos/<NNN - nome>/), passada pelo
// scripts/estudio.mjs em ESTUDIO_PUBLICO. Assim staticFile('1_brutos/clipe.mp4') aponta para o material
// daquele vídeo, e o bundle não copia os outros projetos.
Config.setPublicDir(process.env.ESTUDIO_PUBLICO ?? 'estilos');
// O cache persistente do webpack falha com EPERM em algumas instalações do Windows.
Config.setCachingEnabled(false);
