import { access, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { z } from 'zod';

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(currentFilePath), '..');
const envFilePath = resolve(projectRoot, '.env');
const proxyConfigPath = resolve(projectRoot, 'proxy.conf.json');

const envSchema = z.object({
  NG_APP_BACKEND_URL: z
    .string({
      required_error: 'NG_APP_BACKEND_URL es obligatorio (en .env o variables de sistema)',
      invalid_type_error: 'NG_APP_BACKEND_URL debe ser una cadena de texto'
    })
    .trim()
    .url('NG_APP_BACKEND_URL debe ser una URL valida (ej: http://localhost:5000/api)')
});

const removeTrailingSlash = (value) => value.replace(/\/+$/, '');

const readFileIfExists = async (filePath) => {
  try {
    await access(filePath, fsConstants.F_OK);
    return await readFile(filePath);
  } catch {
    return null;
  }
};

const envBuffer = await readFileIfExists(envFilePath);
let fileEnv = {};

if (envBuffer) {
  const envContent = envBuffer[0] === 0xff && envBuffer[1] === 0xfe
    ? envBuffer.toString('utf16le')
    : envBuffer.toString('utf8');
  fileEnv = parse(envContent.replace(/^\uFEFF/, ''));
} else {
  console.log('ℹ️ Nota: No se encontro el archivo .env, usando variables de sistema.');
}

// Validate variables (prioritize system env over .env file)
let parsedEnv;
try {
  parsedEnv = envSchema.parse({
    ...fileEnv,
    ...process.env
  });
} catch (error) {
  // En entornos de CI (como Cloudflare), si falta la variable, solo mostramos un aviso 
  // para no romper la instalacion de dependencias si no es un build
  if (process.env.CI || process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Advertencia: NG_APP_BACKEND_URL no esta definida. Esto podria causar fallos en el build.');
  } else {
    console.error('❌ Error de validacion de entorno:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => console.error(`   - ${err.message}`));
    }
    process.exit(1);
  }
}

if (parsedEnv) {
  const backendUrl = removeTrailingSlash(parsedEnv.NG_APP_BACKEND_URL);
  const backend = new URL(backendUrl);
  const backendOrigin = `${backend.protocol}//${backend.host}`;

  // Solo actualizamos el proxy.conf.json si estamos en desarrollo
  if (!process.env.CI) {
    await writeFile(
      proxyConfigPath,
      JSON.stringify(
        {
          '/api': {
            target: backendOrigin,
            secure: false,
            changeOrigin: true,
            logLevel: 'info'
          }
        },
        null,
        2
      ),
      'utf8'
    );
    console.log(`✅ Proxy sincronizado localmente: target=${backendOrigin}`);
  }
}
